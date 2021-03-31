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

  // of tile to number.

  class TilesetLoader {
    constructor(tileSize = 16) {
      const handle = assetTracker.getHandle();
      this.subAssetTracker = new AssetLoadTracker();

      this.subAssetTracker.onfinished = () => {
        handle();
        this.generateTileset();
        if (this.onfinished) this.onfinished(this.tileset);
      };

      this.tileSize = tileSize;
      this.tileImages = {};
      this.tileset = new Tileset();
      this.onfinished = null;
    }

    addTile(tileName, tileFilename = tileName) {
      const handle = this.subAssetTracker.getHandle();
      const img = new Image();
      img.src = './assets/tiles/' + tileFilename + '.png';

      img.onload = () => {
        handle();
        this.tileImages[tileName] = img;
      };
    }

    generateTileset() {
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
      const tileCodes = {};
      const codeToTiles = [null];
      let i = 0;

      for (const [tileName, tileImage] of Object.entries(tileImages)) {
        if (tileImage.width > tileSize || tileImage.height > tileSize) // invalid tile, skip
          continue;
        ++i;
        tileCodes[tileName] = i;
        codeToTiles.push(tileName);
        ctx.drawImage(tileImage, 0, 0, tileSize, tileSize, tileSize * (i % textureWidthInTiles), tileSize * Math.floor(i / textureWidthInTiles), tileSize, tileSize);
      } // So that it's happily passed by reference


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

  const tileNames = "stone coal_ore iron_ore diamond_ore gold_ore redstone_ore emerald_ore oak_log"; //(function () { return `acacia_door_bottom acacia_door_top acacia_leaves acacia_log acacia_log_top acacia_planks acacia_sapling acacia_trapdoor activator_rail activator_rail_on allium andesite anvil anvil_top attached_melon_stem attached_pumpkin_stem azure_bluet bamboo_large_leaves bamboo_singleleaf bamboo_small_leaves bamboo_stage0 bamboo_stalk beacon bedrock beetroots_stage0 beetroots_stage1 beetroots_stage2 beetroots_stage3 birch_door_bottom birch_door_top birch_leaves birch_log birch_log_top birch_planks birch_sapling birch_trapdoor black_concrete black_concrete_powder black_glazed_terracotta black_shulker_box black_stained_glass black_stained_glass_pane_top black_terracotta black_wool blue_concrete blue_concrete_powder blue_glazed_terracotta blue_ice blue_orchid blue_shulker_box blue_stained_glass blue_stained_glass_pane_top blue_terracotta blue_wool bone_block_side bone_block_top bookshelf brain_coral brain_coral_block brain_coral_fan brewing_stand brewing_stand_base bricks brown_concrete brown_concrete_powder brown_glazed_terracotta brown_mushroom brown_mushroom_block brown_shulker_box brown_stained_glass brown_stained_glass_pane_top brown_terracotta brown_wool bubble_coral bubble_coral_block bubble_coral_fan cactus_bottom cactus_side cactus_top cake_bottom cake_inner cake_side cake_top carrots_stage0 carrots_stage1 carrots_stage2 carrots_stage3 carved_pumpkin cauldron_bottom cauldron_inner cauldron_side cauldron_top chain_command_block_back chain_command_block_back chain_command_block_conditional chain_command_block_conditional chain_command_block_front chain_command_block_front chain_command_block_side chain_command_block_side chipped_anvil_top chiseled_quartz_block chiseled_quartz_block_top chiseled_red_sandstone chiseled_sandstone chiseled_stone_bricks chorus_flower chorus_flower_dead chorus_plant clay coal_block coal_ore coarse_dirt cobblestone cobweb cocoa_stage0 cocoa_stage1 cocoa_stage2 command_block_back command_block_back command_block_conditional command_block_conditional command_block_front command_block_front command_block_side command_block_side comparator comparator_on conduit cornflower cracked_stone_bricks crafting_table_front crafting_table_side crafting_table_top crying_obsidian cut_red_sandstone cut_sandstone cyan_concrete cyan_concrete_powder cyan_glazed_terracotta cyan_shulker_box cyan_stained_glass cyan_stained_glass_pane_top cyan_terracotta cyan_wool damaged_anvil_top dandelion dark_oak_door_bottom dark_oak_door_top dark_oak_leaves dark_oak_log dark_oak_log_top dark_oak_planks dark_oak_sapling dark_oak_trapdoor dark_prismarine daylight_detector_inverted_top daylight_detector_side daylight_detector_top dead_brain_coral dead_brain_coral_block dead_brain_coral_fan dead_bubble_coral dead_bubble_coral_block dead_bubble_coral_fan dead_bush dead_fire_coral dead_fire_coral_block dead_fire_coral_fan dead_horn_coral dead_horn_coral_block dead_horn_coral_fan dead_tube_coral dead_tube_coral_block dead_tube_coral_fan debug debug2 destroy_stage_0 destroy_stage_1 destroy_stage_2 destroy_stage_3 destroy_stage_4 destroy_stage_5 destroy_stage_6 destroy_stage_7 destroy_stage_8 destroy_stage_9 detector_rail detector_rail_on diamond_block diamond_ore diorite dirt dispenser_front dispenser_front_vertical dragon_egg dried_kelp_bottom dried_kelp_side dried_kelp_top dropper_front dropper_front_vertical emerald_block emerald_ore enchanting_table_bottom enchanting_table_side enchanting_table_top end_portal_frame_eye end_portal_frame_side end_portal_frame_top end_rod end_stone end_stone_bricks farmland farmland_moist fern fire_0 fire_0 fire_1 fire_1 fire_coral fire_coral_block fire_coral_fan flower_pot frosted_ice_0 frosted_ice_1 frosted_ice_2 frosted_ice_3 furnace_front furnace_front_on furnace_side furnace_top glass glass_pane_top glowstone gold_block gold_ore granite grass grass_block_side grass_block_side_overlay grass_block_snow grass_block_top grass_path_side grass_path_top gravel gray_concrete gray_concrete_powder gray_glazed_terracotta gray_shulker_box gray_stained_glass gray_stained_glass_pane_top gray_terracotta gray_wool green_concrete green_concrete_powder green_glazed_terracotta green_shulker_box green_stained_glass green_stained_glass_pane_top green_terracotta green_wool hay_block_side hay_block_top hopper_inside hopper_outside hopper_top horn_coral horn_coral_block horn_coral_fan ice iron_bars iron_block iron_door_bottom iron_door_top iron_ore iron_trapdoor item_frame jack_o_lantern jukebox_side jukebox_top jungle_door_bottom jungle_door_top jungle_leaves jungle_log jungle_log_top jungle_planks jungle_sapling jungle_trapdoor kelp kelp kelp_plant kelp_plant ladder lapis_block lapis_ore large_fern_bottom large_fern_top lava_flow lava_flow lava_still lava_still lever light_blue_concrete light_blue_concrete_powder light_blue_glazed_terracotta light_blue_shulker_box light_blue_stained_glass light_blue_stained_glass_pane_top light_blue_terracotta light_blue_wool light_gray_concrete light_gray_concrete_powder light_gray_glazed_terracotta light_gray_shulker_box light_gray_stained_glass light_gray_stained_glass_pane_top light_gray_terracotta light_gray_wool lilac_bottom lilac_top lily_of_the_valley lily_pad lime_concrete lime_concrete_powder lime_glazed_terracotta lime_shulker_box lime_stained_glass lime_stained_glass_pane_top lime_terracotta lime_wool magenta_concrete magenta_concrete_powder magenta_glazed_terracotta magenta_shulker_box magenta_stained_glass magenta_stained_glass_pane_top magenta_terracotta magenta_wool magma magma melon_side melon_stem melon_top mossy_cobblestone mossy_stone_bricks mushroom_block_inside mushroom_stem mycelium_side mycelium_top nether_bricks nether_portal nether_portal nether_quartz_ore nether_wart_block nether_wart_stage0 nether_wart_stage1 nether_wart_stage2 netherrack note_block oak_door_bottom oak_door_top oak_leaves oak_log oak_log_top oak_planks oak_sapling oak_trapdoor observer_back observer_back_on observer_front observer_side observer_top obsidian orange_concrete orange_concrete_powder orange_glazed_terracotta orange_shulker_box orange_stained_glass orange_stained_glass_pane_top orange_terracotta orange_tulip orange_wool oxeye_daisy packed_ice peony_bottom peony_top pink_concrete pink_concrete_powder pink_glazed_terracotta pink_shulker_box pink_stained_glass pink_stained_glass_pane_top pink_terracotta pink_tulip pink_wool piston_bottom piston_inner piston_side piston_top piston_top_sticky podzol_side podzol_top polished_andesite polished_diorite polished_granite poppy potatoes_stage0 potatoes_stage1 potatoes_stage2 potatoes_stage3 powered_rail powered_rail_on prismarine prismarine prismarine_bricks pumpkin_side pumpkin_stem pumpkin_top purple_concrete purple_concrete_powder purple_glazed_terracotta purple_shulker_box purple_stained_glass purple_stained_glass_pane_top purple_terracotta purple_wool purpur_block purpur_pillar purpur_pillar_top quartz_block_bottom quartz_block_side quartz_block_top quartz_pillar quartz_pillar_top rail rail_corner red_concrete red_concrete_powder red_glazed_terracotta red_mushroom red_mushroom_block red_nether_bricks red_sand red_sandstone red_sandstone_bottom red_sandstone_top red_shulker_box red_stained_glass red_stained_glass_pane_top red_terracotta red_tulip red_wool redstone_block redstone_dust_dot redstone_dust_line0 redstone_dust_line1 redstone_dust_overlay redstone_lamp redstone_lamp_on redstone_ore redstone_torch redstone_torch_off repeater repeater_on repeating_command_block_back repeating_command_block_back repeating_command_block_conditional repeating_command_block_conditional repeating_command_block_front repeating_command_block_front repeating_command_block_side repeating_command_block_side rose_bush_bottom rose_bush_top sand sandstone sandstone_bottom sandstone_top sea_lantern sea_lantern sea_pickle seagrass seagrass shulker_box slime_block smooth_stone smooth_stone_slab_side snow soul_sand spawner sponge spruce_door_bottom spruce_door_top spruce_leaves spruce_log spruce_log_top spruce_planks spruce_sapling spruce_trapdoor stone stone_bricks stripped_acacia_log stripped_acacia_log_top stripped_birch_log stripped_birch_log_top stripped_dark_oak_log stripped_dark_oak_log_top stripped_jungle_log stripped_jungle_log_top stripped_oak_log stripped_oak_log_top stripped_spruce_log stripped_spruce_log_top structure_block structure_block_corner structure_block_data structure_block_load structure_block_save sugar_cane sunflower_back sunflower_bottom sunflower_front sunflower_top tall_grass_bottom tall_grass_top tall_seagrass_bottom tall_seagrass_bottom tall_seagrass_top tall_seagrass_top terracotta tnt_bottom tnt_side tnt_top torch tripwire tripwire_hook tube_coral tube_coral_block tube_coral_fan turtle_egg turtle_egg_slightly_cracked turtle_egg_very_cracked vine water_flow water_flow water_overlay water_still water_still wet_sponge wheat_stage0 wheat_stage1 wheat_stage2 wheat_stage3 wheat_stage4 wheat_stage5 wheat_stage6 wheat_stage7 white_concrete white_concrete_powder white_glazed_terracotta white_shulker_box white_stained_glass white_stained_glass_pane_top white_terracotta white_tulip white_wool wither_rose yellow_concrete yellow_concrete_powder yellow_glazed_terracotta yellow_shulker_box yellow_stained_glass yellow_stained_glass_pane_top yellow_terracotta yellow_wool` })()

  const tileLoader = new TilesetLoader();

  function isNotEmpty(str) {
    return str.replace(/^\s+|\s+$/g, '').length !== 0;
  }

  function splitOverWhitespace(str) {
    return str.split(/\s+/).filter(isNotEmpty);
  }

  for (const a of splitOverWhitespace(tileNames).slice(0, 150)) {
    tileLoader.addTile(a);
  }

  const tileset = window.tileset = tileLoader.tileset;
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

  for (const a of splitOverWhitespace(textureNames).slice(0, 150)) {
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
      this.tileset = tileset;
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // use nearest

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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

  class Vec2$1 {
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
      return new Vec2$1(this.x, this.y);
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
        this.x;
            this.y;
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
      return new Vec2$1(x_m * this.x + x_b, y_m * this.y + y_b);
    }

  }
  const Origin = new Vec2$1(0, 0); // window.Vec2 = Vec2

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
  function generateCaveWorld(width = 128, height = 128, seed = 0) {
    const random = mulberry32(seed);
    const caveBlock = tileset.toCode("stone");
    const airBlock = tileset.toCode("air"); // We'll use automata to do this

    const proportion = 0.4,
          generations = 3,
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

    for (const ore of ores) {
      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < width; ++j) {
          if (arr[i][j] && Math.random() < ore[2]) {
            arr[i][j] = tileset.toCode(ore[0]);
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

  class Entity {
    constructor() {
      // All in tile coordinates
      // Generally, the position of the feet
      this.position = new Vec2$1(0, 0);
      this.hitboxWidth = 0;
      this.hitboxHeight = 0;
    }

    getHitbox() {
      let hitbox = new BoundingBox(0, 0, this.hitboxWidth, this.hitboxHeight);
      return hitbox.setBottomMidpoint(this.position.x, this.position.y);
    } // Return locations in the texture, etc.


    getRenderingInstructions() {
      return [];
    }

    render() {}

  }

  const debuggerId = "hohoho";

  function getProgram(glManager) {
    var _glManager$getProgram;

    const program = (_glManager$getProgram = glManager.getProgram("Debugger")) !== null && _glManager$getProgram !== void 0 ? _glManager$getProgram : glManager.createProgram("Debugger", `attribute vec2 vPosition;
      
      uniform vec2 transformSlopes;
      uniform vec2 transformConstants;

        void main() {
            gl_Position = vec4(transformSlopes * vPosition + transformConstants, 0, 1);
        }`, `precision mediump float;
        uniform vec4 color;
        
        void main() {
          gl_FragColor = color;
        }`, ["vPosition"], ["color", "transformSlopes", "transformConstants"]);
    return program;
  }

  class Debugger {
    constructor(color = {
      r: 255,
      g: 0,
      b: 0,
      a: 255
    }, coordSpace = "world") {
      this.color = color;
      this.coordSpace = coordSpace; // one of "world", "clip" or "canvas"
    }

    setCoordSpace(s) {
      this.coordSpace = s;
      return this;
    }

    setColor(r, g, b, a = 255) {
      this.color.r = r;
      this.color.g = g;
      this.color.b = b;
      this.color.a = a;
    }

    render(renderer, geometry, mode = "LINE_STRIP") {
      const {
        gl,
        glManager,
        canvasWidth,
        canvasHeight,
        width,
        height
      } = renderer;
      const program = getProgram(glManager);
      gl.useProgram(program.program);
      const vPosition = program.attribs.vPosition;
      const posArrayBuffer = glManager.getBuffer(debuggerId);
      gl.bindBuffer(gl.ARRAY_BUFFER, posArrayBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition);
      let transform;

      switch (this.coordSpace) {
        case "world":
          transform = game.getWorldToClipTransform();
          break;

        case "canvas":
          transform = game.getCanvasToClipTransform();
          break;

        default:
          transform = {
            x_m: 1,
            y_m: 1,
            x_b: 0,
            y_b: 0
          };
      }

      gl.uniform2f(program.uniforms.transformSlopes, transform.x_m, transform.y_m);
      gl.uniform2f(program.uniforms.transformConstants, transform.x_b, transform.y_b);
      const {
        color
      } = this;
      gl.uniform4f(program.uniforms.color, color.r / 255, color.g / 255, color.b / 255, color.a / 255);
      gl.drawArrays(gl[mode], 0, geometry.length / 2);
    }

  }

  class RectangleDebugger extends Debugger {
    // a rather inefficient, but useful thing for debugging, drawn at the end of every frame
    constructor(rectangle, color = {
      r: 255,
      g: 0,
      b: 0,
      a: 255
    }) {
      super(color);
      this.rectangle = rectangle;
    }

    render(renderer) {
      const {
        x1,
        y1,
        x2,
        y2
      } = this.rectangle; // Draw the rectangle

      const arr = new Float32Array([x1, y1, x2, y2, x1, y2, x1, y1, x2, y1, x2, y2]);
      super.render(renderer, arr, "LINE_STRIP");
    }

  }
  class PointDebugger extends Debugger {
    constructor(v, color = {
      r: 255,
      g: 0,
      b: 0,
      a: 255
    }) {
      super(color);
      this.pos = v;
      this.radius = 0.1;
    }

    render(renderer) {
      const {
        x,
        y
      } = this.pos;
      const arr = [x, y];

      for (let i = 0; i <= 8; ++i) {
        let rad = 2 * Math.PI * i / 8;
        arr.push(x + this.radius * Math.cos(rad), y + this.radius * Math.sin(rad));
      }

      super.render(renderer, new Float32Array(arr), "TRIANGLE_FAN");
    }

  }

  class EntityWithPhysics extends Entity {
    constructor() {
      super();
      this.mass = 1;
      this.velocity = new Vec2$1(0, 0); // tiles per tick

      this.onGround = false;
    }

  }

  class PlayerEntity extends EntityWithPhysics {
    constructor() {
      super();
      this.position = new Vec2$1(2.5, 2);
      this.hitboxWidth = 0.8;
      this.hitboxHeight = 1.7;
      this.state = "static1";
    }

    getRenderingInstructions() {
      // The panda's height is used to define the texture position. The texture will have height 1.7 and will be centered
      // horizontally on the panda's position (its feet).
      const sprite = texturePack.getLocationOf(this.state);
      const box = new BoundingBox(0, 0, this.hitboxWidth * sprite.h / sprite.w, this.hitboxHeight).setBottomMidpoint(this.position.x, this.position.y);
      return {
        tileCoords: [box.x1, box.y2, box.x2, box.y1],
        textureCoords: [sprite.x, sprite.y, sprite.x + sprite.w, sprite.y + sprite.h]
      };
    }

    render(renderer) {
      renderer.addDebugger(new RectangleDebugger(this.getHitbox()));
      renderer.addDebugger(new PointDebugger(this.position));
    }

    jump() {
      if (this.onGround) {
        this.velocity.y += 0.7;
      }
    }

    moveLeftOrRight(unit = 1) {
      let mvAmount = this.onGround ? 0.05 : 0.02;
      let maxVelo = this.onGround ? 0.6 : 0.1;
      const velocity = this.velocity;
      const currentVelo = velocity.x;
      let intendedMvAmount = unit * mvAmount;

      if (Math.abs(currentVelo + intendedMvAmount) > maxVelo) ; else {
        velocity.x = currentVelo + intendedMvAmount;
      }
    }

    moveLeft() {
      // max x left velocity is 0.2, so we increment slowly to it
      this.moveLeftOrRight(-1);
    }

    moveRight() {
      this.moveLeftOrRight(1);
    }

  }

  const maxTicksBeforeLagBack = 5;
  function createTicker(tickCallback, tickLength = 1
  /*seconds*/
  ) {
    tickLength = tickLength * 1000; // ms
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
        startTime = Date.now();
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
      this.physicalTiles;
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

        effectiveVelocity.add(new Vec2$1(0, this.gravityAcceleration)); // compute hitbox

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

        for (let x = Math.max(xmin, 0); x < Math.min(physicalTiles.width, xmax); ++x) {
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

      this.player = new PlayerEntity();
      this.world.entities.push(this.player);
      this.ticker = createTicker(() => {
        this.tick();
      }, 1 / 30);
      this.keyboard = new Keyboard();
      window.addEventListener("resize", () => {
        this.resize();
      });
      this.canvas.addEventListener("wheel", evt => {
        let y = evt.deltaY;
        this.zoomOn(this.clientVecToTile(new Vec2$1(evt.clientX, evt.clientY)), y / 400 + 1);
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
      let canvPos = new Vec2$1(x - rect.x, y - rect.y);
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
      domElement.style.width = this.width + 'px';
      domElement.style.height = this.height + 'px';
      this.renderer.resize();
    }

    handleInputs() {
      const {
        keyboard,
        viewport
      } = this;
      const movementSpeed = 0.15;
      const moveDir = new Vec2$1(keyboard.isKeyPressed("ArrowRight") - keyboard.isKeyPressed("ArrowLeft"), keyboard.isKeyPressed("ArrowUp") - keyboard.isKeyPressed("ArrowDown")).unit().scale(movementSpeed);
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
        let currCenter = this.clientVecToTile(new Vec2$1(evt.clientX, evt.clientY)); // Need currCenter to coincide with dragCenter

        this.viewport.x1 += dragCenter.x - currCenter.x;
        this.viewport.y1 += dragCenter.y - currCenter.y;
      }
    }

    onMouseUp(m) {
      this.isDragging = false;
    }

    onMouseDown(evt) {
      this.isDragging = true;
      this.dragCenter = this.clientVecToTile(new Vec2$1(evt.clientX, evt.clientY));
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

  assetTracker.onfinished = () => {
    // Add the game to the world
    const game = new Game();
    document.body.appendChild(game.domElement);
    game.resize();
    game.world.physicalTiles.tileData = generateCaveWorld(game.world.width, game.world.height);
    game.world.physicalTiles.markUpdate();
    game.start();
    window.game = game;
    window.renderer = game.renderer;
    window.gl = game.renderer.gl;
    window.world = game.world;
    window.player = game.world.entities[0]; //for (let j = 0; j < 36; ++j) for (let i = 0; i < 64; ++i) game.world.physicalTiles.tileData[j][i] = (i+j+Math.floor(5*Math.random()))%60
  };

}());
