import {BoundingBox} from "./bounding_box"
import {texturePack} from "./main_textiles"

const debuggerId = "hohoho"

function getProgram (glManager) {
  const program = glManager.getProgram("Debugger") ?? glManager.createProgram("Debugger",
    `attribute vec2 vPosition;
      
      uniform vec2 transformSlopes;
      uniform vec2 transformConstants;

        void main() {
            gl_Position = vec4(transformSlopes * vPosition + transformConstants, 0, 1);
        }`, `precision mediump float;
        uniform vec4 color;
        
        void main() {
          gl_FragColor = color;
        }`, ["vPosition"], ["color", "transformSlopes", "transformConstants"])

  return program
}

class Debugger {
  constructor (color={ r: 255, g: 0, b: 0, a: 255 }, coordSpace="world") {
    this.color = color
    this.coordSpace = coordSpace // one of "world", "clip" or "canvas"
  }

  setCoordSpace(s) {
    this.coordSpace = s
    return this
  }

  setColor(r, g, b, a=255) {
    this.color.r = r
    this.color.g = g
    this.color.b = b
    this.color.a = a
  }

  render (renderer, geometry, mode="LINE_STRIP") {
    const { gl, glManager, canvasWidth, canvasHeight, width, height } = renderer

    const program = getProgram(glManager)

    gl.useProgram(program.program);

    const vPosition = program.attribs.vPosition
    const posArrayBuffer = glManager.getBuffer(debuggerId)

    gl.bindBuffer(gl.ARRAY_BUFFER, posArrayBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.DYNAMIC_DRAW)

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    let transform

    switch (this.coordSpace) {
      case "world":
        transform = game.getWorldToClipTransform()
        break
      case "canvas":
        transform = game.getCanvasToClipTransform()
        break
      default:
        transform = { x_m: 1, y_m: 1, x_b: 0, y_b: 0 }
    }

    gl.uniform2f(program.uniforms.transformSlopes, transform.x_m, transform.y_m)
    gl.uniform2f(program.uniforms.transformConstants, transform.x_b, transform.y_b)

    const {color} = this
    gl.uniform4f(program.uniforms.color, color.r / 255, color.g / 255, color.b / 255, color.a / 255)

    gl.drawArrays(gl[mode], 0, geometry.length / 2)
  }
}

export class RectangleDebugger extends Debugger { // a rather inefficient, but useful thing for debugging, drawn at the end of every frame
  constructor (rectangle, color={ r: 255, g: 0, b: 0, a: 255 }) {
    super(color)

    this.rectangle = rectangle
  }

  render (renderer) {
    const { x1, y1, x2, y2 } = this.rectangle

    // Draw the rectangle
    const arr = new Float32Array([x1, y1, x2, y2, x1, y2, x1, y1, x2, y1, x2, y2])
    super.render(renderer, arr, "LINE_STRIP")
  }
}

export class PointDebugger extends Debugger {
  constructor (v, color={ r: 255, g:  0, b: 0, a: 255}) {
    super(color)

    this.pos = v
    this.radius = 0.1
  }

  render (renderer) {
    const { x, y } = this.pos

    const arr = [ x, y ]

    for (let i = 0; i <= 8; ++i) {
      let rad = 2 * Math.PI * i / 8

      arr.push(x + this.radius * Math.cos(rad), y + this.radius * Math.sin(rad))
    }

    super.render(renderer, new Float32Array(arr), "TRIANGLE_FAN")
  }
}
