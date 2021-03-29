// Tracks how far things have loaded
export class AssetLoadTracker {
  constructor () {
    this.id = 0
    this.timeStart = Date.now()
    this.assetProgresses = []

    this.isFinished = false
    this.onfinished = null
  }

  calculateProgress () {
    return this.assetProgresses.reduce((a, b) => a + b) / this.assetProgresses.length
  }

  markProgress (id, x) {
    this.assetProgresses[id] = x
    if (x === 1) {
      let progress = this.calculateProgress()

      if (progress === 1) {
        this.isFinished = true

        if (this.onfinished)
          this.onfinished(Date.now() - this.timeStart)
      }
    }
  }

  getHandle () {
    const id = this.id++

    this.markProgress(id, 0)
    const handle = _ => this.markProgress(id, 1)

    handle.progress = v => this.markProgress(id, Math.max(0, Math.min(v, 1)))
    handle.id = id

    return handle
  }
}

export const assetTracker = new AssetLoadTracker()
