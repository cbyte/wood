var Model = function(filename) {
  this.filename = filename;
  console.log('model', this.filename)

  this.init = function() {
    var self = this;
    console.log('init model', this.filename)
    var d = Q.defer();

    var file = new XMLHttpRequest();
    file.onload = function() {

      var scene = JSON.parse(file.responseText);
      console.log(scene)
      self.meshes = new Array();
      self.materials = new Array();

      console.log(scene.materials.length + " material");

      console.log(scene.materials)

      for (var numMat = 0; numMat < scene.materials.length; numMat++) {
        self.materials[numMat] = new Material();
        var textureIndex = 0;
        for (var i = 0; i < scene.materials[numMat].properties.length; i++) {
          if (scene.materials[numMat].properties[i].key == '$tex.file') {
            textureIndex = i;
          }
        }

        self.materials[numMat].texfile = scene.materials[numMat].properties[textureIndex].value;
        self.materials[numMat].tex = Resource.get(self.materials[numMat].texfile);
      }

      for (var numMesh = 0; numMesh < scene.meshes.length; numMesh++) {
        var mesh = scene.meshes[numMesh];

        self.meshes[self.meshes.length] = new Mesh();
        self.meshes[self.meshes.length - 1].ibo = gl.createBuffer();
        self.meshes[self.meshes.length - 1].vbo = gl.createBuffer();

        var vertdata = new Float32Array(mesh.vertices.length + mesh.normals.length + mesh.texturecoords[0].length);
        var facedata = new Uint16Array(mesh.faces.length * 3);
        var offn = 0,
          offt = 0,
          off = 0;

        for (var numVert = 0; numVert < mesh.vertices.length;) {
          vertdata[off++] = mesh.vertices[numVert++];
          vertdata[off++] = mesh.vertices[numVert++];
          vertdata[off++] = mesh.vertices[numVert++];
          vertdata[off++] = mesh.normals[offn++];
          vertdata[off++] = mesh.normals[offn++];
          vertdata[off++] = mesh.normals[offn++];
          vertdata[off++] = mesh.texturecoords[0][offt++];
          vertdata[off++] = mesh.texturecoords[0][offt++];
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, self.meshes[self.meshes.length - 1].vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertdata, gl.STATIC_DRAW);

        off = 0;
        for (var numFace = 0; numFace < mesh.faces.length; numFace++) {
          facedata[off++] = mesh.faces[numFace][0];
          facedata[off++] = mesh.faces[numFace][1];
          facedata[off++] = mesh.faces[numFace][2];
        }

        self.meshes[self.meshes.length - 1].count = mesh.faces.length * 3;
        self.meshes[self.meshes.length - 1].matoffset = mesh.materialindex;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.meshes[self.meshes.length - 1].ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, facedata, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      }

      console.log(self.filename + " loaded (" + self.meshes.length + " meshes)");
      d.resolve(true);

    }
    file.onerror = function() {
      console.log('error loading model')
      d.reject(false);
    }
    file.open('GET', self.filename);
    file.send();

    return d.promise;
  }

}

//GLOBAL last bound texture
var lasttex = 0;

function DrawModel(m, atlas) {
  gl.enableVertexAttribArray(Renderer.posloc);
  gl.enableVertexAttribArray(Renderer.norloc);
  gl.enableVertexAttribArray(Renderer.texloc);

  // render meshes
  for (var i = 0; i < m.meshes.length; i++) {
    // bind texture but not for every mesh again!
    if (m.materials[m.meshes[i].matoffset].texfile != lasttex || lasttex == 0) {
      Resource.get(m.materials[m.meshes[i].matoffset].texfile).bind();
      lasttex = m.materials[m.meshes[i].matoffset].texfile;
    }

    if (atlas) {
      gl.uniform1f(Renderer.dirloc, atlas.dir);
      atlas.animate();
      gl.uniform4f(Renderer.atlasloc, atlas.getU(), atlas.getV(),
        atlas.getSizeU(), atlas.getSizeV());
    } else {
      gl.uniform4f(Renderer.atlasloc, 0.0, 0.0, 1.0, 1.0);
      gl.uniform1f(Renderer.dirloc, 1.0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, m.meshes[i].vbo);

    gl.vertexAttribPointer(Renderer.posloc, 3, gl.FLOAT, false, 8 * 4, 0 * 4); //position
    gl.vertexAttribPointer(Renderer.norloc, 3, gl.FLOAT, false, 8 * 4, 3 * 4); //normals
    gl.vertexAttribPointer(Renderer.texloc, 2, gl.FLOAT, false, 8 * 4, 6 * 4); //texturecoord

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.meshes[i].ibo);

    gl.drawElements(gl.TRIANGLES, m.meshes[i].count, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  gl.disableVertexAttribArray(2);
  gl.disableVertexAttribArray(1);
  gl.disableVertexAttribArray(0);
}

function Mesh() {
  this.ibo = 0;
  this.vbo = 0;
  this.count = 0; // count of vertices to be drawn
  this.matoffset = 0; // offset in model's materials
}

function Material() {
  this.texfile = 0; // filename
  this.tex = 0; // texture instance
}
