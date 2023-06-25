//Ulises Romero
'use strict'

var gl;
var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);

// Planet Geometry
var sunGeometry = null;
var mercuryGeometry = null;
var venusGeometry = null;
var earthGeometry = null;
var moonGeometry = null;
var marsGeometry = null;
var jupiterGeometry = null;
var saturnGeometry = null;
var uranusGeometry = null;
var neptuneGeometry = null;
var atmosphereGeometry = null;

// Sky box Geometry 
var skyBox = {
    negX : null,
    negY: null, 
    negZ: null, 
    posX: null, 
    posY: null, 
    posZ: null 
}

var projectionMatrix = new Matrix4();
var lightPosition = new Vector4(0, 0, 0, 0);

// the shader that will be used by each piece of geometry (they could each use their own shader but in this case it will be the same)
var phongShaderProgram;
var planetLightProgram;
var atmosphereShaderProgram;

// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

var loadedSolarSystemAssets = {
    phongTextVS: null, 
    phongTextFS: null,
    sphereJSON: null, 
    sunImage: null, 
    mercuryImage: null, 
    venusImage: null, 
    earthImage: null, 
    moonImage: null, 
    marsImage: null, 
    jupiterImage: null, 
    saturnImage: null, 
    uranusImage: null, 
    neptuneImage: null, 
    planetTextFS: null, 
    planetTextVS: null,
    skyBoxNegX_Image: null,
    skyBoxNegY_Image: null, 
    skyBoxNegZ_Image: null, 
    skyBoxPosX_Image: null, 
    skyBoxPosY_Image: null,
    skyBoxPosZ_Image: null, 
    cloudsImage: null,
    atmosphereTextVS: null,
    atmosphereTextFS: null
};

