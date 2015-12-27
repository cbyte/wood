function Skybox(game, model) {
  Entity.call(this, game, model);
  this.renderDisableDepthBuffer = true;
}

Skybox.prototype = Object.create(Entity.prototype);
Skybox.prototype.constructor = Skybox;

Skybox.prototype.update = function() {

}
