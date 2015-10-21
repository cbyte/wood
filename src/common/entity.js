function Entity(pos, scale, dir, model, atlas, defanim) {
  this.model = model;
  this.pos = pos;
  this.scale = scale;
  this.rotate = dir;
  if (atlas) {
    this.atlas = new Atlas(0, 0, new Array([0]));
    this.atlas.clone(atlas);
    this.atlas.play(defanim);
  }
  this.coll = new AABB(scale);

  //for editor
  this.modeloffset = 0;
}

Entity.prototype.update = function() {}