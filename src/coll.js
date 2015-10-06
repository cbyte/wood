function Sphere(c,r) {
	this.c = vec3.fromValues(c[0],c[1],c[2]);
	this.r = r;
}

function testSphere(object, objectlist) {
	for(var i=0;i<objectlist.length;i++) {
		if(vec3.dist(object.c,objectlist[i].spcoll.c)<object.r+objectlist[i].spcoll.r)
			return 1;
		continue;
	}
	return 0;
}

function AABB(r) {
	this.c = [0,0,0]; // current position of entity is used as center 
	if(r && r.length===3) {
		this.r = vec3.fromValues(r[0],r[1],r[2]);
	}
}

function testAABB(object, objectlist) {
	for(var i=0;i<objectlist.length;i++) {
		if(Math.abs(object.c[0]-objectlist[i].pos[0]) > object.r[0] + objectlist[i].coll.r[0]) continue;
		if(Math.abs(object.c[1]-objectlist[i].pos[1]) > object.r[1] + objectlist[i].coll.r[1]) continue;
		if(Math.abs(object.c[2]-objectlist[i].pos[2]) > object.r[2] + objectlist[i].coll.r[2]) continue;
		
		return 1;
	}
	return 0;
}
