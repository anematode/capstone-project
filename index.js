(function () {
  'use strict';

  class Keyboard {
    constructor() {
      this.keyStates = {};
      window.addEventListener("keydown", e => {
        this.keyStates[e.key] = true;
      });
      window.addEventListener("keyup", e => {
        this.keyStates[e.key] = false;
      });
    }

    isKeyPressed(key) {
      return !!this.keyStates[key];
    }

  }

  // Note: written by me in mid-2020
  // This function takes in a GL rendering context, a type of shader (fragment/vertex),
  // and the GLSL source code for that shader, then returns the compiled shader
  function createShaderFromSource(gl, shaderType, shaderSourceText) {
    // create an (empty) shader of the provided type
    const shader = gl.createShader(shaderType); // set the source of the shader to the provided source

    gl.shaderSource(shader, shaderSourceText); // compile the shader!! piquant

    gl.compileShader(shader); // get whether the shader compiled properly

    const succeeded = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (succeeded) {
      return shader; // return it if it compiled properly
    }

    const err = new Error(gl.getShaderInfoLog(shader)); // delete the shader to free it from memory

    gl.deleteShader(shader); // throw an error with the details of why the compilation failed

    throw err;
  } // This function takes in a GL rendering context, the fragment shader, and the vertex shader,
  // and returns a compiled program.


  function createGLProgram(gl, vertShader, fragShader) {
    // create an (empty) GL program
    const program = gl.createProgram(); // link the vertex shader

    gl.attachShader(program, vertShader); // link the fragment shader

    gl.attachShader(program, fragShader); // compile the program

    gl.linkProgram(program); // get whether the program compiled properly

    const succeeded = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (succeeded) {
      return program;
    }

    const err = new Error(gl.getProgramInfoLog(program)); // delete the program to free it from memory

    gl.deleteProgram(program); // throw an error with the details of why the compilation failed

    throw err;
  }
  /**
   @class GLResourceManager stores GL resources on a per-context basis. This allows the
   separation of elements and their drawing buffers in a relatively complete way.
   It is given a gl context to operate on, and creates programs in manager.programs
   and buffers in manager.buffers. programs and buffers are simply key-value pairs
   which objects can create (and destroy) as they please.
   */


  class GLResourceManager {
    /**
     * Construct a GLResourceManager
     * @param gl {WebGLRenderingContext} WebGL context the manager will have dominion over
     */
    constructor(gl) {
      // WebGL rendering context
      this.gl = gl; // Compiled programs and created buffers

      this.programs = {};
      this.buffers = {};
      this.textures = {};
    }
    /**
     * Compile a program and store it in this.programs
     * @param programName {string} Name of the program, used to identify the program
     * @param vertexShaderSource {string} Source code of the vertex shader
     * @param fragmentShaderSource {string} Source code of the fragment shader
     * @param vertexAttributeNames {Array} Array of vertex attribute names
     * @param uniformNames {Array} Array of uniform names
     */


    createProgram(programName, vertexShaderSource, fragmentShaderSource, vertexAttributeNames = [], uniformNames = []) {
      if (this.hasProgram(programName)) {
        // if this program name is already taken, delete the old one
        this.deleteProgram(programName);
      }

      const {
        gl
      } = this; // The actual gl program itself

      const glProgram = createGLProgram(gl, createShaderFromSource(gl, gl.VERTEX_SHADER, vertexShaderSource), createShaderFromSource(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)); // pairs of uniform names and their respective locations

      const uniforms = {};

      for (let i = 0; i < uniformNames.length; ++i) {
        const uniformName = uniformNames[i];
        uniforms[uniformName] = gl.getUniformLocation(glProgram, uniformName);
      } // pairs of vertex attribute names and their respective locations


      const vertexAttribs = {};

      for (let i = 0; i < vertexAttributeNames.length; ++i) {
        const vertexAttribName = vertexAttributeNames[i];
        vertexAttribs[vertexAttribName] = gl.getAttribLocation(glProgram, vertexAttribName);
      }

      this.programs[programName] = {
        program: glProgram,
        uniforms,
        attribs: vertexAttribs
      };
      return this.programs[programName];
    }

    onContextLost() {
      this.programs = {};
      this.buffers = {};
      this.textures = {};
    }
    /**
     * Create a buffer with a certain name, typically including a WebGLElement's id
     * @param bufferName {string} Name of the buffer
     */


    createBuffer(bufferName) {
      // If buffer already exists, return
      if (this.hasBuffer(bufferName)) return;
      const {
        gl
      } = this; // Create a new buffer

      this.buffers[bufferName] = gl.createBuffer();
    }
    /**
     * Delete buffer with given name
     * @param bufferName {string} Name of the buffer
     */


    deleteBuffer(bufferName) {
      if (!this.hasBuffer(bufferName)) return;
      const buffer = this.getBuffer(bufferName);
      const {
        gl
      } = this; // Delete the buffer from GL memory

      gl.deleteBuffer(buffer);
      delete this.buffers[bufferName];
    }
    /**
     * Delete a program
     * @param programName {string} Name of the program to be deleted
     */


    deleteProgram(programName) {
      if (!this.hasProgram(programName)) return;
      const programInfo = this.programs[programName];
      this.gl.deleteProgram(programInfo.program); // Remove the key from this.programs

      delete this.programs[programName];
    }
    /**
     * Retrieve a buffer with a given name, and create it if it does not already exist
     * @param bufferName Name of the buffer
     * @returns {WebGLBuffer} Corresponding buffer
     */


    getBuffer(bufferName) {
      if (!this.hasBuffer(bufferName)) this.createBuffer(bufferName);
      return this.buffers[bufferName];
    }
    /**
     * Retrieve program from storage
     * @param programName {string} Name of the program
     * @returns {Object} Object of the form {program, uniforms, vertexAttribs}
     */


    getProgram(programName) {
      return this.programs[programName];
    }
    /**
     * Whether this manager has a buffer with a given name
     * @param bufferName Name of the buffer
     * @returns {boolean} Whether this manager has a buffer with that name
     */


    hasBuffer(bufferName) {
      return !!this.buffers[bufferName];
    }
    /**
     * Whether a program with programName exists
     * @param programName {string} Name of the program
     * @returns {boolean} Whether that program exists
     */


    hasProgram(programName) {
      return !!this.programs[programName];
    }

    createTexture(name) {
      const {
        gl
      } = this;
      return this.textures[name] = gl.createTexture();
    }

    getTexture(name) {
      var _this$textures$name;

      return (_this$textures$name = this.textures[name]) !== null && _this$textures$name !== void 0 ? _this$textures$name : this.createTexture(name);
    }

    hasTexture(name) {
      return !!this.textures[name];
    }

    deleteTexture(name) {
      const texture = this.getTexture(name);

      if (texture) {
        this.gl.deleteTexture(texture);
        delete this.textures[name];
      }
    }

    createTextureFromImage(name, image) {
      const {
        gl
      } = this;
      const newTexture = this.createTexture(name);
      gl.bindTexture(gl.TEXTURE_2D, newTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      return newTexture;
    }

  }

  class GameRenderer {
    constructor(game) {
      // The main canvas should be a canvas 2D thing. The drawing sequence will go: background, tile layers, (copy gl canv
      // over) special tiles, entities.
      this.game = game;
      const canvas = this.canvas = game.canvas;
      this.debuggers = [];
      let gl = this.gl = canvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        premultipliedAlpha: false
      });
      if (!gl) alert("Browser lacks WebGL support.");
      canvas.addEventListener("webglcontextlost", evt => {
        console.log("context lost");
        evt.preventDefault();
        this.glManager.onContextLost();
      }, false);
      canvas.addEventListener("webglcontextrestored", () => {
        console.log("context restored");
        this.init();
      });
      this.glManager = new GLResourceManager(gl);
      this.init();
    }

    init() {
      let gl = this.gl;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      this.isFirstPass = true;
    }

    get viewport() {
      return this.game.viewport;
    }

    clearCanvas(r = 0, g = 0, b = 0, a = 0) {
      const {
        gl
      } = this;
      gl.clearColor(r, g, b, a);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    resize() {
      // buffer dims
      const {
        width,
        height
      } = this.canvas;
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }

    get canvasWidth() {
      return this.canvas.width;
    }

    get canvasHeight() {
      return this.canvas.height;
    }

    get width() {
      return this.game.width;
    }

    get height() {
      return this.game.height;
    }

    render(instructions = []) {
      if (this.gl.isContextLost()) return; // can't draw anything without WebGL

      this.clearCanvas();
      this.clearDebuggers();

      for (const elem of instructions) {
        elem.render(this);
      }

      for (const debug of this.debuggers) {
        debug.render(this);
      } // deals with context loss, etc.


      this.isFirstPass = false;
    }

    clearDebuggers() {
      this.debuggers = [];
    }

    addDebugger(obj) {
      this.debuggers.push(obj);
    }

  }

  // Tracks how far things have loaded
  class AssetLoadTracker {
    constructor() {
      this.id = 0;
      this.timeStart = Date.now();
      this.assetProgresses = [];
      this.isFinished = false;
      this.onfinished = null;
    }

    calculateProgress() {
      return this.assetProgresses.reduce((a, b) => a + b) / this.assetProgresses.length;
    }

    markProgress(id, x) {
      this.assetProgresses[id] = x;

      if (x === 1) {
        let progress = this.calculateProgress();

        if (progress === 1) {
          this.isFinished = true;
          if (this.onfinished) this.onfinished(Date.now() - this.timeStart);
        }
      }
    }

    getHandle() {
      const id = this.id++;
      this.markProgress(id, 0);

      const handle = _ => this.markProgress(id, 1);

      handle.progress = v => this.markProgress(id, Math.max(0, Math.min(v, 1)));

      handle.id = id;
      return handle;
    }

  }
  const assetTracker = new AssetLoadTracker();

  class Vec2 {
    constructor(x, y) {
      if (x.x) {
        this.x = x.x;
        this.y = x.y;
      } else if (Array.isArray(x)) {
        this.x = x[0];
        this.y = x[1];
      } else {
        this.x = x;
        this.y = y;
      }
    }

    clone() {
      return new Vec2(this.x, this.y);
    }

    setComponents(x, y) {
      this.x = x;
      this.y = y;
    }

    set(v, y) {
      if (y !== undefined) {
        this.x = v;
        this.y = y;
      } else {
        this.x = v.x;
        this.y = v.y;
      }
    }

    subtract(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    }

    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }

    multiply(s) {
      this.x *= s;
      this.y *= s;
      return this;
    }

    hasNaN() {
      return isNaN(this.x) || isNaN(this.y);
    }

    scale(s) {
      return this.multiply(s);
    }

    divide(s) {
      this.x /= s;
      this.y /= s;
      return this;
    }

    asArray() {
      return [this.x, this.y];
    }

    length() {
      return Math.hypot(this.x, this.y);
    }

    unit() {
      if (this.x === 0 && this.y === 0) return this.clone();
      return this.clone().divide(this.length());
    }

    distanceTo(v) {
      return Math.hypot(this.x - v.x, this.y - v.y);
    }

    distanceSquaredTo(v) {
      return (this.x - v.x) ** 2 + (this.y - v.y) ** 2;
    }

    dot(v) {
      return this.x * v.x + this.y * v.y;
    }

    cross(v) {
      return this.x * v.y - v.x * this.y;
    }

    rotate(angle, about = Origin) {
      let c = Math.cos(angle),
          s = Math.sin(angle);

      if (about === Origin) {
        let x = this.x,
            y = this.y;
        this.x = x * c - y * s;
        this.y = y * c + x * s;
      } else {
        let x = this.x,
            y = this.y;
        this.subtract(about).rotate(angle).add(about);
      }

      return this;
    }

    rotateDeg(angle_deg, about = Origin) {
      this.rotate(angle_deg / 180 * 3.14159265359, about);
      return this;
    }

    transform({
      x_m,
      x_b,
      y_m,
      y_b
    }) {
      return new Vec2(x_m * this.x + x_b, y_m * this.y + y_b);
    }

  }
  const Origin = new Vec2(0, 0); // window.Vec2 = Vec2

  // of tile to number.

  class TilesetLoader {
    constructor(tileSize = 64, preloaded) {
      const handle = assetTracker.getHandle();
      this.subAssetTracker = new AssetLoadTracker();

      this.subAssetTracker.onfinished = () => {
        this.generateTileset(preloaded);
        if (this.onfinished) this.onfinished(this.tileset);
        handle();
      };

      this.tileSize = tileSize;
      this.tileImages = {};
      this.tileset = new Tileset();
      this.onfinished = null;
      this.preloaded = preloaded;
    }

    addTile(tileName, tileFilename = tileName) {
      if (this.preloaded) {
        this.tileImages[tileName] = true;
      } else {
        const handle = this.subAssetTracker.getHandle();
        const img = new Image();
        img.src = './assets/tiles/' + tileFilename;

        img.onload = () => {
          handle();
          this.tileImages[tileName] = img;
        };
      }
    }

    generateTileset(preloaded) {
      const {
        tileImages,
        tileSize
      } = this;
      const canv = document.createElement("canvas");
      const ctx = canv.getContext("2d");
      let tileImageCount = Object.keys(tileImages).length; // We wish to generate a texture with power-of-two side lengths, so we find the next power of two of tileImageCount + 1

      const exponent = Math.ceil(Math.log2(tileImageCount + 2));
      let textureHeightInTiles = 2 ** ((exponent - exponent % 2) / 2);
      let textureWidthInTiles = 2 ** exponent / textureHeightInTiles; // We generate a square texture of a sufficient size. 0 is reserved for no tile

      const textureHeight = textureHeightInTiles * tileSize;
      const textureWidth = textureWidthInTiles * tileSize;
      canv.height = textureHeight;
      canv.width = textureWidth;

      if (preloaded) {
        ctx.drawImage(preloaded, 0, 0);
      }

      const tileCodes = {};
      const codeToTiles = [null];
      let i = 0;

      for (const [tileName, tileImage] of Object.entries(tileImages)) {
        if (tileImage.width > tileSize || tileImage.height > tileSize) // invalid tile, skip
          continue;
        ++i;
        tileCodes[tileName] = i;
        codeToTiles.push(tileName);
        if (!preloaded) ctx.drawImage(tileImage, 0, 0, tileSize, tileSize, tileSize * (i % textureWidthInTiles), tileSize * Math.floor(i / textureWidthInTiles), tileSize, tileSize);
      }

      console.log("hi", tileImages); // So that it's happily passed by reference

      this.tileset.init(tileSize, tileImages, canv, tileCodes, codeToTiles, codeToTiles.length - 1, textureWidthInTiles, textureHeightInTiles);
    }

  }
  class Tileset {
    constructor() {
      this.isReady = false;
      this.id = generateUUID();
    }

    init(tileSize, tileImages, texture, tileCodes, codeToTiles, tileCount, widthInTiles, heightInTiles) {
      this.tileSize = tileSize;
      this.tileImages = tileImages;
      this.texture = texture;
      this.tileCodes = tileCodes;
      this.codeToTiles = codeToTiles;
      this.tileCount = tileCount;
      this.widthInTiles = widthInTiles;
      this.heightInTiles = heightInTiles;
      this.isReady = true;
    }

    getTextureObject(renderer) {
      const {
        gl,
        glManager
      } = renderer;
      if (glManager.hasTexture(this.id)) return glManager.getTexture(this.id);
      const texture = glManager.getTexture(this.id);
      gl.bindTexture(gl.TEXTURE_2D, texture); // Load in our tileset

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      return texture;
    }

    indexOf(tilename) {
      var _this$tileCodes$tilen;

      return tilename === "air" ? 0 : (_this$tileCodes$tilen = this.tileCodes[tilename]) !== null && _this$tileCodes$tilen !== void 0 ? _this$tileCodes$tilen : -1;
    }

    tilenameOf(codeOrTile) {
      return codeOrTile === 0 ? "air" : codeOrTile < 0 || codeOrTile >= this.tileCount ? null : this.codeToTiles[codeOrTile];
    }

    toCode(codeOrTile) {
      if (typeof codeOrTile === "number") {
        return codeOrTile;
      } else {
        return this.indexOf(codeOrTile);
      }
    }

    toTile(codeOrTile) {
      if (typeof codeOrTile === "string") {
        return codeOrTile;
      } else {
        return this.tilenameOf(codeOrTile);
      }
    } // Pixel height


    get height() {
      return this.heightInTiles * this.tileSize;
    }

    get width() {
      return this.widthInTiles * this.tileSize;
    }

    getTileCorner(index) {
      // get the pixel location of a corner of a tile, in PIXELS.
      return new Vec2(index % this.widthInTiles, Math.floor(index / this.widthInTiles)).scale(this.tileSize);
    }

    getTileData(index) {
      let corner = this.getTileCorner(index);
      let tile = tileset.texture.getContext("2d").getImageData(corner.x, corner.y, this.tileSize, this.tileSize);
      return tile;
    }

    getTileCorners(index) {}

  }

  // A tileset has 16x16 tiles, while a texture packer includes textures of any (reasonable) size.


  function potpack(boxes) {
    // calculate total box area and maximum box width
    let area = 0;
    let maxWidth = 0;

    for (const box of boxes) {
      area += box.w * box.h;
      maxWidth = Math.max(maxWidth, box.w);
    } // sort the boxes for insertion by height, descending


    boxes.sort((a, b) => b.h - a.h); // aim for a squarish resulting container,
    // slightly adjusted for sub-100% space utilization

    const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth); // start with a single empty space, unbounded at the bottom

    const spaces = [{
      x: 0,
      y: 0,
      w: startWidth,
      h: Infinity
    }];
    let width = 0;
    let height = 0;

    for (const box of boxes) {
      // look through spaces backwards so that we check smaller spaces first
      for (let i = spaces.length - 1; i >= 0; i--) {
        const space = spaces[i]; // look for empty spaces that can accommodate the current box

        if (box.w > space.w || box.h > space.h) continue; // found the space; add the box to its top-left corner
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
      w: width,
      // container width
      h: height,
      // container height
      fill: area / (width * height) || 0 // space utilization

    };
  }

  class TexturePacker {
    constructor() {
      const handle = assetTracker.getHandle();
      this.subAssetTracker = new AssetLoadTracker();

      this.subAssetTracker.onfinished = () => {
        handle();
        this.generateTexturePack();
        if (this.onfinished) this.onfinished(this.texturePack);
      }; // Dict between texture name and texture thing


      this.textures = {};
      this.onfinished = null;
      this.texturePack = new TexturePack();
    }

    addTexture(textureName, textureFilename = textureName) {
      const handle = this.subAssetTracker.getHandle();
      const img = new Image();
      img.src = "./assets/textures/" + textureFilename + ".png";

      img.onload = () => {
        handle();
        this.textures[textureName] = img;
      };
    }

    generateTexturePack() {
      const textureLocations = {};
      const textureList = Object.entries(this.textures);
      textureList.sort((a, b) => b[1].height - a[1].height); // sort by height

      const rects = textureList.map(pair => pair[1]).map(img => ({
        w: img.width,
        h: img.height
      }));
      const {
        w,
        h
      } = potpack(rects);
      const textureWidth = Math.pow(2, Math.ceil(Math.log2(w)));
      const textureHeight = Math.pow(2, Math.ceil(Math.log2(h)));
      const canv = document.createElement("canvas");
      canv.width = textureWidth;
      canv.height = textureHeight;
      const ctx = canv.getContext('2d');

      for (let i = 0; i < textureList.length; ++i) {
        // Sorted by area
        const rect = rects[i];
        const [textureName, img] = textureList[i];
        ctx.drawImage(img, 0, 0, img.width, img.height, rect.x, rect.y, rect.w, rect.h);
        textureLocations[textureName] = rect;
      }

      this.texturePack.init(canv, textureLocations, this.textures);
    }

  }

  class TexturePack {
    constructor() {
      this.isReady = false;
      this.id = generateUUID();
    }

    init(texture, textureLocations, textureImages) {
      this.isReady = true;
      this.texture = texture;
      this.textureLocations = textureLocations;
      this.textureImages = textureImages;
    }

    getTextureObject(renderer) {
      const {
        gl,
        glManager
      } = renderer;
      if (glManager.hasTexture(this.id)) return glManager.getTexture(this.id);
      const texture = glManager.getTexture(this.id);
      gl.bindTexture(gl.TEXTURE_2D, texture); // Load in our textures

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      return texture;
    }

    get width() {
      return this.texture.width;
    }

    get height() {
      return this.texture.height;
    }

    getLocationOf(key) {
      return this.textureLocations[key];
    }

    getNullTexture() {
      // the null texture maps everything to (0.5, 0.5) at which there is a single transculent pixel
      return {
        w: 0,
        h: 0,
        x: 0.5,
        y: 0.5
      };
    }

  }

  const geckoNames = `000_generic.png
001_grounded.png
002_bitcrushed.jpg
002_bitcrushed.png
003_bitcrushed_grounded.jpg
003_bitcrushed_grounded.png
004_crested.png
005_diluted.png
006_dark.png
007_faceless.png
008_hollow.png
009_two_eyed.png
010_warped.png
011_enraged.png
012_prototyped.png
013_impostor.png
014_successor.png
015_corrupted.png
016_gold.png
017_cracked.png
018_crystallized.png
019_pog.png
020_monkas.png
021_boxed.png
022_determined.png
023_unknown.png
024_corruptor.png
025_mechanical.png
026_sans.png
027_demonic.png
028_flushed.png
029_thinking.png
030_vortex.png
031_inverted.png
032_bit_inverted.jpg
032_bit_inverted.png
033_encrypted.png
034_dormant.png
035_failed.png
036_conjured.png
037_invisible.png
038_bewitched.png
039_mutated.png
040_infected.png
041_rogue.png
042_split.png
043_small.png
044_shielded.png
045_paradox.png
046_obliterator.png
047_enraged_impostor.png
048_terminator.png
049_phantom.png
050__.png
051_john.png
052_flowey.png
053_magma.png
054_furnace.png
055_flamethrower.png
056_volcano.png
057_chill.png
058_inverted_rage.png
059_symbolic.png
060_crimson_elite.png
061_iphone_11+_pro.png
062_swarm.png
063_meta.png
064_hat.png
065_original.png
066_crimson_soldier.png
067_crimson_guard.png
068_infected_guard.png
069_hybrid.png
070_troll.png
071_samsung_galaxy_s10+.png
072_blue.png
073_first_guardian.png
074_crimson_overseer.png
075_crimson_priest.png
076_forever.png
077_DMK.png
078_deletethis.png
079_gecko_mech.png
080_funnymeme.png
081_overloading.png
082_phantomterminator.png
083_soldier.png
084_checkthehexidecimal.png
085_blursed.png
086_cursedbaby.png
087_cocomelon.png
088_society.png
089_spraypaint.png
090_beret.png
091_korby.png
092_graduate.png
093_conducter.png
094_violin.png
095_anime.png
096_viola.png
097_suit.png
098_clarinet.png
099_ninja.png
100_party.png
101_coronagecko.png
102_glowy.png
103_lava.png
104_emerald.png
105_dank.png
106_mossy.png
107_beans.png
108_steelwool.png
109_invertedcrested.png
110_stone.png
111_geckostorage.png
112_garf.png
113_floewy.png
114_cursed.png
115_vibe.png
116_unrecognizable.png
117_glass.png
118_invertedbeans.png
119_dream.png
120_banned.png
121_ironore.png
122_irradiatedbeans.png
123_jameson.png
124_omaewamoshinderu.png
125_johnv2.png
126_armored.png
127_lancer.png
128_fade.png
129_tetris.png
130_fire.png
131_nuked_beans.png
132_144p.png
133_supernova.png
134_bajablast.png
135_bioluminescent.png
136_grain.png
137_existing.png
138_obsidian.png
139_normalgecko-0.png
139_normalgecko-1.png
139_normalgecko-2.png
139_normalgecko-3.png
139_normalgecko-4.png
139_normalgecko-5.png
139_normalgecko-6.png
139_normalgecko-7.png
139_normalgecko-8.png
139_normalgecko-9.png
139_normalgecko-10.png
139_normalgecko-11.png
139_normalgecko-12.png
139_normalgecko-13.png
139_normalgecko-14.png
139_normalgecko-15.png
139_normalgecko-16.png
139_normalgecko-17.png
139_normalgecko-18.png
139_normalgecko-19.png
139_normalgecko-20.png
139_normalgecko-21.png
139_normalgecko-22.png
139_normalgecko-23.png
139_normalgecko-24.png
139_normalgecko-25.png
139_normalgecko-26.png
139_normalgecko-27.png
139_normalgecko-28.png
139_normalgecko-29.png
139_normalgecko-30.png
139_normalgecko-31.png
139_normalgecko-32.png
139_normalgecko-33.png
139_normalgecko-34.png
139_normalgecko-35.png
139_normalgecko-36.png
139_normalgecko-37.png
139_normalgecko-38.png
139_normalgecko-39.png
139_normalgecko-40.png
139_normalgecko-41.png
139_normalgecko-42.png
139_normalgecko-43.png
139_normalgecko-44.png
139_normalgecko-45.png
139_normalgecko-46.png
139_normalgecko-47.png
139_normalgecko-48.png
139_normalgecko-49.png
139_normalgecko-50.png
139_normalgecko-51.png
139_normalgecko-52.png
139_normalgecko-53.png
139_normalgecko-54.png
139_normalgecko-55.png
139_normalgecko-56.png
139_normalgecko-57.png
139_normalgecko-58.png
139_normalgecko-59.png
139_normalgecko-60.png
139_normalgecko-61.png
139_normalgecko-62.png
139_normalgecko-63.png
139_normalgecko-64.png
139_normalgecko-65.png
139_normalgecko-66.png
139_normalgecko-67.png
139_normalgecko-68.png
139_normalgecko-69.png
139_normalgecko-70.png
139_normalgecko-71.png
139_normalgecko-72.png
139_normalgecko-73.png
139_normalgecko-74.png
139_normalgecko-75.png
139_normalgecko-76.png
139_normalgecko-77.png
139_normalgecko-78.png
139_normalgecko-79.png
139_normalgecko-80.png
139_normalgecko-81.png
139_normalgecko-82.png
139_normalgecko-83.png
139_normalgecko-84.png
139_normalgecko-85.png
139_normalgecko-86.png
139_normalgecko-87.png
139_normalgecko-88.png
139_normalgecko-89.png
139_normalgecko-90.png
139_normalgecko-91.png
139_normalgecko-92.png
139_normalgecko-93.png
139_normalgecko-94.png
139_normalgecko-95.png
139_normalgecko.gif
140_shreko.png
141_notmadjustdisappointed.png
142_icey_ufo.png
143_what.png
144_explosion.png
145_blood_moon.png
146_ascending.png
147_sentinel.png
148_meteo.png
149_deconstructed.png
150_johnv3.png
151_shadowed.png
152_idk.png
153_quantumsuperposition.png
154_frozen.png
155_notfrozen.png
156_elevating.png
157_escalating.png
158_aquatic.png
159_odd.png
160_electric.png
161_theaccursed.jpg
161_theaccursed.png
162_woodbread.png
163_brain.png
164_nuke.png
165_metal.png
166_infantry.png
167_wat.png
168_osci.png
169_sand.png
170_BREAD.png
171_pepega.png
172_cavalier.png
173_rifle.png
174_thisisnotadrill.png
175_PHYSICAL_FORM.jpg
175_PHYSICAL_FORM.png
176_geckoslide-0.png
176_geckoslide-1.png
176_geckoslide-2.png
176_geckoslide-3.png
176_geckoslide-4.png
176_geckoslide-5.png
176_geckoslide-6.png
176_geckoslide-7.png
176_geckoslide-8.png
176_geckoslide-9.png
176_geckoslide-10.png
176_geckoslide-11.png
176_geckoslide-12.png
176_geckoslide-13.png
176_geckoslide-14.png
176_geckoslide-15.png
176_geckoslide-16.png
176_geckoslide-17.png
176_geckoslide-18.png
176_geckoslide-19.png
176_geckoslide-20.png
176_geckoslide-21.png
176_geckoslide-22.png
176_geckoslide-23.png
176_geckoslide-24.png
176_geckoslide.gif
177_geckoinvasion-0.png
177_geckoinvasion-1.png
177_geckoinvasion-2.png
177_geckoinvasion-3.png
177_geckoinvasion-4.png
177_geckoinvasion-5.png
177_geckoinvasion-6.png
177_geckoinvasion-7.png
177_geckoinvasion-8.png
177_geckoinvasion-9.png
177_geckoinvasion-10.png
177_geckoinvasion-11.png
177_geckoinvasion-12.png
177_geckoinvasion-13.png
177_geckoinvasion-14.png
177_geckoinvasion-15.png
177_geckoinvasion-16.png
177_geckoinvasion-17.png
177_geckoinvasion-18.png
177_geckoinvasion-19.png
177_geckoinvasion-20.png
177_geckoinvasion-21.png
177_geckoinvasion-22.png
177_geckoinvasion-23.png
177_geckoinvasion-24.png
177_geckoinvasion-25.png
177_geckoinvasion-26.png
177_geckoinvasion-27.png
177_geckoinvasion-28.png
177_geckoinvasion-29.png
177_geckoinvasion-30.png
177_geckoinvasion-31.png
177_geckoinvasion-32.png
177_geckoinvasion-33.png
177_geckoinvasion-34.png
177_geckoinvasion-35.png
177_geckoinvasion.gif
178_0.001c.png
179_geckoblitz-0.png
179_geckoblitz-1.png
179_geckoblitz-2.png
179_geckoblitz-3.png
179_geckoblitz-4.png
179_geckoblitz-5.png
179_geckoblitz-6.png
179_geckoblitz-7.png
179_geckoblitz-8.png
179_geckoblitz-9.png
179_geckoblitz-10.png
179_geckoblitz-11.png
179_geckoblitz-12.png
179_geckoblitz.gif
180_lightspeed-0.png
180_lightspeed-1.png
180_lightspeed-2.png
180_lightspeed-3.png
180_lightspeed-4.png
180_lightspeed-5.png
180_lightspeed-6.png
180_lightspeed-7.png
180_lightspeed-8.png
180_lightspeed-9.png
180_lightspeed-10.png
180_lightspeed-11.png
180_lightspeed-12.png
180_lightspeed.gif
181_I_have_ACHIEVED_SPEED-0.png
181_I_have_ACHIEVED_SPEED-1.png
181_I_have_ACHIEVED_SPEED-2.png
181_I_have_ACHIEVED_SPEED-3.png
181_I_have_ACHIEVED_SPEED-4.png
181_I_have_ACHIEVED_SPEED-5.png
181_I_have_ACHIEVED_SPEED-6.png
181_I_have_ACHIEVED_SPEED-7.png
181_I_have_ACHIEVED_SPEED-8.png
181_I_have_ACHIEVED_SPEED-9.png
181_I_have_ACHIEVED_SPEED-10.png
181_I_have_ACHIEVED_SPEED-11.png
181_I_have_ACHIEVED_SPEED-12.png
181_I_have_ACHIEVED_SPEED.gif
182_standardModel.png
183_large.png
184_audio.png
185_unstable.png
186_unstandardModel.png
187_oganesson.png
188_hell.png
189_terror.png
190_hive.png
191_angel.png
192_revenger.png
193_neonsuperspeedoverdose.png
194_mask.png
195_uranium-0.png
195_uranium-1.png
195_uranium-2.png
195_uranium-3.png
195_uranium-4.png
195_uranium-5.png
195_uranium-6.png
195_uranium-7.png
195_uranium-8.png
195_uranium-9.png
195_uranium-10.png
195_uranium-11.png
195_uranium-12.png
195_uranium-13.png
195_uranium-14.png
195_uranium-15.png
195_uranium-16.png
195_uranium-17.png
195_uranium-18.png
195_uranium-19.png
195_uranium-20.png
195_uranium-21.png
195_uranium-22.png
195_uranium-23.png
195_uranium-24.png
195_uranium-25.png
195_uranium-26.png
195_uranium-27.png
195_uranium-28.png
195_uranium-29.png
195_uranium-30.png
195_uranium-31.png
195_uranium-32.png
195_uranium-33.png
195_uranium-34.png
195_uranium-35.png
195_uranium-36.png
195_uranium-37.png
195_uranium.gif
196_uhoh.png
197_woowoowoowoowoowoowoowoowoowoowoowoowoowoowoowoowoowoo.png
198_pupil.png
199_nope.png
200_party2.png
201_info.png
202_command_module_kilo.png
203_stacked.png
204_crusty.jpg
204_crusty.png
205_emission.png
206_v.png
207_sphagetti.jpg
207_sphagetti.png
208_ascii.png
209_e.png
210_deconstruct.png
211_GecceG.png
212_EckokcE.png
213_Window.png
214_annihilated_beans.png
215_shadowclone.png
216_un.png
217_instructor.png
218_stackednt.png
219_invertedfade.png
220_vaporsun.png
221_bruhmoment.png
222_trippycheckers.png
223_reflectedgecko.png
224_geckoreflected.png
225_WindO(w).png
226_weirdsun.png
227_sansv2.png
228_boredhive.png
229_electron.png
230_odd.png
231_darkmatter.png
232_darkenergy.png
233_uhhh.png
234_king.png
235_anomaly.png
236_spooky.png
237_wire.png
238_gray.png
239_random.png
240_backgroundradiation.png
241_vantablack.png
242_spectralon.png
243_uncursed.png
244_firestorm.png
245_acidic.png
246_paralleluniverse.png
247_fragment.png
248_oddspace.png
249_2x.png
250_RGB-0.png
250_RGB-1.png
250_RGB-2.png
250_RGB-3.png
250_RGB-4.png
250_RGB-5.png
250_RGB-6.png
250_RGB-7.png
250_RGB-8.png
250_RGB-9.png
250_RGB-10.png
250_RGB-11.png
250_RGB-12.png
250_RGB-13.png
250_RGB-14.png
250_RGB-15.png
250_RGB-16.png
250_RGB-17.png
250_RGB-18.png
250_RGB-19.png
250_RGB-20.png
250_RGB-21.png
250_RGB-22.png
250_RGB-23.png
250_RGB-24.png
250_RGB-25.png
250_RGB-26.png
250_RGB-27.png
250_RGB-28.png
250_RGB-29.png
250_RGB-30.png
250_RGB-31.png
250_RGB-32.png
250_RGB-33.png
250_RGB-34.png
250_RGB-35.png
250_RGB.gif
251_sheep.png
252_stick.png
253_note.png
254_jedi.png
255_sith.png
256_general_gecko.png
257_greater_demon.png
258_troll.png
259_insect.png
260_rapidly_deconstructing.png
261_meme.png
262_handle.png
263_hexagon.png
264_ye.png
265_lavender.png
266_sunset.png
267_vampire.png
268_weirdwall.png
269_GeckoOfCanada-0.png
269_GeckoOfCanada-1.png
269_GeckoOfCanada-2.png
269_GeckoOfCanada-3.png
269_GeckoOfCanada-4.png
269_GeckoOfCanada-5.png
269_GeckoOfCanada-6.png
269_GeckoOfCanada-7.png
269_GeckoOfCanada-8.png
269_GeckoOfCanada-9.png
269_GeckoOfCanada-10.png
269_GeckoOfCanada-11.png
269_GeckoOfCanada-12.png
269_GeckoOfCanada-13.png
269_GeckoOfCanada-14.png
269_GeckoOfCanada-15.png
269_GeckoOfCanada-16.png
269_GeckoOfCanada-17.png
269_GeckoOfCanada-18.png
269_GeckoOfCanada-19.png
269_GeckoOfCanada-20.png
269_GeckoOfCanada-21.png
269_GeckoOfCanada-22.png
269_GeckoOfCanada-23.png
269_GeckoOfCanada-24.png
269_GeckoOfCanada-25.png
269_GeckoOfCanada-26.png
269_GeckoOfCanada-27.png
269_GeckoOfCanada-28.png
269_GeckoOfCanada-29.png
269_GeckoOfCanada-30.png
269_GeckoOfCanada-31.png
269_GeckoOfCanada-32.png
269_GeckoOfCanada-33.png
269_GeckoOfCanada-34.png
269_GeckoOfCanada-35.png
269_GeckoOfCanada-36.png
269_GeckoOfCanada-37.png
269_GeckoOfCanada-38.png
269_GeckoOfCanada-39.png
269_GeckoOfCanada-40.png
269_GeckoOfCanada-41.png
269_GeckoOfCanada-42.png
269_GeckoOfCanada-43.png
269_GeckoOfCanada-44.png
269_GeckoOfCanada-45.png
269_GeckoOfCanada-46.png
269_GeckoOfCanada-47.png
269_GeckoOfCanada-48.png
269_GeckoOfCanada-49.png
269_GeckoOfCanada-50.png
269_GeckoOfCanada-51.png
269_GeckoOfCanada-52.png
269_GeckoOfCanada-53.png
269_GeckoOfCanada-54.png
269_GeckoOfCanada-55.png
269_GeckoOfCanada-56.png
269_GeckoOfCanada-57.png
269_GeckoOfCanada-58.png
269_GeckoOfCanada-59.png
269_GeckoOfCanada.gif
270_whenyoueat3flinstonesgummyvitaminsinsteadof2.png
271_how.png
272_anime_demon.png
273_fps.png
274_obama.png
275_tronalddump.png
276_sponge.png
277_crayon.png
278_geckodrive.png
279_artillery.png
280_pac.png
281_black_hat_gecko.png
282_hack-0.png
282_hack-1.png
282_hack-2.png
282_hack-3.png
282_hack-4.png
282_hack-5.png
282_hack-6.png
282_hack-7.png
282_hack-8.png
282_hack-9.png
282_hack-10.png
282_hack-11.png
282_hack-12.png
282_hack-13.png
282_hack-14.png
282_hack-15.png
282_hack-16.png
282_hack-17.png
282_hack-18.png
282_hack-19.png
282_hack-20.png
282_hack-21.png
282_hack-22.png
282_hack-23.png
282_hack-24.png
282_hack.gif
283_ken.png
284_mustache.png
285_bandit.png
286_false.png
287_kerbal.png
288_probe.png
289_seems_normal.jpeg
289_seems_normal.png
290_deal_with_it.png
291_purple_gec.png
292_angel.png
293_scarecrow.png
294_musician.png
295_video_game_creator.png
296_chrome.png
297_mario64.png
298_norway.png
299_copyright.png
300_party3.png
301_R0VDS09JTUFHRVM=.png
302_planet.png
303_yob.png
304_youexpectedthisimagetomakesenseright.png
305_ice_cream.png
306_warpzone-0.png
306_warpzone-1.png
306_warpzone-2.png
306_warpzone-3.png
306_warpzone-4.png
306_warpzone-5.png
306_warpzone-6.png
306_warpzone-7.png
306_warpzone-8.png
306_warpzone-9.png
306_warpzone-10.png
306_warpzone-11.png
306_warpzone-12.png
306_warpzone-13.png
306_warpzone-14.png
306_warpzone-15.png
306_warpzone-16.png
306_warpzone-17.png
306_warpzone-18.png
306_warpzone-19.png
306_warpzone-20.png
306_warpzone-21.png
306_warpzone-22.png
306_warpzone-23.png
306_warpzone-24.png
306_warpzone-25.png
306_warpzone-26.png
306_warpzone-27.png
306_warpzone-28.png
306_warpzone-29.png
306_warpzone-30.png
306_warpzone-31.png
306_warpzone-32.png
306_warpzone-33.png
306_warpzone-34.png
306_warpzone-35.png
306_warpzone-36.png
306_warpzone-37.png
306_warpzone-38.png
306_warpzone-39.png
306_warpzone-40.png
306_warpzone-41.png
306_warpzone-42.png
306_warpzone-43.png
306_warpzone-44.png
306_warpzone-45.png
306_warpzone-46.png
306_warpzone-47.png
306_warpzone-48.png
306_warpzone-49.png
306_warpzone-50.png
306_warpzone-51.png
306_warpzone-52.png
306_warpzone-53.png
306_warpzone-54.png
306_warpzone-55.png
306_warpzone-56.png
306_warpzone-57.png
306_warpzone-58.png
306_warpzone-59.png
306_warpzone-60.png
306_warpzone-61.png
306_warpzone-62.png
306_warpzone-63.png
306_warpzone-64.png
306_warpzone-65.png
306_warpzone-66.png
306_warpzone-67.png
306_warpzone-68.png
306_warpzone-69.png
306_warpzone-70.png
306_warpzone-71.png
306_warpzone-72.png
306_warpzone-73.png
306_warpzone-74.png
306_warpzone-75.png
306_warpzone-76.png
306_warpzone-77.png
306_warpzone-78.png
306_warpzone-79.png
306_warpzone-80.png
306_warpzone-81.png
306_warpzone-82.png
306_warpzone-83.png
306_warpzone-84.png
306_warpzone-85.png
306_warpzone-86.png
306_warpzone-87.png
306_warpzone-88.png
306_warpzone-89.png
306_warpzone.gif
307_mask.png
308_slime.png
309_perfected.png
310_baguette.png
311_gecko_gecko.png
312_default_color_palette.png
313_lavaboostergeck.png
314_battle_gecko_Cat.png
315_patchy.png
316_swell.png
317_ghost.png
318_outgeck.png
319_dunesGeck.png
320_nebula.png
321_hydra.png
322_rainbowgrid.png
323_un323.png
324_.png
325_uncanny.png
326_sewer.png
327_kraken.png
328_steven.png
329_amongecko.png
330_superrevenger.png
331_unfairsewer.png
332_compositerain.png
333_sulfurworm.png
334_unreconstructed.png
335_ihonestlydontknowifthiscountsasageckoanymore.png
336_antimatter.png
337_one_punch_gecko.png
338_arceus.png
339_rain.png
340_ugwa.png
341_2setgecko.png
342_darkoil.png
343_woke.png
344_doesthiscount.png
345_photon.png
346_sandworm.png
347_knight.png
348_asriel.png
349_tuba.png
350_cello.png
351_trombone.png
352_flute.png
353_drums.png
354_xylophone.png
355_piano.png
356_trumpet.png
357_bass.png
358_symphony.png
359_geckorno.png
360_geffo.png
361_eva_geck.png
362_un_owen.png
363_john_finality.png
364_abnormality.png
365_reflash-0.png
365_reflash-1.png
365_reflash-2.png
365_reflash-3.png
365_reflash-4.png
365_reflash-5.png
365_reflash-6.png
365_reflash-7.png
365_reflash-8.png
365_reflash-9.png
365_reflash-10.png
365_reflash-11.png
365_reflash-12.png
365_reflash-13.png
365_reflash-14.png
365_reflash-15.png
365_reflash-16.png
365_reflash-17.png
365_reflash-18.png
365_reflash-19.png
365_reflash-20.png
365_reflash-21.png
365_reflash-22.png
365_reflash-23.png
365_reflash-24.png
365_reflash-25.png
365_reflash-26.png
365_reflash-27.png
365_reflash-28.png
365_reflash-29.png
365_reflash-30.png
365_reflash-31.png
365_reflash-32.png
365_reflash-33.png
365_reflash-34.png
365_reflash-35.png
365_reflash-36.png
365_reflash-37.png
365_reflash-38.png
365_reflash-39.png
365_reflash-40.png
365_reflash-41.png
365_reflash-42.png
365_reflash-43.png
365_reflash-44.png
365_reflash-45.png
365_reflash-46.png
365_reflash-47.png
365_reflash-48.png
365_reflash-49.png
365_reflash.gif
366_finality-0.png
366_finality-1.png
366_finality-2.png
366_finality-3.png
366_finality-4.png
366_finality-5.png
366_finality-6.png
366_finality-7.png
366_finality-8.png
366_finality-9.png
366_finality-10.png
366_finality-11.png
366_finality-12.png
366_finality-13.png
366_finality-14.png
366_finality-15.png
366_finality-16.png
366_finality-17.png
366_finality-18.png
366_finality-19.png
366_finality-20.png
366_finality-21.png
366_finality-22.png
366_finality-23.png
366_finality-24.png
366_finality-25.png
366_finality-26.png
366_finality-27.png
366_finality-28.png
366_finality-29.png
366_finality-30.png
366_finality-31.png
366_finality-32.png
366_finality-33.png
366_finality-34.png
366_finality-35.png
366_finality-36.png
366_finality-37.png
366_finality-38.png
366_finality-39.png
366_finality-40.png
366_finality-41.png
366_finality-42.png
366_finality-43.png
366_finality-44.png
366_finality-45.png
366_finality-46.png
366_finality-47.png
366_finality-48.png
366_finality-49.png
366_finality-50.png
366_finality-51.png
366_finality-52.png
366_finality-53.png
366_finality-54.png
366_finality-55.png
366_finality-56.png
366_finality-57.png
366_finality-58.png
366_finality-59.png
366_finality-60.png
366_finality-61.png
366_finality-62.png
366_finality-63.png
366_finality-64.png
366_finality-65.png
366_finality-66.png
366_finality-67.png
366_finality-68.png
366_finality-69.png
366_finality-70.png
366_finality-71.png
366_finality-72.png
366_finality-73.png
366_finality-74.png
366_finality-75.png
366_finality-76.png
366_finality-77.png
366_finality-78.png
366_finality-79.png
366_finality-80.png
366_finality-81.png
366_finality-82.png
366_finality-83.png
366_finality-84.png
366_finality-85.png
366_finality-86.png
366_finality-87.png
366_finality-88.png
366_finality-89.png
366_finality-90.png
366_finality-91.png
366_finality-92.png
366_finality-93.png
366_finality-94.png
366_finality-95.png
366_finality-96.png
366_finality-97.png
366_finality-98.png
366_finality-99.png
366_finality-100.png
366_finality-101.png
366_finality-102.png
366_finality-103.png
366_finality-104.png
366_finality-105.png
366_finality-106.png
366_finality-107.png
366_finality-108.png
366_finality-109.png
366_finality-110.png
366_finality-111.png
366_finality-112.png
366_finality-113.png
366_finality-114.png
366_finality-115.png
366_finality-116.png
366_finality-117.png
366_finality-118.png
366_finality-119.png
366_finality-120.png
366_finality-121.png
366_finality-122.png
366_finality-123.png
366_finality-124.png
366_finality-125.png
366_finality-126.png
366_finality-127.png
366_finality-128.png
366_finality-129.png
366_finality-130.png
366_finality-131.png
366_finality-132.png
366_finality-133.png
366_finality-134.png
366_finality-135.png
366_finality-136.png
366_finality-137.png
366_finality-138.png
366_finality-139.png
366_finality-140.png
366_finality-141.png
366_finality-142.png
366_finality-143.png
366_finality-144.png
366_finality-145.png
366_finality-146.png
366_finality-147.png
366_finality-148.png
366_finality-149.png
366_finality-150.png
366_finality-151.png
366_finality-152.png
366_finality-153.png
366_finality-154.png
366_finality-155.png
366_finality-156.png
366_finality-157.png
366_finality-158.png
366_finality-159.png
366_finality-160.png
366_finality-161.png
366_finality-162.png
366_finality-163.png
366_finality-164.png
366_finality-165.png
366_finality-166.png
366_finality-167.png
366_finality-168.png
366_finality-169.png
366_finality-170.png
366_finality-171.png
366_finality-172.png
366_finality-173.png
366_finality-174.png
366_finality-175.png
366_finality-176.png
366_finality-177.png
366_finality-178.png
366_finality-179.png
366_finality-180.png
366_finality-181.png
366_finality-182.png
366_finality-183.png
366_finality-184.png
366_finality-185.png
366_finality-186.png
366_finality-187.png
366_finality-188.png
366_finality-189.png
366_finality-190.png
366_finality-191.png
366_finality-192.png
366_finality-193.png
366_finality-194.png
366_finality-195.png
366_finality-196.png
366_finality-197.png
366_finality-198.png
366_finality-199.png
366_finality-200.png
366_finality-201.png
366_finality-202.png
366_finality-203.png
366_finality-204.png
366_finality-205.png
366_finality-206.png
366_finality-207.png
366_finality-208.png
366_finality-209.png
366_finality-210.png
366_finality-211.png
366_finality-212.png
366_finality-213.png
366_finality-214.png
366_finality-215.png
366_finality-216.png
366_finality-217.png
366_finality-218.png
366_finality-219.png
366_finality-220.png
366_finality-221.png
366_finality-222.png
366_finality-223.png
366_finality-224.png
366_finality-225.png
366_finality-226.png
366_finality-227.png
366_finality-228.png
366_finality-229.png
366_finality-230.png
366_finality-231.png
366_finality-232.png
366_finality-233.png
366_finality-234.png
366_finality-235.png
366_finality-236.png
366_finality-237.png
366_finality-238.png
366_finality-239.png
366_finality-240.png
366_finality-241.png
366_finality-242.png
366_finality-243.png
366_finality-244.png
366_finality-245.png
366_finality-246.png
366_finality-247.png
366_finality-248.png
366_finality-249.png
366_finality-250.png
366_finality-251.png
366_finality-252.png
366_finality-253.png
366_finality-254.png
366_finality-255.png
366_finality-256.png
366_finality-257.png
366_finality-258.png
366_finality-259.png
366_finality-260.png
366_finality-261.png
366_finality-262.png
366_finality-263.png
366_finality-264.png
366_finality-265.png
366_finality-266.png
366_finality-267.png
366_finality-268.png
366_finality-269.png
366_finality-270.png
366_finality-271.png
366_finality-272.png
366_finality-273.png
366_finality-274.png
366_finality-275.png
366_finality-276.png
366_finality-277.png
366_finality-278.png
366_finality-279.png
366_finality-280.png
366_finality-281.png
366_finality-282.png
366_finality-283.png
366_finality-284.png
366_finality-285.png
366_finality-286.png
366_finality-287.png
366_finality-288.png
366_finality-289.png
366_finality-290.png
366_finality-291.png
366_finality-292.png
366_finality-293.png
366_finality-294.png
366_finality-295.png
366_finality-296.png
366_finality-297.png
366_finality-298.png
366_finality-299.png
366_finality-300.png
366_finality-301.png
366_finality-302.png
366_finality-303.png
366_finality-304.png
366_finality-305.png
366_finality-306.png
366_finality-307.png
366_finality-308.png
366_finality-309.png
366_finality-310.png
366_finality-311.png
366_finality-312.png
366_finality-313.png
366_finality-314.png
366_finality-315.png
366_finality-316.png
366_finality-317.png
366_finality-318.png
366_finality-319.png
366_finality-320.png
366_finality-321.png
366_finality-322.png
366_finality-323.png
366_finality-324.png
366_finality-325.png
366_finality-326.png
366_finality-327.png
366_finality-328.png
366_finality-329.png
366_finality-330.png
366_finality-331.png
366_finality-332.png
366_finality-333.png
366_finality-334.png
366_finality-335.png
366_finality-336.png
366_finality-337.png
366_finality-338.png
366_finality-339.png
366_finality-340.png
366_finality-341.png
366_finality-342.png
366_finality-343.png
366_finality-344.png
366_finality-345.png
366_finality-346.png
366_finality-347.png
366_finality-348.png
366_finality-349.png
366_finality-350.png
366_finality-351.png
366_finality-352.png
366_finality-353.png
366_finality-354.png
366_finality-355.png
366_finality-356.png
366_finality-357.png
366_finality-358.png
366_finality-359.png
366_finality-360.png
366_finality-361.png
366_finality-362.png
366_finality-363.png
366_finality-364.png
366_finality.gif
367_stormcell.png
368_asperitas.png
369_knowledgable.png
370_kilo-0.png
370_kilo-1.png
370_kilo-2.png
370_kilo-3.png
370_kilo-4.png
370_kilo-5.png
370_kilo-6.png
370_kilo-7.png
370_kilo-8.png
370_kilo-9.png
370_kilo-10.png
370_kilo-11.png
370_kilo-12.png
370_kilo-13.png
370_kilo-14.png
370_kilo-15.png
370_kilo-16.png
370_kilo-17.png
370_kilo-18.png
370_kilo-19.png
370_kilo-20.png
370_kilo-21.png
370_kilo-22.png
370_kilo-23.png
370_kilo-24.png
370_kilo-25.png
370_kilo-26.png
370_kilo-27.png
370_kilo-28.png
370_kilo-29.png
370_kilo-30.png
370_kilo-31.png
370_kilo-32.png
370_kilo-33.png
370_kilo-34.png
370_kilo-35.png
370_kilo-36.png
370_kilo-37.png
370_kilo-38.png
370_kilo-39.png
370_kilo-40.png
370_kilo-41.png
370_kilo-42.png
370_kilo-43.png
370_kilo-44.png
370_kilo-45.png
370_kilo-46.png
370_kilo-47.png
370_kilo-48.png
370_kilo-49.png
370_kilo-50.png
370_kilo-51.png
370_kilo-52.png
370_kilo-53.png
370_kilo-54.png
370_kilo-55.png
370_kilo-56.png
370_kilo-57.png
370_kilo-58.png
370_kilo-59.png
370_kilo-60.png
370_kilo-61.png
370_kilo-62.png
370_kilo-63.png
370_kilo-64.png
370_kilo-65.png
370_kilo-66.png
370_kilo-67.png
370_kilo-68.png
370_kilo-69.png
370_kilo-70.png
370_kilo-71.png
370_kilo-72.png
370_kilo-73.png
370_kilo-74.png
370_kilo-75.png
370_kilo-76.png
370_kilo-77.png
370_kilo-78.png
370_kilo-79.png
370_kilo-80.png
370_kilo-81.png
370_kilo-82.png
370_kilo-83.png
370_kilo-84.png
370_kilo-85.png
370_kilo-86.png
370_kilo-87.png
370_kilo-88.png
370_kilo-89.png
370_kilo.gif
371_fpbg.png
372_ripple.png
373_volcaniclightning.png
374_hat12.png
375_xmas.png
376_ohyeah.png
377_run.png
378_festive_gecko.png
379_biden.png
380_how.png
381_sequence.png
382_void.png
383_re383.png
384_welder.png
385_sunset.png
386_rotated.png
387_deth-0.png
387_deth-1.png
387_deth-2.png
387_deth-3.png
387_deth-4.png
387_deth-5.png
387_deth-6.png
387_deth-7.png
387_deth-8.png
387_deth.gif
388_vsc.png
389_vsccccc.png
390_bse.png
391_cold.png
392_optimized.png
393_orange.png
394_venom.png
395_shaded.png
396_oil.png
397_vincent.png
398_golden.png
399_nine-0.png
399_nine-1.png
399_nine-2.png
399_nine-3.png
399_nine-4.png
399_nine-5.png
399_nine-6.png
399_nine-7.png
399_nine-8.png
399_nine-9.png
399_nine-10.png
399_nine-11.png
399_nine-12.png
399_nine-13.png
399_nine-14.png
399_nine-15.png
399_nine-16.png
399_nine-17.png
399_nine-18.png
399_nine-19.png
399_nine-20.png
399_nine-21.png
399_nine-22.png
399_nine-23.png
399_nine-24.png
399_nine-25.png
399_nine-26.png
399_nine-27.png
399_nine-28.png
399_nine-29.png
399_nine-30.png
399_nine-31.png
399_nine.gif
400_abnormalparty.png
401_normality.png
402_shell.png
403_dankenergy.png
404_thatsanerror.png
405_absolutesewer-0.png
405_absolutesewer-1.png
405_absolutesewer-2.png
405_absolutesewer-3.png
405_absolutesewer-4.png
405_absolutesewer-5.png
405_absolutesewer-6.png
405_absolutesewer-7.png
405_absolutesewer-8.png
405_absolutesewer-9.png
405_absolutesewer-10.png
405_absolutesewer-11.png
405_absolutesewer-12.png
405_absolutesewer-13.png
405_absolutesewer-14.png
405_absolutesewer-15.png
405_absolutesewer-16.png
405_absolutesewer-17.png
405_absolutesewer-18.png
405_absolutesewer-19.png
405_absolutesewer-20.png
405_absolutesewer-21.png
405_absolutesewer-22.png
405_absolutesewer-23.png
405_absolutesewer-24.png
405_absolutesewer-25.png
405_absolutesewer-26.png
405_absolutesewer.gif
406_modified.png
407_travis.png
408_protonbeam-0.png
408_protonbeam-1.png
408_protonbeam-2.png
408_protonbeam-3.png
408_protonbeam-4.png
408_protonbeam-5.png
408_protonbeam-6.png
408_protonbeam-7.png
408_protonbeam-8.png
408_protonbeam-9.png
408_protonbeam-10.png
408_protonbeam-11.png
408_protonbeam-12.png
408_protonbeam-13.png
408_protonbeam-14.png
408_protonbeam-15.png
408_protonbeam-16.png
408_protonbeam-17.png
408_protonbeam-18.png
408_protonbeam-19.png
408_protonbeam-20.png
408_protonbeam-21.png
408_protonbeam-22.png
408_protonbeam-23.png
408_protonbeam-24.png
408_protonbeam-25.png
408_protonbeam-26.png
408_protonbeam-27.png
408_protonbeam-28.png
408_protonbeam-29.png
408_protonbeam-30.png
408_protonbeam-31.png
408_protonbeam-32.png
408_protonbeam-33.png
408_protonbeam-34.png
408_protonbeam-35.png
408_protonbeam-36.png
408_protonbeam-37.png
408_protonbeam-38.png
408_protonbeam-39.png
408_protonbeam-40.png
408_protonbeam-41.png
408_protonbeam-42.png
408_protonbeam-43.png
408_protonbeam-44.png
408_protonbeam-45.png
408_protonbeam-46.png
408_protonbeam-47.png
408_protonbeam-48.png
408_protonbeam-49.png
408_protonbeam-50.png
408_protonbeam-51.png
408_protonbeam-52.png
408_protonbeam.gif
409_heck.png
410_frick.png
411_gunspin-0.png
411_gunspin-1.png
411_gunspin-2.png
411_gunspin-3.png
411_gunspin-4.png
411_gunspin-5.png
411_gunspin-6.png
411_gunspin-7.png
411_gunspin-8.png
411_gunspin-9.png
411_gunspin-10.png
411_gunspin-11.png
411_gunspin-12.png
411_gunspin-13.png
411_gunspin-14.png
411_gunspin-15.png
411_gunspin-16.png
411_gunspin-17.png
411_gunspin-18.png
411_gunspin-19.png
411_gunspin-20.png
411_gunspin-21.png
411_gunspin-22.png
411_gunspin-23.png
411_gunspin-24.png
411_gunspin-25.png
411_gunspin-26.png
411_gunspin-27.png
411_gunspin-28.png
411_gunspin-29.png
411_gunspin-30.png
411_gunspin-31.png
411_gunspin-32.png
411_gunspin-33.png
411_gunspin-34.png
411_gunspin-35.png
411_gunspin.gif
412_weirdchamp.png
413_413.png
414_quad.png
415_bounce-0.png
415_bounce-1.png
415_bounce-2.png
415_bounce-3.png
415_bounce-4.png
415_bounce-5.png
415_bounce-6.png
415_bounce-7.png
415_bounce-8.png
415_bounce-9.png
415_bounce-10.png
415_bounce-11.png
415_bounce-12.png
415_bounce-13.png
415_bounce-14.png
415_bounce-15.png
415_bounce-16.png
415_bounce-17.png
415_bounce-18.png
415_bounce-19.png
415_bounce-20.png
415_bounce-21.png
415_bounce-22.png
415_bounce-23.png
415_bounce-24.png
415_bounce-25.png
415_bounce-26.png
415_bounce.gif
416_fasterbounce-0.png
416_fasterbounce-1.png
416_fasterbounce-2.png
416_fasterbounce-3.png
416_fasterbounce-4.png
416_fasterbounce-5.png
416_fasterbounce-6.png
416_fasterbounce.gif
417_decayed.png
418_beatsaberblue.png
419_beatsaberred.png
420_weed.png
421_recreated.png
422_beamproton.png
423_imperfect.png
424_superflushed.png
425_pattern.png
426_diamondore.png
427_goldore.png
428_coalore.png
429_redstoneore.png
430_emeraldore.png
431_quartzore.png
432_ancientdebris.png
433_gib.png
434_birdeatergun.png
435_hologram-0.png
435_hologram-1.png
435_hologram-2.png
435_hologram-3.png
435_hologram-4.png
435_hologram-5.png
435_hologram-6.png
435_hologram-7.png
435_hologram-8.png
435_hologram-9.png
435_hologram-10.png
435_hologram-11.png
435_hologram-12.png
435_hologram-13.png
435_hologram-14.png
435_hologram-15.png
435_hologram-16.png
435_hologram-17.png
435_hologram-18.png
435_hologram-19.png
435_hologram-20.png
435_hologram-21.png
435_hologram-22.png
435_hologram-23.png
435_hologram-24.png
435_hologram-25.png
435_hologram-26.png
435_hologram-27.png
435_hologram-28.png
435_hologram-29.png
435_hologram-30.png
435_hologram-31.png
435_hologram-32.png
435_hologram-33.png
435_hologram-34.png
435_hologram-35.png
435_hologram-36.png
435_hologram-37.png
435_hologram-38.png
435_hologram-39.png
435_hologram-40.png
435_hologram-41.png
435_hologram-42.png
435_hologram-43.png
435_hologram-44.png
435_hologram-45.png
435_hologram-46.png
435_hologram-47.png
435_hologram.gif
436_bignumber.png
437_crewmate.png
438_geckod-0.png
438_geckod-1.png
438_geckod-2.png
438_geckod-3.png
438_geckod-4.png
438_geckod-5.png
438_geckod-6.png
438_geckod-7.png
438_geckod-8.png
438_geckod-9.png
438_geckod-10.png
438_geckod-11.png
438_geckod-12.png
438_geckod-13.png
438_geckod-14.png
438_geckod-15.png
438_geckod-16.png
438_geckod-17.png
438_geckod-18.png
438_geckod-19.png
438_geckod-20.png
438_geckod-21.png
438_geckod-22.png
438_geckod-23.png
438_geckod-24.png
438_geckod-25.png
438_geckod-26.png
438_geckod-27.png
438_geckod-28.png
438_geckod-29.png
438_geckod-30.png
438_geckod-31.png
438_geckod-32.png
438_geckod-33.png
438_geckod-34.png
438_geckod-35.png
438_geckod-36.png
438_geckod-37.png
438_geckod-38.png
438_geckod-39.png
438_geckod-40.png
438_geckod-41.png
438_geckod-42.png
438_geckod-43.png
438_geckod-44.png
438_geckod-45.png
438_geckod-46.png
438_geckod-47.png
438_geckod-48.png
438_geckod-49.png
438_geckod-50.png
438_geckod-51.png
438_geckod-52.png
438_geckod-53.png
438_geckod-54.png
438_geckod-55.png
438_geckod-56.png
438_geckod-57.png
438_geckod-58.png
438_geckod-59.png
438_geckod-60.png
438_geckod-61.png
438_geckod-62.png
438_geckod-63.png
438_geckod-64.png
438_geckod-65.png
438_geckod-66.png
438_geckod-67.png
438_geckod-68.png
438_geckod-69.png
438_geckod-70.png
438_geckod-71.png
438_geckod-72.png
438_geckod-73.png
438_geckod-74.png
438_geckod-75.png
438_geckod-76.png
438_geckod-77.png
438_geckod-78.png
438_geckod-79.png
438_geckod-80.png
438_geckod-81.png
438_geckod-82.png
438_geckod-83.png
438_geckod-84.png
438_geckod-85.png
438_geckod-86.png
438_geckod-87.png
438_geckod-88.png
438_geckod-89.png
438_geckod-90.png
438_geckod-91.png
438_geckod-92.png
438_geckod-93.png
438_geckod-94.png
438_geckod-95.png
438_geckod-96.png
438_geckod-97.png
438_geckod-98.png
438_geckod-99.png
438_geckod-100.png
438_geckod-101.png
438_geckod-102.png
438_geckod-103.png
438_geckod-104.png
438_geckod-105.png
438_geckod-106.png
438_geckod-107.png
438_geckod-108.png
438_geckod-109.png
438_geckod-110.png
438_geckod-111.png
438_geckod-112.png
438_geckod-113.png
438_geckod-114.png
438_geckod-115.png
438_geckod-116.png
438_geckod-117.png
438_geckod-118.png
438_geckod-119.png
438_geckod-120.png
438_geckod-121.png
438_geckod-122.png
438_geckod-123.png
438_geckod-124.png
438_geckod-125.png
438_geckod-126.png
438_geckod-127.png
438_geckod-128.png
438_geckod-129.png
438_geckod-130.png
438_geckod-131.png
438_geckod-132.png
438_geckod-133.png
438_geckod-134.png
438_geckod-135.png
438_geckod-136.png
438_geckod-137.png
438_geckod-138.png
438_geckod-139.png
438_geckod-140.png
438_geckod-141.png
438_geckod-142.png
438_geckod-143.png
438_geckod-144.png
438_geckod-145.png
438_geckod-146.png
438_geckod-147.png
438_geckod-148.png
438_geckod-149.png
438_geckod-150.png
438_geckod-151.png
438_geckod-152.png
438_geckod-153.png
438_geckod-154.png
438_geckod-155.png
438_geckod-156.png
438_geckod-157.png
438_geckod-158.png
438_geckod-159.png
438_geckod-160.png
438_geckod-161.png
438_geckod-162.png
438_geckod-163.png
438_geckod-164.png
438_geckod-165.png
438_geckod-166.png
438_geckod-167.png
438_geckod-168.png
438_geckod-169.png
438_geckod-170.png
438_geckod-171.png
438_geckod-172.png
438_geckod-173.png
438_geckod-174.png
438_geckod-175.png
438_geckod-176.png
438_geckod-177.png
438_geckod-178.png
438_geckod-179.png
438_geckod-180.png
438_geckod-181.png
438_geckod-182.png
438_geckod-183.png
438_geckod-184.png
438_geckod-185.png
438_geckod-186.png
438_geckod-187.png
438_geckod-188.png
438_geckod-189.png
438_geckod-190.png
438_geckod-191.png
438_geckod-192.png
438_geckod-193.png
438_geckod-194.png
438_geckod-195.png
438_geckod.gif
439_jack.png
440_bigbee.png
441_massivemosscharger.png
442_aspid.png
443_ppebtw.png
444_AI-COM_GECK.png
445_geckobot.png
446_lemongeckothink.png
447_geckothink.png
448_pikachu.png
449_jackchomp.png
450_minecraftgecko.png
451_marbleslide.png
452_musescore.png
453_limegeckothink.png
454__.png
455_bro.png
456_docs.png
457_slides.png
458_forms.png
459_sheets.png
460_drawings.png
461_command_module.png
462_enragedcrewmate.png
463_bloom.png
464_primarycolors.png
465_colorsthatareprimary.png
466_flames-0.png
466_flames-1.png
466_flames-2.png
466_flames-3.png
466_flames-4.png
466_flames-5.png
466_flames-6.png
466_flames-7.png
466_flames-8.png
466_flames-9.png
466_flames-10.png
466_flames-11.png
466_flames-12.png
466_flames-13.png
466_flames-14.png
466_flames-15.png
466_flames-16.png
466_flames-17.png
466_flames-18.png
466_flames-19.png
466_flames-20.png
466_flames-21.png
466_flames-22.png
466_flames-23.png
466_flames-24.png
466_flames-25.png
466_flames-26.png
466_flames-27.png
466_flames-28.png
466_flames-29.png
466_flames-30.png
466_flames-31.png
466_flames-32.png
466_flames-33.png
466_flames-34.png
466_flames-35.png
466_flames-36.png
466_flames-37.png
466_flames-38.png
466_flames-39.png
466_flames-40.png
466_flames-41.png
466_flames-42.png
466_flames-43.png
466_flames-44.png
466_flames-45.png
466_flames-46.png
466_flames-47.png
466_flames-48.png
466_flames-49.png
466_flames-50.png
466_flames-51.png
466_flames-52.png
466_flames-53.png
466_flames-54.png
466_flames-55.png
466_flames-56.png
466_flames-57.png
466_flames-58.png
466_flames-59.png
466_flames-60.png
466_flames-61.png
466_flames-62.png
466_flames-63.png
466_flames-64.png
466_flames-65.png
466_flames-66.png
466_flames-67.png
466_flames-68.png
466_flames-69.png
466_flames-70.png
466_flames-71.png
466_flames-72.png
466_flames-73.png
466_flames-74.png
466_flames-75.png
466_flames-76.png
466_flames-77.png
466_flames-78.png
466_flames-79.png
466_flames-80.png
466_flames-81.png
466_flames-82.png
466_flames-83.png
466_flames-84.png
466_flames-85.png
466_flames-86.png
466_flames-87.png
466_flames-88.png
466_flames-89.png
466_flames-90.png
466_flames-91.png
466_flames-92.png
466_flames-93.png
466_flames-94.png
466_flames.gif
467_transmission-0.png
467_transmission-1.png
467_transmission-2.png
467_transmission-3.png
467_transmission-4.png
467_transmission-5.png
467_transmission-6.png
467_transmission-7.png
467_transmission-8.png
467_transmission-9.png
467_transmission-10.png
467_transmission-11.png
467_transmission-12.png
467_transmission-13.png
467_transmission-14.png
467_transmission-15.png
467_transmission.gif
468_lensflare.png
469_fog.png
470_squared.png
471_facelessmask.png
472_unmask.png
473_owo.png
474_calm.png
475_infrared.png
476_reallemon.png
477_strange.png
478_blend.png
479_prism-0.png
479_prism-1.png
479_prism-2.png
479_prism-3.png
479_prism-4.png
479_prism-5.png
479_prism-6.png
479_prism-7.png
479_prism-8.png
479_prism-9.png
479_prism-10.png
479_prism-11.png
479_prism-12.png
479_prism-13.png
479_prism-14.png
479_prism-15.png
479_prism-16.png
479_prism-17.png
479_prism-18.png
479_prism-19.png
479_prism-20.png
479_prism-21.png
479_prism-22.png
479_prism-23.png
479_prism-24.png
479_prism-25.png
479_prism-26.png
479_prism-27.png
479_prism-28.png
479_prism-29.png
479_prism-30.png
479_prism-31.png
479_prism-32.png
479_prism-33.png
479_prism-34.png
479_prism-35.png
479_prism-36.png
479_prism-37.png
479_prism-38.png
479_prism-39.png
479_prism-40.png
479_prism-41.png
479_prism-42.png
479_prism-43.png
479_prism-44.png
479_prism-45.png
479_prism-46.png
479_prism-47.png
479_prism-48.png
479_prism-49.png
479_prism-50.png
479_prism-51.png
479_prism-52.png
479_prism-53.png
479_prism-54.png
479_prism-55.png
479_prism-56.png
479_prism-57.png
479_prism-58.png
479_prism-59.png
479_prism-60.png
479_prism-61.png
479_prism-62.png
479_prism-63.png
479_prism-64.png
479_prism-65.png
479_prism-66.png
479_prism-67.png
479_prism-68.png
479_prism-69.png
479_prism-70.png
479_prism-71.png
479_prism-72.png
479_prism-73.png
479_prism-74.png
479_prism-75.png
479_prism-76.png
479_prism-77.png
479_prism-78.png
479_prism-79.png
479_prism-80.png
479_prism-81.png
479_prism-82.png
479_prism-83.png
479_prism-84.png
479_prism-85.png
479_prism-86.png
479_prism-87.png
479_prism-88.png
479_prism-89.png
479_prism-90.png
479_prism-91.png
479_prism-92.png
479_prism-93.png
479_prism-94.png
479_prism-95.png
479_prism.gif
480_paranoid-0.png
480_paranoid-1.png
480_paranoid-2.png
480_paranoid-3.png
480_paranoid-4.png
480_paranoid-5.png
480_paranoid-6.png
480_paranoid-7.png
480_paranoid-8.png
480_paranoid-9.png
480_paranoid-10.png
480_paranoid-11.png
480_paranoid-12.png
480_paranoid-13.png
480_paranoid-14.png
480_paranoid-15.png
480_paranoid-16.png
480_paranoid-17.png
480_paranoid-18.png
480_paranoid-19.png
480_paranoid-20.png
480_paranoid-21.png
480_paranoid-22.png
480_paranoid-23.png
480_paranoid-24.png
480_paranoid-25.png
480_paranoid-26.png
480_paranoid-27.png
480_paranoid-28.png
480_paranoid-29.png
480_paranoid-30.png
480_paranoid-31.png
480_paranoid-32.png
480_paranoid-33.png
480_paranoid-34.png
480_paranoid-35.png
480_paranoid-36.png
480_paranoid-37.png
480_paranoid-38.png
480_paranoid-39.png
480_paranoid-40.png
480_paranoid-41.png
480_paranoid-42.png
480_paranoid-43.png
480_paranoid-44.png
480_paranoid-45.png
480_paranoid-46.png
480_paranoid-47.png
480_paranoid-48.png
480_paranoid-49.png
480_paranoid.gif
481_h.png
482_hquedslabdjads.png
483_neon.png
484_unity.png
485_moon_dust.png
486_loss.png
487_tesselation.png
488_among_sus.png
489_gecko_of_norway-0.png
489_gecko_of_norway-1.png
489_gecko_of_norway-2.png
489_gecko_of_norway-3.png
489_gecko_of_norway-4.png
489_gecko_of_norway-5.png
489_gecko_of_norway-6.png
489_gecko_of_norway-7.png
489_gecko_of_norway-8.png
489_gecko_of_norway-9.png
489_gecko_of_norway-10.png
489_gecko_of_norway-11.png
489_gecko_of_norway-12.png
489_gecko_of_norway-13.png
489_gecko_of_norway-14.png
489_gecko_of_norway-15.png
489_gecko_of_norway-16.png
489_gecko_of_norway-17.png
489_gecko_of_norway-18.png
489_gecko_of_norway-19.png
489_gecko_of_norway-20.png
489_gecko_of_norway-21.png
489_gecko_of_norway-22.png
489_gecko_of_norway-23.png
489_gecko_of_norway-24.png
489_gecko_of_norway-25.png
489_gecko_of_norway-26.png
489_gecko_of_norway-27.png
489_gecko_of_norway-28.png
489_gecko_of_norway-29.png
489_gecko_of_norway-30.png
489_gecko_of_norway-31.png
489_gecko_of_norway-32.png
489_gecko_of_norway-33.png
489_gecko_of_norway-34.png
489_gecko_of_norway-35.png
489_gecko_of_norway-36.png
489_gecko_of_norway-37.png
489_gecko_of_norway-38.png
489_gecko_of_norway-39.png
489_gecko_of_norway-40.png
489_gecko_of_norway-41.png
489_gecko_of_norway-42.png
489_gecko_of_norway-43.png
489_gecko_of_norway-44.png
489_gecko_of_norway-45.png
489_gecko_of_norway-46.png
489_gecko_of_norway-47.png
489_gecko_of_norway-48.png
489_gecko_of_norway-49.png
489_gecko_of_norway-50.png
489_gecko_of_norway-51.png
489_gecko_of_norway-52.png
489_gecko_of_norway-53.png
489_gecko_of_norway-54.png
489_gecko_of_norway-55.png
489_gecko_of_norway-56.png
489_gecko_of_norway.gif
490_arm.png
491_inferno.png
492_hexagonal.png
493_absorbant.png
494_eight_ball.png
495_angery.png
496_ping-0.png
496_ping-1.png
496_ping-2.png
496_ping-3.png
496_ping-4.png
496_ping-5.png
496_ping-6.png
496_ping-7.png
496_ping-8.png
496_ping-9.png
496_ping-10.png
496_ping-11.png
496_ping-12.png
496_ping-13.png
496_ping-14.png
496_ping-15.png
496_ping-16.png
496_ping-17.png
496_ping-18.png
496_ping-19.png
496_ping-20.png
496_ping.gif
497_circle.png
498_amonggecko.png
499_DripGecc.png
500_reincarnation-0.png
500_reincarnation-1.png
500_reincarnation-2.png
500_reincarnation-3.png
500_reincarnation-4.png
500_reincarnation-5.png
500_reincarnation-6.png
500_reincarnation-7.png
500_reincarnation-8.png
500_reincarnation-9.png
500_reincarnation-10.png
500_reincarnation-11.png
500_reincarnation-12.png
500_reincarnation-13.png
500_reincarnation-14.png
500_reincarnation-15.png
500_reincarnation-16.png
500_reincarnation-17.png
500_reincarnation-18.png
500_reincarnation-19.png
500_reincarnation-20.png
500_reincarnation-21.png
500_reincarnation-22.png
500_reincarnation-23.png
500_reincarnation-24.png
500_reincarnation-25.png
500_reincarnation-26.png
500_reincarnation-27.png
500_reincarnation-28.png
500_reincarnation-29.png
500_reincarnation-30.png
500_reincarnation-31.png
500_reincarnation-32.png
500_reincarnation-33.png
500_reincarnation-34.png
500_reincarnation-35.png
500_reincarnation-36.png
500_reincarnation-37.png
500_reincarnation-38.png
500_reincarnation-39.png
500_reincarnation-40.png
500_reincarnation-41.png
500_reincarnation-42.png
500_reincarnation-43.png
500_reincarnation-44.png
500_reincarnation-45.png
500_reincarnation-46.png
500_reincarnation-47.png
500_reincarnation-48.png
500_reincarnation-49.png
500_reincarnation-50.png
500_reincarnation-51.png
500_reincarnation-52.png
500_reincarnation-53.png
500_reincarnation-54.png
500_reincarnation-55.png
500_reincarnation-56.png
500_reincarnation-57.png
500_reincarnation-58.png
500_reincarnation-59.png
500_reincarnation-60.png
500_reincarnation-61.png
500_reincarnation-62.png
500_reincarnation-63.png
500_reincarnation-64.png
500_reincarnation-65.png
500_reincarnation-66.png
500_reincarnation-67.png
500_reincarnation-68.png
500_reincarnation-69.png
500_reincarnation-70.png
500_reincarnation-71.png
500_reincarnation-72.png
500_reincarnation-73.png
500_reincarnation-74.png
500_reincarnation-75.png
500_reincarnation-76.png
500_reincarnation-77.png
500_reincarnation-78.png
500_reincarnation-79.png
500_reincarnation-80.png
500_reincarnation-81.png
500_reincarnation-82.png
500_reincarnation-83.png
500_reincarnation-84.png
500_reincarnation-85.png
500_reincarnation-86.png
500_reincarnation-87.png
500_reincarnation-88.png
500_reincarnation-89.png
500_reincarnation-90.png
500_reincarnation-91.png
500_reincarnation-92.png
500_reincarnation-93.png
500_reincarnation-94.png
500_reincarnation-95.png
500_reincarnation-96.png
500_reincarnation-97.png
500_reincarnation-98.png
500_reincarnation-99.png
500_reincarnation-100.png
500_reincarnation-101.png
500_reincarnation-102.png
500_reincarnation-103.png
500_reincarnation-104.png
500_reincarnation-105.png
500_reincarnation-106.png
500_reincarnation-107.png
500_reincarnation-108.png
500_reincarnation-109.png
500_reincarnation-110.png
500_reincarnation-111.png
500_reincarnation-112.png
500_reincarnation-113.png
500_reincarnation-114.png
500_reincarnation-115.png
500_reincarnation-116.png
500_reincarnation-117.png
500_reincarnation-118.png
500_reincarnation-119.png
500_reincarnation-120.png
500_reincarnation-121.png
500_reincarnation-122.png
500_reincarnation-123.png
500_reincarnation-124.png
500_reincarnation-125.png
500_reincarnation-126.png
500_reincarnation-127.png
500_reincarnation-128.png
500_reincarnation-129.png
500_reincarnation-130.png
500_reincarnation-131.png
500_reincarnation-132.png
500_reincarnation-133.png
500_reincarnation-134.png
500_reincarnation-135.png
500_reincarnation-136.png
500_reincarnation-137.png
500_reincarnation-138.png
500_reincarnation-139.png
500_reincarnation-140.png
500_reincarnation-141.png
500_reincarnation-142.png
500_reincarnation-143.png
500_reincarnation-144.png
500_reincarnation-145.png
500_reincarnation-146.png
500_reincarnation-147.png
500_reincarnation-148.png
500_reincarnation-149.png
500_reincarnation-150.png
500_reincarnation-151.png
500_reincarnation-152.png
500_reincarnation-153.png
500_reincarnation-154.png
500_reincarnation-155.png
500_reincarnation-156.png
500_reincarnation-157.png
500_reincarnation-158.png
500_reincarnation-159.png
500_reincarnation.gif
501_clock.png
502_sun.png
503_z.png
504_calm_inverted.png
505_inverted_fog.png
506_metallic.png
507_osmium.png
508_increased.png
509_leaf.png
510_mug.png
511_inverted_facelessmask.png
512_THENUMBERS.png
513_trail.png
514_calm_inverted_reinverted.png
515_brain.png
516_gecko_the_hedgehog.png
517_hodtog.png
518_hotdog_RTX_on.png
519_zoom.png
520_membrane.png
521_Snapple_Beneathstory.png
522_lemongeckolemonthinksticker.png
523_iterator.png
524_death_star.png
525_holy_hand_gecko.png
526_potter.png
527_starship.png
528_stonks.jpg
528_stonks.png
529_jotaro.png
530_abyssal.png
531_cow.png
532_green_lizard.png
533_pink_lizard.png
534_blue_lizard.png
535_white_lizard.png
536_yellow_lizard.png
537_black_lizard.png
538_salamander.png
539_cyan_lizard.png
540_red_lizard.png
541_baby_yoda.png
542_jigsaw.png
543_za_warudo.png
544_coldgeck-0.png
544_coldgeck-1.png
544_coldgeck-2.png
544_coldgeck-3.png
544_coldgeck-4.png
544_coldgeck-5.png
544_coldgeck-6.png
544_coldgeck-7.png
544_coldgeck-8.png
544_coldgeck-9.png
544_coldgeck-10.png
544_coldgeck-11.png
544_coldgeck-12.png
544_coldgeck-13.png
544_coldgeck-14.png
544_coldgeck-15.png
544_coldgeck-16.png
544_coldgeck-17.png
544_coldgeck-18.png
544_coldgeck-19.png
544_coldgeck-20.png
544_coldgeck-21.png
544_coldgeck-22.png
544_coldgeck-23.png
544_coldgeck-24.png
544_coldgeck-25.png
544_coldgeck-26.png
544_coldgeck-27.png
544_coldgeck-28.png
544_coldgeck-29.png
544_coldgeck-30.png
544_coldgeck-31.png
544_coldgeck-32.png
544_coldgeck-33.png
544_coldgeck-34.png
544_coldgeck-35.png
544_coldgeck-36.png
544_coldgeck-37.png
544_coldgeck-38.png
544_coldgeck-39.png
544_coldgeck-40.png
544_coldgeck-41.png
544_coldgeck-42.png
544_coldgeck-43.png
544_coldgeck-44.png
544_coldgeck-45.png
544_coldgeck-46.png
544_coldgeck-47.png
544_coldgeck-48.png
544_coldgeck-49.png
544_coldgeck-50.png
544_coldgeck-51.png
544_coldgeck-52.png
544_coldgeck-53.png
544_coldgeck-54.png
544_coldgeck-55.png
544_coldgeck-56.png
544_coldgeck-57.png
544_coldgeck-58.png
544_coldgeck-59.png
544_coldgeck-60.png
544_coldgeck-61.png
544_coldgeck-62.png
544_coldgeck-63.png
544_coldgeck-64.png
544_coldgeck-65.png
544_coldgeck-66.png
544_coldgeck-67.png
544_coldgeck-68.png
544_coldgeck-69.png
544_coldgeck-70.png
544_coldgeck-71.png
544_coldgeck-72.png
544_coldgeck-73.png
544_coldgeck-74.png
544_coldgeck-75.png
544_coldgeck-76.png
544_coldgeck-77.png
544_coldgeck-78.png
544_coldgeck-79.png
544_coldgeck-80.png
544_coldgeck-81.png
544_coldgeck-82.png
544_coldgeck-83.png
544_coldgeck-84.png
544_coldgeck-85.png
544_coldgeck-86.png
544_coldgeck-87.png
544_coldgeck-88.png
544_coldgeck-89.png
544_coldgeck-90.png
544_coldgeck-91.png
544_coldgeck-92.png
544_coldgeck-93.png
544_coldgeck-94.png
544_coldgeck-95.png
544_coldgeck-96.png
544_coldgeck-97.png
544_coldgeck-98.png
544_coldgeck-99.png
544_coldgeck-100.png
544_coldgeck-101.png
544_coldgeck-102.png
544_coldgeck-103.png
544_coldgeck-104.png
544_coldgeck-105.png
544_coldgeck-106.png
544_coldgeck-107.png
544_coldgeck-108.png
544_coldgeck-109.png
544_coldgeck-110.png
544_coldgeck-111.png
544_coldgeck-112.png
544_coldgeck-113.png
544_coldgeck-114.png
544_coldgeck-115.png
544_coldgeck-116.png
544_coldgeck-117.png
544_coldgeck-118.png
544_coldgeck-119.png
544_coldgeck-120.png
544_coldgeck-121.png
544_coldgeck-122.png
544_coldgeck-123.png
544_coldgeck-124.png
544_coldgeck-125.png
544_coldgeck-126.png
544_coldgeck-127.png
544_coldgeck-128.png
544_coldgeck-129.png
544_coldgeck-130.png
544_coldgeck-131.png
544_coldgeck-132.png
544_coldgeck-133.png
544_coldgeck-134.png
544_coldgeck-135.png
544_coldgeck-136.png
544_coldgeck-137.png
544_coldgeck-138.png
544_coldgeck-139.png
544_coldgeck-140.png
544_coldgeck-141.png
544_coldgeck-142.png
544_coldgeck-143.png
544_coldgeck-144.png
544_coldgeck-145.png
544_coldgeck-146.png
544_coldgeck-147.png
544_coldgeck-148.png
544_coldgeck-149.png
544_coldgeck-150.png
544_coldgeck-151.png
544_coldgeck-152.png
544_coldgeck-153.png
544_coldgeck-154.png
544_coldgeck-155.png
544_coldgeck-156.png
544_coldgeck-157.png
544_coldgeck-158.png
544_coldgeck-159.png
544_coldgeck-160.png
544_coldgeck-161.png
544_coldgeck-162.png
544_coldgeck-163.png
544_coldgeck-164.png
544_coldgeck-165.png
544_coldgeck-166.png
544_coldgeck-167.png
544_coldgeck-168.png
544_coldgeck-169.png
544_coldgeck-170.png
544_coldgeck-171.png
544_coldgeck-172.png
544_coldgeck-173.png
544_coldgeck-174.png
544_coldgeck-175.png
544_coldgeck-176.png
544_coldgeck-177.png
544_coldgeck-178.png
544_coldgeck-179.png
544_coldgeck.gif
545_bohdi.png
546_morshu.png
547_separating-0.png
547_separating-1.png
547_separating-2.png
547_separating-3.png
547_separating-4.png
547_separating-5.png
547_separating-6.png
547_separating-7.png
547_separating-8.png
547_separating-9.png
547_separating-10.png
547_separating-11.png
547_separating-12.png
547_separating-13.png
547_separating-14.png
547_separating-15.png
547_separating-16.png
547_separating-17.png
547_separating-18.png
547_separating-19.png
547_separating-20.png
547_separating-21.png
547_separating-22.png
547_separating-23.png
547_separating-24.png
547_separating-25.png
547_separating-26.png
547_separating-27.png
547_separating-28.png
547_separating-29.png
547_separating-30.png
547_separating-31.png
547_separating-32.png
547_separating-33.png
547_separating-34.png
547_separating-35.png
547_separating-36.png
547_separating-37.png
547_separating-38.png
547_separating-39.png
547_separating-40.png
547_separating-41.png
547_separating-42.png
547_separating-43.png
547_separating-44.png
547_separating-45.png
547_separating-46.png
547_separating-47.png
547_separating-48.png
547_separating-49.png
547_separating-50.png
547_separating-51.png
547_separating-52.png
547_separating-53.png
547_separating-54.png
547_separating-55.png
547_separating-56.png
547_separating-57.png
547_separating-58.png
547_separating-59.png
547_separating-60.png
547_separating-61.png
547_separating-62.png
547_separating-63.png
547_separating-64.png
547_separating-65.png
547_separating-66.png
547_separating-67.png
547_separating-68.png
547_separating-69.png
547_separating-70.png
547_separating-71.png
547_separating-72.png
547_separating-73.png
547_separating-74.png
547_separating-75.png
547_separating-76.png
547_separating-77.png
547_separating-78.png
547_separating-79.png
547_separating-80.png
547_separating-81.png
547_separating-82.png
547_separating-83.png
547_separating-84.png
547_separating-85.png
547_separating-86.png
547_separating-87.png
547_separating-88.png
547_separating-89.png
547_separating-90.png
547_separating-91.png
547_separating-92.png
547_separating-93.png
547_separating-94.png
547_separating-95.png
547_separating-96.png
547_separating-97.png
547_separating-98.png
547_separating-99.png
547_separating-100.png
547_separating-101.png
547_separating-102.png
547_separating-103.png
547_separating-104.png
547_separating-105.png
547_separating-106.png
547_separating-107.png
547_separating-108.png
547_separating-109.png
547_separating-110.png
547_separating-111.png
547_separating-112.png
547_separating-113.png
547_separating-114.png
547_separating-115.png
547_separating-116.png
547_separating-117.png
547_separating-118.png
547_separating-119.png
547_separating-120.png
547_separating-121.png
547_separating-122.png
547_separating-123.png
547_separating-124.png
547_separating-125.png
547_separating-126.png
547_separating-127.png
547_separating-128.png
547_separating-129.png
547_separating-130.png
547_separating-131.png
547_separating-132.png
547_separating-133.png
547_separating-134.png
547_separating-135.png
547_separating-136.png
547_separating-137.png
547_separating-138.png
547_separating-139.png
547_separating-140.png
547_separating-141.png
547_separating-142.png
547_separating-143.png
547_separating-144.png
547_separating-145.png
547_separating-146.png
547_separating-147.png
547_separating-148.png
547_separating-149.png
547_separating.gif
548_ditheredrainbow.png
549_ditheredgrayscale.png
550_ditheredpalette.png
551_ditheredgold.png
552_blizzard.png
553_anaphase.png
554_ralsei.png
555_no_anime.png
556_wick.png
557_link.png
558_indiana.png
559_lemonimegeckothink.png
560_inverted_pt.png
561_cactusgeffgecko.png
562_CursedFlushedGecko.png
563_e_y_e_s.png
564_flip.png
565_vortexcannon.png
566_thegametheprequelthegamethegame.png
567_thegamethesequelthegamethegame.png
568_676563636b6f.png
569_placeholder.png
570_kobito.png
571_diagonal.png
572_snow.png
573_glass.png
574_2.5d.png
575_enchanted.png
576_marble.png
577_iceberg.png
578_WD.png
579_monster.png
580_acrantel.png
581_yukari.png
582_crimson_destroyer.png
583_guy_fawkes.png
584_battleship.png
585_strangebread.png
586_orangegeckothink.png
587_applegeckothink.png
588_grapegeckothink.png
589_blueberrygeckothink.png
590_blueraspberrygeckothink.png
591_blackberrygeckothink.png
592_canadafruitgeckothink.png
593_peachgeckothink.png
594_bananageckothink.png
595_coffeebeangeckothink.png
596_orb.png
597_amplified_canada.png
598_abstracted.png
599_cube.png
600_celebration.png
601_dripstone.png
602_impsoster.png
603_wwwwwwwww.png
604_geckowithhands.jpg
604_geckowithhands.png
605_crimson_sorcerer.png
606_crimson_pilot.png
607_technoblade.png
608_github.png
609_usaco.png
610_spongegecko.jpeg
610_spongegecko.png
611_gecko_is_watching_you.jpeg
611_gecko_is_watching_you.png
612_6th_angel.png
613_tet.png
614_dream.png
615_roblox.png
616_shotgun_gecko.png
617_bse5.png
618_hug.png
619_group_hug.png
620_cubic_distortions.png
621_confused.png
622_gecko_of_greenland.png
623_smiling_gecko_with_3_hearts.png
624_kevin.png
625_notlikegecko.png
626_paha_silmä.png
627_nso_ost.png
628_smiling_hodtog_with_3_hearts.png
629_canada_irl.png
630_vtuber_gec.png
631_amonggecdrip.png
632_endergecko.png
633_lit_fuse.png
634_rob.png
635_copperore.png
636_amethyst.png
637_menacing.png
638_tester.png
639_tunnel.png
640_the_eyes.png
641_cursed_with_knowledge.png
642_opposites.png
643_smile.png
644_Spöhr.png
645_sadspoodergecko.png
646_amalgam.png
647_jpg.png
648_gross.png
649_amalgam.jpg.png
650_GeckoOfNotCanada.png
651_GeckoOfNotCanada_noBG.png
652_jpg2.png
653_loading.png
654_geckophone.png
655_normal_gecko.png
656_normal_of_normality.png
657_perfectly_normal_beans.png
658_Perfectly_Canadian_Canada.png
659_tower_of_hat_geckos.png
660_pythagorean_triple.png
661_rainFruitGeckoThink-0.png
661_rainFruitGeckoThink-1.png
661_rainFruitGeckoThink-2.png
661_rainFruitGeckoThink-3.png
661_rainFruitGeckoThink-4.png
661_rainFruitGeckoThink-5.png
661_rainFruitGeckoThink-6.png
661_rainFruitGeckoThink-7.png
661_rainFruitGeckoThink.gif
662_trickery.png
663_painting.png
664_portal.png
665_black_hole.png
666_fryingpanladygecko.png
667_el_geco.png
668_los_gecos.png
669_gecko_jumper.png
670_in_the_radiator.png
671_thinkgeckothink.png
672_runmo.png
673_geckolemonthink.png
674_surviving.png
675_wavelength.png
676_silhouette.png
677_slightly_altered_sunset.png
678_very_altered_sunset.png
679_normal_amalgam.png
680_zerotwo.png
681_flying.png
682_missile.png
683_rotozoa.png
684_cyclone.png
685_ghillie_suit.png
686_okuu.png
687_miku.png
688_combustible_gecko.png
689_destroyer.png
690_promare.png
691_gecko_card.png
692_crying_obsidian.png
693_atomic_gecko.png
694_dissolved.png
695_anatomy.png
696_cat.png
697_10th_angel.png
698_chapter_2_ralsei.png
699_peach.png
700_extra_celebration.png
701_gecrod.png
702_omori.png
703_ckokc.png
704_suspicious_ckokc.png
705_dripspicious_ckokc.png
706_GeeG.png
707_despicable_ckokc.png
708_feet.png
709_unus.png
710_annus.png
711_ominosquare.png
712_heiscomingforyou.png
713_mazeofhell.png
714_proud_loud_guy.png
715_jiggle_your_badiggle.png
716_this_suave_guy.png
717_third_impact.png
718_lttm.png
719_guessthenameornumberofthisgecko.png
720_glowing_matter-0.png
720_glowing_matter-1.png
720_glowing_matter-2.png
720_glowing_matter-3.png
720_glowing_matter-4.png
720_glowing_matter-5.png
720_glowing_matter-6.png
720_glowing_matter-7.png
720_glowing_matter-8.png
720_glowing_matter-9.png
720_glowing_matter-10.png
720_glowing_matter-11.png
720_glowing_matter-12.png
720_glowing_matter-13.png
720_glowing_matter-14.png
720_glowing_matter-15.png
720_glowing_matter-16.png
720_glowing_matter-17.png
720_glowing_matter-18.png
720_glowing_matter-19.png
720_glowing_matter-20.png
720_glowing_matter-21.png
720_glowing_matter-22.png
720_glowing_matter-23.png
720_glowing_matter-24.png
720_glowing_matter-25.png
720_glowing_matter-26.png
720_glowing_matter-27.png
720_glowing_matter-28.png
720_glowing_matter-29.png
720_glowing_matter-30.png
720_glowing_matter-31.png
720_glowing_matter-32.png
720_glowing_matter-33.png
720_glowing_matter-34.png
720_glowing_matter-35.png
720_glowing_matter-36.png
720_glowing_matter-37.png
720_glowing_matter-38.png
720_glowing_matter-39.png
720_glowing_matter-40.png
720_glowing_matter-41.png
720_glowing_matter-42.png
720_glowing_matter-43.png
720_glowing_matter-44.png
720_glowing_matter-45.png
720_glowing_matter-46.png
720_glowing_matter-47.png
720_glowing_matter-48.png
720_glowing_matter-49.png
720_glowing_matter-50.png
720_glowing_matter-51.png
720_glowing_matter-52.png
720_glowing_matter-53.png
720_glowing_matter-54.png
720_glowing_matter-55.png
720_glowing_matter-56.png
720_glowing_matter-57.png
720_glowing_matter-58.png
720_glowing_matter-59.png
720_glowing_matter-60.png
720_glowing_matter-61.png
720_glowing_matter-62.png
720_glowing_matter-63.png
720_glowing_matter-64.png
720_glowing_matter-65.png
720_glowing_matter-66.png
720_glowing_matter-67.png
720_glowing_matter-68.png
720_glowing_matter-69.png
720_glowing_matter-70.png
720_glowing_matter-71.png
720_glowing_matter.gif
721_hecatia.png
722_paradoximity.png
723_defenestrate.png
724_ditto.png
725_dracovish.png
726_bumpy.png
727_liminal.png
728_shine.png
729_ultrarevenger.png
730_nhoj.png
731_thedecaabnormality.png
732_second_flash-0.png
732_second_flash-1.png
732_second_flash-2.png
732_second_flash-3.png
732_second_flash-4.png
732_second_flash-5.png
732_second_flash-6.png
732_second_flash-7.png
732_second_flash-8.png
732_second_flash-9.png
732_second_flash-10.png
732_second_flash-11.png
732_second_flash-12.png
732_second_flash-13.png
732_second_flash-14.png
732_second_flash-15.png
732_second_flash-16.png
732_second_flash-17.png
732_second_flash-18.png
732_second_flash-19.png
732_second_flash-20.png
732_second_flash-21.png
732_second_flash-22.png
732_second_flash-23.png
732_second_flash-24.png
732_second_flash-25.png
732_second_flash-26.png
732_second_flash-27.png
732_second_flash-28.png
732_second_flash-29.png
732_second_flash-30.png
732_second_flash-31.png
732_second_flash-32.png
732_second_flash-33.png
732_second_flash-34.png
732_second_flash-35.png
732_second_flash-36.png
732_second_flash-37.png
732_second_flash-38.png
732_second_flash-39.png
732_second_flash-40.png
732_second_flash-41.png
732_second_flash-42.png
732_second_flash-43.png
732_second_flash-44.png
732_second_flash-45.png
732_second_flash.gif
733_finaler_finality-0.png
733_finaler_finality-1.png
733_finaler_finality-2.png
733_finaler_finality-3.png
733_finaler_finality-4.png
733_finaler_finality-5.png
733_finaler_finality-6.png
733_finaler_finality-7.png
733_finaler_finality-8.png
733_finaler_finality-9.png
733_finaler_finality-10.png
733_finaler_finality-11.png
733_finaler_finality-12.png
733_finaler_finality-13.png
733_finaler_finality-14.png
733_finaler_finality-15.png
733_finaler_finality-16.png
733_finaler_finality-17.png
733_finaler_finality-18.png
733_finaler_finality-19.png
733_finaler_finality-20.png
733_finaler_finality-21.png
733_finaler_finality-22.png
733_finaler_finality-23.png
733_finaler_finality-24.png
733_finaler_finality-25.png
733_finaler_finality-26.png
733_finaler_finality-27.png
733_finaler_finality-28.png
733_finaler_finality-29.png
733_finaler_finality-30.png
733_finaler_finality-31.png
733_finaler_finality-32.png
733_finaler_finality-33.png
733_finaler_finality-34.png
733_finaler_finality-35.png
733_finaler_finality-36.png
733_finaler_finality-37.png
733_finaler_finality-38.png
733_finaler_finality-39.png
733_finaler_finality-40.png
733_finaler_finality-41.png
733_finaler_finality-42.png
733_finaler_finality-43.png
733_finaler_finality-44.png
733_finaler_finality-45.png
733_finaler_finality-46.png
733_finaler_finality-47.png
733_finaler_finality-48.png
733_finaler_finality-49.png
733_finaler_finality-50.png
733_finaler_finality-51.png
733_finaler_finality-52.png
733_finaler_finality-53.png
733_finaler_finality-54.png
733_finaler_finality-55.png
733_finaler_finality-56.png
733_finaler_finality-57.png
733_finaler_finality-58.png
733_finaler_finality-59.png
733_finaler_finality-60.png
733_finaler_finality-61.png
733_finaler_finality-62.png
733_finaler_finality-63.png
733_finaler_finality-64.png
733_finaler_finality-65.png
733_finaler_finality-66.png
733_finaler_finality-67.png
733_finaler_finality-68.png
733_finaler_finality-69.png
733_finaler_finality-70.png
733_finaler_finality-71.png
733_finaler_finality-72.png
733_finaler_finality-73.png
733_finaler_finality-74.png
733_finaler_finality-75.png
733_finaler_finality-76.png
733_finaler_finality-77.png
733_finaler_finality-78.png
733_finaler_finality-79.png
733_finaler_finality-80.png
733_finaler_finality-81.png
733_finaler_finality-82.png
733_finaler_finality-83.png
733_finaler_finality-84.png
733_finaler_finality-85.png
733_finaler_finality-86.png
733_finaler_finality-87.png
733_finaler_finality-88.png
733_finaler_finality-89.png
733_finaler_finality-90.png
733_finaler_finality-91.png
733_finaler_finality-92.png
733_finaler_finality-93.png
733_finaler_finality-94.png
733_finaler_finality-95.png
733_finaler_finality-96.png
733_finaler_finality-97.png
733_finaler_finality-98.png
733_finaler_finality-99.png
733_finaler_finality-100.png
733_finaler_finality-101.png
733_finaler_finality-102.png
733_finaler_finality-103.png
733_finaler_finality-104.png
733_finaler_finality-105.png
733_finaler_finality-106.png
733_finaler_finality-107.png
733_finaler_finality-108.png
733_finaler_finality-109.png
733_finaler_finality-110.png
733_finaler_finality-111.png
733_finaler_finality-112.png
733_finaler_finality-113.png
733_finaler_finality-114.png
733_finaler_finality-115.png
733_finaler_finality-116.png
733_finaler_finality-117.png
733_finaler_finality-118.png
733_finaler_finality-119.png
733_finaler_finality-120.png
733_finaler_finality-121.png
733_finaler_finality-122.png
733_finaler_finality-123.png
733_finaler_finality-124.png
733_finaler_finality-125.png
733_finaler_finality-126.png
733_finaler_finality-127.png
733_finaler_finality-128.png
733_finaler_finality-129.png
733_finaler_finality-130.png
733_finaler_finality-131.png
733_finaler_finality-132.png
733_finaler_finality-133.png
733_finaler_finality-134.png
733_finaler_finality-135.png
733_finaler_finality-136.png
733_finaler_finality-137.png
733_finaler_finality-138.png
733_finaler_finality-139.png
733_finaler_finality-140.png
733_finaler_finality-141.png
733_finaler_finality-142.png
733_finaler_finality-143.png
733_finaler_finality-144.png
733_finaler_finality-145.png
733_finaler_finality-146.png
733_finaler_finality-147.png
733_finaler_finality-148.png
733_finaler_finality-149.png
733_finaler_finality-150.png
733_finaler_finality-151.png
733_finaler_finality-152.png
733_finaler_finality-153.png
733_finaler_finality-154.png
733_finaler_finality-155.png
733_finaler_finality-156.png
733_finaler_finality-157.png
733_finaler_finality-158.png
733_finaler_finality-159.png
733_finaler_finality-160.png
733_finaler_finality-161.png
733_finaler_finality-162.png
733_finaler_finality-163.png
733_finaler_finality-164.png
733_finaler_finality-165.png
733_finaler_finality-166.png
733_finaler_finality-167.png
733_finaler_finality-168.png
733_finaler_finality-169.png
733_finaler_finality-170.png
733_finaler_finality-171.png
733_finaler_finality-172.png
733_finaler_finality-173.png
733_finaler_finality-174.png
733_finaler_finality-175.png
733_finaler_finality-176.png
733_finaler_finality-177.png
733_finaler_finality-178.png
733_finaler_finality-179.png
733_finaler_finality-180.png
733_finaler_finality-181.png
733_finaler_finality-182.png
733_finaler_finality-183.png
733_finaler_finality-184.png
733_finaler_finality-185.png
733_finaler_finality-186.png
733_finaler_finality-187.png
733_finaler_finality-188.png
733_finaler_finality-189.png
733_finaler_finality-190.png
733_finaler_finality-191.png
733_finaler_finality-192.png
733_finaler_finality-193.png
733_finaler_finality-194.png
733_finaler_finality-195.png
733_finaler_finality-196.png
733_finaler_finality-197.png
733_finaler_finality-198.png
733_finaler_finality-199.png
733_finaler_finality-200.png
733_finaler_finality-201.png
733_finaler_finality-202.png
733_finaler_finality-203.png
733_finaler_finality-204.png
733_finaler_finality-205.png
733_finaler_finality-206.png
733_finaler_finality-207.png
733_finaler_finality-208.png
733_finaler_finality-209.png
733_finaler_finality-210.png
733_finaler_finality-211.png
733_finaler_finality-212.png
733_finaler_finality-213.png
733_finaler_finality-214.png
733_finaler_finality-215.png
733_finaler_finality-216.png
733_finaler_finality-217.png
733_finaler_finality-218.png
733_finaler_finality-219.png
733_finaler_finality-220.png
733_finaler_finality-221.png
733_finaler_finality-222.png
733_finaler_finality-223.png
733_finaler_finality-224.png
733_finaler_finality-225.png
733_finaler_finality-226.png
733_finaler_finality-227.png
733_finaler_finality-228.png
733_finaler_finality-229.png
733_finaler_finality-230.png
733_finaler_finality-231.png
733_finaler_finality-232.png
733_finaler_finality-233.png
733_finaler_finality-234.png
733_finaler_finality-235.png
733_finaler_finality-236.png
733_finaler_finality-237.png
733_finaler_finality-238.png
733_finaler_finality-239.png
733_finaler_finality-240.png
733_finaler_finality-241.png
733_finaler_finality-242.png
733_finaler_finality-243.png
733_finaler_finality-244.png
733_finaler_finality-245.png
733_finaler_finality-246.png
733_finaler_finality-247.png
733_finaler_finality-248.png
733_finaler_finality-249.png
733_finaler_finality-250.png
733_finaler_finality-251.png
733_finaler_finality-252.png
733_finaler_finality-253.png
733_finaler_finality-254.png
733_finaler_finality-255.png
733_finaler_finality-256.png
733_finaler_finality-257.png
733_finaler_finality-258.png
733_finaler_finality-259.png
733_finaler_finality-260.png
733_finaler_finality-261.png
733_finaler_finality-262.png
733_finaler_finality-263.png
733_finaler_finality-264.png
733_finaler_finality-265.png
733_finaler_finality-266.png
733_finaler_finality-267.png
733_finaler_finality-268.png
733_finaler_finality-269.png
733_finaler_finality-270.png
733_finaler_finality-271.png
733_finaler_finality-272.png
733_finaler_finality-273.png
733_finaler_finality-274.png
733_finaler_finality-275.png
733_finaler_finality-276.png
733_finaler_finality-277.png
733_finaler_finality-278.png
733_finaler_finality-279.png
733_finaler_finality-280.png
733_finaler_finality-281.png
733_finaler_finality-282.png
733_finaler_finality-283.png
733_finaler_finality-284.png
733_finaler_finality-285.png
733_finaler_finality-286.png
733_finaler_finality-287.png
733_finaler_finality-288.png
733_finaler_finality-289.png
733_finaler_finality-290.png
733_finaler_finality-291.png
733_finaler_finality-292.png
733_finaler_finality-293.png
733_finaler_finality-294.png
733_finaler_finality-295.png
733_finaler_finality-296.png
733_finaler_finality-297.png
733_finaler_finality-298.png
733_finaler_finality-299.png
733_finaler_finality-300.png
733_finaler_finality-301.png
733_finaler_finality-302.png
733_finaler_finality-303.png
733_finaler_finality-304.png
733_finaler_finality-305.png
733_finaler_finality-306.png
733_finaler_finality-307.png
733_finaler_finality-308.png
733_finaler_finality-309.png
733_finaler_finality-310.png
733_finaler_finality-311.png
733_finaler_finality-312.png
733_finaler_finality-313.png
733_finaler_finality-314.png
733_finaler_finality-315.png
733_finaler_finality-316.png
733_finaler_finality-317.png
733_finaler_finality-318.png
733_finaler_finality-319.png
733_finaler_finality-320.png
733_finaler_finality-321.png
733_finaler_finality-322.png
733_finaler_finality-323.png
733_finaler_finality-324.png
733_finaler_finality-325.png
733_finaler_finality-326.png
733_finaler_finality-327.png
733_finaler_finality-328.png
733_finaler_finality-329.png
733_finaler_finality-330.png
733_finaler_finality-331.png
733_finaler_finality-332.png
733_finaler_finality-333.png
733_finaler_finality-334.png
733_finaler_finality-335.png
733_finaler_finality-336.png
733_finaler_finality-337.png
733_finaler_finality-338.png
733_finaler_finality-339.png
733_finaler_finality-340.png
733_finaler_finality-341.png
733_finaler_finality-342.png
733_finaler_finality-343.png
733_finaler_finality-344.png
733_finaler_finality-345.png
733_finaler_finality-346.png
733_finaler_finality-347.png
733_finaler_finality-348.png
733_finaler_finality-349.png
733_finaler_finality-350.png
733_finaler_finality-351.png
733_finaler_finality-352.png
733_finaler_finality-353.png
733_finaler_finality-354.png
733_finaler_finality-355.png
733_finaler_finality-356.png
733_finaler_finality-357.png
733_finaler_finality-358.png
733_finaler_finality-359.png
733_finaler_finality-360.png
733_finaler_finality-361.png
733_finaler_finality-362.png
733_finaler_finality-363.png
733_finaler_finality-364.png
733_finaler_finality.gif
734_mammatus.png
735_crystal.png
736_unstablecrystal.png
737_camouflage.png
738_trapped.png
739_out.png
740_pyramid_discovery.png
741_render.png
742_system.png
743_cog.png
744_rust.png
745_diamond.png
746_red_diamond.png
747_j.png
748_Godkiller.png
749_Limatoukka.png
750_Limatoukka_destroyer.png
751_Distant.png
752_gecko_at_battery.png
753_geckos_stargazing.png
754_gecko_at_festival.png
755_gecko_at_lamp.png
756_gecko_on_mountain.png
757_odd_shader.png
758_optimized_faceless.png
759_minä.png
760_stendari.png
761_ukko.png
762_suur-ukko.png
763_eldari.png
764_pakasukko.png
765_haavoittajamestari.png
766_kohdennusmestari.png
767_maadoittajamestari.png
768_muodonmuutosmestari.png
769_palauttajamestari.png
770_sätkymestari.png
771_sokaisunmestari.png
772_siirtäjämestari.png
773_turvattomuusmestari.png
774_vaihdosmestari.png
775_turvonnu_velho.png
776_new_canada.png
777_slotmachine.png
778_wav.png
779_iron_ingot_gecko.png
780_gold_ingot_gecko.png
781_copper_ingot_gecko.png
782_netherite_ingot_gecko.png
783_vegetation.png
784_farewell.jpg
784_farewell.png
785_o.png
786_r.png
787_z.png
788_GeckoPokemon.jpg
788_GeckoPokemon.png
789_ProbablyNotCanada.png
790_dumpy-0.png
790_dumpy-1.png
790_dumpy-2.png
790_dumpy-3.png
790_dumpy-4.png
790_dumpy-5.png
790_dumpy.gif
791_sussus_amongus-0.png
791_sussus_amongus-1.png
791_sussus_amongus-2.png
791_sussus_amongus-3.png
791_sussus_amongus-4.png
791_sussus_amongus-5.png
791_sussus_amongus.gif
792_chlorine.png
793_fluorine.png
794_bromine.png
795_iodine.png
796_the_funny.png
797_notification.png
798_relatively_altered.jpeg
798_relatively_altered.png
799_211.png
800_ultra_extra_celebration.png
801_refracted_oil.png
802_astatine.png
803_tennessine.png
804_kyle.png
805_the_square.png
806_axolotl.png
807_punch.png
808_thatsanerror_in_dark_theme.png
809_witch.png
810_olm.png
811_om.png
812_subconscious.png
813_home_depot.png
814_mima.png
815_yama.png
816_geckomarketteleport.png
817_critikal.png
818_canada_gecko_gecko.png
819_sunglas.png
820_water.png
821_lava.png
822_donaustin.png
823_the_giant_enemy_spider.png
824_garf2.png
825_sober.png
826_reg.png
827_reg_hat.png
828_riko.png
829_nanachi.png
830_prushka.png
831_ozen.png
832_bondrewd.png
833_ozen_bruh.png
834_canada_rhombus.png
835_kill.png
836_crested_inverted_accurate.png
837_4113.png
838_petr.png
839__].png
840_°U°.png
841_°U°_but_scary.png
842_colorful.png
843_ragbad.png
844_bad_apple.png`;
  let tileLoader;

  {
    let preloaded = new Image();
    preloaded.src = "./assets/textures/map.png";
    tileLoader = new TilesetLoader(64, preloaded);
    preloaded.onload = tileLoader.subAssetTracker.getHandle();
  }

  function isNotEmpty(str) {
    return str.replace(/^\s+|\s+$/g, '').length !== 0;
  }

  function splitOverWhitespace(str) {
    return str.split(/\s+/).filter(isNotEmpty);
  }

  for (const a of splitOverWhitespace(geckoNames)) {
    tileLoader.addTile(a);
  }

  const tileset$1 = window.tileset = tileLoader.tileset;
  const texturePacker = new TexturePacker();

  const textureNames = function () {
    return `hit1
hit2
jump1
jump2
jump3
kick1
kick2
pick1
pick2
player_sprite
portrait
static1
walk1
walk2
walk3
walk4`;
  }();

  for (const a of splitOverWhitespace(textureNames).slice(0, 350)) {
    texturePacker.addTexture(a);
  }

  const texturePack = window.texturePack = texturePacker.texturePack;

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  } // A layer... of tiles. Yep.

  class TileLayer {
    constructor(game) {
      this.game = game;
      this.tileData = []; // 2d array of tile indices

      this.worldTexture = null;
      this.tileset = tileset$1;
      this.needsWorldTextureUpdate = true;
      this.needsUpdate = true;
      this.id = generateUUID();
      this.clear();
    }

    tileInBounds(x, y) {
      return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    tileAt(x, y) {
      return this.tileData[y][x];
    }

    get width() {
      return this.game.world.width;
    }

    get height() {
      return this.game.world.height;
    }

    setTileAt(x, y, v) {
      if (this.tileInBounds(x, y)) {
        this.tileData[y][x] = this.tileset.toCode(v);
        this.needsUpdate = true;
      }
    }

    clear() {
      // Fill everything with air.
      this.tileData = new Array(this.height).fill(0).map(() => new Array(this.width).fill(0));
    }

    renderWorldToTexture() {
      // the R values are the x coord of the tile, the G values are the y coord of the tile in the tileset image. B and A are unused for now
      // Should be rather fast.
      const {
        width,
        height,
        tileset,
        tileData
      } = this;
      const outputArr = new Uint8ClampedArray(width * height * 4);
      const {
        tileSize,
        widthInTiles,
        heightInTiles
      } = tileset; // Coordinates in pixels of a tile are  tileSize * (indx % widthInTiles, floor(indx / widthInTiles))
      // as the tl corner, then (0/+tileSize, 0/+tileSize) for the others. But that doesn't matter.
      // This ImageData will be inverted, since the y axis on the tiles goes up, and will be uninverted by GL.

      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
          const tile = tileData[i][j];
          let k = 4 * (i * width + j);
          outputArr[k] = tile % widthInTiles;
          outputArr[k + 1] = Math.floor(tile / widthInTiles);
          let neighbors = 0; // Set b to the number of neighbors within 2 blocks

          /*egg: for (let m = -1; m < 2; ++m) {
            for (let n = -1; n < 2; ++n) {
              let x = i + m
              let y = j + n
               if (this.tileInBounds(x, y))
                neighbors += !!tileData[x][y]
              else {
                neighbors = 0
                break egg
              }
            }
          }*/

          outputArr[k + 2] = neighbors;
          outputArr[k + 3] = 255; // opacity
        }
      }

      this.worldTexture = new ImageData(outputArr, width, height);
    }

    markUpdate() {
      this.needsUpdate = true;
    }

    render(renderer) {
      var _glManager$getProgram;

      if (this.needsUpdate) this.renderWorldToTexture();
      if (!this.worldTexture || !this.tileset) return; // fail silently

      const {
        gl,
        glManager,
        canvasWidth,
        canvasHeight,
        width,
        height
      } = renderer;
      const tilesetTexture = this.tileset.getTextureObject(renderer);
      let worldGLTexture = glManager.getTexture(this.id);

      if (this.needsUpdate || renderer.isFirstPass) {
        gl.bindTexture(gl.TEXTURE_2D, worldGLTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.worldTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // use nearest

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      } // Load in a rectangle geometry


      const rectangle = new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]);
      const buf = glManager.getBuffer(this.id);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, rectangle, gl.STATIC_DRAW);
      gl.activeTexture(gl.TEXTURE0); // bind tileset to texture 0

      gl.bindTexture(gl.TEXTURE_2D, tilesetTexture);
      gl.activeTexture(gl.TEXTURE1); // bind world texture to 1

      gl.bindTexture(gl.TEXTURE_2D, worldGLTexture);
      const program = (_glManager$getProgram = glManager.getProgram("TileLayer")) !== null && _glManager$getProgram !== void 0 ? _glManager$getProgram : glManager.createProgram("TileLayer", // In the vertex shader, we set the vec2 vWorldCoord to the location in the world texture where we're drawing.
      // The location in the world texture is the same as the tileData, so this is done via a transformation of
      // coordinates, namely the transformation returned by game.getClipToWorldTransform()
      `precision mediump float;
       attribute vec2 vPosition;
       
       uniform vec2 transformSlopes;
       uniform vec2 transformConstants;
       
       varying vec2 vWorldCoord;

       void main() {
         gl_Position = vec4(vPosition, 0, 1);
         vWorldCoord = transformSlopes * vPosition + transformConstants;
       }`, `precision mediump float;
       varying vec2 vWorldCoord; // Where in the world we are, perhaps between (0,0) and (32,18)
       
       uniform sampler2D worldTexture;
       uniform sampler2D tileset;
       uniform vec2 worldSize; // Know where to look in the world texture
       uniform float tileSize; // in pixels
       uniform vec2 tilesetSize; // width and height of the tileset in pixels
       
       vec2 roundVec2(vec2 v) {
         return vec2(floor(v.x + 0.5), floor(v.y + 0.5));
       }
       
       void main() {
         // This is the tile we are in
         vec2 tileLookup = floor(vWorldCoord);
         
         vec4 tileData = texture2D(worldTexture, (tileLookup + vec2(0.5, 0.5)) / worldSize) * 255.;
         
         // the r and g values have the position in the tileset array where it should be. We center on the pixel to
         // avoid any rounding errors
         vec2 tilePos = tileData.xy;
         
         float brightnessInfo = tileData.b;
         
         
         
         // Should be two integers in pixel space
         vec2 roundedTilePos = roundVec2(tilePos * tileSize);
         
         // We now need the location of the texel WITHIN the tile. We use the difference between the vWorldCoord and
         // the vec used for the tile lookup, to avoid rounding errors. because we're using gl nearest, we again try
         // to round to the nearest pixel and sample it at its center. We also have to FLIP the y axis value, because the tiles are
         // upside down relative to this.
         
         vec2 shiftAmount = floor((vWorldCoord - tileLookup) * tileSize) + vec2(0.5, 0.5);
         shiftAmount.y = tileSize - shiftAmount.y;
         
         gl_FragColor = texture2D(tileset, (roundedTilePos + shiftAmount) / tilesetSize);
         gl_FragColor.rgb *= gl_FragColor.a * (25. - tileData.b) / 25. ;
       }`, ["vPosition"], ["transformSlopes", "transformConstants", "worldTexture", "tileset", "worldSize", "tileSize", "tilesetSize"]);
      const transformation = renderer.game.getClipToWorldTransform();
      gl.useProgram(program.program);
      const vPosition = program.attribs.vPosition;
      gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition);
      gl.uniform1i(program.uniforms.tileset, 0);
      gl.uniform1i(program.uniforms.worldTexture, 1);
      gl.uniform2f(program.uniforms.worldSize, this.width, this.height);
      gl.uniform2f(program.uniforms.transformSlopes, transformation.x_m, transformation.y_m);
      gl.uniform2f(program.uniforms.transformConstants, transformation.x_b, transformation.y_b);
      gl.uniform1f(program.uniforms.tileSize, this.tileset.tileSize);
      gl.uniform2f(program.uniforms.tilesetSize, this.tileset.width, this.tileset.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.needsUpdate = false;
    }

  } // Layer

  /*const tileLayerProgram = glManager.getProgram("TileLayer") ?? glManager.createProgram("TileLayer",
         `attribute vec2 vPosition;

          varying highp vec2 vTextureCoord;

          void main() {
              gl_Position = vec4(vPosition, 0, 1);
              vTextureCoord = vec2(0.5, -0.5) * vPosition + vec2(0.5, 0.5);
          }`, `
          precision mediump float;
          varying highp vec2 vTextureCoord;
          uniform sampler2D uSampler;

          void main() {
            gl_FragColor = texture2D(uSampler, vTextureCoord);
          }`, ["vPosition"], ["uSampler", "test1", "test2"])*/

  class BoundingBox {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      // location of the box's center
      this.x1 = x;
      this.y1 = y;
      this.width = width;
      this.height = height;
    }

    setWidth(w) {
      this.width = w;
      return this;
    }

    setHeight(h) {
      this.height = h;
      return this;
    }

    setCenter(x, y) {
      // preserving width and height
      this.x1 = x - this.width / 2;
      this.y1 = y - this.height / 2;
      return this;
    }

    get cx() {
      return this.x1 + this.width / 2;
    }

    set cx(v) {
      this.x1 = v - this.width / 2;
    }

    get cy() {
      return this.y1 + this.height / 2;
    }

    set cy(v) {
      this.y1 = v - this.height / 2;
    }

    get x2() {
      return this.x1 + this.width;
    }

    get y2() {
      return this.y1 + this.height;
    }

    getY2() {
      return this.y2;
    }

    getX2() {
      return this.x2;
    }

    getXBounds() {
      return [this.x1, this.x1 + width];
    }

    getYBounds() {
      return [this.y1, this.y1 + height];
    }

    setBottomMidpoint(x, y) {
      this.cx = x;
      this.y1 = y;
      return this;
    }

    shift(x, y) {
      this.x1 += x;
      this.y1 += y;
      return this;
    }

    copyFrom(bbox) {
      this.x1 = bbox.x1;
      this.y1 = bbox.y1;
      this.width = bbox.width;
      this.height = bbox.height;
      return this;
    }

    getLargestBoxInsideWithAspectRatio(aspectRatio) {
      let newWidth = this.width,
          newHeight = this.height;

      if (newWidth / newHeight > aspectRatio) {
        // height is constraining
        newWidth = newHeight * aspectRatio;
      } else {
        // width is constraining
        newHeight = newWidth / aspectRatio;
      }

      return new BoundingBox(0, 0, newWidth, newHeight).setCenter(this.cx, this.cy);
    }

    getSmallestBoxOutsideWithAspectRatio(aspectRatio) {
      let newWidth = this.width,
          newHeight = this.height;

      if (newWidth / newHeight > aspectRatio) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }

      return new BoundingBox(0, 0, newWidth, newHeight).setCenter(this.cx, this.cy);
    }

    resizeToAspectRatio(aspectRatio) {
      this.copyFrom(this.getLargestBoxInsideWithAspectRatio(aspectRatio));
    }

    static getReducedTransform(box1, box2, flipX = false, flipY = false) {
      let x_m = 1 / box1.width;
      let x_b = -box1.x1 / box1.width;

      if (flipX) {
        x_m *= -1;
        x_b = 1 - x_b;
      }

      x_m *= box2.width;
      x_b *= box2.width;
      x_b += box2.x1;
      let y_m = 1 / box1.height;
      let y_b = -box1.y1 / box1.height;

      if (flipY) {
        y_m *= -1;
        y_b = 1 - y_b;
      }

      y_m *= box2.height;
      y_b *= box2.height;
      y_b += box2.y1;
      return {
        x_m,
        x_b,
        y_m,
        y_b
      };
    }

    shrink(d) {
      return new BoundingBox(this.x1 + d, this.y1 + d, this.width - 2 * d, this.height - 2 * d);
    }

    intersectWith(bbox) {
      let tx1 = this.x1,
          tx2 = this.getX2(),
          ty1 = this.y1,
          ty2 = this.getY2();
      let bx1 = bbox.x1,
          bx2 = bbox.getX2(),
          by1 = bbox.y1,
          by2 = bbox.getY2();
      let x1 = Math.max(tx1, bx1),
          y1 = Math.max(ty1, by1);
      let x2 = Math.min(tx2, bx2),
          y2 = Math.min(ty2, by2);

      if (y1 <= y2 && x1 <= x2) {
        return new BoundingBox(x1, y1, x2 - x1, y2 - y1);
      }

      return null;
    }

    zoomOn(v, amt) {
      // Scale on v by amt
      let newCornerX = (this.x1 - v.x) * amt + v.x;
      let newCornerY = (this.y1 - v.y) * amt + v.y;
      this.x1 = newCornerX;
      this.y1 = newCornerY;
      this.width *= amt;
      this.height *= amt;
    }

    static fromPoints(x1, y1, x2, y2) {
      return new BoundingBox(x1, y1, x2 - x1, y2 - y1);
    }

    clone() {
      return new BoundingBox(this.x1, this.y1, this.width, this.height);
    }

    union(bbox) {
      return BoundingBox.fromPoints(Math.min(this.x1, bbox.x1), Math.min(this.y1, bbox.y1), Math.max(this.x2, bbox.x2), Math.max(this.y2, bbox.y2));
    }

  }

  class BackgroundImage {
    constructor(game, img) {
      this.game = game;
      this.img = img;
      this.id = generateUUID();
      this.needsUpdate = true;
    }

    render(renderer) {
      var _glManager$getProgram;

      const {
        gl,
        glManager,
        canvasWidth,
        canvasHeight,
        width,
        height
      } = renderer;
      const tileLayerProgram = (_glManager$getProgram = glManager.getProgram("BackgroundImage")) !== null && _glManager$getProgram !== void 0 ? _glManager$getProgram : glManager.createProgram("BackgroundImage", `attribute vec2 vPosition;
       
        varying highp vec2 vTextureCoord;

        void main() {
            gl_Position = vec4(vPosition, 0, 1);
            vTextureCoord = vec2(0.5, -0.5) * vPosition + vec2(0.5, 0.5);
        }`, `
        precision mediump float;
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        
        void main() {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
          gl_FragColor.rgb *= gl_FragColor.a;
        }`, ["vPosition"], ["uSampler"]);
      const buf = glManager.getBuffer(this.id); // Whole canvas

      const rectangle = new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, rectangle, gl.STATIC_DRAW);
      const vPosition = tileLayerProgram.attribs.vPosition;
      gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition);
      let texture = glManager.getTexture(this.id);

      if (this.needsUpdate || renderer.isFirstPass) {
        console.log("updated");
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        this.needsUpdate = false;
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.useProgram(tileLayerProgram.program);
      gl.uniform1i(tileLayerProgram.uniforms.uSampler, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

  }

  function create2DArray(width, height, value = 0) {
    // height first, then width
    const ret = [];

    for (let i = 0; i < height; ++i) {
      ret.push(new Array(width).fill(value));
    }

    return ret;
  } // Credit to https://stackoverflow.com/a/47593316/13458117

  function mulberry32(a) {
    return function () {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  window.generateCaveWorld = generateCaveWorld;
  function generateCaveWorld(width = 128, height = 128, seed = 0, generations = 3, doOres = true) {
    const random = mulberry32(seed);
    const caveBlock = tileset$1.toCode("stone");
    const airBlock = tileset$1.toCode("air"); // We'll use automata to do this

    const proportion = 0.4,
          starvationLimit = 10,
          overpopulationLimit = 25,
          birthNumber = 11; // Generate a random array

    let arr = create2DArray(width, height);
    arr.forEach(row => {
      for (let i = 0; i < row.length; ++i) row[i] = random() < proportion ? caveBlock : airBlock;
    });

    for (let g = 0; g < generations; ++g) {
      let newArr = create2DArray(width, height, airBlock);

      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
          // Count alive neighbors
          let neighborCount = 0;

          for (let x = -2; x <= 2; ++x) {
            let xCoord = j + x;
            if (xCoord < 0 || xCoord >= width) neighborCount++;

            for (let y = -2; y <= 2; ++y) {
              if (x === 0 && y === 0) continue;
              let yCoord = i + y;
              if (yCoord < 0 || yCoord >= height || arr[yCoord][xCoord] === caveBlock) neighborCount++;
            }
          }

          let val = arr[i][j];

          if (val === caveBlock) {
            // already cell, kill if too many or too few
            if (neighborCount >= starvationLimit && neighborCount <= overpopulationLimit) {
              newArr[i][j] = caveBlock;
            }
          } else {
            if (neighborCount > birthNumber) {
              newArr[i][j] = caveBlock;
            }
          }
        }
      }

      arr = newArr;
    }

    let ores = [["diamond_ore", 3, 0.002], ["emerald_ore", 1, 0.006], ["iron_ore", 4, 0.02], ["coal_ore", 12, 0.02], ["redstone_ore", 6, 0.006]];

    if (doOres) {
      for (const ore of ores) {
        for (let i = 0; i < height; ++i) {
          for (let j = 0; j < width; ++j) {
            if (arr[i][j] && Math.random() < ore[2]) {
              arr[i][j] = tileset$1.toCode(ore[0]);
            }
          }
        }
      }
    } // Make the perimeter cave block


    for (let i = 0; i < width; ++i) {
      arr[0][i] = caveBlock;
      arr[height - 1][i] = caveBlock;
    }

    for (let j = 0; j < height; ++j) {
      arr[j][0] = caveBlock;
      arr[j][width - 1] = caveBlock;
    }

    return arr;
  }

  class EntityGroup {
    constructor(game, entities) {
      this.id = generateUUID();
      this.game = game;
      this.entities = entities;
    }

    render(renderer) {
      const renderingInstructions = []; // Array of instructions:  { textureCoords : [ x1, y1, x2, y2 ], tileCoords: [ x1, y1, x2, y2 ] }

      for (const entity of this.entities) {
        // From each entity, ask for the texture coordinates and where it'd like to be drawn. Specifically we get
        // (coord of top left in tile space), (coord of bottom right in tile space), (coord of top left in texture),
        // (coord of bottom right in texture). An array of these can also be given, in which case they will all be
        // drawn.
        const instructions = entity.getRenderingInstructions();
        if (Array.isArray(instructions)) Array.prototype.push(renderingInstructions, instructions);else renderingInstructions.push(instructions);
      }

      this.renderSprites(renderer, renderingInstructions); // Then render whatever the entity desires

      for (const entity of this.entities) {
        entity.render(renderer);
      }
    }

    renderSprites(renderer, instructions) {
      var _glManager$getProgram;

      const {
        gl,
        glManager,
        game
      } = renderer;
      if (instructions.length === 0) return; // Tile space positions
      // For each rectangle we need six vertices, so twelve coordinates

      const positionArray = new Float32Array(instructions.length * 12); // Texture pixel space, what part of the texture should we be mapping to

      const textureCoordArray = new Float32Array(instructions.length * 12);

      for (let i = 0; i < instructions.length; ++i) {
        // construct rectangles
        const instruction = instructions[i];
        const indx = 12 * i;
        const {
          textureCoords,
          tileCoords
        } = instruction;
        positionArray[indx] = tileCoords[0];
        positionArray[indx + 1] = tileCoords[1];
        positionArray[indx + 2] = tileCoords[2];
        positionArray[indx + 3] = tileCoords[3];
        positionArray[indx + 4] = tileCoords[0];
        positionArray[indx + 5] = tileCoords[3];
        positionArray[indx + 6] = tileCoords[0];
        positionArray[indx + 7] = tileCoords[1];
        positionArray[indx + 8] = tileCoords[2];
        positionArray[indx + 9] = tileCoords[3];
        positionArray[indx + 10] = tileCoords[2];
        positionArray[indx + 11] = tileCoords[1];
        textureCoordArray[indx] = textureCoords[0];
        textureCoordArray[indx + 1] = textureCoords[1];
        textureCoordArray[indx + 2] = textureCoords[2];
        textureCoordArray[indx + 3] = textureCoords[3];
        textureCoordArray[indx + 4] = textureCoords[0];
        textureCoordArray[indx + 5] = textureCoords[3];
        textureCoordArray[indx + 6] = textureCoords[0];
        textureCoordArray[indx + 7] = textureCoords[1];
        textureCoordArray[indx + 8] = textureCoords[2];
        textureCoordArray[indx + 9] = textureCoords[3];
        textureCoordArray[indx + 10] = textureCoords[2];
        textureCoordArray[indx + 11] = textureCoords[1];
      } //console.log(positionArray, textureCoordArray)


      const glTexturePack = texturePack.getTextureObject(renderer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, glTexturePack);
      const program = (_glManager$getProgram = glManager.getProgram("EntityGroup")) !== null && _glManager$getProgram !== void 0 ? _glManager$getProgram : glManager.createProgram("EntityGroup", // In the vertex shader, we set the vec2 vWorldCoord to the location in the world texture where we're drawing.
      // The location in the world texture is the same as the tileData, so this is done via a transformation of
      // coordinates, namely the transformation returned by game.getClipToWorldTransform()
      `attribute vec2 vPosition;
       attribute vec2 vTextureCoord;
       
       varying highp vec2 vTextureCoordInterp;
       
       uniform vec2 tileToClipSlopes;
       uniform vec2 tileToClipConstants;
       
       uniform vec2 textureSize;

        void main() {
            gl_Position = vec4(tileToClipSlopes * vPosition + tileToClipConstants, 0, 1);
            vTextureCoordInterp = vTextureCoord / textureSize;
        }`, `precision mediump float;
        varying highp vec2 vTextureCoordInterp;
        uniform sampler2D texturePack;
        
        void main() {
          gl_FragColor = texture2D(texturePack, vTextureCoordInterp);
          gl_FragColor.rgb *= gl_FragColor.a;
        }
       `, ["vPosition", "vTextureCoord"], ["tileToClipSlopes", "tileToClipConstants", "textureSize", "texturePack"]);
      gl.useProgram(program.program);
      const vPosition = program.attribs.vPosition;
      const vTextureCoord = program.attribs.vTextureCoord;
      const posArrayBuffer = glManager.getBuffer(this.id + 'pos');
      const texCoordArrayBuffer = glManager.getBuffer(this.id + 'texCoord');
      gl.bindBuffer(gl.ARRAY_BUFFER, posArrayBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition);
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordArrayBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, textureCoordArray, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(vTextureCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vTextureCoord);
      const tileToClip = game.getWorldToClipTransform();
      gl.uniform2f(program.uniforms.tileToClipSlopes, tileToClip.x_m, tileToClip.y_m);
      gl.uniform2f(program.uniforms.tileToClipConstants, tileToClip.x_b, tileToClip.y_b);
      gl.uniform2f(program.uniforms.textureSize, texturePack.width, texturePack.height);
      gl.uniform1i(program.uniforms.texturePack, 0); // texture 0, glTexturePack

      gl.drawArrays(gl.TRIANGLES, 0, instructions.length * 6);
    }

  } // Generally the hitbox of an entity is centered over its position.

  const maxTicksBeforeLagBack = 5;
  function createTicker(tickCallback, tickLength = 1
  /*seconds*/
  ) {
    tickLength = tickLength * 1000; // ms

    let trueStartTime;
    let startTime;
    let tickIndex;
    let isRunning = false;
    let historyLen = 5;
    let tickTimeHistory = [];

    function doTick() {
      let tickStart = Date.now();
      tickIndex++;
      tickCallback();
      let tickEnd = Date.now();
      let tickTime = tickEnd - tickStart;
      tickTimeHistory.push(tickTime);

      if (tickTimeHistory.length > historyLen) {
        tickTimeHistory.shift();
      }
    }

    function avgTickTime() {
      // in ms
      return tickTimeHistory.reduce((a, b) => a + b) / tickTimeHistory.length;
    }

    function skipTicks() {
      //console.warn(`Can't keep up! Average tick took ${avgTickTime()} ms (should be ${tickLength} ms).`)
      startTime = Date.now();
      tickIndex = 1;
    }

    function runTicks() {
      if (!isRunning) return;
      let currentTime = Date.now();
      let expectedTime = startTime + tickLength * tickIndex;

      if (expectedTime > currentTime + tickLength) {
        // we're more than half a tick early; skip this tick without incrementing tickIndex
        setTimeout(runTicks, currentTime - expectedTime);
      } else if (expectedTime < currentTime - tickLength) {
        if (expectedTime < currentTime - 5 * tickLength) {
          skipTicks();
        } else {
          // else, call tick() multiple times to catch up
          for (let i = 0; i < maxTicksBeforeLagBack; ++i) {
            doTick();
            let delta = startTime + tickLength * tickIndex - Date.now(); // successfully caught up

            if (delta < tickLength) {
              break;
            } else if (delta > maxTicksBeforeLagBack * tickLength) {
              skipTicks();
            }
          }
        }
      } else {
        doTick();
      }

      setTimeout(runTicks, startTime + tickLength * tickIndex - Date.now());
    } // The general strategy is as follows. We trust that setTimeout is somewhat competent and ask to to return (tickLength - 2) ms
    // later. If we're faster than the linear 1/60ths of a second, we increase the setTimeout value, and if we're more than
    // a tick ahead, we skip an invocation of tick(). If we're slower than 1/60ths of a second, we decrease the setTimeout
    // value, and if we're quite behind (more than maxTicksBeforeLagBack) we define the new start time as current and
    // proceed calculating ticks.


    return {
      start: () => {
        isRunning = true;
        trueStartTime = startTime = Date.now();
        tickIndex = 0;
        setTimeout(runTicks, 0);
      },
      stop: () => {
        isRunning = false;
      },
      getTickCount: () => {
        return tickIndex;
      },
      getAvgTickTime: () => {
        return avgTickTime();
      }
    };
  } // The physics engine runs at a different speed than the renderer. One physics tick is 1/30th of a second.

  class PhysicsEngine {
    constructor(game) {
      this.game = game;
      this.gravityAcceleration = -0.07; // tiles per tick per tick
    }

    get entities() {
      return this.game.world.entities;
    }

    get physicalTiles() {
      return this.game.world.physicalTiles;
    }

    getPhysicalTileGeometriesInRange(bbox) {
      // bounding box of the entity's tick movement. We search through the tiles in this range, reporting their bounding
      // boxes
      const physicalTiles = this.physicalTiles;
    }

    tick() {
      // In this tick based system, we first compute the movement, which gives a new velocity, then we apply the forces
      // to that velocity. The velocity is in tiles / tick.
      const {
        entities,
        tickLength,
        physicalTiles
      } = this;

      for (const entity of entities) {
        if (!entity.velocity) return; // not a physics entity

        const {
          position,
          velocity
        } = entity;
        const effectiveVelocity = velocity.clone(); // modify velocity (gravity)

        effectiveVelocity.add(new Vec2(0, this.gravityAcceleration)); // compute hitbox

        const hitbox = entity.getHitbox(); // COMPUTE NEXT INTENDED POSITION

        const nextPosition = position.clone().add(effectiveVelocity); // compute next hitbox

        const nextHitbox = hitbox.clone().shift(effectiveVelocity.x, effectiveVelocity.y); // Together this forms a sort pf parallelepiped like this. We want to know whether this intersects any objects,
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

        const bbox = hitbox.union(nextHitbox);
        let xmin = Math.floor(bbox.x1),
            xmax = Math.ceil(bbox.x2) + 1;
        let ymin = Math.floor(bbox.y1),
            ymax = Math.ceil(bbox.y2) + 1;

        const velocityUnit = effectiveVelocity.unit();
        entity.onGround = false;

        exit: for (let x = Math.max(xmin, 0); x < Math.min(physicalTiles.width, xmax); ++x) {
          for (let y = Math.max(ymin, 0); y < Math.min(physicalTiles.height, ymax); ++y) {
            const tile = physicalTiles.tileData[y][x];

            if (tile) {
              // block to collide with, which is at (x, y) to (x+1, y+1)
              if (nextHitbox) {
                const intersection = nextHitbox.intersectWith(new BoundingBox(x, y, 1, 1));

                if (intersection) {
                  if (intersection.width < intersection.height) {
                    effectiveVelocity.x = 0;
                    nextPosition.x += -intersection.width * Math.sign(velocityUnit.x);
                  } else {
                    effectiveVelocity.y = 0;
                    nextPosition.y += -intersection.height * Math.sign(velocityUnit.y); // On the ground, so slow movements

                    effectiveVelocity.x *= 0.74;
                    entity.onGround = true;
                  }
                }
              }
            }
          }
        }

        position.set(nextPosition);
        velocity.set(effectiveVelocity);
      }
    }

  }

  /**
   * The concept here is to allow the execution of expensive functions both synchronously and asynchronously, without the
   * need for a web worker or other heavyweight techniques. There are benefits to both synchronous and asynchronous
   * execution; some functions are so oft-executed and take such a short time that there is no point to using setTimeout
   * and making it asynchronous. I fear that the proliferation of asynchronous APIs all over the Internet discourages
   * simple, effective code. Also, the current asynchronous APIs aren't the most versatile. For example, how could we
   * track the progress of a render, or cancel the render, via Promises alone?
   *
   * Web workers, while useful (I plan to eventually implement them), are difficult. They can't really do rendering work,
   * and if the function in question takes an absurdly long amount of time to execute, it cannot be terminated gracefully;
   * the entire worker needs to be terminated and then restarted.
   *
   * We use a generator-like object called a "bolus". Why? Because I like that word. Also, it makes it feel
   * like the evaluation of these expensive functions is like digestion. We consume a bolus and digest it asynchronously;
   * it's not like while we're digesting, we can't do anything else. We do get periodic interruptions—stomach cramps,
   * defecation—but it does not control our life. If digestion is taking too long, we can go to the doctor and get a
   * laxative. Using a Web Worker is like giving the bolus to a chemical digester (or another person), and then eating the
   * digested remains; not appetizing, and the process of transferring a disgusting bolus soup is not pleasant. If we find
   * out the bolus is poisonous (aka, we don't want to fully digest it), we can vomit up the bolus, but this is not
   * guaranteed. If this bolus is extremely poisonous, we may die; similarly, if a Grapheme bolus is poorly made, it may
   * still crash the webpage. (Okay, henceforth every "bolus" is a Grapheme bolus.)
   *
   * The bolus may accept any number of arguments. If it is detected to be a normal function (that is, one whose return
   * value does not have a "next" function), its result is given if it's synchronously evaluated, or given as a Promise if
   * asynchronously evaluated. If it is a generator, then during its execution it may periodically yield. If synchronously
   * evaluated, the wrapper will simply keep calling .next() (digestion) until it returns, and then return this value.
   * If asynchronously evaluated, the wrapper will keep calling .next() until some amount of time has elapsed (default is
   * 8 ms, since a frame is 1/60 s) since the function call, or the function returns; in the former case, a timeout will
   * be called to unblock, and in the latter case, the result of the function resolves the Promise.
   *
   * There are additional things that may be given to the wrapper functions for convenience. For example, both sync and
   * asyncEvaluate can be told to throw an error (and thus in the latter case, reject the Promise) if too much time has
   * elapsed. Note that this won't prevent an errant function which enters an infinite loop and NEVER yields from crashing
   * the browser, but in the case of syncEvaluate, it can prevent crashes. Furthermore, asyncEvaluate may be given an
   * additional "onProgress" callback function along with the bolus, which is called based on the estimated time for a
   * bolus to finish, and the Promise it returns is equipped with a special function .cancel() which may be called to
   * terminate the function (and call reject()) before it actually ends. This is useful for things like cancelling
   * expensive updates.
   */
  /**
   * Digest a bolus asynchronously.
   * @param bolus
   * @param onProgress
   * @param onFinished
   * @param pauseLen
   * @param timeout
   */

  function asyncDigest(bolus, onFinished, onProgress, pauseLen = 30, timeout = -1) {
    if (typeof (bolus === null || bolus === void 0 ? void 0 : bolus.next) !== 'function') return bolus;

    function process() {
      let groupStartTime = Date.now();

      while (true) {
        const next = bolus.next();

        if (next.done) {
          // return the result if done
          onFinished(next.value);
          onProgress === null || onProgress === void 0 ? void 0 : onProgress(1);
          return;
        }

        let time = Date.now();

        if (time - groupStartTime > pauseLen) {
          var _ref;

          setTimeout(process, 0);
          onProgress === null || onProgress === void 0 ? void 0 : onProgress((_ref = typeof next.value === "number" && next.value) !== null && _ref !== void 0 ? _ref : 0.5);
          return;
        }
      }
    }

    process();
  }

  const aspectRatio = 16 / 9;
  const maxGameWidth = 1920;
  const maxGameHeight = Math.round(maxGameWidth / aspectRatio);

  function getGameHTMLElement() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("game-wrapper");
    const canvas = document.createElement("canvas");
    wrapper.appendChild(canvas);
    return {
      domElement: wrapper,
      canvas
    };
  }

  const testBackground = window.testBackground = new Image();
  testBackground.src = "./assets/test_background.jpg";
  testBackground.onload = assetTracker.getHandle(); // The main class containing all the relevant data for gameplay, controls, etc.

  class Game {
    constructor() {
      const {
        domElement,
        canvas
      } = getGameHTMLElement();
      this.domElement = domElement;
      this.canvas = canvas;
      this.renderer = new GameRenderer(this);
      this.physicsEngine = new PhysicsEngine(this);
      this.viewport = new BoundingBox(0, 0, 32, 32).setCenter(0, 0); // What is the bounding box in tile space

      this.world = {
        width: 512,
        height: 512,
        backgroundImage: new BackgroundImage(this, testBackground),
        entities: []
      };
      this.world.physicalTiles = new TileLayer(this);
      this.world.entityGroup = new EntityGroup(this, this.world.entities); // for rendering

      this.ticker = createTicker(() => {
        this.tick();
      }, 1 / 30);
      this.keyboard = new Keyboard();
      window.addEventListener("resize", () => {
        this.resize();
      });
      this.canvas.addEventListener("wheel", evt => {
        let y = evt.deltaY;
        this.zoomOn(this.clientVecToTile(new Vec2(evt.clientX, evt.clientY)), y / 400 + 1);
      });
      this.canvas.addEventListener("mousemove", evt => this.onMouseMove(evt));
      this.canvas.addEventListener("mousedown", evt => this.onMouseDown(evt));
      this.canvas.addEventListener("mouseup", evt => this.onMouseUp(evt));
      this.gameRunning = false;
    }

    start() {
      this.gameRunning = true;
      this.ticker.start();
      requestAnimationFrame(() => this.renderLoop());
    }

    tick() {
      this.handleInputs(); //this.physicsEngine.tick()
    }

    clientVecToTile({
      x,
      y
    }) {
      const rect = game.canvas.getBoundingClientRect();
      const canvToTile = this.getCanvasToWorldTransform();
      let canvPos = new Vec2(x - rect.x, y - rect.y);
      return canvPos.transform(canvToTile);
    }

    stop() {
      this.ticker.stop();
      this.gameRunning = false;
    }

    getCanvasBBox() {
      return new BoundingBox(0, 0, this.width, this.height);
    }

    getWorldToCanvasTransform() {
      return BoundingBox.getReducedTransform(this.viewport, this.getCanvasBBox(), false, true);
    }

    getCanvasToWorldTransform() {
      return BoundingBox.getReducedTransform(this.getCanvasBBox(), this.viewport, false, true);
    }

    getWorldToClipTransform() {
      return BoundingBox.getReducedTransform(this.viewport, new BoundingBox(-1, -1, 2, 2), false, false);
    }

    getClipToWorldTransform() {
      return BoundingBox.getReducedTransform(new BoundingBox(-1, -1, 2, 2), this.viewport, false, false);
    }

    getCanvasToClipTransform() {
      return BoundingBox.getReducedTransform(this.getCanvasBBox(), this.viewport, false, false);
    }

    maintainValidViewport() {
      //if (this.viewport.width > this.world.width) this.viewport.width = this.world.width
      //if (this.viewport.height > this.world.height) this.viewport.height = this.world.height
      this.viewport.resizeToAspectRatio(aspectRatio);

      if (this.viewport.x2 < 0 || this.viewport.x1 > this.world.width) ;
    }

    zoom(s) {
      // TODO
      this.viewport.width /= s;
      this.viewport.height /= s;
    }

    zoomOn(v, dX) {
      this.viewport.zoomOn(v, dX);
    }

    setCenter(x, y) {
      this.viewport.cx = x;
      this.viewport.cy = y;
    }

    resize() {
      // Resize to fill the DOM
      const dpi = window.devicePixelRatio;
      const {
        canvas,
        domElement
      } = this;
      let {
        innerWidth,
        innerHeight
      } = window; // Make sure it fits within the required bounds

      if (innerWidth > maxGameWidth) {
        innerWidth = maxGameWidth;
      } else if (innerHeight > maxGameHeight) {
        innerHeight = maxGameHeight;
      }

      innerWidth = Math.round(innerWidth);
      innerHeight = Math.round(innerHeight); // Dimensions of the canvas buffer

      let height, width;

      if (innerWidth / innerHeight > aspectRatio) {
        height = dpi * innerHeight;
        width = dpi * Math.round(aspectRatio * innerHeight);
      } else {
        height = dpi * Math.round(innerWidth / aspectRatio);
        width = dpi * innerWidth;
      }

      canvas.height = height;
      canvas.width = width; // We must distinguish the CSS height and width (these) from the underlying buffer's height and width

      this.height = height / dpi;
      this.width = width / dpi;
      canvas.style.width = this.width + 'px';
      canvas.style.height = this.height + 'px';
      this.renderer.resize();
    }

    handleInputs() {
      const {
        keyboard,
        viewport
      } = this;
      const movementSpeed = 0.15;
      const moveDir = new Vec2(keyboard.isKeyPressed("ArrowRight") - keyboard.isKeyPressed("ArrowLeft"), keyboard.isKeyPressed("ArrowUp") - keyboard.isKeyPressed("ArrowDown")).unit().scale(movementSpeed);
      viewport.cx += moveDir.x;
      viewport.cy += moveDir.y;

      if (keyboard.isKeyPressed(" ")) {
        this.player.jump();
      } else if (keyboard.isKeyPressed("a")) {
        this.player.moveLeft();
      } else if (keyboard.isKeyPressed("d")) {
        this.player.moveRight();
      }
    }

    onMouseMove(evt) {
      if (this.isDragging) {
        let dragCenter = this.dragCenter;
        let currCenter = this.clientVecToTile(new Vec2(evt.clientX, evt.clientY)); // Need currCenter to coincide with dragCenter

        this.viewport.x1 += dragCenter.x - currCenter.x;
        this.viewport.y1 += dragCenter.y - currCenter.y;
      }
    }

    onMouseUp(m) {
      this.isDragging = false;
    }

    onMouseDown(evt) {
      this.isDragging = true;
      this.dragCenter = this.clientVecToTile(new Vec2(evt.clientX, evt.clientY));
    }

    renderLoop() {
      if (!this.gameRunning) return;
      this.maintainValidViewport();
      const {
        world
      } = this;
      this.renderer.render([world.backgroundImage, world.physicalTiles, world.entityGroup]);
      requestAnimationFrame(() => {
        this.renderLoop();
      });
    }

  }

  function getClosestTile(r, g, b, a) {
    let minIndex = 0,
        min = Infinity;

    for (let i = 1; i < tileColors.length; ++i) {
      let color = tileColors[i];
      let manhattan = Math.abs(color[0] - r) ** 2 + Math.abs(color[1] - g) ** 2 + Math.abs(color[2] - b) ** 2;

      if (manhattan < min) {
        minIndex = i;
        min = manhattan;
      }
    }

    return minIndex;
  }

  window.asyncDigest = asyncDigest;

  window.imageToTileData = function* imageToTileData(img) {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    let arr = create2DArray(img.width + 2, img.height + 2);
    let data = context.getImageData(0, 0, img.width, img.height).data;

    for (let y = 0; y < img.height; ++y) {
      for (let x = 0; x < img.width; ++x) {
        let r = data[4 * (y * img.width + x)],
            g = data[4 * (y * img.width + x) + 1],
            b = data[4 * (y * img.width + x) + 2],
            a = data[4 * (y * img.width + x) + 3];
        arr[img.height - y][x + 1] = getClosestTile(r, g, b);
      }

      yield y / img.height;
    }

    return arr;
  };

  function averageColor(data) {
    let r = 0,
        g = 0,
        b = 0,
        a = 0;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      a += data[i + 3];
    }

    let c = data.length / 4;
    return [r / c, g / c, b / c, a / c];
  }

  let tileColors = [[0, 0, 0, 0]];

  function getAverageColors() {
    for (let index = 1; index < tileset.tileCount; index++) {
      tileColors[index] = averageColor(tileset.getTileData(index).data);
    }
  }

  window.doImageFromURL = function doImageFromURL(url) {
    const testImg = window.testBackground = new Image();
    testImg.src = url;

    testImg.onload = () => doImage(testImg);
  };

  function doImage(testImg) {
    asyncDigest(imageToTileData(testImg), data => {
      game.world.physicalTiles.tileData = data;
      game.world.width = data[0].length;
      game.world.height = data.length;
      game.world.physicalTiles.markUpdate();
      game.start();
      game.setCenter(testImg.width / 2, testImg.height / 2);
    }, progress => {
      document.getElementById("progress").innerText = `progress: ${progress * 100}%`;
    });
  }

  window.addEventListener('load', function () {
    document.querySelector('input[type="file"]').addEventListener('change', function () {
      if (this.files && this.files[0]) {
        let img = new Image();

        img.onload = () => doImage(img);

        img.src = URL.createObjectURL(this.files[0]); // set src to blob url
      }
    });
  });

  assetTracker.onfinished = () => {
    window.tileColors = tileColors;
    getAverageColors(); // Add the game to the world

    const game = new Game();
    document.body.appendChild(game.domElement);
    game.resize();
    window.game = game;
    window.renderer = game.renderer;
    window.gl = game.renderer.gl;
    window.world = game.world; //for (let j = 0; j < 36; ++j) for (let i = 0; i < 64; ++i) game.world.physicalTiles.tileData[j][i] = (i+j+Math.floor(5*Math.random()))%60
  };

}());
