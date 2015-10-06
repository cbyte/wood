function Object(pos,scale,dir,model,atlas,defanim) {
	this.model = model;
	this.pos = pos;
	this.scale = scale;
	this.rotate = dir;
	if(atlas) {
		this.atlas = new Atlas(0,0,new Array([0]));
		this.atlas.clone(atlas);
		this.atlas.play(defanim);
	}
	this.coll = new AABB(scale);
	
	//for editor
	this.modeloffset=0;
}

Object.prototype.update = function() {}

function PlaySound(s) {
	var audio = new Audio();
	audio.volume = 0.2;
	audio.src = s;
	audio.play();
}

var Time = new function() {
	this.time = function() {
		return (new Date()).getTime();
	}
};

var Input = new function() {
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

	this.orientationX = 0;
	this.orientationY = 0;

	this.init = function() {
		document.onkeydown = this.keyevent;
		document.onkeyup = this.keyevent;
		
		document.addEventListener('pointerlockchange', this.mouseLockChange, false);
		document.addEventListener('mozpointerlockchange', this.mouseLockChange, false);
		document.addEventListener('webkitpointerlockchange', this.mouseLockChange, false);
	};

	this.mouseMove = function(e) {
		var movementX = e.movementX||e.mozMovementX||e.webkitMovementX||0;
		var movementY = e.movementY||e.mozMovementY||e.webkitMovementY||0;
		Input.orientationX -= movementX;
		Input.orientationY -= movementY;

		if(Input.orientationX > 180) {
			Input.orientationX -= 360;
		}
		if(Input.orientationX < -180) {
			Input.orientationX += 360;
		}
		if(Input.orientationY >= 90) {
			Input.orientationY = 89;
		}
		if(Input.orientationY <= -90) {
			Input.orientationY = -89;
		}

		console.log(Input.orientationX,Input.orientationY);
	}

	this.mouseLockChange = function() {
		if((document.pointerLockElement||document.mozPointerLockElement||document.webkitPointerLockElement)) {
			if(!this.locked) {
				document.addEventListener('mousemove', Input.mouseMove, false);
				this.locked = true;
			}
		} else if(this.locked) {
			document.removeEventListener('mousemove', Input.mouseMove, false);
			this.locked = false;
		}
	}
	
	this.keyevent = function(e) {
		if(e.type=="keydown") {
			if(e.which==32) Input.space = 1; //space
			if(e.which==65) Input.lt = 1; //a
			if(e.which==83) Input.dn = 1; //s
			if(e.which==68) Input.rt = 1; //d
			if(e.which==87) Input.up = 1; //w
			if(e.which==81) Input.top = 1; //q
			if(e.which==69) Input.bot = 1; //e
			if(e.which==46) Input.del = 1; //delete
			if(e.which==16) Input.shift = 1; //shift
			if(e.which==192) Input.circum = 1; //circumflex
			if(e.which==188) Input.comma = 1;
			if(e.which==190) Input.dot = 1;
			if(e.which==80) Input.p = 1;
			if(e.which==82) Input.r = 1;
			if(e.which==67) Input.c = 1;
		}
		else if(e.type=="keyup") {
			if(e.which==32) Input.space = 0;
			if(e.which==65) Input.lt = 0;
			if(e.which==83) Input.dn = 0;
			if(e.which==68) Input.rt = 0;
			if(e.which==87) Input.up = 0;
			if(e.which==81) Input.top = 0; //q
			if(e.which==69) Input.bot = 0; //e
			if(e.which==46) Input.del = 0; //delete
			if(e.which==16) Input.shift = 0; //shift
			if(e.which==192) Input.circum = 0; //circumflex
			if(e.which==188) Input.comma = 0;
			if(e.which==190) Input.dot = 0;
			if(e.which==80) Input.p = 0;
			if(e.which==82) Input.r = 0;
			if(e.which==67) Input.c = 0;
		}
	}
};

var Resource = new function() {
	this.resources = new Array();
	
	this.getTexture = function(f){
		if(!this.resources[f]) {
			console.log("loading texture "+f);
			this.resources[f] = new Texture(f);
		}
		return this.resources[f];
	}
	
	this.getModel = function(f){
		if(!this.resources[f]) {
			console.log("loading model "+f);
			this.resources[f] = new Model(f);
		}
		return this.resources[f];
	}
};

function max(a,b) {
	return a>b?a:b;
}

function rand(min,max) {
	if(min>max) return rand(max,min);
	if(min==max) return min;
	return min+parseInt(Math.random()*(max-min+1));
}

function Init() {
	Renderer.initGL();
	Input.init();
	
	Edit.init();
	
	window.setInterval(Loop,1)

	Renderer.canvas.requestPointerLock = Renderer.canvas.requestPointerLock||Renderer.canvas.mozRequestPointerLock||Renderer.canvas.webkitRequestPointerLock;
	Renderer.canvas.onclick = function() {
		Renderer.canvas.requestPointerLock();
	}

}

function NoWebGL() {
	document.body.innerHTML = "NOWEBGL"
}
