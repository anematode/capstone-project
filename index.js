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
      this.canvasCtx = canvas.getContext("2d");
      this.glCanvas = document.createElement("canvas");
      let gl = this.gl = this.glCanvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        premultipliedAlpha: false
      });
      if (!gl) alert("Browser lacks WebGL support.");
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      this.glManager = new GLResourceManager(this.gl); // Init

      this.resizeGLCanvas();
    }

    resetCanvasCtxTransform() {
      this.canvasCtx.resetTransform();
      this.canvasCtx.scale(this.canvasWidth / this.width, this.canvasHeight / this.height);
    }

    clearCanvas() {
      this.canvasCtx.clearRect(0, 0, this.width, this.height);
    }

    get viewport() {
      return this.game.viewport;
    }

    clearGLCanvas(r = 0, g = 0, b = 0, a = 0) {
      const {
        gl
      } = this;
      gl.clearColor(r, g, b, a);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    resize() {
      this.resizeGLCanvas();
    }

    resizeGLCanvas() {
      // buffer dims
      const {
        width,
        height
      } = this.canvas;
      this.glCanvas.width = width;
      this.glCanvas.height = height;
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

    copyGLCanvas() {
      this.resizeGLCanvas();
      const {
        width,
        height
      } = this.canvas;
      this.canvasCtx.resetTransform();
      this.canvasCtx.drawImage(this.glCanvas, 0, 0, width, height, 0, 0, width, height);
      this.resetCanvasCtxTransform();
    }

    render(instructions = []) {
      this.clearCanvas();
      this.clearGLCanvas();

      for (const elem of instructions) {
        elem.render(this);
      } // Copy over


      this.copyGLCanvas();
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

      const exponent = Math.ceil(Math.log2(tileImageCount + 1));
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

  const filenames = `
acacia_door_bottom
acacia_door_top
acacia_leaves
acacia_log
acacia_log_top
acacia_planks
acacia_sapling
acacia_trapdoor
activator_rail
activator_rail_on
allium
andesite
anvil
anvil_top
attached_melon_stem
attached_pumpkin_stem
azure_bluet
bamboo_large_leaves
bamboo_singleleaf
bamboo_small_leaves
bamboo_stage0
bamboo_stalk
beacon
bedrock
beetroots_stage0
beetroots_stage1
beetroots_stage2
beetroots_stage3
birch_door_bottom
birch_door_top
birch_leaves
birch_log
birch_log_top
birch_planks
birch_sapling
birch_trapdoor
black_concrete
black_concrete_powder
black_glazed_terracotta
black_shulker_box
black_stained_glass
black_stained_glass_pane_top
black_terracotta
black_wool
blue_concrete
blue_concrete_powder
blue_glazed_terracotta
blue_ice
blue_orchid
blue_shulker_box
blue_stained_glass
blue_stained_glass_pane_top
blue_terracotta
blue_wool
bone_block_side
bone_block_top
bookshelf
brain_coral
brain_coral_block
brain_coral_fan
brewing_stand
brewing_stand_base
bricks
brown_concrete
brown_concrete_powder
brown_glazed_terracotta
brown_mushroom
brown_mushroom_block
brown_shulker_box
brown_stained_glass
brown_stained_glass_pane_top
brown_terracotta
brown_wool
bubble_coral
bubble_coral_block
bubble_coral_fan
cactus_bottom
cactus_side
cactus_top
cake_bottom
cake_inner
cake_side
cake_top
carrots_stage0
carrots_stage1
carrots_stage2
carrots_stage3
carved_pumpkin
cauldron_bottom
cauldron_inner
cauldron_side
cauldron_top
chain_command_block_back
chain_command_block_back
chain_command_block_conditional
chain_command_block_conditional
chain_command_block_front
chain_command_block_front
chain_command_block_side
chain_command_block_side
chipped_anvil_top
chiseled_quartz_block
chiseled_quartz_block_top
chiseled_red_sandstone
chiseled_sandstone
chiseled_stone_bricks
chorus_flower
chorus_flower_dead
chorus_plant
clay
coal_block
coal_ore
coarse_dirt
cobblestone
cobweb
cocoa_stage0
cocoa_stage1
cocoa_stage2
command_block_back
command_block_back
command_block_conditional
command_block_conditional
command_block_front
command_block_front
command_block_side
command_block_side
comparator
comparator_on
conduit
cornflower
cracked_stone_bricks
crafting_table_front
crafting_table_side
crafting_table_top
crying_obsidian
cut_red_sandstone
cut_sandstone
cyan_concrete
cyan_concrete_powder
cyan_glazed_terracotta
cyan_shulker_box
cyan_stained_glass
cyan_stained_glass_pane_top
cyan_terracotta
cyan_wool
damaged_anvil_top
dandelion
dark_oak_door_bottom
dark_oak_door_top
dark_oak_leaves
dark_oak_log
dark_oak_log_top
dark_oak_planks
dark_oak_sapling
dark_oak_trapdoor
dark_prismarine
daylight_detector_inverted_top
daylight_detector_side
daylight_detector_top
dead_brain_coral
dead_brain_coral_block
dead_brain_coral_fan
dead_bubble_coral
dead_bubble_coral_block
dead_bubble_coral_fan
dead_bush
dead_fire_coral
dead_fire_coral_block
dead_fire_coral_fan
dead_horn_coral
dead_horn_coral_block
dead_horn_coral_fan
dead_tube_coral
dead_tube_coral_block
dead_tube_coral_fan
debug
debug2
destroy_stage_0
destroy_stage_1
destroy_stage_2
destroy_stage_3
destroy_stage_4
destroy_stage_5
destroy_stage_6
destroy_stage_7
destroy_stage_8
destroy_stage_9
detector_rail
detector_rail_on
diamond_block
diamond_ore
diorite
dirt
dispenser_front
dispenser_front_vertical
dragon_egg
dried_kelp_bottom
dried_kelp_side
dried_kelp_top
dropper_front
dropper_front_vertical
emerald_block
emerald_ore
enchanting_table_bottom
enchanting_table_side
enchanting_table_top
end_portal_frame_eye
end_portal_frame_side
end_portal_frame_top
end_rod
end_stone
end_stone_bricks
farmland
farmland_moist
fern
fire_0
fire_0
fire_1
fire_1
fire_coral
fire_coral_block
fire_coral_fan
flower_pot
frosted_ice_0
frosted_ice_1
frosted_ice_2
frosted_ice_3
furnace_front
furnace_front_on
furnace_side
furnace_top
glass
glass_pane_top
glowstone
gold_block
gold_ore
granite
grass
grass_block_side
grass_block_side_overlay
grass_block_snow
grass_block_top
grass_path_side
grass_path_top
gravel
gray_concrete
gray_concrete_powder
gray_glazed_terracotta
gray_shulker_box
gray_stained_glass
gray_stained_glass_pane_top
gray_terracotta
gray_wool
green_concrete
green_concrete_powder
green_glazed_terracotta
green_shulker_box
green_stained_glass
green_stained_glass_pane_top
green_terracotta
green_wool
hay_block_side
hay_block_top
hopper_inside
hopper_outside
hopper_top
horn_coral
horn_coral_block
horn_coral_fan
ice
iron_bars
iron_block
iron_door_bottom
iron_door_top
iron_ore
iron_trapdoor
item_frame
jack_o_lantern
jukebox_side
jukebox_top
jungle_door_bottom
jungle_door_top
jungle_leaves
jungle_log
jungle_log_top
jungle_planks
jungle_sapling
jungle_trapdoor
kelp
kelp
kelp_plant
kelp_plant
ladder
lapis_block
lapis_ore
large_fern_bottom
large_fern_top
lava_flow
lava_flow
lava_still
lava_still
lever
light_blue_concrete
light_blue_concrete_powder
light_blue_glazed_terracotta
light_blue_shulker_box
light_blue_stained_glass
light_blue_stained_glass_pane_top
light_blue_terracotta
light_blue_wool
light_gray_concrete
light_gray_concrete_powder
light_gray_glazed_terracotta
light_gray_shulker_box
light_gray_stained_glass
light_gray_stained_glass_pane_top
light_gray_terracotta
light_gray_wool
lilac_bottom
lilac_top
lily_of_the_valley
lily_pad
lime_concrete
lime_concrete_powder
lime_glazed_terracotta
lime_shulker_box
lime_stained_glass
lime_stained_glass_pane_top
lime_terracotta
lime_wool
magenta_concrete
magenta_concrete_powder
magenta_glazed_terracotta
magenta_shulker_box
magenta_stained_glass
magenta_stained_glass_pane_top
magenta_terracotta
magenta_wool
magma
magma
melon_side
melon_stem
melon_top
mossy_cobblestone
mossy_stone_bricks
mushroom_block_inside
mushroom_stem
mycelium_side
mycelium_top
nether_bricks
nether_portal
nether_portal
nether_quartz_ore
nether_wart_block
nether_wart_stage0
nether_wart_stage1
nether_wart_stage2
netherrack
note_block
oak_door_bottom
oak_door_top
oak_leaves
oak_log
oak_log_top
oak_planks
oak_sapling
oak_trapdoor
observer_back
observer_back_on
observer_front
observer_side
observer_top
obsidian
orange_concrete
orange_concrete_powder
orange_glazed_terracotta
orange_shulker_box
orange_stained_glass
orange_stained_glass_pane_top
orange_terracotta
orange_tulip
orange_wool
oxeye_daisy
packed_ice
peony_bottom
peony_top
pink_concrete
pink_concrete_powder
pink_glazed_terracotta
pink_shulker_box
pink_stained_glass
pink_stained_glass_pane_top
pink_terracotta
pink_tulip
pink_wool
piston_bottom
piston_inner
piston_side
piston_top
piston_top_sticky
podzol_side
podzol_top
polished_andesite
polished_diorite
polished_granite
poppy
potatoes_stage0
potatoes_stage1
potatoes_stage2
potatoes_stage3
powered_rail
powered_rail_on
prismarine
prismarine
prismarine_bricks
pumpkin_side
pumpkin_stem
pumpkin_top
purple_concrete
purple_concrete_powder
purple_glazed_terracotta
purple_shulker_box
purple_stained_glass
purple_stained_glass_pane_top
purple_terracotta
purple_wool
purpur_block
purpur_pillar
purpur_pillar_top
quartz_block_bottom
quartz_block_side
quartz_block_top
quartz_pillar
quartz_pillar_top
rail
rail_corner
red_concrete
red_concrete_powder
red_glazed_terracotta
red_mushroom
red_mushroom_block
red_nether_bricks
red_sand
red_sandstone
red_sandstone_bottom
red_sandstone_top
red_shulker_box
red_stained_glass
red_stained_glass_pane_top
red_terracotta
red_tulip
red_wool
redstone_block
redstone_dust_dot
redstone_dust_line0
redstone_dust_line1
redstone_dust_overlay
redstone_lamp
redstone_lamp_on
redstone_ore
redstone_torch
redstone_torch_off
repeater
repeater_on
repeating_command_block_back
repeating_command_block_back
repeating_command_block_conditional
repeating_command_block_conditional
repeating_command_block_front
repeating_command_block_front
repeating_command_block_side
repeating_command_block_side
rose_bush_bottom
rose_bush_top
sand
sandstone
sandstone_bottom
sandstone_top
sea_lantern
sea_lantern
sea_pickle
seagrass
seagrass
shulker_box
slime_block
smooth_stone
smooth_stone_slab_side
snow
soul_sand
spawner
sponge
spruce_door_bottom
spruce_door_top
spruce_leaves
spruce_log
spruce_log_top
spruce_planks
spruce_sapling
spruce_trapdoor
stone
stone_bricks
stripped_acacia_log
stripped_acacia_log_top
stripped_birch_log
stripped_birch_log_top
stripped_dark_oak_log
stripped_dark_oak_log_top
stripped_jungle_log
stripped_jungle_log_top
stripped_oak_log
stripped_oak_log_top
stripped_spruce_log
stripped_spruce_log_top
structure_block
structure_block_corner
structure_block_data
structure_block_load
structure_block_save
sugar_cane
sunflower_back
sunflower_bottom
sunflower_front
sunflower_top
tall_grass_bottom
tall_grass_top
tall_seagrass_bottom
tall_seagrass_bottom
tall_seagrass_top
tall_seagrass_top
terracotta
tnt_bottom
tnt_side
tnt_top
torch
tripwire
tripwire_hook
tube_coral
tube_coral_block
tube_coral_fan
turtle_egg
turtle_egg_slightly_cracked
turtle_egg_very_cracked
vine
water_flow
water_flow
water_overlay
water_still
water_still
wet_sponge
wheat_stage0
wheat_stage1
wheat_stage2
wheat_stage3
wheat_stage4
wheat_stage5
wheat_stage6
wheat_stage7
white_concrete
white_concrete_powder
white_glazed_terracotta
white_shulker_box
white_stained_glass
white_stained_glass_pane_top
white_terracotta
white_tulip
white_wool
wither_rose
yellow_concrete
yellow_concrete_powder
yellow_glazed_terracotta
yellow_shulker_box
yellow_stained_glass
yellow_stained_glass_pane_top
yellow_terracotta
yellow_wool`.split('\n');
  const loader = new TilesetLoader();

  for (const a of filenames.slice(0, 150)) {
    if (a) loader.addTile(a);
  }

  const tileset = window.tileset = loader.tileset;

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  } // A layer... of tiles... to render. Yep.

  class TileLayer {
    constructor(game) {
      this.game = game;
      this.tileData = []; // 2d array of tile indices

      this.width = 64;
      this.height = 36;
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

    setTileAt(x, y, v) {
      this.needsUpdate = true;
    }

    resize(width, height) {
      this.width = width;
      this.height = height;
      this.clear();
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
          outputArr[k + 3] = 255; // opacity
        }
      }

      this.worldTexture = new ImageData(outputArr, width, height);
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

      if (this.needsUpdate) {
        gl.bindTexture(gl.TEXTURE_2D, worldGLTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.worldTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // use nearest

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // Load in a rectangle geometry

        const rectangle = new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]);
        const buf = glManager.getBuffer(this.id);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, rectangle, gl.STATIC_DRAW);
      }

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
         
         // the r and g values have the position in the tileset array where it should be. We center on the pixel to
         // avoid any rounding errors
         vec2 tilePos = texture2D(worldTexture, (tileLookup + vec2(0.5, 0.5)) / worldSize).xy * 255.;
         
         // Should be two integers in pixel space
         vec2 roundedTilePos = roundVec2(tilePos * tileSize);
         
         // We now need the location of the texel WITHIN the tile. We use the difference between the vWorldCoord and
         // the vec used for the tile lookup, to avoid rounding errors. because we're using gl nearest, we again try
         // to round to the nearest pixel and sample it at its center. We also have to FLIP the y axis value, because the tiles are
         // upside down relative to this.
         
         vec2 shiftAmount = floor((vWorldCoord - tileLookup) * tileSize) + vec2(0.5, 0.5);
         shiftAmount.y = tileSize - shiftAmount.y;
         
         gl_FragColor = texture2D(tileset, (roundedTilePos + shiftAmount) / tilesetSize);
         gl_FragColor.rgb *= gl_FragColor.a;
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

    set(v) {
      this.x = v.x;
      this.y = v.y;
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
  const Origin = new Vec2$1(0, 0);
  window.Vec2 = Vec2$1;

  class BoundingBox {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      // location of the box's center
      this.cx = x + width / 2;
      this.cy = y + height / 2;
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
      this.cx = x;
      this.cy = y;
      return this;
    }

    get x1() {
      return this.cx - Math.abs(this.width) / 2;
    }

    get x2() {
      return this.cx + Math.abs(this.width) / 2;
    }

    get y1() {
      return this.cy - Math.abs(this.height) / 2;
    }

    get y2() {
      return this.cy + Math.abs(this.height) / 2;
    }

    getX1() {
      return this.cx - Math.abs(this.width) / 2;
    }

    getX2() {
      return this.cx + Math.abs(this.width) / 2;
    }

    getY1() {
      return this.cy - Math.abs(this.height) / 2;
    }

    getY2() {
      return this.cy + Math.abs(this.height) / 2;
    } // bottom left in graph-like spaces, top left in canvas-like spaces


    setX1Y1Corner(x, y) {
      this.cx = x + Math.abs(this.width) / 2;
      this.cy = y + Math.abs(this.height) / 2;
      return this;
    }

    setX1Y2Corner(x, y) {
      this.cx = x + Math.abs(this.width) / 2;
      this.cy = y - Math.abs(this.height) / 2;
      return this;
    }

    static getReducedTransform(box1, box2, flipX = false, flipY = false) {
      let x_m = 1 / box1.width;
      let x_b = -box1.getX1() / box1.width;

      if (flipX) {
        x_m *= -1;
        x_b = 1 - x_b;
      }

      x_m *= box2.width;
      x_b *= box2.width;
      x_b += box2.getX1();
      let y_m = 1 / box1.height;
      let y_b = -box1.getY1() / box1.height;

      if (flipY) {
        y_m *= -1;
        y_b = 1 - y_b;
      }

      y_m *= box2.height;
      y_b *= box2.height;
      y_b += box2.getY1();
      return {
        x_m,
        x_b,
        y_m,
        y_b
      };
    }

  }

  class BackgroundImage {
    constructor(game, img) {
      this.game = game;
      this.img = img;
      this.id = generateUUID();
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
      let texture; // If we haven't made a texture here before

      if (!glManager.hasTexture(this.id)) {
        texture = glManager.getTexture(this.id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      } else {
        texture = glManager.getTexture(this.id);
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.useProgram(tileLayerProgram.program);
      gl.uniform1i(tileLayerProgram.uniforms.uSampler, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
      this.viewport = new BoundingBox(0, 0, 64, 36); // What is the bounding box in tile space

      this.world = {
        width: 128,
        height: 72,
        physicalTiles: new TileLayer(this),
        backgroundImage: new BackgroundImage(this, testBackground)
      };
      this.keyboard = new Keyboard();
      window.addEventListener("resize", () => {
        this.resize();
      });
      this.gameRunning = false;
    }

    start() {
      this.gameRunning = true;
      requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
      this.gameRunning = false;
    }

    getCanvasBBox() {
      return new BoundingBox(0, 0, this.width, this.height);
    }

    getWorldToCanvasTransform() {
      return BoundingBox.getReducedTransform(this.viewport, this.getCanvasBBox(), false, true);
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
    }

    gameLoop() {
      if (!this.gameRunning) return;
      this.handleInputs();
      const {
        world
      } = this;
      this.renderer.render([world.backgroundImage, world.physicalTiles]);
      requestAnimationFrame(() => {
        this.gameLoop();
      });
    }

  }

  assetTracker.onfinished = () => {
    // Add the game to the world
    const game = new Game();
    document.body.appendChild(game.domElement);
    game.resize();
    game.start();
    window.game = game;
    window.renderer = game.renderer;
    window.gl = game.renderer.gl;

    for (let j = 0; j < 36; ++j) for (let i = 0; i < 64; ++i) game.world.physicalTiles.tileData[j][i] = (i + j + Math.floor(5 * Math.random())) % 60;
  };

}());
