// todo: remove pos,scale,dir
function Entity(model, atlas, defanim) {
  this.model = model;
  this.position = [0, 0, 0];
  this.scale = [1, 1, 1];
  this.rotation = quat.create();
  quat.identity(this.rotation);

  if (atlas) {
    this.atlas = new Atlas(0, 0, new Array([0]));
    this.atlas.clone(atlas);
    this.atlas.play(defanim);
  }
  // this.coll = new AABB(scale);

  //for editor
  this.modeloffset = 0;

  this.renderDisableDepthBuffer = false;
}

Entity.prototype.setRotation = function(yaw, pitch, roll) {
  quat.identity(this.rotation);
  quat.rotateX(this.rotation, this.rotation, roll * DEGREE_TO_RAD);
  quat.rotateY(this.rotation, this.rotation, pitch * DEGREE_TO_RAD);
  quat.rotateZ(this.rotation, this.rotation, yaw * DEGREE_TO_RAD);
}

Entity.prototype.setRotationX = function(degree) {
  quat.rotateX(this.rotation, this.rotation, degree * DEGREE_TO_RAD);
}

Entity.prototype.setRotationY = function(degree) {
  quat.rotateY(this.rotation, this.rotation, degree * DEGREE_TO_RAD);
}

Entity.prototype.setRotationZ = function(degree) {
  quat.rotateZ(this.rotation, this.rotation, degree * DEGREE_TO_RAD);
}

Entity.prototype.update = function() {}