import {Vec2} from "./vec2"
import {BoundingBox} from "./bounding_box"

// The maximum number of times we call tick() when we're drifting over
const maxTicksBeforeLagBack = 5

export function createTicker (tickCallback, tickLength=1 /*seconds*/) {
  tickLength = tickLength * 1000 // ms

  let trueStartTime
  let startTime
  let tickIndex

  let isRunning = false

  let historyLen = 5
  let tickTimeHistory = []

  function doTick () {
    let tickStart = Date.now()

    tickIndex++
    tickCallback()

    let tickEnd = Date.now()
    let tickTime = tickEnd - tickStart

    tickTimeHistory.push(tickTime)
    if (tickTimeHistory.length > historyLen) {
      tickTimeHistory.shift()
    }
  }

  function avgTickTime () { // in ms
    return tickTimeHistory.reduce((a, b) => a + b) / tickTimeHistory.length
  }

  function skipTicks () {
    //console.warn(`Can't keep up! Average tick took ${avgTickTime()} ms (should be ${tickLength} ms).`)

    startTime = Date.now()
    tickIndex = 1
  }

  function runTicks () {
    if (!isRunning) return

    let currentTime = Date.now()
    let expectedTime = startTime + tickLength * tickIndex

    if (expectedTime > currentTime + tickLength) {
      // we're more than half a tick early; skip this tick without incrementing tickIndex
      setTimeout(runTicks, currentTime - expectedTime)
    } else if (expectedTime < currentTime - tickLength) {

      if (expectedTime < currentTime - 5 * tickLength) {
        skipTicks()
      } else {// else, call tick() multiple times to catch up
        for (let i = 0; i < maxTicksBeforeLagBack; ++i) {
          doTick()

          let delta = startTime + tickLength * tickIndex - Date.now()

          // successfully caught up
          if (delta < tickLength) {
            break
          } else if (delta > maxTicksBeforeLagBack * tickLength) {
            skipTicks()
          }
        }
      }
    } else {
      doTick()
    }

    setTimeout(runTicks, startTime + tickLength * tickIndex - Date.now())
  }

  // The general strategy is as follows. We trust that setTimeout is somewhat competent and ask to to return (tickLength - 2) ms
  // later. If we're faster than the linear 1/60ths of a second, we increase the setTimeout value, and if we're more than
  // a tick ahead, we skip an invocation of tick(). If we're slower than 1/60ths of a second, we decrease the setTimeout
  // value, and if we're quite behind (more than maxTicksBeforeLagBack) we define the new start time as current and
  // proceed calculating ticks.

  return {
    start: () => {
      isRunning = true
      trueStartTime = startTime = Date.now()
      tickIndex = 0

      setTimeout(runTicks, 0)
    },
    stop: () => {
      isRunning = false
    },
    getTickCount: () => {
      return tickIndex
    },
    getAvgTickTime: () => {
      return avgTickTime()
    }
  }
}

// The physics engine runs at a different speed than the renderer. One physics tick is 1/30th of a second.
export class PhysicsEngine {
  constructor (game) {
    this.game = game

    this.gravityAcceleration = -0.07  // tiles per tick per tick
  }

  get entities () {
    return this.game.world.entities
  }

  get physicalTiles () {
    return this.game.world.physicalTiles
  }

  getPhysicalTileGeometriesInRange (bbox) {
    // bounding box of the entity's tick movement. We search through the tiles in this range, reporting their bounding
    // boxes
    const physicalTiles = this.physicalTiles


  }

  tick () {
    // In this tick based system, we first compute the movement, which gives a new velocity, then we apply the forces
    // to that velocity. The velocity is in tiles / tick.
    const { entities, tickLength, physicalTiles } = this

    for (const entity of entities) {
      if (!entity.velocity) return  // not a physics entity

      const { position, velocity } = entity
      const effectiveVelocity = velocity.clone()

      // modify velocity (gravity)
      effectiveVelocity.add(new Vec2(0, this.gravityAcceleration))

      // compute hitbox
      const hitbox = entity.getHitbox()

      // COMPUTE NEXT INTENDED POSITION
      const nextPosition = position.clone().add(effectiveVelocity)

      // compute next hitbox
      const nextHitbox = hitbox.clone().shift(effectiveVelocity.x, effectiveVelocity.y)

      // Together this forms a sort pf parallelepiped like this. We want to know whether this intersects any objects,
      // and if so, where, and at what time within the tick.
      //  ----------
      // |          |\
      // |          | \
      // |          |  \
      // |          |   \
      // |          |    \
      // ------------     \
      //  \          \     \
      //   \     -----------
      //    \    |    \     |
      //     \   |     \    |
      //      \  |      \   |
      //       \ |       \  |
      //        \|        \ |
      //         ------------

      // Box containing the entire tick
      const bbox = hitbox.union(nextHitbox)

      let xmin = Math.floor(bbox.x1), xmax = Math.ceil(bbox.x2) + 1
      let ymin = Math.floor(bbox.y1), ymax = Math.ceil(bbox.y2) + 1

      let closestIntersectionTime = Infinity  // within a tick

      const velocityUnit = effectiveVelocity.unit()
      entity.onGround = false

      exit: for (let x = Math.max(xmin, 0); x < Math.min(physicalTiles.width, xmax); ++x) {
        for (let y = Math.max(ymin, 0); y < Math.min(physicalTiles.height, ymax); ++y) {
          const tile = physicalTiles.tileData[y][x]

          if (tile) { // block to collide with, which is at (x, y) to (x+1, y+1)
            if (nextHitbox) {
              const intersection = nextHitbox.intersectWith(new BoundingBox(x, y, 1, 1))

              if (intersection) {
                if (intersection.width < intersection.height) {
                  effectiveVelocity.x = 0
                  nextPosition.x += -intersection.width * Math.sign(velocityUnit.x)
                } else {
                  effectiveVelocity.y = 0
                  nextPosition.y += -intersection.height * Math.sign(velocityUnit.y)

                  // On the ground, so slow movements
                  effectiveVelocity.x *= 0.74

                  entity.onGround = true
                }
              }
            }
          }
        }
      }

      if (closestIntersectionTime !== Infinity) {

      }

      position.set(nextPosition)
      velocity.set(effectiveVelocity)
    }
  }
}
