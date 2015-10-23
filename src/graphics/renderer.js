var Renderer = new function() {
  this.vbo = 0;
  this.ibo = 0;
  this.program = 0;
  this.posloc = 0;
  this.norloc = 0;
  this.texloc = 0;
  this.atlasloc = 0;
  this.dirloc = 0;
  this.objects = new Array();
  this.camera = null;
  this.canvas = null;

  this.initShader = function() {
    this.program = gl.createProgram();
    var vshader = document.getElementById("vshader").textContent;
    var fshader = document.getElementById("fshader").textContent;

    var vs = gl.createShader(gl.VERTEX_SHADER);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vs, vshader);
    gl.shaderSource(fs, fshader);
    gl.compileShader(vs);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(vs));
      return;
    }

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(fs));
      return;
    }

    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      document.body.innerHTML = "<div id=\"info\"><b>Sorry</b>, Couldnt link Program.</div>";
      return;
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(this.program);

    this.posloc = gl.getAttribLocation(this.program, "position");
    this.norloc = gl.getAttribLocation(this.program, "normal");
    this.texloc = gl.getAttribLocation(this.program, "texcoord");
    this.atlasloc = gl.getUniformLocation(this.program, "atlas");
    this.dirloc = gl.getUniformLocation(this.program, "dir");

    // Enable Depth Test
    gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LEQUAL);
    //gl.clearDepth(1.0);
    gl.enable(gl.CULL_FACE)

  };

  this.init = function(camera) {
    this.camera = camera;
  };

  this.draw = function() {
    // resize to client's window size
    var clientWidth = gl.canvas.clientWidth;
    var clientHeight = gl.canvas.clientHeight;
    if (gl.canvas.width != clientWidth || gl.canvas.height != clientHeight) {
       gl.canvas.width = clientWidth;
       gl.canvas.height = clientHeight;
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.useProgram(this.program);

    gl.clearColor(1.0, 1.0, 1.0, 1);
    gl.clearDepth(1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    var proj = mat4.create();
    var view = this.camera.getView();
    mat4.multiply(proj, this.camera.getProjection(), view);

    var projectionInv = mat4.create();
    mat4.invert(projectionInv, this.camera.getProjection());

    //this.objects.sort(function(a,b){ return a.sprite.texturename.localeCompare(b.sprite.texturename) })

    for (var i = 0; i < this.objects.length; i++) {
      var obj = this.objects[i];
      if (obj == 0) continue;

      if (obj.renderDisableDepthBuffer) {
        gl.depthMask(false);
      }

      var modelView = mat4.create();
      mat4.identity(modelView);
      mat4.translate(modelView, modelView, [obj.pos[0], obj.pos[1], obj.pos[2]]);
      mat4.scale(modelView, modelView, [obj.scale[0], obj.scale[1], obj.scale[2]]);
      mat4.rotate(modelView, modelView, obj.rotate[0], [1, 0, 0]);
      mat4.rotate(modelView, modelView, obj.rotate[1], [0, 1, 0]);
      mat4.rotate(modelView, modelView, obj.rotate[2], [0, 0, 1]);

      var modelViewProjection = mat4.create();
      mat4.multiply(modelViewProjection, proj, modelView);

      var modelViewTranspose = mat4.create();

      mat4.invert(modelViewTranspose, modelView);
      mat4.transpose(modelViewTranspose, modelViewTranspose);

      gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "matInvProjection"), false, projectionInv);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "matView"), false, view);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "matModelView"), false, modelView);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "matModelViewProj"), false, modelViewProjection);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "matModelViewTranspose"), false, modelViewTranspose);

      DrawModel(this.objects[i].model, this.objects[i].atlas);

      if (obj.renderDisableDepthBuffer) {
        gl.depthMask(true);
      }
    }
  }

};
