var gl;

var Camera = new function() {
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.target = 0;
	this.pos = vec3.create();
	this.dist = vec3.create();
	this.follow = 0;
	
	this.getView = function() {
		
		var targetp = vec3.create();
		vec3.set(targetp,this.target.pos[0],this.target.pos[1],this.target.pos[2]);
		
		if(this.follow)
			vec3.add(this.pos, this.target.pos,this.dist);
		
		var view = mat4.create();
		var right = this.pos;
		
		var dir = vec3.create();
		vec3.sub(dir,this.pos,targetp);
		vec3.normalize(dir,dir);
		
		var up = vec3.create();
		//vec3.cross(up,dir,right);
		//vec3.normalize(up,up);
		
		vec3.set(up,0,1,0)
		
		mat4.lookAt(view,this.pos, targetp, up );
		//mat4.lookAt(view,[0,0,0], [0,0,1], [0,1,0] );
		//console.log("lookat pos "+this.pos[0]+" "+this.pos[1]+" "+this.pos[2]
		//				 + " target "+targetp[0]+" "+targetp[1]+" "+targetp[2]
		//				 + " up "+up[0]+" "+up[1]+" "+up[2]
		//);
		
		//mat4.lookAt(view,[0,0,0], [0,0,1], [0,1,0] );
		return view;
	}
	
	this.getProjection = function() {
		var proj = mat4.create();
		mat4.perspective(proj,70,2,0.1,100.0);
		return proj;
	}
};

function Atlas(rows,cols,def,animation) {
	this.rows = rows;
	this.cols = cols;
	this.actualanim = def; //selected animation
	this.actualanimstep = 0; // animation index
	this.actual = 0; // finally selected texture 
	this.animation = animation;
	this.laststep = new Date();
	
	this.play = function(id) {
		this.actualanim = id;
		this.actalanimstep = 0;
		if(id==0)
			this.actual = 0;
	}
	
	this.animate = function() {
		if(!animation || animation[this.actualanim]==0)
			return;
		
		// animation = Array( 0: [loop,speed,index0,...,indexn], ...)
		var now = new Date();
		
		if(new Date(now-this.laststep).getMilliseconds() > this.animation[this.actualanim][1]) {
			if(this.actualanimstep+1 < this.animation[this.actualanim].length-2)
				this.actualanimstep++
			else
				this.actualanimstep = 0;
			
			this.actual = this.animation[this.actualanim][this.actualanimstep+2];
			
			this.laststep = new Date();
		}
	}
	
	this.getU = function() {
		return this.actual%this.rows;
	}
	
	this.getV = function() {
		return -Math.floor(this.actual/this.cols);
	}
	
	this.getSizeU = function() {
		return 1/(this.rows);
	}
	this.getSizeV = function() {
		return 1/(this.cols);
	}
}

function Texture(s) {
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
	
	image.onerror = function() { alert("failed to load image.");}
	
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
	this.objects = new Array();
	
	this.initGL = function() {
		gl = WebGLHelper.GetGLContext(document.getElementById("webgl"));
		if(!gl)
			NoWebGL();
		return;
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
		
		if(!gl.getShaderParameter(vs,gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(vs));
			return;
		}
		
		if(!gl.getShaderParameter(fs,gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(fs));
			return;
		}
		
		gl.attachShader(this.program,vs);
		gl.attachShader(this.program,fs);
		gl.linkProgram(this.program);
		
		if(!gl.getProgramParameter(this.program,gl.LINK_STATUS)) {
			document.body.innerHTML = "<div id=\"info\"><b>Sorry</b>, Couldnt link Program.</div>";
			return;
		}
		
		gl.deleteShader(vs);
		gl.deleteShader(fs);
		gl.useProgram(this.program);
		
		this.posloc = gl.getAttribLocation(this.program,"position");
		this.norloc = gl.getAttribLocation(this.program,"normal");
		this.texloc = gl.getAttribLocation(this.program,"texcoord");
		this.atlasloc = gl.getUniformLocation(this.program,"atlas");
		
		// Enable Depth Test
		gl.enable(gl.DEPTH_TEST);
		//gl.depthFunc(gl.LEQUAL);
		//gl.clearDepth(1.0);
		
	};

	this.step = function() {
		
		gl.useProgram(this.program);
		
		gl.clearColor(0.85, 0.85, 0.89, 1);
		gl.clearDepth(1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
		
		var proj = mat4.create();
		var view = Camera.getView();
		mat4.multiply(proj,Camera.getProjection(),view);
		
		var projectionInv = mat4.create();
		mat4.invert(projectionInv,Camera.getProjection());
		
		//this.objects.sort(function(a,b){ return a.sprite.texturename.localeCompare(b.sprite.texturename) })
		
		for(var i=0;i<this.objects.length;i++) {
			var obj = this.objects[i];
			if(obj==0) continue;
			
			var modelView = mat4.create();
			mat4.identity(modelView);
			mat4.translate(modelView,modelView,[obj.pos[0],obj.pos[1],obj.pos[2]]);
			mat4.scale(modelView,modelView,[obj.scale[0],obj.scale[1],obj.scale[2]]);
			mat4.rotate(modelView,modelView,obj.rotate[0],[1,0,0]);
			mat4.rotate(modelView,modelView,obj.rotate[1],[0,1,0]);
			mat4.rotate(modelView,modelView,obj.rotate[2],[0,0,1]);
			
			var modelViewProjection = mat4.create();
			mat4.multiply(modelViewProjection,proj,modelView);
			
			var modelViewTranspose = mat4.create();
			
			mat4.invert(modelViewTranspose,modelView);
			mat4.transpose(modelViewTranspose,modelViewTranspose);
			
			gl.uniformMatrix4fv(gl.getUniformLocation(this.program,"matInvProjection"),false,projectionInv);
			gl.uniformMatrix4fv(gl.getUniformLocation(this.program,"matView"),false,view);
			gl.uniformMatrix4fv(gl.getUniformLocation(this.program,"matModelView"),false,modelView);
			gl.uniformMatrix4fv(gl.getUniformLocation(this.program,"matModelViewProj"),false,modelViewProjection);
			gl.uniformMatrix4fv(gl.getUniformLocation(this.program,"matModelViewTranspose"),false,modelViewTranspose);
			
			gl.uniform2fv(gl.getUniformLocation(this.program,"window"),[800.0,400.0]);
			
			
			DrawModel(this.objects[i].model);
		}
		
		//default object
		this.objects = new Array();
	}
	
	this.render = function(objects) {
		this.objects = this.objects.concat(objects);
	};
};
