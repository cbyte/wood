function Texture(s) {
  if (s == "") return;

  this.filename = s

  this.init = function() {
    var d = Q.defer();

    this.tex = gl.createTexture();
    this.image = new Image();
    
    this.image.onerror = function() {
      alert("failed to load image.");
      d.reject(false);
    }

    this.image.onload = function() {
      console.log('Texture loaded')
      d.resolve(true);
    }

    this.image.src = s;

    return d.promise;
  }

  this.bind = function() {

    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    //gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  }
}
