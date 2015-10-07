var gl;

var Camera = function() {
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.target = 0;
  this.pos = vec3.create();
  this.dist = vec3.create();
  this.follow = 0;

  this.forward = vec3.create();
  this.right = vec3.create();

  this.speedForward = 1;
  this.speedStrafe = 1;

  /**
   * Calculate the view matrix
   * 
   * @return {mat4}
   */
  this.getView = function() {
    var center = [0, 0, 1];

    var rotationYaw = quat.create();
    quat.setAxisAngle(rotationYaw, [0, 1, 0], Input.orientationX * Math.PI / 180)
    vec3.transformQuat(center, center, rotationYaw);

    var rotationRoll = quat.create();
    var right = vec3.create();
    vec3.cross(right, center, [0, 1, 0]);
    quat.setAxisAngle(rotationRoll, right, Input.orientationY * Math.PI / 180)
    vec3.transformQuat(center, center, rotationRoll);

    vec3.normalize(center, center);

    this.forward = vec3.clone(center);
    this.right = right;

    var view = mat4.create();
    vec3.add(center, center, this.pos);
    mat4.lookAt(view, this.pos, center, [0, 1, 0]);

    return view;
  }

  /**
   * Calculate the projection matrix
   * 
   * @return {mat4}
   */
  this.getProjection = function() {
    var proj = mat4.create();
    mat4.perspective(proj, 70, 16 / 9, 0.1, 500.0);
    return proj;
  }

  /**
   * Camera update step
   * 
   * @param  {ts} timestamp
   */
  this.update = function(ts) {
    // move forwards or backwards
    vec3.scaleAndAdd(this.pos, this.pos, vec3.clone(this.forward), (Input.up - Input.dn) * ts * this.speedForward);
    // move left or right
    vec3.scaleAndAdd(this.pos, this.pos, vec3.clone(this.right), (Input.rt - Input.lt) * ts * this.speedStrafe);
  }
};

function Atlas(rows, cols, animation) {
  this.rows = rows;
  this.cols = cols;
  this.actualanim = 0; //selected animation
  this.actualanimstep = 0; // animation index
  this.actual = 0; // finally selected texture 
  this.animation = animation;
  this.laststep = new Date();
  this.dir = 1.0;

  this.clone = function(o) {
    this.rows = o.rows;
    this.cols = o.cols;
    this.actualanim = o.actualanim;
    this.actualanimstep = o.actualanimstep;
    this.actual = o.actual;
    this.animation = o.animation;
    this.dir = o.dir;
  }

  this.play = function(id) {
    this.actualanim = id;
    this.actalanimstep = 0;
    if (id == 0)
      this.actual = 0;
  }

  this.animate = function() {
    if (!animation || animation[this.actualanim] == 0)
      return;

    // animation = Array( 0: [loop,speed,index0,...,indexn], ...)
    var now = new Date();

    if (new Date(now - this.laststep).getMilliseconds() > this.animation[this.actualanim][1]) {
      if (this.actualanimstep + 1 < this.animation[this.actualanim].length - 2)
        this.actualanimstep++;
      else
        this.actualanimstep = 0;

      this.actual = this.animation[this.actualanim][this.actualanimstep + 2];

      this.laststep = new Date();
    }
  }

  this.getU = function() {
    return this.actual % this.rows;
  }

  this.getV = function() {
    return -Math.ceil(this.actual / this.cols + 1 / this.cols);
  }

  this.getSizeU = function() {
    return 1 / (this.rows);
  }
  this.getSizeV = function() {
    return 1 / (this.cols);
  }
}

function Texture(s) {
  if (s == "") return;

  var tex = gl.createTexture();
  var image = new Image();

  this.bind = function() {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    //gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  }

  image.onerror = function() {
    alert("failed to load image.");
  }

  image.src = s;
}

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

    this.initShader();
  }

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

  };

  this.init = function(camera) {
    this.camera = camera;
  };

  this.step = function() {

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

      gl.uniform2fv(gl.getUniformLocation(this.program, "window"), [800.0, 400.0]);

      DrawModel(this.objects[i].model, this.objects[i].atlas);
    }

    //default object
    this.objects = new Array();
  }

  this.render = function(objects) {
    this.objects = this.objects.concat(objects);
  };
};
