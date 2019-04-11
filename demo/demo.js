'use strict'

const DrawingSurface = require('../index')

const canvasRender = document.createElement('canvas')
canvasRender.id = 'canvas-render'
canvasRender.width = window.innerWidth
canvasRender.height = window.innerHeight
canvasRender.style.backgroundColor = 'rgb(255, 100, 0)'
document.body.appendChild(canvasRender)

const gl = canvasRender.getContext('webgl')

const vs = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
  gl_Position = u_matrix * a_position;
  v_texcoord = a_texcoord;
}
`
const fs = `
precision mediump float;

varying vec2 v_texcoord;

uniform float u_time;

void main() {
  vec3 color = vec3(.5, .1, 1.);
  gl_FragColor = vec4(color, abs(sin(u_time)));
}
`

const surface = new DrawingSurface(gl, vs, fs)

let time = 0
let resolution = [canvasRender.width, canvasRender.height]

function render () {
  surface.draw(gl, time, resolution)

  time += 0.025

  window.requestAnimationFrame(render)
}

document.addEventListener('DOMContentLoaded', render)
