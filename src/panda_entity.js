import {Entity} from "./entity_group"
import {texturePack} from "./main_textiles"
import {BoundingBox} from "./bounding_box"

export class PlayerEntity extends Entity {
  constructor () {
    super()

    this.position = new Vec2(2.5, 2)
    this.hitbox = new BoundingBox(0, 0, 0.8, 1.7)

    this.fixHitbox()

    this.state = "static1"
  }

  fixHitbox () {
    this.hitbox.setBottomMidpoint(this.position.x, this.position.y)
  }

  getRenderingInstructions () {
    // The panda's height is used to define the texture position. The texture will have height 1.7 and will be centered
    // horizontally on the panda's position (its feet).

    const sprite = texturePack

    const textureHeight

  }
}
