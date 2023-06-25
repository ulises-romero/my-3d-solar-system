// Ulises Romero
precision mediump float;

attribute vec3 aVertexPosition;
attribute vec2 aTexcoords;

varying vec2 vTexcoords;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main(void) {
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aVertexPosition, 1.0);
    vTexcoords = aTexcoords;
}