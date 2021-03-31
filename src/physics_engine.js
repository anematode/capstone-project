
// The maximum number of times we call tick() when we're drifting over
const maxTicksBeforeLagBack = 5

function createTicker (tickCallback, tickLength=1/60 /*seconds*/) {
  tickLength = tickLength * 1000 // ms

  let startTime
  let tickIndex

  let isRunning = false

  function doTick () {
    tickIndex++
    tickCallback()
  }

  function runTicks () {
    if (!isRunning) return

    let currentTime = Date.now()
    let expectedTime = startTime + tickLength * tickIndex

    cow: if (expectedTime > currentTime + tickLength) {
      // we're more than half a tick early; skip this tick without incrementing tickIndex
      console.log(`Tick ${tickIndex} should come at t=${expectedTime}, while it is t=${currentTime}; skipping tick invocation`)
      setTimeout(runTicks, currentTime - expectedTime)
    } else if (expectedTime < currentTime - tickLength) {
      // more than a tick late; call tick() multiple times to catch up
      for (let i = 0; i < maxTicksBeforeLagBack; ++i) {
        doTick()
        if (startTime + tickLength * tickIndex - Date.now() < tickLength) {
          break cow
        }
      }

      // Time to lag and reset everything
      startTime = Date.now()
      tickIndex = 1
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
      startTime = Date.now()
      tickIndex = 1

      setTimeout(runTicks, 0)
    },
    stop: () => {
      isRunning = false
    }
  }
}

window.createTicker = createTicker

// The physics engine runs at a different speed than the renderer. One physics tick is 1/60th of a second.

export class PhysicsEngine {
  constructor (game) {
    this.game = game
  }

  tick () {

  }
}
