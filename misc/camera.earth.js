function EarthCamera(input, target) {
    this.input = input;
    this.target = target;
    this.distance = 20;
    this.rotation = new Vector3(0, 0, 0);
  }
  
  EarthCamera.prototype.update = function() {
    // Calculate camera position based on target position, distance, and rotation
    var position = new Vector3(
      this.target.x + this.distance * Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
      this.target.y + this.distance * Math.sin(this.rotation.x),
      this.target.z + this.distance * Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
    );
  
    // Aim the camera at the target
    var viewMatrix = new Matrix4().setLookAt(position, this.target, new Vector3(0, 1, 0));
  
    // Update the projection and view matrices
    projectionMatrix.setPerspective(45, gl.canvasWidth / gl.canvasHeight, 0.1, 1000);
    cameraMatrix = viewMatrix;
  };
  