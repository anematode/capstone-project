import { Keyboard } from './keyboard'
import { GameRenderer } from "./renderer"
import {TileLayer} from "./tile_layer"
import {BoundingBox} from "./bounding_box"
import {assetTracker} from "./asset_loader"
import {BackgroundImage} from "./background_image"
import {Vec2} from "./vec2"
import {create2DArray, generateCaveWorld} from "./gen_cave"
import {EntityGroup} from "./entity_group"
import {PlayerEntity} from "./player_entity"
import {PhysicsEngine, createTicker} from "./physics_engine"
import { asyncDigest} from "./bolus"

const aspectRatio = 16 / 9
const maxGameWidth = 1920
const maxGameHeight = Math.round(maxGameWidth / aspectRatio)

function getGameHTMLElement () {
  const wrapper = document.createElement("div")
  wrapper.classList.add("game-wrapper")

  const canvas = document.createElement("canvas")
  wrapper.appendChild(canvas)

  return { domElement: wrapper, canvas }
}

const testBackground = window.testBackground = new Image()
testBackground.src = "./assets/test_background.jpg"

testBackground.onload = assetTracker.getHandle()

// The main class containing all the relevant data for gameplay, controls, etc.
class Game {
  constructor () {
    const { domElement, canvas } = getGameHTMLElement()

    this.domElement = domElement
    this.canvas = canvas
    this.renderer = new GameRenderer(this)
    this.physicsEngine = new PhysicsEngine(this)

    this.viewport = new BoundingBox(0, 0, 32, 32).setCenter(0,0) // What is the bounding box in tile space
    this.world = {
      width: 512,
      height: 512,
      backgroundImage: new BackgroundImage(this, testBackground),
      entities: []
    }
    this.world.physicalTiles = new TileLayer(this)
    this.world.entityGroup = new EntityGroup(this, this.world.entities) // for rendering

    this.ticker = createTicker(() => {
      this.tick()
    }, 1/30)

    this.keyboard = new Keyboard()
    window.addEventListener("resize", () => { this.resize() })

    this.canvas.addEventListener("wheel", (evt) => {
      let y = evt.deltaY

      this.zoomOn(this.clientVecToTile(new Vec2(evt.clientX, evt.clientY)), y/400+1)
    })
    this.canvas.addEventListener("mousemove", (evt) => this.onMouseMove(evt))
    this.canvas.addEventListener("mousedown", (evt) => this.onMouseDown(evt))
    this.canvas.addEventListener("mouseup", (evt) => this.onMouseUp(evt))

    this.gameRunning = false
  }

  start () {
    this.gameRunning = true
    this.ticker.start()

    requestAnimationFrame(() => this.renderLoop())
  }

  tick() {
    this.handleInputs()
    //this.physicsEngine.tick()
  }

  clientVecToTile ({ x, y }) {
    const rect = game.canvas.getBoundingClientRect()
    const canvToTile = this.getCanvasToWorldTransform()

    let canvPos = new Vec2(x - rect.x, y - rect.y)
    return canvPos.transform(canvToTile)
  }

  stop () {
    this.ticker.stop()
    this.gameRunning = false
  }

  getCanvasBBox () {
    return new BoundingBox(0, 0, this.width, this.height)
  }

  getWorldToCanvasTransform () {
    return BoundingBox.getReducedTransform(this.viewport, this.getCanvasBBox(), false, true)
  }

  getCanvasToWorldTransform () {
    return BoundingBox.getReducedTransform(this.getCanvasBBox(), this.viewport, false, true)
  }

  getWorldToClipTransform () {
    return BoundingBox.getReducedTransform(this.viewport, new BoundingBox(-1, -1, 2, 2), false, false)
  }

  getClipToWorldTransform () {
    return BoundingBox.getReducedTransform(new BoundingBox(-1, -1, 2, 2), this.viewport, false, false)
  }

  getCanvasToClipTransform () {
    return BoundingBox.getReducedTransform(this.getCanvasBBox(), this.viewport, false, false)
  }

  maintainValidViewport () {
    //if (this.viewport.width > this.world.width) this.viewport.width = this.world.width
    //if (this.viewport.height > this.world.height) this.viewport.height = this.world.height

    this.viewport.resizeToAspectRatio(aspectRatio)

    if (this.viewport.x2 < 0 || this.viewport.x1 > this.world.width) {

    }
  }

  zoom (s) { // TODO
    this.viewport.width /= s
    this.viewport.height /= s
  }

  zoomOn (v, dX) {
    this.viewport.zoomOn(v, dX)
  }

  setCenter (x, y) {
    this.viewport.cx = x
    this.viewport.cy = y
  }

