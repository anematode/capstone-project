import {Entity} from "./entity_group"
import {Vec2} from "./vec2"

class EntityWithPhysics extends Entity {
  constructor () {
    super()

    this.mass = 1
    this.velocity = new Vec2(0, 0) // tiles per tick, one tick = 60 ms

  }
}
