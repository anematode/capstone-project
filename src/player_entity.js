import {Entity} from "./entity_group"
import {texturePack} from "./main_textiles"
import {BoundingBox} from "./bounding_box"
import {PointDebugger, RectangleDebugger} from "./debugger"
import {EntityWithPhysics} from "./entity_with_physics"
import {Vec2} from "./vec2"

export class PlayerEntity extends EntityWithPhysics {
  constructor () {
    super()

    this.position = new Vec2(2.5, 2)

    this.hitboxWidth = 0.8
    this.hitboxHeight = 1.7

    this.state = "static1"
  }

  getRenderingInstructions () {
    // The panda's height is used to define the texture position. The texture will have height 1.7 and will be centered
    // horizontally on the panda's position (its feet).

    const sprite = texturePack.getLocationOf(this.state)

    const box = new BoundingBox(0, 0, this.hitboxWidth * sprite.h / sprite.w, this.hitboxHeight ).setBottomMidpoint(this.position.x, this.position.y)

    return { tileCoords: [box.x1, box.y2, box.x2, box.y1 ], textureCoords: [sprite.x, sprite.y, sprite.x + sprite.w, sprite.y + sprite.h]}
  }

  render (renderer) {
    renderer.addDebugger(new RectangleDebugger(this.getHitbox()))
    renderer.addDebugger(new PointDebugger(this.position))
  }

  jump () {
    if (this.onGround) {
      this.velocity.y += 0.7
    }
  }

  moveLeftOrRight (unit=1) {
    let mvAmount = this.onGround ? 0.05 : 0.02
    let maxVelo = this.onGround ? 0.6 : 0.1

    const velocity = this.velocity
    const currentVelo = velocity.x

    let intendedMvAmount = unit * mvAmount
    if (Math.abs(currentVelo + intendedMvAmount) > maxVelo) {
      // do nothing
    } else {
      velocity.x = currentVelo + intendedMvAmount
    }
  }

  moveLeft () {
    // max x left velocity is 0.2, so we increment slowly to it
    this.moveLeftOrRight(-1)
  }

  moveRight () {
    this.moveLeftOrRight(1)
  }
}
