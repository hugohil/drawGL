'use strict'

const m4 = require('./m4')

module.exports = class DrawingSurface {
  constructor (gl, vs, fs, texturesCount) {
    this.texturesCount = texturesCount
    this.shader = this.createProgram(gl, this.compileShader(gl, vs, gl.VERTEX_SHADER), this.compileShader(gl, fs, gl.FRAGMENT_SHADER))

    this.positionLocation = gl.getAttribLocation(this.shader, 'a_position')
    this.texcoordLocation = gl.getAttribLocation(this.shader, 'a_texcoord')
    this.matrixLocation = gl.getUniformLocation(this.shader, 'u_matrix')
    this.textureStreamLocation = gl.getUniformLocation(this.shader, 'u_textureStream')
    this.resolutionLocation = gl.getUniformLocation(this.shader, 'u_resolution')
    this.timeLocation = gl.getUniformLocation(this.shader, 'u_time')

    this.textureLocations = []
    for (let i = 0; i < this.texturesCount; i++) {
      this.textureLocations[i] = gl.getUniformLocation(this.shader, `u_texture${(i + 1)}`)
    }

    console.log(this)

    this.positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    const positions = [
      0, 0,
      0, 1,
      1, 0,
      1, 0,
      0, 1,
      1, 1
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    this.texcoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
    const texcoords = [
      0, 0,
      0, 1,
      1, 0,
      1, 0,
      0, 1,
      1, 1
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW)

    this.textureStream = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.textureStream)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    this.textures = []
    for (let i = 0; i < this.texturesCount; i++) {
      this.textures[i] = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, this.textures[i])
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }
  }

  compileShader (gl, shaderSource, shaderType) {
    // Create the shader object
    const shader = gl.createShader(shaderType)
    // Set the shader source code.
    gl.shaderSource(shader, shaderSource)
    // Compile the shader
    gl.compileShader(shader)
    // Check if it compiled
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!success) {
      // Something went wrong during compilation get the error
      throw('could not compile shader:' + gl.getShaderInfoLog(shader))
    }

    return shader
  }

  createProgram (gl, vertexShader, fragmentShader) {
    // create a program.
    const program = gl.createProgram()
    // attach the shaders.
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    // link the program.
    gl.linkProgram(program)
    // Check if it linked.
    const success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!success) {
      // something went wrong with the link
      throw ('program filed to link:' + gl.getProgramInfoLog (program))
    }
    return program
  }

  getStreamTexture () {
    return this.textureStream
  }

  getTextureByIndex (index) {
    return this.textures[index]
  }

  updateTextureStream (gl, stream) {
    gl.bindTexture(gl.TEXTURE_2D, this.textureStream)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, stream)
  }

  setTextureByIndex (gl, index, texture) {
    gl.bindTexture(gl.TEXTURE_2D, this.textures[index])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture)
  }

  drawTexture (gl, time, resolution, width, height) {
    gl.useProgram(this.shader)

    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.enableVertexAttribArray(this.positionLocation)
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
    gl.enableVertexAttribArray(this.texcoordLocation)
    gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0)

    // this matrix will convert from pixels to clip space
    let matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1)
    // this matrix will translate our quad to dstX, dstY
    matrix = m4.translate(matrix, ((gl.canvas.width - width) * .5), ((gl.canvas.height - height) * .5), 0)
    // this matrix will scale our 1 unit quad from 1 unit to texWidth, texHeight units
    matrix = m4.scale(matrix, width, height, 1)
    // Set the matrix.
    gl.uniformMatrix4fv(this.matrixLocation, false, matrix)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.textureStream)
    gl.uniform1i(this.textureStreamLocation, 0)

    for (let i = 0; i < this.texturesCount; i++) {
      gl.activeTexture(gl[`TEXTURE${(i + 1)}`])
      // console.log(gl.getParameter(gl.ACTIVE_TEXTURE))
      gl.bindTexture(gl.TEXTURE_2D, this.textures[i])
      gl.uniform1i(this.textureLocations[i], (i + 1))
    }

    // update resolution
    gl.uniform2f(this.resolutionLocation, resolution[0], resolution[1])

    // update time
    gl.uniform1f(this.timeLocation, time)

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
