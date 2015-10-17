function Init() {
  Renderer.initGL();
  Input.init();

  Edit.init();

  window.setInterval(Loop, 1)

  Renderer.canvas.requestPointerLock = Renderer.canvas.requestPointerLock || Renderer.canvas.mozRequestPointerLock || Renderer.canvas.webkitRequestPointerLock;
  Renderer.canvas.onclick = function() {
    Renderer.canvas.requestPointerLock();
  }

}

function NoWebGL() {
  document.body.innerHTML = "NOWEBGL"
}