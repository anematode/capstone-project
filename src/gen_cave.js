import { tileset } from "./main_textiles"

function create2DArray(width, height, value=0) {
  // height first, then width
  const ret = []

  for (let i = 0; i < height; ++i) {
    ret.push(new Array(width).fill(value))
  }

  return ret
}

// Credit to https://stackoverflow.com/a/47593316/13458117
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

window.generateCaveWorld = generateCaveWorld

export function generateCaveWorld(width=128, height=128, seed=0, generations=3, doOres=true) {
  const random = mulberry32(seed)

  const caveBlock = tileset.toCode("stone")
  const airBlock = tileset.toCode("air")

  // We'll use automata to do this

  const proportion = 0.4, starvationLimit = 10, overpopulationLimit = 25, birthNumber = 11

  // Generate a random array
  let arr = create2DArray(width, height)
  arr.forEach(row => {
    for (let i = 0; i < row.length; ++i) row[i] = (random() < proportion) ? caveBlock : airBlock
  })

  for (let g = 0; g < generations; ++g) {
    let newArr = create2DArray(width, height, airBlock)

    for (let i = 0; i < height; ++i) {
      for (let j = 0; j < width; ++j) {
        // Count alive neighbors

        let neighborCount = 0

        for (let x = -2; x <= 2; ++x) {
          let xCoord = j+x
          if (xCoord < 0 || xCoord >= width) neighborCount++

          for (let y = -2; y <= 2; ++y) {
            if (x === 0 && y === 0) continue

            let yCoord = i+y
            if (yCoord < 0 || yCoord >= height || arr[yCoord][xCoord] === caveBlock) neighborCount++
          }
        }

        let val = arr[i][j]

        if (val === caveBlock) { // already cell, kill if too many or too few
          if (neighborCount >= starvationLimit && neighborCount <= overpopulationLimit) {
            newArr[i][j] = caveBlock
          }
        } else {
          if (neighborCount > birthNumber) {
            newArr[i][j] = caveBlock
          }
        }
      }
    }

    arr = newArr
  }

  let ores = [ ["diamond_ore", 3, 0.002], ["emerald_ore", 1, 0.006], ["iron_ore", 4, 0.02], ["coal_ore", 12, 0.02], ["redstone_ore", 6, 0.006] ]

  if (doOres) {
    for (const ore of ores) {
      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
          if (arr[i][j] && Math.random() < ore[2]) {
            arr[i][j] = tileset.toCode(ore[0])
          }
        }
      }
    }
  }


  // Make the perimeter cave block
  for (let i = 0; i < width; ++i) {
    arr[0][i] = caveBlock
    arr[height-1][i] = caveBlock
  }
  for (let j = 0; j < height; ++j) {
    arr[j][0] = caveBlock
    arr[j][width-1] = caveBlock
  }

  return arr


}
