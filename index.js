'use strict'

const m4 = require('./m4')

module.exports = class DrawingSurface {
  constructor (gl, vs, fs) {
    this.shader = this.createProgram(gl, this.compileShader(gl, vs, gl.VERTEX_SHADER), this.compileShader(gl, fs, gl.FRAGMENT_SHADER))

    this.positionLocation = gl.getAttribLocation(this.shader, 'a_position')
    this.texcoordLocation = gl.getAttribLocation(this.shader, 'a_texcoord')
    this.matrixLocation = gl.getUniformLocation(this.shader, 'u_matrix')
    this.resolutionLocation = gl.getUniformLocation(this.shader, 'u_resolution')
    this.timeLocation = gl.getUniformLocation(this.shader, 'u_time')

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

  draw (gl, time, resolution) {
    gl.useProgram(this.shader)

    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.enableVertexAttribArray(this.positionLocation)
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
    gl.enableVertexAttribArray(this.texcoordLocation)
    gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0)

    // // this matrix will convert from pixels to clip space
    // let matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1)
    // // this matrix will translate our quad to dstX, dstY
    // matrix = m4.translate(matrix, 0, 0, 0)
    // // this matrix will scale our 1 unit quad from 1 unit to texWidth, texHeight units
    // matrix = m4.scale(matrix, gl.canvas.width, gl.canvas.height, 1)
    // // Set the matrix.
    // gl.uniformMatrix4fv(this.matrixLocation, false, matrix)

    let matrix = m4.orthographic(0, 1, 1, 0, -1, 1)
    gl.uniformMatrix4fv(this.matrixLocation, false, matrix)

    // update resolution
    gl.uniform2f(this.resolutionLocation, resolution[0], resolution[1])

    // update time
    gl.uniform1f(this.timeLocation, time)

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