// -------------------------------------------------------------------------
// Old function 
function initializeAndStartRendering() {
    initGL();
    loadSolarSystemAssets(function(){
        createShaders(loadedSolarSystemAssets);
        createScene();

        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;

        gl.enable(gl.DEPTH_TEST);
    } catch (e) {}

    if (!gl) {
        alert("Could not initialize WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------

function loadSolarSystemAssets(onLoadedCB){
    var filePromises = [
        fetch('./shaders/phong.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/phong.pointlit.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/sun.jpg'), 
        loadImage('./data/Additional Planets/mercury.jpg'),
        loadImage('./data/Additional Planets/venus.jpg'),
        loadImage('./data/earth.jpg'),
        loadImage('./data/moon.png'),
        loadImage('./data/Additional Planets/mars.jpg'),
        loadImage('./data/Additional Planets/jupiter.jpg'),
        loadImage('./data/Additional Planets/saturn.jpg'),
        loadImage('./data/Additional Planets/uranus.jpg'),
        loadImage('./data/Additional Planets/neptune.jpg'),
        fetch('./shaders/flat.color.fs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/flat.color.vs.glsl').then((response) => { return response.text(); }),
        loadImage('./data/Skybox Faces/GalaxyTex_NegativeX.png'),
        loadImage('./data/Skybox Faces/GalaxyTex_NegativeY.png'),
        loadImage('./data/Skybox Faces/GalaxyTex_NegativeZ.png'),
        loadImage('./data/Skybox Faces/GalaxyTex_PositiveX.png'),
        loadImage('./data/Skybox Faces/GalaxyTex_PositiveY.png'),
        loadImage('./data/Skybox Faces/GalaxyTex_PositiveZ.png'),
        loadImage('./data/Earth Day-Night-Clouds/2k_earth_clouds.jpg'),
        fetch('./shaders/atmosphere.fs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/atmosphere.vs.glsl').then((response) => { return response.text(); })
    ];

    Promise.all(filePromises).then(function(values) {
        // Assign loaded data to our named variables
        loadedSolarSystemAssets.phongTextVS = values[0];
        loadedSolarSystemAssets.phongTextFS = values[1];
        loadedSolarSystemAssets.sphereJSON = values[2];
        loadedSolarSystemAssets.sunImage = values[3];
        loadedSolarSystemAssets.mercuryImage = values[4];
        loadedSolarSystemAssets.venusImage = values[5];
        loadedSolarSystemAssets.earthImage = values[6];
        loadedSolarSystemAssets.moonImage = values[7];
        loadedSolarSystemAssets.marsImage = values[8];
        loadedSolarSystemAssets.jupiterImage = values[9];
        loadedSolarSystemAssets.saturnImage = values[10];
        loadedSolarSystemAssets.uranusImage = values[11];
        loadedSolarSystemAssets.neptuneImage = values[12];
        loadedSolarSystemAssets.planetTextFS = values[13];
        loadedSolarSystemAssets.planetTextVS = values[14];
        loadedSolarSystemAssets.skyBoxNegX_Image = values[15];
        loadedSolarSystemAssets.skyBoxNegY_Image = values[16];
        loadedSolarSystemAssets.skyBoxNegZ_Image = values[17];
        loadedSolarSystemAssets.skyBoxPosX_Image = values[18];
        loadedSolarSystemAssets.skyBoxPosY_Image = values[19];
        loadedSolarSystemAssets.skyBoxPosZ_Image = values[20];
        loadedSolarSystemAssets.cloudsImage = values[21];
        loadedSolarSystemAssets.atmosphereTextFS = values[22];
        loadedSolarSystemAssets.atmosphereTextVS = values[23];
    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

// -------------------------------------------------------------------------
function createShaders(loadedSolarSystemAssets) {
    phongShaderProgram = createCompiledAndLinkedShaderProgram(loadedSolarSystemAssets.phongTextVS, loadedSolarSystemAssets.phongTextFS);
    atmosphereShaderProgram = createCompiledAndLinkedShaderProgram(loadedSolarSystemAssets.atmosphereTextVS, loadedSolarSystemAssets.atmosphereTextFS)
    planetLightProgram = createCompiledAndLinkedShaderProgram(loadedSolarSystemAssets.planetTextVS, loadedSolarSystemAssets.planetTextFS);

    phongShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(phongShaderProgram, "aVertexPosition"),
        vertexNormalsAttribute: gl.getAttribLocation(phongShaderProgram, "aNormal"),
        vertexTexcoordsAttribute: gl.getAttribLocation(phongShaderProgram, "aTexcoords"),
        // added here too
        // sphereVertexPositionAttribute: gl.getAttribLocation(planetLightProgram, "aVertexPosition")
    };

    phongShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uProjectionMatrix"),
        lightPositionUniform: gl.getUniformLocation(phongShaderProgram, "uLightPosition"),
        cameraPositionUniform: gl.getUniformLocation(phongShaderProgram, "uCameraPosition"),
        textureUniform: gl.getUniformLocation(phongShaderProgram, "uTexture")
        // boolUniform: gl.getUniformLocation(phongShaderProgram, "doPointLighting")
        // added here too
        // sphereWorldMatrixUniform: gl.getUniformLocation(planetLightProgram, "uWorldMatrix"),
        // sphereViewMatrixUniform: gl.getUniformLocation(planetLightProgram, "uViewMatrix"),
        // sphereProjectionMatrixUniform: gl.getUniformLocation(planetLightProgram, "uProjectionMatrix")
    };

    planetLightProgram.attributes = { 
        vertexPositionAttribute: gl.getAttribLocation(planetLightProgram, "aVertexPosition"),
        vertexTexcoordsAttribute: gl.getAttribLocation(planetLightProgram, "aTexcoords")
    }

    planetLightProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(planetLightProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(planetLightProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(planetLightProgram, "uProjectionMatrix"),
        textureUniform: gl.getUniformLocation(planetLightProgram, "uTexture"),
        emissiveColorUniform: gl.getUniformLocation(planetLightProgram, "uEmissiveColor")
    }

    atmosphereShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(atmosphereShaderProgram, "aVertexPosition"),
        vertexTexcoordsAttribute: gl.getAttribLocation(atmosphereShaderProgram, "uv")
    }

    atmosphereShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(atmosphereShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(atmosphereShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(atmosphereShaderProgram, "uProjectionMatrix"), 
        textureUniform: gl.getUniformLocation(atmosphereShaderProgram, "cloudTexture")
    }
}

// -------------------------------------------------------------------------
function createScene() {
    // Create Sky Box Quad Geometry 
    skyBox.negX = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyBox.negX.create(loadedSolarSystemAssets.skyBoxNegX_Image);

    skyBox.negY = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyBox.negY.create(loadedSolarSystemAssets.skyBoxNegY_Image);

    skyBox.negZ = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyBox.negZ.create(loadedSolarSystemAssets.skyBoxNegZ_Image);

    skyBox.posX = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyBox.posX.create(loadedSolarSystemAssets.skyBoxPosX_Image);

    skyBox.posY = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyBox.posY.create(loadedSolarSystemAssets.skyBoxPosY_Image);

    skyBox.posZ = new WebGLGeometryQuad(gl, phongShaderProgram);
    skyBox.posZ.create(loadedSolarSystemAssets.skyBoxPosZ_Image);

    // Define Sky Box Scale & Translations
    var scaleValue = 150.0;
    var scale = new Matrix4().makeScale(scaleValue, scaleValue, scaleValue);
    var translationNegX = new Matrix4().makeTranslation(-scaleValue, 0, 0);
    var translationNegY = new Matrix4().makeTranslation(0, -scaleValue, 0);
    var translationNegZ = new Matrix4().makeTranslation(0, 0, -scaleValue); // u
    var translationPosX = new Matrix4().makeTranslation(scaleValue, 0, 0);
    var translationPosY = new Matrix4().makeTranslation(0, scaleValue, 0);
    var translationPosZ = new Matrix4().makeTranslation(0, 0, scaleValue); // u

    // Place Sky Box Face Negative X [DONE]
    skyBox.negX.worldMatrix.makeIdentity();
    skyBox.negX.worldMatrix.multiply(translationNegZ).multiply(scale);

    // Place Sky Box Face Negative Y 
    var rotationNegY = new Matrix4().makeRotationX(-90);
    skyBox.negY.worldMatrix.makeIdentity();
    skyBox.negY.worldMatrix.multiply(translationNegY).multiply(rotationNegY).multiply(scale);

    // Place Sky Box Face Negative Z [DONE]
    var rotationNegZ = new Matrix4().makeRotationY(90);
    skyBox.negZ.worldMatrix.makeIdentity();
    skyBox.negZ.worldMatrix.multiply(translationNegX).multiply(rotationNegZ).multiply(scale);

    // Place Sky Box Face Positive X [DONE]
    var rotationPosX = new Matrix4().makeRotationY(180);
    skyBox.posX.worldMatrix.makeIdentity();
    skyBox.posX.worldMatrix.multiply(translationPosZ).multiply(rotationPosX).multiply(scale);

    // Place Sky Box Face Positive Y
    var rotationPosY = new Matrix4().makeRotationX(90);
    skyBox.posY.worldMatrix.makeIdentity();
    skyBox.posY.worldMatrix.multiply(translationPosY).multiply(rotationPosY).multiply(scale);

    // Place Sky Box Face Positive Z [DONE]
    var rotationPosZ = new Matrix4().makeRotationY(-90);
    skyBox.posZ.worldMatrix.makeIdentity();
    skyBox.posZ.worldMatrix.multiply(translationPosX).multiply(rotationPosZ).multiply(scale);

    //------------------------------------- PLANETS ------------------------------------------

    // Place the sun 
    sunGeometry = new WebGLGeometryJSON(gl);
    sunGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.sunImage);

    var sunScale = new Matrix4().makeScale(0.15, 0.15, 0.15);
    sunGeometry.worldMatrix.multiply(sunScale);

    // Place Mercury 
    mercuryGeometry = new WebGLGeometryJSON(gl);
    mercuryGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.mercuryImage);

    var mercuryScale = new Matrix4().makeScale(0.01, 0.01, 0.01);
    var mercuryStarterPos = -12;
    var mercuryTranslation = new Matrix4().makeTranslation(mercuryStarterPos, 0, 0);
    mercuryGeometry.worldMatrix.multiply(mercuryTranslation).multiply(mercuryScale);

    // Place Venus
    venusGeometry = new WebGLGeometryJSON(gl);
    venusGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.venusImage);

    var venusScale = new Matrix4().makeScale(0.015, 0.015, 0.015);
    var venusStarterPos = mercuryStarterPos + (-5);
    var venusTranslation = new Matrix4().makeTranslation(venusStarterPos, 0, 0);
    venusGeometry.worldMatrix.multiply(venusTranslation).multiply(venusScale);

    // Place Earth
    earthGeometry = new WebGLGeometryJSON(gl);
    earthGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.earthImage);

    var earthScale = new Matrix4().makeScale(0.020, 0.020, 0.020);
    var earthStarterPos = venusStarterPos + (-5.5);
    var earthTranslation = new Matrix4().makeTranslation(earthStarterPos, 0, 0);
    earthGeometry.worldMatrix.multiply(earthTranslation).multiply(earthScale);

    // Place Moon
    moonGeometry = new WebGLGeometryJSON(gl);
    moonGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.moonImage);

    var moonScale = new Matrix4().makeScale(0.005, 0.005, 0.005);
    var moonTranslation = new Matrix4().makeTranslation(earthStarterPos + (-2), 0, 0);
    moonGeometry.worldMatrix.multiply(moonTranslation).multiply(moonScale);

    // Place Mars
    marsGeometry = new WebGLGeometryJSON(gl);
    marsGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.marsImage);

    var marsScale = new Matrix4().makeScale(0.011, 0.011, 0.011);
    var marsStarterPos = earthStarterPos + (-5);
    var marsTranslation = new Matrix4().makeTranslation(marsStarterPos, 0, 0);
    marsGeometry.worldMatrix.multiply(marsTranslation).multiply(marsScale);

    // Place Jupiter 
    jupiterGeometry = new WebGLGeometryJSON(gl);
    jupiterGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.jupiterImage);

    var jupiterScale = new Matrix4().makeScale(0.045, 0.045, 0.045);
    var jupiterStarterPos = marsStarterPos + (-6.5);
    var jupiterTranslation = new Matrix4().makeTranslation(jupiterStarterPos, 0, 0);
    jupiterGeometry.worldMatrix.multiply(jupiterTranslation).multiply(jupiterScale);

    // Place Saturn 
    saturnGeometry = new WebGLGeometryJSON(gl);
    saturnGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.saturnImage);

    var saturnScale = new Matrix4().makeScale(0.04, 0.04, 0.04);
    var saturnStarterPos = jupiterStarterPos + (-7.5);
    var saturnTranslation = new Matrix4().makeTranslation(saturnStarterPos, 0, 0);
    saturnGeometry.worldMatrix.multiply(saturnTranslation).multiply(saturnScale);

    // Place Uranus
    uranusGeometry = new WebGLGeometryJSON(gl);
    uranusGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.uranusImage);

    var uranusScale = new Matrix4().makeScale(0.025, 0.025, 0.025);
    var uranusStarterPos = saturnStarterPos + (-6.25);
    var uranusTranslation = new Matrix4().makeTranslation(uranusStarterPos, 0, 0);
    uranusGeometry.worldMatrix.multiply(uranusTranslation).multiply(uranusScale);

    // Place Neptune
    neptuneGeometry = new WebGLGeometryJSON(gl);
    neptuneGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.neptuneImage);

    var neptuneScale = new Matrix4().makeScale(0.02, 0.02, 0.02);
    var neptuneStarterPos = uranusStarterPos + (-6);
    var neptuneTranslation = new Matrix4().makeTranslation(neptuneStarterPos, 0, 0);
    neptuneGeometry.worldMatrix.multiply(neptuneTranslation).multiply(neptuneScale);

    // Place earth atmosphere
    atmosphereGeometry = new WebGLGeometryJSON(gl);
    atmosphereGeometry.create(loadedSolarSystemAssets.sphereJSON, loadedSolarSystemAssets.cloudsImage);

    var atmosphereScale = new Matrix4().makeScale(0.022, 0.022, 0.022);
    var atmosphereTranslation = new Matrix4().makeTranslation(earthStarterPos, 0, 0);
    atmosphereGeometry.worldMatrix.multiply(atmosphereTranslation).multiply(atmosphereScale);
}

