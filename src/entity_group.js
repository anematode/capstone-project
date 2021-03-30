import {generateUUID} from "./tile_layer"
import {texturePack} from "./main_textiles"


export class EntityGroup {
  constructor (game) {
    this.id = generateUUID()
    this.game = game

    this.entities = []
  }

  render (renderer) {

    const renderingInstructions = []  // Flat array of (tl x, tl y, br x, br y, same in texture space, ... )

    for (const entity of this.entities) {
      // From each entity, ask for the texture coordinates and where it'd like to be drawn. Specifically we get
      // (coord of top left in tile space), (coord of bottom right in tile space), (coord of top left in texture),
      // (coord of bottom right in texture). An array of these can also be given, in which case they will all be
      // drawn.

      const instructions = entity.getRenderingInstructions()

      for (let i = 0; i < instructions.length; ++i) {
        renderingInstructions.push(instructions[i])
      }
    }

    this.renderSprites(renderer, renderingInstructions.flat())

    // Then render whatever the entity desires
    for (const entity of this.entities) {
      entity.render(renderer)
    }
  }

  renderSprites (renderer, instructions) {
    const { gl, glManager, game } = renderer

    // How many rectangular textures need to be drawn
    const rectToDraw = Math.floor(instructions.length / 8)

    // Tile space,
    const positionArray = new Float32Array(rectToDraw * 4)
    // Texture pixel space, what part of the texture should we be mapping to
    const textureCoordArray = new Float32Array(rectToDraw * 4)

    // Copy over instructions
    for (let i = 0; i < rectToDraw; ++i) {
      const instructionsIndx = i * 8
      const arrayIndx = i * 4

      for (let j = 0; j < 4; ++j) {
        positionArray[arrayIndx+j] = instructions[instructionsIndx+j]
        textureCoordArray[arrayIndx+j] = instructions[instructionsIndx+j+4]
      }
    }

    // Transformation from tiles

    const posArrayBuffer = glManager.getBuffer(this.id+'pos')
    const texCoordArrayBuffer = glManager.getBuffer(this.id+'texCoord')

    const glTexturePack = texturePack.getTextureObject(renderer)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, glTexturePack)

    const program = glManager.getProgram("TileLayer") ?? glManager.createProgram("TileLayer",
      // In the vertex shader, we set the vec2 vWorldCoord to the location in the world texture where we're drawing.
      // The location in the world texture is the same as the tileData, so this is done via a transformation of
      // coordinates, namely the transformation returned by game.getClipToWorldTransform()
      `precision mediump float;
       attribute vec2 vPosition;
       
       uniform vec2 transformSlopes;
       uniform vec2 transformConstants;
       
       varying vec2 vWorldCoord;

       void main() {
         gl_Position = vec4(vPosition, 0, 1);
         vWorldCoord = transformSlopes * vPosition + transformConstants;
       }`, `precision mediump float;
       varying vec2 vWorldCoord; // Where in the world we are, perhaps between (0,0) and (32,18)
       
       uniform sampler2D worldTexture;
       uniform sampler2D tileset;
       uniform vec2 worldSize; // Know where to look in the world texture
       uniform float tileSize; // in pixels
       uniform vec2 tilesetSize; // width and height of the tileset in pixels
       
       vec2 roundVec2(vec2 v) {
         return vec2(floor(v.x + 0.5), floor(v.y + 0.5));
       }
       
       void main() {
         // This is the tile we are in
         vec2 tileLookup = floor(vWorldCoord);
         
         // the r and g values have the position in the tileset array where it should be. We center on the pixel to
         // avoid any rounding errors
         vec2 tilePos = texture2D(worldTexture, (tileLookup + vec2(0.5, 0.5)) / worldSize).xy * 255.;
         
         // Should be two integers in pixel space
         vec2 roundedTilePos = roundVec2(tilePos * tileSize);
         
         // We now need the location of the texel WITHIN the tile. We use the difference between the vWorldCoord and
         // the vec used for the tile lookup, to avoid rounding errors. because we're using gl nearest, we again try
         // to round to the nearest pixel and sample it at its center. We also have to FLIP the y axis value, because the tiles are
         // upside down relative to this.
         
         vec2 shiftAmount = floor((vWorldCoord - tileLookup) * tileSize) + vec2(0.5, 0.5);
         shiftAmount.y = tileSize - shiftAmount.y;
         
         gl_FragColor = texture2D(tileset, (roundedTilePos + shiftAmount) / tilesetSize);
         gl_FragColor.rgb *= gl_FragColor.a;
       }`, ["vPosition"], ["transformSlopes", "transformConstants", "worldTexture", "tileset", "worldSize", "tileSize", "tilesetSize"])

    const transformation = renderer.game.getClipToWorldTransform()

    gl.useProgram(program.program);

    const vPosition = program.attribs.vPosition

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)
  }
}


export class Entity {
  constructor () {
    // All in tile coordinates

    // Generally, the position of the feet
    this.position = new Vec2(0, 0)

    // Hitbox, should contain the position
    this.hitbox = new BoundingBox(0, 0, 0, 0)
  }

  // Return locations in the texture, etc.
  getRenderingInstructions () {
    return []
  }

  render () {

  }
}
