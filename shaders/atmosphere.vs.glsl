// Ulises Romero
precision mediump float;

// Input attributes
attribute vec3 aVertexPosition;
attribute vec2 uv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
// uniform mat4

// Output varying variables
varying vec2 vUv;

void main() {
  // Assign the UV coordinates to the varying variable
  vUv = uv;

  // Note: Perform any other transformations or calculations on the position if needed here

  // Set the final position for the vertex
  // gl_Position = projectionMatrix * uViewMatrix; * vec4(aVertexPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aVertexPosition, 1.0);

}
