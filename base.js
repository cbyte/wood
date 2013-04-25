var Object = function(pos,scale,dir,model) {
	this.model = model;
	this.pos = pos;
	this.scale = scale;
	this.rotate = dir;
	
	this.coll = new AABB(scale);
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
	this.r = 0;
	
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
			if(e.which==82) Input.r = 1;
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
			if(e.which==82) Input.r = 0;
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

function Init() {
	Renderer.initGL();
	Renderer.initShader();
	
	Edit.init();
	
	document.onkeydown=Input.keyevent;
	document.onkeyup=Input.keyevent;
	window.setInterval(Loop,1)
}

function NoWebGL() {
	document.body.innerHTML = "NOWEBGL"
}
