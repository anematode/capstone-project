import { Vec2 } from "./vec2"

export class BoundingBox {
  constructor (x=0, y=0, width=0, height=0) {
    // location of the box's center
    this.cx = x + width / 2
    this.cy = y + height / 2
    this.width = width
    this.height = height
  }

  setWidth (w) {
    this.width = w
    return this
  }

  setHeight (h) {
    this.height = h
    return this
  }

  setCenter (x, y) {
    this.cx = x
    this.cy = y
    return this
  }

  get x1 () {
    return this.cx - this.width / 2
  }

  get x2 () {
    return this.cx + this.width / 2
  }

  get y1 () {
    return this.cy - this.height / 2
  }

  get y2 () {
    return this.cy + this.height / 2
  }

  getX1 () {
    return this.cx - this.width / 2
  }

  getX2 () {
    return this.cx + this.width / 2
  }

  getY1 () {
    return this.cy - this.height / 2
  }

  getY2 () {
    return this.cy + this.height / 2
  }

  getXBounds () {
    let delta = this.width / 2
    return [ this.cx - delta, this.cx + delta ]
  }

  getYBounds () {
    let delta = this.height / 2
    return [ this.cy - delta, this.cy + delta ]
  }

  setBottomMidpoint (x, y) {
    this.cx = x
    this.cy = y + this.height / 2
    return this
  }

  // bottom left in graph-like spaces, top left in canvas-like spaces
  setX1Y1Corner (x, y) {
    this.cx = x + this.width / 2
    this.cy = y + this.height / 2
    return this
  }

  setX1Y2Corner (x, y) {
    this.cx = x + this.width / 2
    this.cy = y - this.height / 2
    return this
  }

  copyFrom (bbox) {
    this.cx = bbox.cx
    this.cy = bbox.cy
    this.width = bbox.width
    this.height = bbox.height
  }

  getLargestBoxInsideWithAspectRatio (aspectRatio) {
    let newWidth = this.width, newHeight = this.height
    if (newWidth / newHeight > aspectRatio) { // height is constraining
      newWidth = newHeight * aspectRatio
    } else { // width is constraining
      newHeight = newWidth / aspectRatio
    }

    return new BoundingBox(0, 0, newWidth, newHeight).setCenter(this.cx, this.cy)
  }

  getSmallestBoxOutsideWithAspectRatio (aspectRatio) {
    let newWidth = this.width, newHeight = this.height
    if (newWidth / newHeight > aspectRatio) {
      newHeight = newWidth / aspectRatio
    } else {
      newWidth = newHeight * aspectRatio
    }

    return new BoundingBox(0, 0, newWidth, newHeight).setCenter(this.cx, this.cy)
  }

  moveToBeInside (bbox) { // translate the box so that the distance translated is minimized and the intersection with bbox is minimized

  }

  resizeToAspectRatio (aspectRatio) {
    this.copyFrom(this.getLargestBoxInsideWithAspectRatio(aspectRatio))
  }

  static getReducedTransform (box1, box2, flipX=false, flipY=false) {
    let x_m = 1 / box1.width
    let x_b = - box1.x1 / box1.width

    if (flipX) {
      x_m *= -1
      x_b = 1 - x_b
    }

    x_m *= box2.width
    x_b *= box2.width
    x_b += box2.x1

    let y_m = 1 / box1.height
    let y_b = - box1.y1 / box1.height

    if (flipY) {
      y_m *= -1
      y_b = 1 - y_b
    }

    y_m *= box2.height
    y_b *= box2.height
    y_b += box2.y1

    return {x_m, x_b, y_m, y_b}
  }
}

function boundsOverlap(bounds1, bounds2) {

}
