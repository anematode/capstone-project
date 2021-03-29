import { Keyboard } from './keyboard'
import { GameRenderer } from "./renderer"
import {TileLayer} from "./tile_layer"
import {BoundingBox} from "./bounding_box"
import {assetTracker} from "./asset_loader"
import {BackgroundImage} from "./background_image"

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

    this.viewport = new BoundingBox(0, 0, 32, 18) // What is the bounding box in tile space
    this.world = {
      physicalTiles: new TileLayer(),
      backgroundImage: new BackgroundImage(testBackground),

    }

    this.keyboard = new Keyboard()
    window.addEventListener("resize", () => { this.resize() })

    this.gameRunning = false
  }

  start () {
    this.gameRunning = true
    this.gameLoop()
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

  gameLoop () {
    if (!this.gameRunning) return

    const {world} = this
    this.renderer.render([ world.backgroundImage, world.physicalTiles ])

    requestAnimationFrame(() => { this.gameLoop() })
  }
}

assetTracker.onfinished = () => {
  // Add the game to the world
  const game = new Game()
  document.body.appendChild(game.domElement)
  game.resize()

  game.start()

  window.game = game
  window.renderer = game.renderer

  window.gl = game.renderer.gl
}
