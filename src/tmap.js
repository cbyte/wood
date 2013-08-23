var Tilemap = new function() {
	this.data = 0; // { model [, scale[xyz], rotation[xyz], atlas, atlasdefanim] }
	this.model = new Array();
	this.atlas = new Array();
	this.width = 0;
	this.height = 0;
	this.tilewidth = 1;
	this.tileheight = 1;
	
	this.addModel = function(t) {
		this.model[this.model.length] = t;
	}
	
	this.addAtlas = function(a) {
		this.atlas[this.atlas.length] = a;
	}
	
	this.load = function(arr,x,y) {
		this.data = arr;
		this.width = x;
		this.height = y;
	}
	
	// layer indicates Z index
	this.getRenderData = function(layer) {
		if(!this.data) {
			alert("no data"); return;
		}
		
		var output = new Array();
		var countobjects = 0;
		for(var i=0;i<this.width*this.height;i++) {
			var scale = this.data[countobjects][1]?this.data[countobjects][1]:[1,1,1];
			var rot = this.data[countobjects][2]?this.data[countobjects][2]:[0,0,0];
			var atlas = this.data[countobjects][3]?this.data[countobjects][3]:0;
			var defanim = this.data[countobjects][4]?this.data[countobjects][4]:0;
			
			output[countobjects] = new Object([(i%this.width)*this.tilewidth,-Math.floor(i/this.width)*this.tileheight],layer]
											  scale,
											  rot,
											  this.model[this.data[countobjects]], 
											  atlas,
											  defanim
			);
			countobjects++;
		}
		
		return output;
	}
};