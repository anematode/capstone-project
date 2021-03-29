
// This aspect ratio is forced and cannot be changed
const aspectRatio = 16 / 9
const maxGameWidth = 1920
const maxGameHeight = Math.round(maxGameWidth / aspectRatio)

// Div containing the game canvas
const gameWrapper = document.getElementById("game-wrapper")

// The main canvas we draw to
const gameCanvas = document.createElement("canvas")
const drawingContext = gameCanvas.getContext("2d")
gameWrapper.appendChild(gameCanvas)

// The renderer
class GameRenderer {
  constructor () {

  }

}

class AssetLoadTracker {
  constructor () {
    this.id = 0
    this.timeStart = Date.now()
    this.assetProgresses = []

    this.isFinished = false
    this.onfinished = null
  }

  calculateProgress () {
    return this.assetProgresses.reduce((a, b) => a + b) / this.assetProgresses.length
  }

  markProgress (id, x) {
    this.assetProgresses[id] = x
    if (x === 1) {
      let progress = this.calculateProgress()

      console.log("Asset loading progress: " + Math.floor(progress * 100) + "%" )

      if (progress === 1) {
        this.isFinished = true

        if (this.onfinished)
          this.onfinished(Date.now() - this.timeStart)
      }
    }
  }

  getHandle () {
    const id = this.id++

    this.markProgress(id, 0)
    const handle = _ => this.markProgress(id, 1)

    handle.markProgress = v => this.markProgress(id, Math.max(0, Math.min(v, 1)))
    handle.id = id

    return handle
  }
}

const assetTracker = new AssetLoadTracker()

// Convenience properties for the canvas. The values are subtly different; canvasWidth is the width in pixels, while
// cssWidth is the width in CSS pixels, but everything scaled to the real size. This distinction is required
// because of high DPI screens
let canvasWidth = 0, canvasHeight = 0
let cssWidth = 0, cssHeight = 0
let gameCanvasBoundingBox

const GameStyles = {

}

// Set the canvas's UNDERLYING pixel size
function setCanvasSize(height, width) {
  const dpi = window.devicePixelRatio

  gameCanvas.height = height
  gameCanvas.width = width

  canvasHeight = height
  canvasWidth = width

  // CSS sizes
  cssHeight = height / dpi
  cssWidth = width / dpi

  gameWrapper.style.width = cssWidth + 'px'
  gameWrapper.style.height = cssHeight + 'px'
  gameCanvasBoundingBox = new BoundingBox(new Vec2(0, 0), cssWidth, cssHeight)

  // To make it look the same across different screens
  drawingContext.resetTransform()
  drawingContext.scale(dpi, dpi)
}

// Auto resize canvas depending on the window size
function resizeCanvas () {
  const dpi = window.devicePixelRatio
  let { innerWidth, innerHeight } = window

  // Make sure it fits within the required bounds
  if (innerWidth > maxGameWidth) {
    innerWidth = maxGameWidth
  } else if (innerHeight > maxGameHeight) {
    innerHeight = maxGameHeight
  }

  if (innerWidth / innerHeight > aspectRatio) {
    // width is too big, height is limiting
    setCanvasSize(dpi * innerHeight, dpi * Math.round(aspectRatio * innerHeight))
  } else {
    // vice versa
    setCanvasSize(dpi * Math.round(innerWidth / aspectRatio), dpi * innerWidth)
  }
}

window.addEventListener("resize", resizeCanvas)

// Keeps track of the keyboard state (including meta keys like shift)
class Keyboard {
  constructor () {
    this.keyStates = {}

    window.addEventListener("keydown", (e) => {
      this.keyStates['k' + e.key] = true
    })

    window.addEventListener("keyup", (e) => {
      this.keyStates['k' + e.key] = false
    })
  }

  isKeyPressed (key) {
    return !!this.keyStates['k' + key]
  }
}

const keyboard = new Keyboard()

// Copied from Grapheme
class Vec2 {
  constructor (x, y) {
    if (x.x) {
      this.x = x.x
      this.y = x.y
    } else if (Array.isArray(x)) {
      this.x = x[0]
      this.y = x[1]
    } else {
      this.x = x
      this.y = y
    }
  }

  clone() {
    return new Vec2(this.x, this.y)
  }

