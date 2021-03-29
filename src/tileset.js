
import { assetTracker, AssetLoadTracker } from "./asset_loader"
import {generateUUID} from "./tile_layer"

// Takes in a bunch of tiles of a given square size and outputs a corresponding texture object for use, and the mappings
// of tile to number.
export class TilesetLoader {
  constructor (tileSize=16) {
    const handle = assetTracker.getHandle()

    this.subAssetTracker = new AssetLoadTracker()
    this.subAssetTracker.onfinished = () => {
      handle()
      this.generateTileset()

      if (this.onfinished)
        this.onfinished(this.tileset)
    }

    this.tileSize = tileSize
    this.tileImages = {}

    this.tileset = null
    this.onfinished = null
  }

  addTile (tileName, tileFilename=tileName) {
    const handle = this.subAssetTracker.getHandle()

    const img = new Image()
    img.src = './assets/tiles/' + tileFilename + '.png'
    img.onload = () => {
      handle()
      this.tileImages[tileName] = img
    }
  }

  generateTileset () {
    const { tileImages, tileSize } = this

    const canv = document.createElement("canvas")
    const ctx = canv.getContext("2d")

    let tileImageCount = Object.keys(tileImages).length

    // We wish to generate a texture with power-of-two side lengths, so we find the next power of two of tileImageCount + 1

    const exponent = Math.ceil(Math.log2(tileImageCount + 1))

    let textureHeightInTiles = 2 ** ((exponent - (exponent % 2)) / 2)
    let textureWidthInTiles = 2 ** exponent / textureHeightInTiles

    // We generate a square texture of a sufficient size. 0 is reserved for no tile
    const textureHeight = textureHeightInTiles * tileSize
    const textureWidth = textureWidthInTiles * tileSize

    canv.height = textureHeight
    canv.width = textureWidth

    const tileIndices = {}
    const indexToTiles = [ null ]

    let i = 0
    for (const [tileName, tileImage] of Object.entries(tileImages)) {
      if (tileImage.width > tileSize || tileImage.height > tileSize) // invalid tile, skip
        continue

      ++i
      tileIndices[tileName] = i
      indexToTiles.push(tileName)

      ctx.drawImage(tileImage, 0, 0, tileSize, tileSize, tileSize * (i % textureWidthInTiles), tileSize * Math.floor(i / textureWidthInTiles), tileSize, tileSize)
    }

    this.tileset = new Tileset(tileSize, tileImages, canv, tileIndices, indexToTiles, indexToTiles.length - 1, textureWidthInTiles, textureHeightInTiles)
  }
}

export class Tileset {
  constructor (tileSize, tileImages, texture, tileIndices, indexToTiles, tileCount, widthInTiles, heightInTiles) {
    this.tileSize = tileSize
    this.tileImages = tileImages
    this.texture = texture
    this.tileIndices = tileIndices
    this.indexToTiles = indexToTiles
    this.tileCount = tileCount
    this.widthInTiles = widthInTiles
    this.heightInTiles = heightInTiles

    this.id = generateUUID()
  }

  getTextureObject (renderer) {
    const {gl, glManager} = renderer

    if (glManager.hasTexture(this.id)) return glManager.getTexture(this.id)

    const texture = glManager.getTexture(this.id)

    gl.bindTexture(gl.TEXTURE_2D, texture)
    // Load in our tileset
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture
  }

  getTileCorner (index) { // get the pixel location of a corner of a tile, in PIXELS.
    return new Vec2(index % this.widthInTiles, Math.floor(index / this.widthInTiles)).scale(this.tileSize)
  }

  getTileCorners (index) {

  }
}

