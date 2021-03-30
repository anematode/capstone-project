import { Keyboard } from './keyboard'
import { GameRenderer } from "./renderer"
import {TileLayer} from "./tile_layer"
import {BoundingBox} from "./bounding_box"
import {assetTracker} from "./asset_loader"
import {BackgroundImage} from "./background_image"
import {Vec2} from "./vec2"
import {generateCaveWorld} from "./gen_cave"

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

    this.viewport = new BoundingBox(0, 0, 128, 72) // What is the bounding box in tile space
    this.world = {
      width: 128,
      height: 128,
      physicalTiles: new TileLayer(this),
      backgroundImage: new BackgroundImage(this, testBackground)
    }

    this.keyboard = new Keyboard()
    window.addEventListener("resize", () => { this.resize() })

    this.gameRunning = false
  }

  start () {
    this.gameRunning = true

    requestAnimationFrame(() => this.gameLoop())
  }

  stop () {
    this.gameRunning = false
  }

  getCanvasBBox () {
    return new BoundingBox(0, 0, this.width, this.height)
  }

  getWorldToCanvasTransform () {
    return BoundingBox.getReducedTransform(this.viewport, this.getCanvasBBox(), false, true)
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
    if (this.viewport.width > this.world.width) this.viewport.width = this.world.width
    if (this.viewport.height > this.world.height) this.viewport.height = this.world.height
    this.viewport.resizeToAspectRatio(aspectRatio)
  }


  zoom (s) { // TODO
    this.viewport.width /= s
    this.viewport.height /= s
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

    domElement.style.width = this.width + 'px'
    domElement.style.height = this.height + 'px'

    this.renderer.resize()
  }

  handleInputs() {
    const { keyboard, viewport } = this
    const movementSpeed = 0.15

    const moveDir = new Vec2(keyboard.isKeyPressed("ArrowRight") - keyboard.isKeyPressed("ArrowLeft"),
      keyboard.isKeyPressed("ArrowUp") - keyboard.isKeyPressed("ArrowDown")).unit().scale(movementSpeed)

    viewport.cx += moveDir.x
    viewport.cy += moveDir.y
  }

  gameLoop () {
    if (!this.gameRunning) return

    this.handleInputs()

    this.maintainValidViewport()

    const { world } = this
    this.renderer.render([ world.backgroundImage, world.physicalTiles ])

    requestAnimationFrame(() => { this.gameLoop() })
  }
}

assetTracker.onfinished = () => {
  // Add the game to the world
  const game = new Game()
  document.body.appendChild(game.domElement)
  game.resize()

  game.world.physicalTiles.tileData = generateCaveWorld(128, 128)
  game.world.physicalTiles.markUpdate()

  game.start()

  window.game = game
  window.renderer = game.renderer
  window.gl = game.renderer.gl

  //for (let j = 0; j < 36; ++j) for (let i = 0; i < 64; ++i) game.world.physicalTiles.tileData[j][i] = (i+j+Math.floor(5*Math.random()))%60
}
