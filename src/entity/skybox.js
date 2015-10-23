function Skybox() {
    Resource.add(new Texture("skybox/frozen_back.jpg"))
    Resource.add(new Texture("skybox/frozen_front.jpg"))
    Resource.add(new Texture("skybox/frozen_left.jpg"))
    Resource.add(new Texture("skybox/frozen_right.jpg"))
    Resource.add(new Texture("skybox/frozen_top.jpg"))
    Resource.add(new Model("skybox/skybox.json"))

    Entity.call(this,[0, 0, 0], [10, 10, 10], [0, 0, 0], Resource.get('skybox/skybox.json'))
    this.renderDisableDepthBuffer = true;
}

Skybox.prototype = new Entity;
Skybox.prototype.constructor = Skybox;