  setComponents(x, y) {
    this.x = x
    this.y = y
  }

  set(v) {
    this.x = v.x
    this.y = v.y
  }

  subtract(v) {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  add(v) {
    this.x += v.x
    this.y += v.y
    return this
  }

  multiply(s) {
    this.x *= s
    this.y *= s
    return this
  }

  hasNaN() {
    return isNaN(this.x) || isNaN(this.y)
  }

  scale(s) {
    return this.multiply(s)
  }

  divide(s) {
    this.x /= s
    this.y /= s
    return this
  }

  asArray() {
    return [this.x, this.y]
  }

  length() {
    return Math.hypot(this.x, this.y)
  }

  unit() {
    return this.clone().divide(this.length())
  }

  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y)
  }

  distanceSquaredTo(v) {
    return (this.x - v.x) ** 2 + (this.y - v.y) ** 2
  }

  dot(v) {
    return this.x * v.x + this.y * v.y
  }

  cross(v) {
    return this.x * v.y - v.x * this.y
  }

  rotate(angle, about=Origin) {
    let c = Math.cos(angle), s = Math.sin(angle)

    if (about === Origin) {
      let x = this.x, y = this.y

      this.x = x * c - y * s
      this.y = y * c + x * s
    } else {
      let x = this.x, y = this.y

      this.subtract(about).rotate(angle).add(about)
    }

    return this
  }

  rotateDeg(angle_deg, about=Origin) {
    this.rotate(angle_deg / 180 * 3.14159265359, about)

    return this
  }
}

class BoundingBox {
  constructor(top_left=new Vec2(0,0), width=640, height=480) {
    this.top_left = top_left

    this.width = width
    this.height = height
  }

  draw(canvasCtx) {
    canvasCtx.beginPath()
    canvasCtx.rect(this.top_left.x, this.top_left.y, this.width, this.height)
    canvasCtx.stroke()
  }

  get width() {
    return this._width
  }

  get height() {
    return this._height
  }

  set width(w) {
    if (w < 0)
      throw new Error("Invalid bounding box width")
    this._width = w
  }

  set height(h) {
    if (h < 0)
      throw new Error("Invalid bounding box height")
    this._height = h
  }

  setTL(top_left) {
    this.top_left = top_left
    return this
  }

  area() {
    return this.width * this.height
  }

  set cx(cx) {
    this.top_left.x = cx - this.width / 2
  }

  set cy(cy) {
    this.top_left.y = cy - this.height / 2
  }

  get cx() {
    return this.top_left.x + this.width / 2
  }

  get cy() {
    return this.top_left.y + this.height / 2
  }

  setSize(width, height) {
    this.width = width
    this.height = height
    return this
  }

  clone() {
    return new BoundingBox(this.top_left.clone(), this.width, this.height)
  }

  padLeft(x) {
    this.width -= x
    this.top_left.x += x
    return this
  }

  padRight(x) {
    this.width -= x
    return this
  }

  padTop(y) {
    this.height -= y
    this.top_left.y += y
    return this
  }

  padBottom(y) {
    this.height -= y
    return this
  }

  pad(paddings={}) {
    if (paddings.left) {
      this.padLeft(paddings.left)
    }
    if (paddings.right) {
      this.padRight(paddings.right)
    }
    if (paddings.top) {
      this.padTop(paddings.top)
    }
    if (paddings.bottom) {
      this.padBottom(paddings.bottom)
    }

    return this
  }

  get x1() {
    return this.top_left.x
  }

  get x2() {
    return this.top_left.x + this.width
  }

  set x1(x) {
    this.top_left.x = x
  }

  set x2(x) {
    this.width = x - this.top_left.x
  }

  get y1() {
    return this.top_left.y
  }

  get y2() {
    return this.top_left.y + this.height
  }

  set y1(y) {
    this.top_left.y = y
  }

  set y2(y) {
    this.height = y - this.top_left.y
  }

  getBoxVertices() {
    return [this.x1, this.y1, this.x2, this.y1, this.x2, this.y2, this.x1, this.y2, this.x1, this.y1]
  }

  getPath() {
    let path = new Path2D()

    path.rect(this.x1, this.y1, this.width, this.height)

    return path
  }

  clip(ctx) {
    ctx.clip(this.getPath())
  }
}

