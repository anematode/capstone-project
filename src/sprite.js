import {BoundingBox} from "./bounding_box"


export class Sprite {
  constructor () {
    this.needsUpdate = true

    this.boundingBox = new BoundingBox()
  }

  render (renderer) {
    if (this.needsUpdate) {

    }
  }
}
