function Sphere(c, r) {
  this.c = vec3.fromValues(c[0], c[1], c[2]);
  this.r = r;
}

function testSphere(object, objectlist) {
  for (var i = 0; i < objectlist.length; i++) {
    if (vec3.dist(object.c, objectlist[i].spcoll.c) < object.r + objectlist[i].spcoll.r)
      return 1;
    continue;
  }
  return 0;
}