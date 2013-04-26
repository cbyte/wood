var TS = 1/16;

var Edit = new function() {
	this.modelfile = new Array();
	this.models = new Array();
	
	// Game objects
	this.objects = new Array(); // level objects
	this.cursor = 0; // cursor object
	this.cursormodel = 0; // offset to active cursor model
	
	this.actiondecay = 0;
	
	this.init = function() {
		this.addModel("asset/box.json");
		this.addModel("mesh.json");
		this.cursor = new Object([0,0,0],[1,1,1],[0,0,0],this.models[0]);
		
		Camera.target = this.cursor;
		Camera.dist = [0,0,5];
		Camera.follow = 1;
		
		
	}
	
	this.update = function(ts) {
		if(!Input.shift) {
			if(this.actiondecay<=Time.time()) {
				this.actiondecay = Time.time()+100;
			} else return;
		}
		
		var dir = vec3.fromValues(Input.rt-Input.lt,Input.up-Input.dn,Input.top-Input.bot);
		
		//select object located at cursor position
		var selectedoffset = -1;
		for(var i=0;i<this.objects.length;i++) {
			if(this.objects[i]==0) continue;
			if(this.cursor.pos[0]==this.objects[i].pos[0] && 
			   this.cursor.pos[1]==this.objects[i].pos[1] && 
			   this.cursor.pos[2]==this.objects[i].pos[2])
			selectedoffset = i;
		}
		
		//sth was selected
		if(selectedoffset>=0&&(Input.comma||Input.dot||Input.del)) {
			if(Input.comma) {
				//rotate
				var rotate = vec3.create();
				vec3.add(this.objects[selectedoffset].rotate,this.objects[selectedoffset].rotate,vec3.scale(rotate,dir,Math.PI/16));
				
				if(Input.r)
				vec3.set(this.objects[selectedoffset].rotate,0,0,0);
			} else if(Input.dot) {
				//scale
				var scale = vec3.create();
				vec3.add(this.objects[selectedoffset].scale,this.objects[selectedoffset].scale,vec3.scale(scale,[1,1,1],dir[0]*0.1));
				
				if(Input.r)
				vec3.set(this.objects[selectedoffset].scale,1,1,1);
			} else if(Input.del) {
				this.objects[selectedoffset] = 0;
			}
		} else
		//move cursor
		//vec3.scale(dir,dir,0.5);
		vec3.add(this.cursor.pos,this.cursor.pos,dir);
		
		//switch cursor model
		if(Input.circum) {
			if(this.cursormodel<this.models.length-1)
				++this.cursormodel;
			else
				this.cursormodel = 0;
			
			// switch to active model
			this.cursor.model = this.models[this.cursormodel];
		}
		
		//add level object if possible
		if(Input.space) {
			//already sth at this position?
			if(selectedoffset>=0) return;
			
			this.objects[this.objects.length] = new Object([this.cursor.pos[0],this.cursor.pos[1],this.cursor.pos[2]],[1,1,1],[0,0,0],this.models[this.cursormodel]);
			console.log(this.objects.length);
		}
	}
	
	this.addModel = function(filename) {
		this.modelfile[this.modelfile.length] = filename;
		this.models[this.models.length] = Resource.getModel(filename);
	}
};

function Loop() {
	
	Edit.update(TS);
	
	Renderer.render(Edit.objects);
	Renderer.render(new Array(Edit.cursor));
	
	Renderer.step();
}
