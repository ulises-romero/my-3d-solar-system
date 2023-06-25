// Ulises Romero
precision mediump float;

uniform sampler2D cloudTexture;

varying vec2 vUv;

void main(void) {
    // Calculate the emissive light contribution by multiplying the texture color with the emissive color
    vec4 cloudColor = texture2D(cloudTexture, vUv);

    cloudColor = vec4(cloudColor.rgb, cloudColor.r);  // 0.5 represents the desired transparency value (0.0 = fully transparent, 1.0 = fully opaque)

    gl_FragColor = cloudColor;
}