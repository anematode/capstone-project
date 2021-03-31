import {Entity} from "./entity_group"
import {texturePack} from "./main_textiles"
import {BoundingBox} from "./bounding_box"
import {PointDebugger, RectangleDebugger} from "./debugger"

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

    const sprite = texturePack.getLocationOf(this.state)

    const box = new BoundingBox(0, 0, sprite.w / sprite.h * this.hitbox.height, this.hitbox.height).setBottomMidpoint(this.position.x, this.position.y)

    return { tileCoords: [box.x1, box.y2, box.x2, box.y1 ], textureCoords: [sprite.x, sprite.y, sprite.x + sprite.w, sprite.y + sprite.h]}
  }

  render (renderer) {
    renderer.addDebugger(new RectangleDebugger(this.hitbox))
    renderer.addDebugger(new PointDebugger(this.position))
  }
}
