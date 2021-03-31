
// A tileset has 16x16 tiles, while a texture packer includes textures of any (reasonable) size.

import {AssetLoadTracker, assetTracker} from "./asset_loader"
import {generateUUID} from "./tile_layer"

// Get an array of bounding boxes corresponding to each texture
function getRectanglePacking (textureList) {
  const out = []

  // already sorted by area
  for (const [name, img] of textureList) {

  }
}

// Credit to https://github.com/mapbox/potpack
function potpack(boxes) {

  // calculate total box area and maximum box width
  let area = 0;
  let maxWidth = 0;

  for (const box of boxes) {
    area += box.w * box.h;
    maxWidth = Math.max(maxWidth, box.w);
  }

  // sort the boxes for insertion by height, descending
  boxes.sort((a, b) => b.h - a.h);

  // aim for a squarish resulting container,
  // slightly adjusted for sub-100% space utilization
  const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

  // start with a single empty space, unbounded at the bottom
  const spaces = [{x: 0, y: 0, w: startWidth, h: Infinity}];

  let width = 0;
  let height = 0;

  for (const box of boxes) {
    // look through spaces backwards so that we check smaller spaces first
    for (let i = spaces.length - 1; i >= 0; i--) {
      const space = spaces[i];

      // look for empty spaces that can accommodate the current box
      if (box.w > space.w || box.h > space.h) continue;

      // found the space; add the box to its top-left corner
      // |-------|-------|
      // |  box  |       |
      // |_______|       |
      // |         space |
      // |_______________|
      box.x = space.x;
      box.y = space.y;

      height = Math.max(height, box.y + box.h);
      width = Math.max(width, box.x + box.w);

      if (box.w === space.w && box.h === space.h) {
        // space matches the box exactly; remove it
        const last = spaces.pop();
        if (i < spaces.length) spaces[i] = last;

      } else if (box.h === space.h) {
        // space matches the box height; update it accordingly
        // |-------|---------------|
        // |  box  | updated space |
        // |_______|_______________|
        space.x += box.w;
        space.w -= box.w;

      } else if (box.w === space.w) {
        // space matches the box width; update it accordingly
        // |---------------|
        // |      box      |
        // |_______________|
        // | updated space |
        // |_______________|
        space.y += box.h;
        space.h -= box.h;

      } else {
        // otherwise the box splits the space into two spaces
        // |-------|-----------|
        // |  box  | new space |
        // |_______|___________|
        // | updated space     |
        // |___________________|
        spaces.push({
          x: space.x + box.w,
          y: space.y,
          w: space.w - box.w,
          h: box.h
        });
        space.y += box.h;
        space.h -= box.h;
      }
      break;
    }
  }

  return {
    w: width, // container width
    h: height, // container height
    fill: (area / (width * height)) || 0 // space utilization
  };
}

export class TexturePacker {
  constructor () {
    const handle = assetTracker.getHandle()

    this.subAssetTracker = new AssetLoadTracker()
    this.subAssetTracker.onfinished = () => {
      handle()
      this.generateTexturePack()

      if (this.onfinished)
        this.onfinished(this.texturePack)
    }

    // Dict between texture name and texture thing
    this.textures = {}

    this.onfinished = null
    this.texturePack = new TexturePack()
  }

  addTexture (textureName, textureFilename=textureName) {
    const handle = this.subAssetTracker.getHandle()

    const img = new Image()
    img.src = "./assets/textures/" + textureFilename + ".png"
    img.onload = () => {
      handle()
      this.textures[textureName] = img
    }
  }

  generateTexturePack () {
    // We have to pack them as rectangles, basically. Not too complicated; we just repeatedly put them in the best corner
    const rectanglePacking = []

    const textureLocations = {}

    const textureList = Object.entries(this.textures)
    textureList.sort((a, b) => (b[1].height - a[1].height)) // sort by height

    const rects = textureList.map(pair => pair[1]).map(img => ({w: img.width, h: img.height}))
    const { w, h } = potpack(rects)

    const textureWidth = Math.pow(2, Math.ceil(Math.log2(w)))
    const textureHeight = Math.pow(2, Math.ceil(Math.log2(h)))

    const canv = document.createElement("canvas")
    canv.width = textureWidth
    canv.height = textureHeight

    const ctx = canv.getContext('2d')

    for (let i = 0; i < textureList.length; ++i) { // Sorted by area
      const rect = rects[i]
      const [textureName, img] = textureList[i]

      ctx.drawImage(img, 0, 0, img.width, img.height, rect.x, rect.y, rect.w, rect.h)
      textureLocations[textureName] = rect
    }

    this.texturePack.init(canv, textureLocations, this.textures)
  }

}

class TexturePack {
  constructor () {
    this.isReady = false
    this.id = generateUUID()
  }

  init (texture, textureLocations, textureImages) {
    this.isReady = true

    this.texture = texture
    this.textureLocations = textureLocations
    this.textureImages = textureImages
  }

  getTextureObject (renderer) {
    const { gl, glManager } = renderer

    if (glManager.hasTexture(this.id)) return glManager.getTexture(this.id)

    const texture = glManager.getTexture(this.id)

    gl.bindTexture(gl.TEXTURE_2D, texture)
    // Load in our textures
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture
  }

  get width () {
    return this.texture.width
  }

  get height () {
    return this.texture.height
  }

  getLocationOf (key) {
    return this.textureLocations[key]
  }

  getNullTexture () { // the null texture maps everything to (0.5, 0.5) at which there is a single transculent pixel
    return { w: 0, h: 0, x: 0.5, y: 0.5 }
  }
}
