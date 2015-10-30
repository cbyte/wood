function SphereCollision(center, radius) {
  this.c = vec3.fromValues(center[0], center[1], center[2]);
  this.r = radius;
}

SphereCollision.prototype.sphereIntersection = function(sphere) {
  if (vec3.dist(this.c, sphere.c) < this.r + sphere.r) {
    return 1;
  }
  return 0;
}


/* After https://www.siggraph.org/education/materials/HyperGraph/raytrace/rtinter1.htm */
SphereCollision.prototype.rayIntersection = function(position, direction) {
  vec3.normalize(direction, direction);

  var A = this.r[0] * this.r[0] + this.r[1] * this.r[1] + this.r[2] * this.r[2];
  var B = 2 * (direction[0] * (position[0] - this.c[0]) +
    direction[1] * (position[1] - this.c[1]) +
    direction[2] * (position[2] - this.c[2]));
  var C = (position[0] - this.c[0]) * (position[0] - this.c[0]) + (position[1] - this.c[1]) * (position[1] - this.c[1]) + (position[2] - this.c[2]) * (position[2] - this.c[2]) - this.r * this.r;
  var discriminant = Math.pow(B * B - 4 * C, 0.5)
  if (discriminant < 0) {
    return false;
  }
  var x = (-B + discriminant) / 2;
  var out = vec3.create();
  if (x > 0) {
    vec3.scaleAndAdd(out, position, direction, x);
    return out;
  }

  x = (-B - discriminant) / 2;
  if (!x) {
    return;
  }
  vec3.scaleAndAdd(out, position, direction, x);
  return out;
}
