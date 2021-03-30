import {generateUUID} from "./tile_layer"
import {texturePack} from "./main_textiles"


export class EntityRenderingGroup {
  constructor () {
    this.id = generateUUID()

    this.entities = [] // This will not be mutated
  }

  render (renderer) {

    const renderingInstructions = []  // Flat array of (tl x, tl y, br x, br y, same in texture space, ... )

    for (const entity of this.entities) {
      // From each entity, ask for the texture coordinates and where it'd like to be drawn. Specifically we get
      // (coord of top left in tile space), (coord of bottom right in tile space), (coord of top left in texture),
      // (coord of bottom right in texture). An array of these can also be given, in which case they will all be
      // drawn.

      renderingInstructions.push(entity.getRenderingInstructions())
    }

    this.renderSprites(renderer, renderingInstructions.flat())

    for (const entity of this.entities) {

    }
  }

  renderSprites (renderer) {

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
}
