var Camera = function() {
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.target = 0;
  this.pos = vec3.create();
  this.dist = vec3.create();
  this.follow = 0;

  // forward and right vector, indicating view direction
  this.forward = vec3.create();
  this.right = vec3.create();

  this.speedForward = 1;
  this.speedStrafe = 1;
  this.speedForwardStrafe = 1/Math.sqrt(2);

  /**
   * Calculate the view matrix
   * 
   * @return {mat4}
   */
  this.getView = function() {
    var center = [0, 0, 1];

    var rotationYaw = quat.create();
    quat.setAxisAngle(rotationYaw, [0, 1, 0], Input.orientationX * Math.PI / 180)
    vec3.transformQuat(center, center, rotationYaw);

    var rotationRoll = quat.create();
    var right = vec3.create();
    vec3.cross(right, center, [0, 1, 0]);
    quat.setAxisAngle(rotationRoll, right, Input.orientationY * Math.PI / 180)
    vec3.transformQuat(center, center, rotationRoll);

    vec3.normalize(center, center);

    this.forward = vec3.clone(center);
    this.right = right;

    var view = mat4.create();
    vec3.add(center, center, this.pos);
    mat4.lookAt(view, this.pos, center, [0, 1, 0]);

    return view;
  }

  /**
   * Calculate the projection matrix
   * 
   * @return {mat4}
   */
  this.getProjection = function() {
    var proj = mat4.create();
    mat4.perspective(proj, 70, 16 / 9, 0.1, 500.0);
    return proj;
  }

  /**
   * Camera update step
   * 
   * @param  {ts} timestamp
   */
  this.update = function(ts) {
    if((Input.up||Input.dn) && (Input.rt||Input.lt)) {
      vec3.scaleAndAdd(this.pos, this.pos, vec3.clone(this.forward), (Input.up - Input.dn) * ts * this.speedForwardStrafe);
      vec3.scaleAndAdd(this.pos, this.pos, vec3.clone(this.right), (Input.rt - Input.lt) * ts * this.speedForwardStrafe);
    } else {
      // move forwards or backwards
      vec3.scaleAndAdd(this.pos, this.pos, vec3.clone(this.forward), (Input.up - Input.dn) * ts * this.speedForward);
      // move left or right
      vec3.scaleAndAdd(this.pos, this.pos, vec3.clone(this.right), (Input.rt - Input.lt) * ts * this.speedStrafe);
    }
  }
};