const boundingBoxTransform = {
  X: (x, box1, box2, flipX) => {
    if (Array.isArray(x)) {
      for (let i = 0; i < x.length; ++i) {
        let fractionAlong = (x[i] - box1.x1) / box1.width

        if (flipX)
          fractionAlong = 1 - fractionAlong

        x[i] = fractionAlong * box2.width + box2.x1
      }
      return x
    } else {
      return boundingBoxTransform.X([x], box1, box2, flipX)[0]
    }
  },
  Y: (y, box1, box2, flipY) => {
    if (Array.isArray(y) || utils.isTypedArray(y)) {
      for (let i = 0; i < y.length; ++i) {
        let fractionAlong = (y[i] - box1.y1) / box1.height

        if (flipY)
          fractionAlong = 1 - fractionAlong

        y[i] = fractionAlong * box2.height + box2.y1
      }
      return y
    } else {
      return boundingBoxTransform.Y([y], box1, box2, flipY)[0]
    }
  },
  XY: (xy, box1, box2, flipX, flipY) => {
    if (Array.isArray(xy)) {
      for (let i = 0; i < xy.length; i += 2) {
        let fractionAlong = (xy[i] - box1.x1) / box1.width

        if (flipX)
          fractionAlong = 1 - fractionAlong

        xy[i] = fractionAlong * box2.width + box2.x1

        fractionAlong = (xy[i+1] - box1.y1) / box1.height

        if (flipY)
          fractionAlong = 1 - fractionAlong

        xy[i+1] = fractionAlong * box2.height + box2.y1
      }
      return xy
    } else {
      throw new Error("No")
    }
  },
  getReducedTransform(box1, box2, flipX, flipY) {
    let x_m = 1 / box1.width
    let x_b = - box1.x1 / box1.width

    if (flipX) {
      x_m *= -1
      x_b = 1 - x_b
    }

    x_m *= box2.width
    x_b *= box2.width
    x_b += box2.x1

    let y_m = 1 / box1.height
    let y_b = - box1.y1 / box1.height

    if (flipY) {
      y_m *= -1
      y_b = 1 - y_b
    }

    y_m *= box2.height
    y_b *= box2.height
    y_b += box2.y1

    return {x_m, x_b, y_m, y_b}
  }
}

const EMPTY = new BoundingBox(new Vec2(0,0), 0, 0)

function intersectBoundingBoxes(box1, box2) {
  let x1 = Math.max(box1.x1, box2.x1)
  let y1 = Math.max(box1.y1, box2.y1)
  let x2 = Math.min(box1.x2, box2.x2)
  let y2 = Math.min(box1.y2, box2.y2)

  if (x2 < x1) {
    return EMPTY.clone()
  }

  if (y2 < y1) {
    return EMPTY.clone()
  }

  let width = x2 - x1
  let height = y2 - y1

  return new BoundingBox(new Vec2(x1, y1), width, height)
}

// Loads and keeps track of a tile set
class Tileset {
  constructor (sourceFile, tileDim=16) {
    const buffer = new Image()
    buffer.src = sourceFile

    buffer.onload = () => this.onload()
    this.buffer = buffer

    this.tileDim = tileDim
    this.widthInTiles = this.heightInTiles = this.tileCount = 0

    this.tracker = assetTracker.getHandle()
  }

  onload () {
    const { buffer } = this

    this.widthInTiles = buffer.width / this.tileDim
    this.heightInTiles = buffer.height / this.tileDim
    this.tileCount = buffer.width * buffer.height
    this.tracker()

    if (this.onReady) this.onReady()
  }

  getTilePos (id) {
    --id
    return { y: this.tileDim * Math.floor(id / this.widthInTiles), x: this.tileDim * (id % this.widthInTiles) }
  }
}

// Size of the standard tile
const tileDim = 16
const mainTileset = new Tileset("./assets/tiles.png")

const testBackground = new Image()
testBackground.src = "./assets/test_background.jpg"

testBackground.onload = assetTracker.getHandle()

