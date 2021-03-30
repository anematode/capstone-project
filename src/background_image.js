import {generateUUID} from "./tile_layer"

export class BackgroundImage {
  constructor (game, img) {
    this.game = game
    this.img = img

    this.id = generateUUID()
    this.needsUpdate = true
  }

  render (renderer) {
    const { gl, glManager, canvasWidth, canvasHeight, width, height } = renderer

    const tileLayerProgram = glManager.getProgram("BackgroundImage") ?? glManager.createProgram("BackgroundImage",
      `attribute vec2 vPosition;
       
        varying highp vec2 vTextureCoord;

        void main() {
            gl_Position = vec4(vPosition, 0, 1);
            vTextureCoord = vec2(0.5, -0.5) * vPosition + vec2(0.5, 0.5);
        }`, `
        precision mediump float;
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        
        void main() {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
          gl_FragColor.rgb *= gl_FragColor.a;
        }`, ["vPosition"], ["uSampler"])

    const buf = glManager.getBuffer(this.id)

    // Whole canvas
    const rectangle = new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1])

    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, rectangle, gl.STATIC_DRAW)

    const vPosition = tileLayerProgram.attribs.vPosition

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    let texture = glManager.getTexture(this.id)

    if (this.needsUpdate) {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img)

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      this.needsUpdate = false
    }

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.useProgram(tileLayerProgram.program)
    gl.uniform1i(tileLayerProgram.uniforms.uSampler, 0)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}
