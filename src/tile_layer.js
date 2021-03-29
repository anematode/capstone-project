import { assetTracker } from "./asset_loader"
import {BoundingBox} from "./bounding_box"

export function generateUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const
      v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// A layer... of tiles... to render. Yep.
export class TileLayer {
  constructor () {
    this.width = 32
    this.height = 18

    this.tileData = [] // 2d array of tile indices

    this.worldTexture = new Image()
    this.tileset = mainTileset.tileset

    this.needsUpdate = true
    this.id = generateUUID()

    this.clear()
  }

  tileInBounds (x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height
  }

  tileAt (x, y) {
    return this.tileData[y][x]
  }

  setTileAt (x, y) {

  }

  clear () {
    this.tileData = new Array(this.height).fill(0).map(() => new Array(this.width).fill(1))
  }

  renderWorldToTexture () {
    // the R values are the x coord of the tile, the G values are the y coord of the tile in the tileset image. B and A are unused for now
    const { width, height, tileset, tileData } = this
    const outputArr = new Uint8ClampedArray(width * height * 4)

    const { tileSize, widthInTiles, heightInTiles } = tileset

    // Coordinates in pixels of a tile are  tileSize * (indx % widthInTiles, floor(indx / widthInTiles))
    // as the tl corner, then (0/+tileSize, 0/+tileSize) for the others. But that doesn't matter.
    // This ImageData will be inverted, since the y axis on the tiles goes up, and will be uninverted by GL.

    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        const tile = tileData[i][j]

        let k = 4 * (i * width + j)
        outputArr[k] = tileSize * (tile / widthInTiles)
        outputArr[k+1] = tileSize * Math.floor(tile / widthInTiles)
      }
    }

    const imgData = new ImageData(outputArr, width, height);

    this.worldTexture = imgData
  }

  render (renderer) {
    if (this.needsUpdate) this.renderWorldToTexture()

    const { gl, glManager, canvasWidth, canvasHeight, width, height } = renderer

    const tilesetTexture = this.tileset.getTextureObject(renderer)

    let worldGLTexture = glManager.getTexture(this.id)

    if (this.needsUpdate) {
      gl.bindTexture(gl.TEXTURE_2D, worldGLTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.worldTexture)

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // use nearest
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    gl.activeTexture(gl.TEXTURE0) // bind tileset to texture 0
    gl.bindTexture(gl.TEXTURE_2D, tilesetTexture)
    gl.activeTexture(gl.TEXTURE1) // bind world texture to 1
    gl.bindTexture(gl.TEXTURE_2D, worldGLTexture)

    const program = glManager.getProgram("TileLayer") ?? glManager.createProgram("TileLayer",
      // In the vertex shader, we set the vec2 vWorldCoord to the location in the world texture where we're drawing.
      // The location in the world texture is the same as the tileData, so this is done via a transformation of
      // coordinates, namely the transformation returned by game.getClipToWorldTransform()
      `precision mediump float;
       attribute vec2 vPosition;
       
       uniform vec2 transformSlopes;
       uniform vec2 transformConstants;
       
       varying highp vec2 vWorldCoord;

       void main() {
         gl_Position = vec4(vPosition, 0, 1);
         vWorldCoord = transformSlopes * vPosition + transformConstants;
       }`, `precision mediump float;
       varying highp vec2 vWorldCoord; // Where in the world we are, perhaps between (0,0) and (32,18)
       
       uniform sampler2D worldTexture;
       uniform sampler2D tileset;
       uniform vec2 worldSize; // Know where to look in the world texture
       uniform int tileSize; // in pixels
       uniform int tilesetSize; // width of the tileset in tiles
       
       void main() {
         gl_FragColor = texture2D(worldTexture, vWorldCoord / worldSize);
       }`, ["vPosition"], ["transformSlopes", "transformConstants", "worldTexture", "tileset", "worldSize", "tileSize", "tilesetWidth", "tilesetHeight"])

    const transformation = renderer.game.getClipToWorldTransform()

    // Load in a rectangle geometry
    const rectangle = new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1])
    const buf = glManager.getBuffer(this.id)

    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, rectangle, gl.STATIC_DRAW)

    gl.useProgram(program.program);

    const vPosition = program.attribs.vPosition

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    gl.uniform1i(program.uniforms.tileset, 0)
    gl.uniform1i(program.uniforms.worldTexture, 1)

    gl.uniform2f(program.uniforms.worldSize, this.width, this.height)
    gl.uniform2f(program.uniforms.transformSlopes, transformation.x_m, transformation.y_m)
    gl.uniform2f(program.uniforms.transformConstants, transformation.x_b, transformation.y_b)
    gl.uniform2f(program.uniforms.transformConstants, transformation.x_b, transformation.y_b)
    gl.uniform1i(program.uniforms.tileSize, this.tileset.tileSize)
    gl.uniform1i(program.uniforms.tilesetSize, this.tileset.widthInTiles)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}

// Layer
/*const tileLayerProgram = glManager.getProgram("TileLayer") ?? glManager.createProgram("TileLayer",
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
        }`, ["vPosition"], ["uSampler", "test1", "test2"])*/