// The current world. We represent the world as a series of images/tiles, in various layers, along with
// entities (one of which is the player). First is the background. Then, the physical tiles and partial tiles. We
// represent plain tiles simply as a series of numbers which are their tile IDs. Their properties, like slipperiness
// and hitbox and their names, can be looked up dynamically.
//
// The transformation from tilespace to the canvas is flipped over the Y axis; the bottom corner of plainTilespace[0] is
// at (0,0) in tilespace and the top right corner of plainTilespace[-1] is at (32, 18). The textures, however, are NOT
// flipped. Yes, it's a bit confusing.
const world = {
  width: 32, // the width and height of the world in tiles
  height: 18,
  background: testBackground, // the background image, which should be 1920 x 1080 or thereabouts
  plainTilespace: [], // A 2D numerical array of length width * height. These are tiles which have no special properties and are physically solid.
  entities: []
}

function clearWorld () {
  // Fill it with air
  world.plainTilespace = new Array(world.height).fill(0).map(() => new Array(world.width).fill(0))
}

// We model the transform as a single bounding box, telling us the bounds of tile space we are transforming to canvas
// space. The direction of the y axis is of course important, as is the aspect ratio of each. We must force the camera
// transform to be in the correct aspect ratio as well, of course. Another question is that of tile space; what is the
// transformation of coordinates. It makes more sense for y to go up, because there is gravity. Thus, we flip the y
// axis.
const cameraTransform = new BoundingBox(new Vec2(0, 0), 32, 18)

function clearCanvas (context=drawingContext) {
  context.clearRect(0, 0, cssWidth, cssHeight)
}

function renderWorldBackground (context=drawingContext) {
  context.drawImage(world.background, 0, 0, 1920, 1080, 0, 0, cssWidth, cssHeight)
}

function renderWorldTiles (context=drawingContext, tileset=mainTileset, tilespace=world.plainTilespace) {
  // We iterate through the tilespace, keeping in mind that 0 means air.

  const { x_m, x_b, y_m, y_b } = boundingBoxTransform.getReducedTransform(cameraTransform, gameCanvasBoundingBox, false, true)

  const dim = tileset.tileDim
  const buffer = tileset.buffer

  // a box is x_m by y_m pixels

  // TODO: optimize for tiles outside the canvas
  for (let y = world.height - 1; y >= 0; --y) {
    for (let x = 0; x < world.width; ++x) {
      const tileID = tilespace[y][x]

      if (!tileID) continue

      // Get the top left corner of the current tile
      let topleftX = x_m * x + x_b
      let topleftY = y_m * y + y_b
      let pos = mainTileset.getTilePos(tileID)

      drawingContext.drawImage(buffer, pos.x, pos.y, dim - 0.5, dim - 0.5, topleftX, topleftY, x_m, y_m)
    }
  }
}

function renderWorldEntities (context=drawingContext, entities=world.entities) {
  for (const entity of entities) {
    entity.render(context)
  }
}

function renderWorld () {
  renderWorldBackground()
  renderWorldTiles()
  renderWorldEntities()
}

function mainLoop () {
  handleInputs()
  renderWorld()

  requestAnimationFrame(mainLoop)
}

function getReducedCameraTransform () {
  return boundingBoxTransform.getReducedTransform(cameraTransform, gameCanvasBoundingBox, false, true)
}

function drawImageTileSpace (context=drawingContext, img, x, y, scale_x, scale_y=scale_x) {
  // Draws the image with a bottom left corner at (x, y) in tile space

  const { x_m, x_b, y_m, y_b } = getReducedCameraTransform()
  const { width, height } = img
  const desiredWidth = width * scale_x, desiredHeight = height * scale_y


  context.drawImage(img, 0, 0, width, height, x_m * x + x_b, y_m * (y + desiredHeight) + y_b, x_m * desiredWidth, Math.abs(y_m * desiredHeight))
}

clearWorld()

// Hitboxes are gonna be a little weird. let's stick with simple bounding boxes for now.

class GameEntity {
  constructor (params={}) {
    // Intrinsic
    this.mass = params.mass ?? 1
    this.hitboxSize = params.hitbox ?? params.hitboxSize ?? { width: 0.5, height: 2} // in tiles
    this.friction = params.friction ?? 0.5

    // Dynamic
    this.position = new Vec2(0, 0) // Position  center of feet
    this.velocity = new Vec2(0, 0) // Stationary
  }

  getBBox () {
    let bbox = new BoundingBox()

    bbox.width = this.hitboxSize.width
    bbox.height = this.hitboxSize.height
    bbox.y1 = this.position.y
    bbox.cx = this.position.x

    return bbox
  }

