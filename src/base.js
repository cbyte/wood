var Engine = new function() {
  this.init = function() {
    this.initGL();
    Input.init();

    this.canvas = document.querySelector('canvas');
    var canvas = this.canvas;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
  }

  this.noWebGL = function() {
    document.body.innerHTML += "NOWEBGL"
  }

  this.initGL = function() {
    this.canvas = document.querySelector('canvas')
    try {
      gl = this.canvas.getContext('experimental-webgl')
    } catch (e) {
      console.log('error', e)
    }

    if(!gl) {
    	try {
	      gl = this.canvas.getContext('webgl')
	    } catch (e) {
	      console.log('error', e)
	    }
    }

    if (!gl) {
      this.noWebGL();
      return;
    }

    Renderer.initShader();
  }

}
