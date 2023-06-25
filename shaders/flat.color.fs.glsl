// Ulises Romero
precision mediump float;

uniform sampler2D uTexture;

uniform vec3 uEmissiveColor;
varying vec2 vTexcoords;

void main(void) {
    // Calculate the emissive light contribution by multiplying the texture color with the emissive color
    vec4 emissive = vec4(texture2D(uTexture, vTexcoords).rgb * uEmissiveColor, 1.0);
    
    vec3 sunColor = texture2D(uTexture, vTexcoords).rgb;
    gl_FragColor = vec4(sunColor, 1.0);
}