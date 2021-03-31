import { GLResourceManager } from "./gl_helper"

// I'm scared.
export class GameRenderer {
  constructor (game) {
    // The main canvas should be a canvas 2D thing. The drawing sequence will go: background, tile layers, (copy gl canv
    // over) special tiles, entities.

    this.game = game
    const canvas = this.canvas = game.canvas

    this.debuggers = []
    let gl = this.gl = canvas.getContext("webgl", {
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    })

    if (!gl) alert("Browser lacks WebGL support.")

    canvas.addEventListener("webglcontextlost", (evt) => {
      console.log("context lost")
      evt.preventDefault()
      this.glManager.onContextLost()
    }, false)
    canvas.addEventListener("webglcontextrestored", () => {
      console.log("context restored")
      this.init()
    })

    this.glManager = new GLResourceManager(gl)

    this.init()
  }

  init () {
    let gl = this.gl

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.isFirstPass = true
  }

  get viewport () {
    return this.game.viewport
  }

  clearCanvas (r = 0, g = 0, b = 0, a = 0) {
    const { gl } = this

    gl.clearColor(r, g, b, a)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  resize () {
    // buffer dims
    const {width, height} = this.canvas

    this.canvas.width = width
    this.canvas.height = height

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


  render (instructions=[]) {
    if (this.gl.isContextLost()) return // can't draw anything without WebGL

    this.clearCanvas()
    this.clearDebuggers()

    for (const elem of instructions) {
      elem.render(this)
    }

    for (const debug of this.debuggers) {
      debug.render(this)
    }

    // deals with context loss, etc.
    this.isFirstPass = false
  }

  clearDebuggers () {
    this.debuggers = []
  }

  addDebugger (obj) {
    this.debuggers.push(obj)
  }
}
