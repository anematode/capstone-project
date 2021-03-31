import { Vec2 } from "./vec2"

export class BoundingBox {
  constructor (x=0, y=0, width=0, height=0) {
    // location of the box's center
    this.x1 = x
    this.y1 = y
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
    // preserving width and height
    this.x1 = x - this.width / 2
    this.y1 = y - this.height / 2

    return this
  }

  get cx () {
    return this.x1 + this.width / 2
  }

  set cx (v) {
    this.x1 = v - this.width / 2
  }

  get cy () {
    return this.y1 + this.height / 2
  }

  set cy (v) {
    this.y1 = v - this.height / 2
  }

  get x2 () {
    return this.x1 + this.width
  }

  get y2 () {
    return this.y1 + this.height
  }

  getY2 () {
    return this.y2
  }

  getX2 () {
    return this.x2
  }

  getXBounds () {
    return [ this.x1, this.x1 + width ]
  }

  getYBounds () {
    return [ this.y1, this.y1 + height ]
  }

  setBottomMidpoint (x, y) {
    this.cx = x
    this.y1 = y

    return this
  }

  shift (x, y) {
    this.x1 += x
    this.y1 += y
    return this
  }

  copyFrom (bbox) {
    this.x1 = bbox.x1
    this.y1 = bbox.y1
    this.width = bbox.width
    this.height = bbox.height
    return this
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

  shrink (d) {
    return new BoundingBox(this.x1 + d, this.y1 + d, this.width - 2 * d, this.height - 2 * d)
  }

  intersectWith (bbox) {
    let tx1 = this.x1, tx2 = this.getX2(), ty1 = this.y1, ty2 = this.getY2()
    let bx1 = bbox.x1, bx2 = bbox.getX2(), by1 = bbox.y1, by2 = bbox.getY2()

    let x1 = Math.max(tx1, bx1), y1 = Math.max(ty1, by1)
    let x2 = Math.min(tx2, bx2), y2 = Math.min(ty2, by2)

    if (y1 <= y2 && x1 <= x2) {
      return new BoundingBox(x1, y1, x2 - x1, y2 - y1)
    }

    return null
  }

  zoomOn (v, amt) {
    // Scale on v by amt
    let newCornerX = (this.x1 - v.x) * amt + v.x
    let newCornerY = (this.y1 - v.y) * amt + v.y

    this.x1 = newCornerX
    this.y1 = newCornerY
    this.width *= amt
    this.height *= amt
  }

  static fromPoints (x1, y1, x2, y2) {
    return new BoundingBox(x1, y1, x2 - x1, y2 - y1)
  }

  clone () {
    return new BoundingBox(this.x1, this.y1, this.width, this.height)
  }

  union (bbox) {
    return BoundingBox.fromPoints(Math.min(this.x1, bbox.x1), Math.min(this.y1, bbox.y1), Math.max(this.x2, bbox.x2), Math.max(this.y2, bbox.y2))
  }
}