  resize () { // Resize to fill the DOM
    const dpi = window.devicePixelRatio
    const { canvas, domElement } = this

    let { innerWidth, innerHeight } = window

    // Make sure it fits within the required bounds
    if (innerWidth > maxGameWidth) {
      innerWidth = maxGameWidth
    } else if (innerHeight > maxGameHeight) {
      innerHeight = maxGameHeight
    }

    innerWidth = Math.round(innerWidth)
    innerHeight = Math.round(innerHeight)

    // Dimensions of the canvas buffer
    let height, width

    if (innerWidth / innerHeight > aspectRatio) {
      height = dpi * innerHeight
      width = dpi * Math.round(aspectRatio * innerHeight)
    } else {
      height = dpi * Math.round(innerWidth / aspectRatio)
      width = dpi * innerWidth
    }

    canvas.height = height
    canvas.width = width

    // We must distinguish the CSS height and width (these) from the underlying buffer's height and width
    this.height = height / dpi
    this.width = width / dpi

    canvas.style.width = this.width + 'px'
    canvas.style.height = this.height + 'px'

    this.renderer.resize()
  }

  handleInputs() {
    const { keyboard, viewport } = this
    const movementSpeed = 0.15

    const moveDir = new Vec2(keyboard.isKeyPressed("ArrowRight") - keyboard.isKeyPressed("ArrowLeft"),
      keyboard.isKeyPressed("ArrowUp") - keyboard.isKeyPressed("ArrowDown")).unit().scale(movementSpeed)

    viewport.cx += moveDir.x
    viewport.cy += moveDir.y

    if (keyboard.isKeyPressed(" ")) {
      this.player.jump()
    } else if (keyboard.isKeyPressed("a")) {
      this.player.moveLeft()
    } else if (keyboard.isKeyPressed("d")) {
      this.player.moveRight()
    }
  }

  onMouseMove (evt) {
    if (this.isDragging) {
      let dragCenter = this.dragCenter
      let currCenter = this.clientVecToTile(new Vec2(evt.clientX, evt.clientY))

      // Need currCenter to coincide with dragCenter

      this.viewport.x1 += dragCenter.x - currCenter.x
      this.viewport.y1 += dragCenter.y - currCenter.y
    }
  }

  onMouseUp (m) {
    this.isDragging = false
  }

  onMouseDown (evt) {
    this.isDragging = true
    this.dragCenter = this.clientVecToTile(new Vec2(evt.clientX, evt.clientY))
  }

  renderLoop () {
    if (!this.gameRunning) return

    this.maintainValidViewport()

    const { world } = this
    this.renderer.render([ world.backgroundImage, world.physicalTiles, world.entityGroup ])

    requestAnimationFrame(() => { this.renderLoop() })
  }
}

function getClosestTile(r, g, b, a) {
  let minIndex = 0, min = Infinity
  for (let i = 1; i < tileColors.length; ++i) {
    let color = tileColors[i]
    let manhattan = Math.abs(color[0] - r)**2 + Math.abs(color[1] - g)**2  + Math.abs(color[2] - b)**2

    if (manhattan < min) {
      minIndex = i
      min = manhattan
    }
  }

  return minIndex
}

window.asyncDigest = asyncDigest
window.imageToTileData = function* imageToTileData (img) {
  let canvas = document.createElement('canvas')
  let context = canvas.getContext('2d')
  canvas.width = img.width
  canvas.height = img.height
  context.drawImage(img, 0, 0 )

  let arr = create2DArray(img.width + 2, img.height + 2)
  let data = context.getImageData(0, 0, img.width, img.height).data

  for (let y = 0; y < img.height; ++y) {
    for (let x = 0; x < img.width; ++x) {
      let r = data[4 * (y * img.width + x)], g = data[4 * (y * img.width + x) + 1],
        b = data[4 * (y * img.width + x) + 2], a = data[4 * (y * img.width + x) + 3]

      arr[img.height-y][x+1] = getClosestTile(r, g, b, a)
    }

    yield y / img.height
  }

  return arr
}

function averageColor (data) { let r=0,g=0,b=0,a=0; for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; a += data[i+3] } let c = data.length / 4; return [r/c,g/c,b/c,a/c] }

let tileColors = [[0,0,0,0]]

function getAverageColors () {

  for (let index = 1; index < tileset.tileCount; index++) {
    tileColors[index] = averageColor(tileset.getTileData(index).data)
  }
}

const testImg = window.testBackground = new Image()
testImg.src = "./assets/textures/IMG_1953.JPG"
testImg.onload = assetTracker.getHandle()

assetTracker.onfinished = () => {
  window.tileColors = tileColors
  getAverageColors()

  // Add the game to the world
  const game = new Game()

  document.body.appendChild(game.domElement)
  game.resize()

  asyncDigest(imageToTileData(testImg), data => {

    game.world.physicalTiles.tileData = data
    game.world.width = data[0].length
    game.world.height = data.length
    game.world.physicalTiles.markUpdate()

    game.start()
    game.setCenter(testImg.width / 2, testImg.height / 2)
  }, progress => {
    document.getElementById("progress").innerText = `progress: ${progress * 100}%`
  })

  window.game = game
  window.renderer = game.renderer
  window.gl = game.renderer.gl
  window.world = game.world

  //for (let j = 0; j < 36; ++j) for (let i = 0; i < 64; ++i) game.world.physicalTiles.tileData[j][i] = (i+j+Math.floor(5*Math.random()))%60
}
