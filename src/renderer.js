import { GLResourceManager } from "./gl_helper"
import { TilesetLoader } from "./tileset"
import { mainTileset } from "./main_tileset"




// I'm scared.
export class GameRenderer {
  constructor (game) {
    // The main canvas should be a canvas 2D thing. The drawing sequence will go: background, tile layers, (copy gl canv
    // over) special tiles, entities.

    this.game = game
    const canvas = this.canvas = game.canvas

    this.canvasCtx = canvas.getContext("2d")

    this.glCanvas = document.createElement("canvas")
    this.gl = this.glCanvas.getContext("webgl", {
      preserveDrawingBuffer: true
    })

    if (!this.gl) alert("Browser lacks WebGL support.")

    this.glManager = new GLResourceManager(this.gl)

    // Init
    this.resizeGLCanvas()
  }

  resetCanvasCtxTransform () {
    this.canvasCtx.resetTransform()
    this.canvasCtx.scale(this.canvasWidth / this.width, this.canvasHeight / this.height)
  }

  clearCanvas () {
    this.canvasCtx.clearRect(0, 0, this.width, this.height)
  }

  get viewport () {
    return this.game.viewport
  }

  clearGLCanvas (r = 0, g = 0, b = 0, a = 0) {
    const { gl } = this

    gl.clearColor(r, g, b, a)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  resize () {
    this.resizeGLCanvas()
  }

  resizeGLCanvas () {
    // buffer dims
    const {width, height} = this.canvas

    this.glCanvas.width = width
    this.glCanvas.height = height

    this.gl.viewport(0, 0, width, height)
  }

  get canvasWidth () {
    return this.canvas.width
  }

  get canvasHeight () {
    return this.canvas.height
  }

  get width () {
    return this.game.width
  }

  get height () {
    return this.game.height
  }

  copyGLCanvas () {
    this.resizeGLCanvas()

    const { width, height } = this.canvas

    this.canvasCtx.resetTransform()
    this.canvasCtx.drawImage(this.glCanvas, 0, 0, width, height, 0, 0, width, height)
    this.resetCanvasCtxTransform()
  }

  render (instructions=[]) {
    this.clearGLCanvas()

    for (const elem of instructions) {
      elem.render(this)
    }

    // Copy over
    this.copyGLCanvas()
  }
}
