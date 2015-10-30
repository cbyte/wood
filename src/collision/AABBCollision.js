function AABB(r) {
  this.c = [0, 0, 0]; // current position of entity is used as center 
  if (r && r.length === 3) {
    this.r = vec3.fromValues(r[0], r[1], r[2]);
  }
}

AABB.prototype.generateFromModel = function(m) {
  
}

AABB.prototype.AABBintersection = function(object, objectlist) {
  for (var i = 0; i < objectlist.length; i++) {
    if (Math.abs(object.c[0] - objectlist[i].c[0]) > object.r[0] + objectlist[i].r[0]) continue;
    if (Math.abs(object.c[1] - objectlist[i].c[1]) > object.r[1] + objectlist[i].r[1]) continue;
    if (Math.abs(object.c[2] - objectlist[i].c[2]) > object.r[2] + objectlist[i].r[2]) continue;

    return 1;
  }
  return 0;
}