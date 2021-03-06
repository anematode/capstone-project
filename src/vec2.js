export class Vec2 {
  constructor (x, y) {
    if (x.x) {
      this.x = x.x
      this.y = x.y
    } else if (Array.isArray(x)) {
      this.x = x[0]
      this.y = x[1]
    } else {
      this.x = x
      this.y = y
    }
  }

  clone() {
    return new Vec2(this.x, this.y)
  }

  setComponents(x, y) {
    this.x = x
    this.y = y
  }

  set(v, y) {
    if (y !== undefined) {
      this.x = v
      this.y = y
    } else {
      this.x = v.x
      this.y = v.y
    }
  }

  subtract(v) {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  add(v) {
    this.x += v.x
    this.y += v.y
    return this
  }

  multiply(s) {
    this.x *= s
    this.y *= s
    return this
  }

  hasNaN() {
    return isNaN(this.x) || isNaN(this.y)
  }

  scale(s) {
    return this.multiply(s)
  }

  divide(s) {
    this.x /= s
    this.y /= s
    return this
  }

  asArray() {
    return [this.x, this.y]
  }

  length() {
    return Math.hypot(this.x, this.y)
  }

  unit() {
    if (this.x === 0 && this.y === 0)
      return this.clone()

    return this.clone().divide(this.length())
  }

  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y)
  }

  distanceSquaredTo(v) {
    return (this.x - v.x) ** 2 + (this.y - v.y) ** 2
  }

  dot(v) {
    return this.x * v.x + this.y * v.y
  }

  cross(v) {
    return this.x * v.y - v.x * this.y
  }

  rotate(angle, about=Origin) {
    let c = Math.cos(angle), s = Math.sin(angle)

    if (about === Origin) {
      let x = this.x, y = this.y

      this.x = x * c - y * s
      this.y = y * c + x * s
    } else {
      let x = this.x, y = this.y

      this.subtract(about).rotate(angle).add(about)
    }

    return this
  }

  rotateDeg(angle_deg, about=Origin) {
    this.rotate(angle_deg / 180 * 3.14159265359, about)

    return this
  }

  transform({ x_m, x_b, y_m, y_b }) {
    return new Vec2(x_m * this.x + x_b, y_m * this.y + y_b)
  }
}

const Origin = new Vec2(0,0)

// window.Vec2 = Vec2
