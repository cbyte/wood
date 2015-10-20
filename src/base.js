var Engine = new function() {
  this.init = function() {
    this.initGL();
    Input.init();

    var canvas = document.querySelector('canvas');
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    canvas.onclick = function() {
      canvas.requestPointerLock();
    }

    Game.init();
  }

  this.noWebGL = function() {
    document.body.innerHTML = "NOWEBGL"
  }

  this.initGL = function() {
    this.canvas = document.querySelector('canvas')
    try {
      gl = this.canvas.getContext('webgl');
    } catch (e) {
      console.log('error', e)
    }

    if (!gl) {
      NoWebGL();
      return;
    }

    Renderer.initShader();
  }

}
