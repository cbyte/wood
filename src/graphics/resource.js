
var Resource = new function() {
  this.resources = new Array();

  this.getTexture = function(f) {
    if (!this.resources[f]) {
      console.log("loading texture " + f);
      this.resources[f] = new Texture(f);
    }
    return this.resources[f];
  }

  this.getModel = function(f) {
    if (!this.resources[f]) {
      console.log("loading model " + f);
      this.resources[f] = new Model(f);
    }
    return this.resources[f];
  }
};