'use strict'

const DrawingSurface = require('../index')

const canvasRender = document.createElement('canvas')
canvasRender.id = 'canvas-render'
canvasRender.width = window.innerWidth
canvasRender.height = window.innerHeight
canvasRender.style.position = 'absolute'
canvasRender.style.left = 0
canvasRender.style.top = 0
canvasRender.style.zIndex = 10
canvasRender.style.backgroundColor = 'rgb(22, 22, 29)'
document.body.appendChild(canvasRender)

window.addEventListener('resize', () => {
  canvasRender.width = window.innerWidth
  canvasRender.height = window.innerHeight
})

let ready = false

const gl = canvasRender.getContext('webgl')

const video = document.createElement('video')
video.muted = true
video.style.visibility = 'hidden'
video.style.position = 'absolute'
video.style.left = 0
video.style.top = 0
video.style.zIndex = 0
video.setAttribute('playsinline', null)
document.body.appendChild(video)
video.addEventListener('canplaythrough', () => {
  video.play()
  setTimeout(() => { ready = true }, 10)
})

navigator.mediaDevices.getUserMedia({ audio: false, video: true, facingMode: 'user' }).then((stream) => {
  video.srcObject = stream
}).catch(console.error)

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
uniform vec2 u_resolution;

uniform sampler2D u_textureStream;
uniform sampler2D u_texture1;

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec2 random2f(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)))) * 43758.5453);
}

void main() {
  vec2 st = (gl_FragCoord.xy / u_resolution.xy);

  vec2 coord = v_texcoord;

  float offset = texture2D(u_texture1, coord).r;

  coord += ((offset - .5) * .1);
  vec3 color = texture2D(u_textureStream, coord).rgb;

  gl_FragColor = vec4(color, 1.);
}
`

const surface = new DrawingSurface(gl, vs, fs, 2)

const displace = new Image()
displace.src = require('./camo.png')
displace.addEventListener('load', () => {
  surface.setTextureByIndex(gl, 0, displace)
})

let time = 0
let resolution = [canvasRender.width, canvasRender.height]

function render () {
  if (ready) {
    time += .1

    surface.updateTextureStream(gl, video)

    surface.drawTexture(gl, time, resolution, video.clientWidth, video.clientHeight)
  }

  window.requestAnimationFrame(render)
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(render, 1)
})
