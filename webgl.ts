//Credit to: https://github.com/AlexJWayne/ts-gl-shader/blob/main/examples/hello-world-3d/hello-world-3d.ts
// I have ported it to using gl-matrix for mat4 and vec3 operations instead of using its own libary for the same.


import { createShaderProgram } from '@alexjwayne/ts-gl-shader'
import { mat4, vec3 } from 'gl-matrix'

// Pass a 3d coordinate straight through.
const dVertSrc = /* glsl */ `
  precision mediump float;
  
  attribute vec3 aVert;
  
  uniform mat4 uProjection;
  uniform mat4 uMatrix;

  void main() {
    gl_Position = uProjection * uMatrix * vec4(aVert, 1.0);
  }
`

// Create a fragment shader that colors the radar shape a blue to purple reflectivity color scale
const dFragSrc = /* glsl */ `
  precision mediump float;

  uniform vec4 colorScale[8];
  uniform float reflectivity;


  
  void main() {
    float reflectivity = 0.5;
    float reflectivityIndex = floor(reflectivity * 8.0);
    vec4 color = colorScale[int(reflectivityIndex)];
    gl_FragColor = color;
  }
`



function start() {
  const canvas = setupCanvas()
  const gl = getWebGLContext(canvas)

  // const cubeVerts = createCube(gl)
  const radarVerts = createRadar(gl)

  // Create the shader program
  const shader = createShaderProgram(gl, dVertSrc, dFragSrc)
  gl.useProgram(shader)

  // Get the attribute location
  const aVert = gl.getAttribLocation(shader, 'aVert')
  gl.enableVertexAttribArray(aVert)
  const colorScaleFloat32Array = new Float32Array([
    0.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
  ])
  const radarColorScale = shader.uniforms['colorScale[8]'].setArray(colorScaleFloat32Array)

  // Get the uniform location
  const uProjection = gl.getUniformLocation(shader, 'uProjection')
  const uMatrix = gl.getUniformLocation(shader, 'uMatrix')
  const reflectivity = gl.getUniformLocation(shader, 'reflectivity')

  // Set the projection matrix
  const projection = mat4.create()
  mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, 0.1, 100)

  // Set the model matrix
  const model = mat4.create()
  mat4.translate(model, model, vec3.fromValues(0, 0, -5))

  // Set the view matrix
  const view = mat4.create()

  // Set the reflectivity
  gl.uniform1f(reflectivity, 0.5)

  // Set the projection matrix
  gl.uniformMatrix4fv(uProjection, false, projection)

  // Set the model matrix
  gl.uniformMatrix4fv(uMatrix, false, model)

  // Bind the buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, radarVerts)
  gl.vertexAttribPointer(aVert, 3, gl.FLOAT, false, 0, 0)

  // Render loop
  function render() {
    // Clear the screen
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Rotate the model matrix
    mat4.rotateX(model, model, Math.PI / 180)
    mat4.rotateY(model, model, Math.PI / 180)
    gl.uniformMatrix4fv(uMatrix, false, model)

    // Draw the radar
    gl.drawArrays(gl.TRIANGLES, 0, 36)









    // Next frame
    requestAnimationFrame(render)
  }

  // Start rendering
  requestAnimationFrame(render)
}

function createCube(gl: WebGL2RenderingContext): WebGLBuffer {
  const quadBuffer = gl.createBuffer()
  if (!quadBuffer) throw new Error('gl.createBuffer() returned null')

  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 1, 1, -1, 1, 1, 1, 1,

      -1, -1, 1, 1, 1, 1, -1, 1, 1,

      1, -1, 1, 1, -1, -1, 1, 1, -1,

      1, -1, 1, 1, 1, -1, 1, 1, 1,

      1, -1, -1, -1, -1, -1, -1, 1, -1,

      1, -1, -1, -1, 1, -1, 1, 1, -1,

      -1, -1, -1, -1, -1, 1, -1, 1, 1,

      -1, -1, -1, -1, 1, 1, -1, 1, -1,

      -1, 1, 1, 1, 1, 1, 1, 1, -1,

      -1, 1, 1, 1, 1, -1, -1, 1, -1,

      1, -1, 1, -1, -1, -1, 1, -1, -1,

      1, -1, 1, -1, -1, 1, -1, -1, -1,
    ]),

    gl.STATIC_DRAW,
  )

  return quadBuffer
}

function createRadar(gl: WebGL2RenderingContext): WebGLBuffer {
  const radarBuffer = gl.createBuffer()
  if (!radarBuffer) throw new Error('gl.createBuffer() returned null')

  gl.bindBuffer(gl.ARRAY_BUFFER, radarBuffer)
  //create buffer data for radar
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 1, 1, -1, 1, 1, 1, 1,

      -1, -1, 1, 1, 1, 1, -1, 1, 1,

      1, -1, 1, 1, -1, -1, 1, 1, -1,

      1, -1, 1, 1, 1, -1, 1, 1, 1,

      1, -1, -1, -1, -1, -1, -1, 1, -1,

      1, -1, -1, -1, 1, -1, 1, 1, -1,

      -1, -1, -1, -1, -1, 1, -1, 1, 1,

      -1, -1, -1, -1, 1, 1, -1, 1, -1,

      -1, 1, 1, 1, 1, 1, 1, 1, -1,

      -1, 1, 1, 1, 1, -1, -1, 1, -1,

      1, -1, 1, -1, -1, -1, 1, -1, -1,

      1, -1, 1, -1, -1, 1, -1, -1, -1,
    ]),

    gl.STATIC_DRAW,
  )

  return radarBuffer

}

function setupCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  if (!canvas) throw new Error('Unable to find canvas element.')

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  return canvas
}

function getWebGLContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2')
  if (!gl) throw new Error('Unable to create WebGL context.')

  gl.viewport(0, 0, canvas.width, canvas.height)

  gl.enable(gl.DEPTH_TEST)

  return gl
}

start()