// -------------------------------------------------------------------------
function updateAndRender() { 
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    // var rotationMatrix = new Matrix4().makeRotationY(-45.0 * time.deltaTime); 
   
    orbitPlanets();

    time.update();

    camera.earthPos = new Vector4(earthGeometry.worldMatrix.elements[3] + 4, earthGeometry.worldMatrix.elements[7], earthGeometry.worldMatrix.elements[11], 1);
    camera.update(time.deltaTime);

    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(phongShaderProgram);
    var uniforms = phongShaderProgram.uniforms;
    gl.uniform3f(uniforms.lightPositionUniform, lightPosition.x, lightPosition.y, lightPosition.z);

    sunGeometry.render(camera, projectionMatrix, planetLightProgram);

    projectionMatrix.makePerspective(45, aspectRatio, 0.1, 1000);

    // Render Sky Box
    skyBox.negX.render(camera, projectionMatrix, planetLightProgram);
    skyBox.negY.render(camera, projectionMatrix, planetLightProgram);
    skyBox.negZ.render(camera, projectionMatrix, planetLightProgram);
    skyBox.posX.render(camera, projectionMatrix, planetLightProgram);
    skyBox.posY.render(camera, projectionMatrix, planetLightProgram);
    skyBox.posZ.render(camera, projectionMatrix, planetLightProgram);

    // Render planets
    mercuryGeometry.render(camera, projectionMatrix, phongShaderProgram);
    venusGeometry.render(camera, projectionMatrix, phongShaderProgram);
    earthGeometry.render(camera, projectionMatrix, phongShaderProgram);
    moonGeometry.render(camera, projectionMatrix, phongShaderProgram);
    marsGeometry.render(camera, projectionMatrix, phongShaderProgram);
    jupiterGeometry.render(camera, projectionMatrix, phongShaderProgram);
    saturnGeometry.render(camera, projectionMatrix, phongShaderProgram);
    uranusGeometry.render(camera, projectionMatrix, phongShaderProgram);
    neptuneGeometry.render(camera, projectionMatrix, phongShaderProgram);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    atmosphereGeometry.render(camera, projectionMatrix, atmosphereShaderProgram);
    gl.disable(gl.BLEND);
}

