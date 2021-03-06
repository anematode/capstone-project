
// Note: written by me in mid-2020

// This function takes in a GL rendering context, a type of shader (fragment/vertex),
// and the GLSL source code for that shader, then returns the compiled shader
function createShaderFromSource (gl, shaderType, shaderSourceText) {
  // create an (empty) shader of the provided type
  const shader = gl.createShader(shaderType)

  // set the source of the shader to the provided source
  gl.shaderSource(shader, shaderSourceText)

  // compile the shader!! piquant
  gl.compileShader(shader)

  // get whether the shader compiled properly
  const succeeded = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

  if (succeeded) {
    return shader // return it if it compiled properly
  }

  const err = new Error(gl.getShaderInfoLog(shader))

  // delete the shader to free it from memory
  gl.deleteShader(shader)

  // throw an error with the details of why the compilation failed
  throw err
}

// This function takes in a GL rendering context, the fragment shader, and the vertex shader,
// and returns a compiled program.
function createGLProgram (gl, vertShader, fragShader) {
  // create an (empty) GL program
  const program = gl.createProgram()

  // link the vertex shader
  gl.attachShader(program, vertShader)

  // link the fragment shader
  gl.attachShader(program, fragShader)

  // compile the program
  gl.linkProgram(program)

  // get whether the program compiled properly
  const succeeded = gl.getProgramParameter(program, gl.LINK_STATUS)

  if (succeeded) {
    return program
  }

  const err = new Error(gl.getProgramInfoLog(program))

  // delete the program to free it from memory
  gl.deleteProgram(program)

  // throw an error with the details of why the compilation failed
  throw err
}

/**
 @class GLResourceManager stores GL resources on a per-context basis. This allows the
 separation of elements and their drawing buffers in a relatively complete way.
 It is given a gl context to operate on, and creates programs in manager.programs
 and buffers in manager.buffers. programs and buffers are simply key-value pairs
 which objects can create (and destroy) as they please.
 */
export class GLResourceManager {
  /**
   * Construct a GLResourceManager
   * @param gl {WebGLRenderingContext} WebGL context the manager will have dominion over
   */
  constructor (gl) {
    // WebGL rendering context
    this.gl = gl

    // Compiled programs and created buffers
    this.programs = {}
    this.buffers = {}
    this.textures = {}
  }

  /**
   * Compile a program and store it in this.programs
   * @param programName {string} Name of the program, used to identify the program
   * @param vertexShaderSource {string} Source code of the vertex shader
   * @param fragmentShaderSource {string} Source code of the fragment shader
   * @param vertexAttributeNames {Array} Array of vertex attribute names
   * @param uniformNames {Array} Array of uniform names
   */
  createProgram (programName, vertexShaderSource, fragmentShaderSource,
                  vertexAttributeNames = [], uniformNames = []) {
    if (this.hasProgram(programName)) {
      // if this program name is already taken, delete the old one
      this.deleteProgram(programName)
    }

    const { gl } = this

    // The actual gl program itself
    const glProgram = createGLProgram(gl,
      createShaderFromSource(gl, gl.VERTEX_SHADER, vertexShaderSource),
      createShaderFromSource(gl, gl.FRAGMENT_SHADER, fragmentShaderSource))

    // pairs of uniform names and their respective locations
    const uniforms = {}
    for (let i = 0; i < uniformNames.length; ++i) {
      const uniformName = uniformNames[i]

      uniforms[uniformName] = gl.getUniformLocation(glProgram, uniformName)
    }

    // pairs of vertex attribute names and their respective locations
    const vertexAttribs = {}
    for (let i = 0; i < vertexAttributeNames.length; ++i) {
      const vertexAttribName = vertexAttributeNames[i]

      vertexAttribs[vertexAttribName] = gl.getAttribLocation(glProgram, vertexAttribName)
    }

    this.programs[programName] = {
      program: glProgram,
      uniforms,
      attribs: vertexAttribs
    }

    return this.programs[programName]
  }

  onContextLost () {
    this.programs = {}
    this.buffers = {}
    this.textures = {}
  }


  /**
   * Create a buffer with a certain name, typically including a WebGLElement's id
   * @param bufferName {string} Name of the buffer
   */
  createBuffer (bufferName) {
    // If buffer already exists, return
    if (this.hasBuffer(bufferName)) return

    const { gl } = this

    // Create a new buffer
    this.buffers[bufferName] = gl.createBuffer()
  }

  /**
   * Delete buffer with given name
   * @param bufferName {string} Name of the buffer
   */
  deleteBuffer (bufferName) {
    if (!this.hasBuffer(bufferName)) return

    const buffer = this.getBuffer(bufferName)
    const { gl } = this

    // Delete the buffer from GL memory
    gl.deleteBuffer(buffer)
    delete this.buffers[bufferName]
  }

  /**
   * Delete a program
   * @param programName {string} Name of the program to be deleted
   */
  deleteProgram (programName) {
    if (!this.hasProgram(programName)) return

    const programInfo = this.programs[programName]
    this.gl.deleteProgram(programInfo.program)

    // Remove the key from this.programs
    delete this.programs[programName]
  }

  /**
   * Retrieve a buffer with a given name, and create it if it does not already exist
   * @param bufferName Name of the buffer
   * @returns {WebGLBuffer} Corresponding buffer
   */
  getBuffer (bufferName) {
    if (!this.hasBuffer(bufferName)) this.createBuffer(bufferName)
    return this.buffers[bufferName]
  }

  /**
   * Retrieve program from storage
   * @param programName {string} Name of the program
   * @returns {Object} Object of the form {program, uniforms, vertexAttribs}
   */
  getProgram (programName) {
    return this.programs[programName]
  }

  /**
   * Whether this manager has a buffer with a given name
   * @param bufferName Name of the buffer
   * @returns {boolean} Whether this manager has a buffer with that name
   */
  hasBuffer (bufferName) {
    return !!this.buffers[bufferName]
  }

  /**
   * Whether a program with programName exists
   * @param programName {string} Name of the program
   * @returns {boolean} Whether that program exists
   */
  hasProgram (programName) {
    return !!this.programs[programName]
  }

  createTexture (name) {
    const { gl } = this
    return this.textures[name] = gl.createTexture()
  }

  getTexture (name) {
    return this.textures[name] ?? this.createTexture(name)
  }

  hasTexture (name) {
    return !!this.textures[name]
  }

  deleteTexture (name) {
    const texture = this.getTexture(name)

    if (texture) {
      this.gl.deleteTexture(texture)

      delete this.textures[name]
    }
  }

  createTextureFromImage (name, image) {
    const { gl } = this

    const newTexture = this.createTexture(name)

    gl.bindTexture(gl.TEXTURE_2D, newTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

    return newTexture
  }
}
