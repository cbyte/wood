function FirstPersonCamera(game) {
  Camera.call(this);

  this.speedForward = .01;
  this.speedStrafe = .01;
  this.speedForwardStrafe = .01 / Math.sqrt(2);

  this.skybox = new Skybox(game, Resource.get('content/skybox.json'));
}

FirstPersonCamera.prototype = Object.create(Camera.prototype);
FirstPersonCamera.prototype.constructor = FirstPersonCamera;

FirstPersonCamera.prototype.update = function(ts) {
  Object.getPrototypeOf(FirstPersonCamera.prototype).update.call(this, ts);

  this.skybox.position = this.position;

  if ((Input.up || Input.dn) && (Input.rt || Input.lt)) {
    // move diagonally
    vec3.scaleAndAdd(this.position, this.position, vec3.clone(this.forward), (Input.up - Input.dn) * ts * this.speedForwardStrafe);
    vec3.scaleAndAdd(this.position, this.position, vec3.clone(this.right), (Input.rt - Input.lt) * ts * this.speedForwardStrafe);
  } else {
    // move forwards or backwards
    vec3.scaleAndAdd(this.position, this.position, vec3.clone(this.forward), (Input.up - Input.dn) * ts * this.speedForward);
    // move left or right
    vec3.scaleAndAdd(this.position, this.position, vec3.clone(this.right), (Input.rt - Input.lt) * ts * this.speedStrafe);
  }

}