// -------------------------------------------------------------------------

function orbitPlanets(){
    // rotate planets in place 
    var XLrotationMatrix = new Matrix4().makeRotationY(-40.0 * time.deltaTime); // for the SUN
    var LrotationMatrix = new Matrix4().makeRotationY(-10.0 * time.deltaTime); // for jupiter and saturn 
    var MrotationMatrix = new Matrix4().makeRotationY(-15.0 * time.deltaTime); // for uranus & neptune 
    var SrotationMatrix = new Matrix4().makeRotationY(-17.0 * time.deltaTime); // for earth and venus
    var XSrotationMatrix = new Matrix4().makeRotationY(0.1 * time.deltaTime);  // for mercury & mars
    var atmosphereRotationMatrix = new Matrix4().makeRotationY(-15 * time.deltaTime); 

    sunGeometry.worldMatrix.multiply(XLrotationMatrix);
    mercuryGeometry.worldMatrix.multiply(XSrotationMatrix);
    venusGeometry.worldMatrix.multiply(SrotationMatrix);
    earthGeometry.worldMatrix.multiply(SrotationMatrix);
    marsGeometry.worldMatrix.multiply(XSrotationMatrix);
    jupiterGeometry.worldMatrix.multiply(LrotationMatrix);
    saturnGeometry.worldMatrix.multiply(LrotationMatrix);
    uranusGeometry.worldMatrix.multiply(MrotationMatrix);
    neptuneGeometry.worldMatrix.multiply(MrotationMatrix);
    atmosphereGeometry.worldMatrix.multiply(atmosphereRotationMatrix);

    // ORBIT PLANETS AROUND THE SUN ----------------------------------------------------------------------

    function orbitPlanet(planetGeometry, orbitSpeed) {
        var orbitRotationMatrix = new Matrix4().makeRotationY(orbitSpeed * time.deltaTime);
        var planetPosition = new Vector4(
            planetGeometry.worldMatrix.elements[3],
            planetGeometry.worldMatrix.elements[7],
            planetGeometry.worldMatrix.elements[11],
            0
        );

        var planetPos = orbitRotationMatrix.multiplyVector(planetPosition);

        planetGeometry.worldMatrix.elements[3] = planetPos.x;
        planetGeometry.worldMatrix.elements[7] = planetPos.y;
        planetGeometry.worldMatrix.elements[11] = planetPos.z;
    }

    // Orbit Mercury
    var mercuryOrbitSpeed = -47.9;
    orbitPlanet(mercuryGeometry, mercuryOrbitSpeed);

    // Orbit Venus
    var venusOrbitSpeed = -35.0;
    orbitPlanet(venusGeometry, venusOrbitSpeed);

    // Orbit Earth
    var earthOrbitSpeed = -29.8;
    orbitPlanet(earthGeometry, earthOrbitSpeed);
    orbitPlanet(atmosphereGeometry, earthOrbitSpeed);

    // Orbit Mars
    var marsOrbitSpeed = -24.1;
    orbitPlanet(marsGeometry, marsOrbitSpeed);

    // Orbit Jupiter
    var jupiterOrbitSpeed = -13.1;
    orbitPlanet(jupiterGeometry, jupiterOrbitSpeed);

    // Orbit Saturn
    var saturnOrbitSpeed = -9.7;
    orbitPlanet(saturnGeometry, saturnOrbitSpeed);

    // Orbit Uranus
    var uranusOrbitSpeed = -6.8;
    orbitPlanet(uranusGeometry, uranusOrbitSpeed);

    // Orbit Neptune
    var neptuneOrbitSpeed = -5.4;
    orbitPlanet(neptuneGeometry, neptuneOrbitSpeed);

    // Orbit Moon
    // var moonOrbitSpeed = -3;
    // var earthPosition = new Vector4(
    //     earthGeometry.worldMatrix.elements[3],
    //     earthGeometry.worldMatrix.elements[7],
    //     earthGeometry.worldMatrix.elements[11],
    //     0
    // );

    // var moonRotationMatrix = new Matrix4().makeRotationY(moonOrbitSpeed * time.deltaTime);

    // // Calculate the spherical coordinates of the moon's position relative to the Earth
    // var radius = 1.5; // Radius of the moon's orbit around the Earth
    // var theta = moonOrbitSpeed * time.deltaTime; // Angle of rotation around the Earth
    // var moonPositionSpherical = new Vector4(radius, 0, 0, 0);
    // moonRotationMatrix.multiplyVector(moonPositionSpherical);

    // // Convert spherical coordinates to Cartesian coordinates
    // var moonPositionCartesian = new Vector4(
    //     moonPositionSpherical.x * Math.cos(theta),
    //     moonPositionSpherical.y,
    //     moonPositionSpherical.x * Math.sin(theta),
    //     0
    // );

    // // Apply the translation to the moon's position relative to the Earth's position
    // moonGeometry.worldMatrix.elements[3] = earthPosition.x + moonPositionCartesian.x;
    // moonGeometry.worldMatrix.elements[7] = earthPosition.y + moonPositionCartesian.y;
    // moonGeometry.worldMatrix.elements[11] = earthPosition.z + moonPositionCartesian.z;
}