  // Custom instructions to render this entity to the given context
  render (context=drawingContext) {

  }
}

// Abstract class for entities with sprites
class SpriteGameEntity extends GameEntity {
  constructor (params={}) {
    super(params)

    this.sprite = null  // should just be an image
    this.spriteScalingFactor = 1 / tileDim
  }

  spriteWidth() {
    return this.sprite.width * this.spriteScalingFactor
  }

  spriteHeight() {
    return this.sprite.height * this.spriteScalingFactor
  }

  getSpriteBBox () {
    let bbox = new BoundingBox()

    bbox.width = this.spriteWidth()
    bbox.height = this.spriteHeight()
    bbox.y1 = this.position.y
    bbox.cx = this.position.x

    return bbox
  }

  render (context=drawingContext) {
    if (!this.sprite) return

    const { x_m, x_b, y_m, y_b } = getReducedCameraTransform()
    const spriteBBox = this.getSpriteBBox()

    drawImageTileSpace(context, this.sprite, ...spriteBBox.top_left.asArray(), this.spriteScalingFactor)
  }
}

const Sprites = {}

function loadSprites () {
  const spritesToLoad = {
    player: "./assets/player_sprite.png"
  }

  for (const [name, loc] of Object.entries(spritesToLoad)) {
    let img = Sprites[name] = new Image()
    img.src = loc
    img.onload = assetTracker.getHandle()
  }
}

loadSprites()

function getSprite (spriteName) {
  // Returns an object which can be used as a reference to the actual image once it's downloaded

  const res = Sprites[spriteName]
  if (!res) throw new Error(`Unrecognized sprite name ${spriteName}; it must be among the Sprites dictionary`)
  return res
}

class PlayerEntity extends SpriteGameEntity {
  constructor(params={}) {
    super(params)

    this.hitboxSize = { width: 0.7, height: 1.7 }
    this.position = new Vec2(3, 4)
    this.sprite = getSprite("player")
  }
}

// How do we do collision detection between an entity and an object? An ancient problem, indeed. The simplest method
// is a tick based system where we move the entity slightly in some direction (depending on the various forces) and see
// whether the entity intersects any objects, at which point we'd push the entity outwards. Alternatively, we could draw
// a weird parallelogram and see what it intersects, find the point of intersection and stop there. But what about
// collisions between entities? It would be cool to have them be able to impart forces into each other.

class PhysicsEngine {
  // Hm. There are entities with velocities, there are collisions with objects, there are forces... a lot of stuff.
  // An entity has a hitbox, which is a rectangle or some similar shape. It has a position (the position of its feet)
  // and a velocity, a 2D
  // vector. It has a weight, which reflects how much it imparts its velocity to others when they collide. They might
  // also have event listeners for collisions and such.

  // All length units will be in tiles. All velocities will be in tiles / tick. We need to guarantee that the ticks
  // happen at a steady rate. All accelerations will be in tiles / tick^2. The coordinate system used is the same as
  // that of the

  // Certain entities will have friction coefficients, as will

  // And what about collisions for physical blocks?

  constructor () {
    this.entities = []

    this.physicalBlocks = []

  }
}

function makeTestWorld () {
  for (let i = 0; i < world.width; ++i) {
    let elevation = Math.round(3 * (Math.sin(0.2 * i) + 3))
    for (let j = 0; j < elevation - 4; ++j) {
      world.plainTilespace[j][i] = 3 // stone
    }
    for (let j = elevation - 4; j < elevation - 1; ++j) {
      world.plainTilespace[j][i] = 2 // dirt
    }
    world.plainTilespace[elevation - 1][i] = 1 // grass
  }
}

// Handle arrow keys and stuff
function handleInputs () {
  let intendedX = keyboard.isKeyPressed("ArrowRight") - keyboard.isKeyPressed("ArrowLeft")
  let intendedY = keyboard.isKeyPressed("ArrowUp") - keyboard.isKeyPressed("ArrowDown")

  let speed = 0.1

  player.position.add(new Vec2(speed * intendedX, speed * intendedY))
}

const player = new PlayerEntity()
world.entities.push(player)

// Final stuffs
resizeCanvas()
makeTestWorld()

assetTracker.onfinished = mainLoop
