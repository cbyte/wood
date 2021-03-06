var Input = new function() {
  this.keyBindings = [] // only supports one method per keyCode

  this.up = 0;
  this.dn = 0;
  this.lt = 0;
  this.rt = 0;
  this.top = 0;
  this.bot = 0;
  this.space = 0;
  this.shift = 0;
  this.del = 0;
  this.circum = 0;
  this.comma = 0;
  this.dot = 0;
  this.p = 0;
  this.r = 0;
  this.c = 0;
  this.alt_up = 0;
  this.alt_dn = 0;
  this.alt_lt = 0;
  this.alt_rt = 0;

  this.orientationX = 0;
  this.orientationY = 0;
  this.mouseSensivityX = 0.1;
  this.mouseSensivityY = 0.1;
  this.mouse0 = 0;
  this.mouse1 = 0;
  this.mouse2 = 0;
  this.screenX = 0;
  this.screenY = 0;

  this.init = function() {
    document.onkeydown = this.keyevent;
    document.onkeyup = this.keyevent;

    document.addEventListener('pointerlockchange', this.mouseLockChange, false);
    document.addEventListener('mozpointerlockchange', this.mouseLockChange, false);
    document.addEventListener('webkitpointerlockchange', this.mouseLockChange, false);

    document.addEventListener('mousemove', Input.mouseMoveUpdateScreenPosition, false)

    document.addEventListener('mousedown', this.activateRightClickCameraMotion, false);
    document.addEventListener('mouseup', this.deactivateRightClickCameraMotion, false);
    document.addEventListener('mousedown', this.mouseEvent, false);
    document.addEventListener('mouseup', this.mouseEvent, false);
  };

  this.activateRightClickCameraMotion = function(e) {
    if (e.button == 2) {
      document.addEventListener('mousemove', Input.mouseMoveUpdateOrientation, false);
    }
  }

  this.deactivateRightClickCameraMotion = function(e) {
    if (e.button == 2) {
      document.removeEventListener('mousemove', Input.mouseMoveUpdateOrientation, false);
    }
  }

  this.mouseMoveUpdateScreenPosition = function(e) {
    Input.screenX = e.clientX / gl.canvas.clientWidth
    Input.screenY = e.clientY / gl.canvas.clientHeight

    //console.log(this.screenX, this.screenY)
  }

  this.mouseMoveUpdateOrientation = function(e) {
    var movementX = e.movementX || e.mozMovementX || 0;
    var movementY = e.movementY || e.mozMovementY || 0;

    var changeX = movementX * Input.mouseSensivityX;
    var changeY = movementY * Input.mouseSensivityY;

    if (Input.orientationX - changeX > 180) {
      Input.orientationX = Input.orientationX - changeX - 360;
    } else if (Input.orientationX - changeX < -180) {
      Input.orientationX = Input.orientationX - changeX + 360;
    } else {
      Input.orientationX -= changeX;
    }

    if (Input.orientationY - changeY >= 89.999) {
      Input.orientationY = 89.999;
    } else if (Input.orientationY - changeY <= -89.999) {
      Input.orientationY = -89.999;
    } else {
      Input.orientationY -= changeY;
    }
  }

  this.mouseLockChange = function() {
    if ((document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement)) {
      if (!this.locked) {
        document.addEventListener('mousemove', Input.mouseMoveUpdateOrientation, false);
        this.locked = true;
      }
    } else if (this.locked) {
      document.removeEventListener('mousemove', Input.mouseMoveUpdateOrientation, false);
      this.locked = false;
    }
  }

  this.keyevent = function(e) {
    //console.log(e.which)
    if (e.type == "keydown") {
      if (Input.keyBindings[e.which]) {
        Input.keyBindings[e.which]();
      }

      if (e.which == 32) Input.space = 1; //space
      if (e.which == 65) Input.lt = 1; //a
      if (e.which == 83) Input.dn = 1; //s
      if (e.which == 68) Input.rt = 1; //d
      if (e.which == 87) Input.up = 1; //w
      if (e.which == 81) Input.top = 1; //q
      if (e.which == 69) Input.bot = 1; //e
      if (e.which == 46) Input.del = 1; //delete
      if (e.which == 16) Input.shift = 1; //shift
      if (e.which == 192) Input.circum = 1; //circumflex
      if (e.which == 188) Input.comma = 1;
      if (e.which == 190) Input.dot = 1;
      if (e.which == 80) Input.p = 1;
      if (e.which == 82) Input.r = 1;
      if (e.which == 67) Input.c = 1;
      if (e.which == 37) Input.alt_lt = 1;
      if (e.which == 38) Input.alt_up = 1;
      if (e.which == 39) Input.alt_rt = 1;
      if (e.which == 40) Input.alt_dn = 1;
    } else if (e.type == "keyup") {
      if (e.which == 32) Input.space = 0;
      if (e.which == 65) Input.lt = 0;
      if (e.which == 83) Input.dn = 0;
      if (e.which == 68) Input.rt = 0;
      if (e.which == 87) Input.up = 0;
      if (e.which == 81) Input.top = 0; //q
      if (e.which == 69) Input.bot = 0; //e
      if (e.which == 46) Input.del = 0; //delete
      if (e.which == 16) Input.shift = 0; //shift
      if (e.which == 192) Input.circum = 0; //circumflex
      if (e.which == 188) Input.comma = 0;
      if (e.which == 190) Input.dot = 0;
      if (e.which == 80) Input.p = 0;
      if (e.which == 82) Input.r = 0;
      if (e.which == 67) Input.c = 0;
      if (e.which == 37) Input.alt_lt = 0;
      if (e.which == 38) Input.alt_up = 0;
      if (e.which == 39) Input.alt_rt = 0;
      if (e.which == 40) Input.alt_dn = 0;
    }
  }

  this.mouseEvent = function(e) {
    if (e.type == 'mousedown') {
      if (e.button == 0) Input.mouse0 = 1;
      if (e.button == 1) Input.mouse1 = 1;
      if (e.button == 2) Input.mouse2 = 1;
    } else if (e.type == 'mouseup') {
      if (e.button == 0) Input.mouse0 = 0;
      if (e.button == 1) Input.mouse1 = 0;
      if (e.button == 2) Input.mouse2 = 0;
    }
  }

  this.bindKey = function(charCode, fn) {
    this.keyBindings[charCode] = fn;
  }

  this.unbindKey = function(charCode) {
    delete this.keyBindings[charCode];
  }
};
