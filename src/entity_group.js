import {generateUUID} from "./tile_layer"
import {texturePack} from "./main_textiles"
import {BoundingBox} from "./bounding_box"
import {Vec2} from "./vec2"

export class EntityGroup {
  constructor (game, entities) {
    this.id = generateUUID()
    this.game = game

    this.entities = entities
  }

  render (renderer) {
    const renderingInstructions = []  // Array of instructions:  { textureCoords : [ x1, y1, x2, y2 ], tileCoords: [ x1, y1, x2, y2 ] }

    for (const entity of this.entities) {
      // From each entity, ask for the texture coordinates and where it'd like to be drawn. Specifically we get
      // (coord of top left in tile space), (coord of bottom right in tile space), (coord of top left in texture),
      // (coord of bottom right in texture). An array of these can also be given, in which case they will all be
      // drawn.

      const instructions = entity.getRenderingInstructions()

      if (Array.isArray(instructions))
        Array.prototype.push(renderingInstructions, instructions)
      else
        renderingInstructions.push(instructions)
    }

    this.renderSprites(renderer, renderingInstructions)

    // Then render whatever the entity desires
    for (const entity of this.entities) {
      entity.render(renderer)
    }
  }

  renderSprites (renderer, instructions) {
    const { gl, glManager, game } = renderer

    if (instructions.length === 0) return

    // Tile space positions
    // For each rectangle we need six vertices, so twelve coordinates
    const positionArray = new Float32Array(instructions.length * 12)

    // Texture pixel space, what part of the texture should we be mapping to
    const textureCoordArray = new Float32Array(instructions.length * 12)

    for (let i = 0; i < instructions.length; ++i) { // construct rectangles
      const instruction = instructions[i]
      const indx = 12 * i

      const { textureCoords, tileCoords } = instruction

      positionArray[indx] = tileCoords[0]
      positionArray[indx+1] = tileCoords[1]
      positionArray[indx+2] = tileCoords[2]
      positionArray[indx+3] = tileCoords[3]
      positionArray[indx+4] = tileCoords[0]
      positionArray[indx+5] = tileCoords[3]

      positionArray[indx+6] = tileCoords[0]
      positionArray[indx+7] = tileCoords[1]
      positionArray[indx+8] = tileCoords[2]
      positionArray[indx+9] = tileCoords[3]
      positionArray[indx+10] = tileCoords[2]
      positionArray[indx+11] = tileCoords[1]

      textureCoordArray[indx] = textureCoords[0]
      textureCoordArray[indx+1] = textureCoords[1]
      textureCoordArray[indx+2] = textureCoords[2]
      textureCoordArray[indx+3] = textureCoords[3]
      textureCoordArray[indx+4] = textureCoords[0]
      textureCoordArray[indx+5] = textureCoords[3]

      textureCoordArray[indx+6] = textureCoords[0]
      textureCoordArray[indx+7] = textureCoords[1]
      textureCoordArray[indx+8] = textureCoords[2]
      textureCoordArray[indx+9] = textureCoords[3]
      textureCoordArray[indx+10] = textureCoords[2]
      textureCoordArray[indx+11] = textureCoords[1]
    }

    //console.log(positionArray, textureCoordArray)

    const glTexturePack = texturePack.getTextureObject(renderer)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, glTexturePack)

    const program = glManager.getProgram("EntityGroup") ?? glManager.createProgram("EntityGroup",
      // In the vertex shader, we set the vec2 vWorldCoord to the location in the world texture where we're drawing.
      // The location in the world texture is the same as the tileData, so this is done via a transformation of
      // coordinates, namely the transformation returned by game.getClipToWorldTransform()
      `attribute vec2 vPosition;
       attribute vec2 vTextureCoord;
       
       varying highp vec2 vTextureCoordInterp;
       
       uniform vec2 tileToClipSlopes;
       uniform vec2 tileToClipConstants;
       
       uniform vec2 textureSize;

        void main() {
            gl_Position = vec4(tileToClipSlopes * vPosition + tileToClipConstants, 0, 1);
            vTextureCoordInterp = vTextureCoord / textureSize;
        }`, `precision mediump float;
        varying highp vec2 vTextureCoordInterp;
        uniform sampler2D texturePack;
        
        void main() {
          gl_FragColor = texture2D(texturePack, vTextureCoordInterp);
          gl_FragColor.rgb *= gl_FragColor.a;
        }
       `, ["vPosition", "vTextureCoord"], ["tileToClipSlopes", "tileToClipConstants", "textureSize", "texturePack" ])

    gl.useProgram(program.program);

    const vPosition = program.attribs.vPosition
    const vTextureCoord = program.attribs.vTextureCoord

    const posArrayBuffer = glManager.getBuffer(this.id+'pos')
    const texCoordArrayBuffer = glManager.getBuffer(this.id+'texCoord')

    gl.bindBuffer(gl.ARRAY_BUFFER, posArrayBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.DYNAMIC_DRAW)

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordArrayBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, textureCoordArray, gl.DYNAMIC_DRAW)

    gl.vertexAttribPointer(vTextureCoord, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vTextureCoord)

    const tileToClip = game.getWorldToClipTransform()
    gl.uniform2f(program.uniforms.tileToClipSlopes, tileToClip.x_m, tileToClip.y_m)
    gl.uniform2f(program.uniforms.tileToClipConstants, tileToClip.x_b, tileToClip.y_b)
    gl.uniform2f(program.uniforms.textureSize, texturePack.width, texturePack.height)
    gl.uniform1i(program.uniforms.texturePack, 0) // texture 0, glTexturePack

    gl.drawArrays(gl.TRIANGLES, 0, instructions.length * 6)
  }
}

// Generally the hitbox of an entity is centered over its position.

export class Entity {
  constructor () {
    // All in tile coordinates

    // Generally, the position of the feet
    this.position = new Vec2(0, 0)

    this.hitboxWidth = 0
    this.hitboxHeight = 0
  }

  getHitbox () {
    let hitbox = new BoundingBox(0, 0, this.hitboxWidth, this.hitboxHeight)
    return hitbox.setBottomMidpoint(this.position.x, this.position.y)
  }

  // Return locations in the texture, etc.
  getRenderingInstructions () {
    return []
  }

  render () {

  }
}
