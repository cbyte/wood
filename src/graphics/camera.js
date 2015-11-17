var Camera = function() {
  this.position = vec3.create();
  // forward and right vector, indicating view direction
  this.forward = vec3.create();
  this.right = vec3.create();
}

/**
 * Calculate the view matrix
 * 
 * @return {mat4}
 */
Camera.prototype.getView = function() {
  var center = [0, 0, 1];

  var rotationYaw = quat.create();
  quat.setAxisAngle(rotationYaw, [0, 1, 0], Input.orientationX * DEGREE_TO_RAD);
  vec3.transformQuat(center, center, rotationYaw);

  var rotationRoll = quat.create();
  var right = vec3.create();
  vec3.cross(right, center, [0, 1, 0]);
  quat.setAxisAngle(rotationRoll, right, Input.orientationY * DEGREE_TO_RAD);
  vec3.transformQuat(center, center, rotationRoll);

  vec3.normalize(center, center);

  this.forward = vec3.clone(center);
  this.right = right;

  var view = mat4.create();
  vec3.add(center, center, this.position);
  mat4.lookAt(view, this.position, center, [0, 1, 0]);

  return view;
}

/**
 * Calculate the projection matrix
 * 
 * @return {mat4}
 */
Camera.prototype.getProjection = function() {
  var proj = mat4.create();
  var aspect = Engine.canvas.clientWidth / Engine.canvas.clientHeight;
  mat4.perspective(proj, 70, aspect, 0.1, 500.0);
  return proj;
}

/**
 * Camera update step
 * 
 * @param  {ts} timestamp
 */
Camera.prototype.update = function(ts) {

}
