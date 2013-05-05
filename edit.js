var TS = 1/16;

var Edit = new function() {
	this.modelfile = new Array();
	this.models = new Array();
	this.modelatlas = new Array();
	
	// Game objects
	this.objects = new Array(); // level objects
	this.cursor = 0; // cursor object
	this.cursormodel = 0; // offset to active cursor model
	this.atlaspos = 0; // offset to active atlas anim
	
	this.actiondecay = 0;
	
	this.gamemode = 0; // 0 edit // 1 game
	
	this.init = function() {
		//this.addModel("plane.json",new Atlas(4,4,new Array([0],[0,100,0,1,2])));
		this.addModel("box.json");
		//this.addModel("wbox.json");
		//this.addModel("plant.json");
		//this.addModel("desk.json");
		//this.addModel("locker.json");
		//this.addModel("room.json");
		//this.addModel("roomdoorback.json");
		//this.addModel("roomdoor.json");
		//this.addModel("roomedge.json");
		//this.addModel("door.json");
		//this.addModel("computer.json");
		this.cursor = new Object([0,0,0],[1,1,1],[0,0,0],this.models[0]);
		
		Camera.target = this.cursor;
		Camera.dist = [0,0,10];
		Camera.follow = 1;
		
		document.getElementById("edit").innerHTML = "<textarea id=\"editout\"></textarea><br/><button onclick=\"Edit.loadLevel();\">Load</button><button onclick=\"Edit.reset();\">Reset</button>";
		
	}
	
	this.update = function(ts) {
		
		if(!Input.shift) {
			if(this.actiondecay<=Time.time()) {
				this.actiondecay = Time.time()+100;
			} else return;
		}
		
		// toggle between game and editor
		if(Input.p&&this.gamemode==0) {
			this.gamemode=1;
			Game.init();
		} else if(Input.p) {
			this.gamemode=0;
			Camera.target = Edit.cursor;
		}
		
		if(Edit.gamemode>0) return;
		
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
		if(selectedoffset>=0&&(Input.comma||Input.dot||Input.del||Input.c)) {
			document.getElementById("COORD").innerHTML = selectedoffset+" "+this.objects[selectedoffset].pos[0]+" "+this.objects[selectedoffset].pos[1]+" "+this.objects[selectedoffset].pos[2]+"<br/> rotate"+this.objects[selectedoffset].rotate[0]+" "+this.objects[selectedoffset].rotate[1]+" "+this.objects[selectedoffset].rotate[2]+"<br/> scale"+this.objects[selectedoffset].scale[0]+" "+this.objects[selectedoffset].scale[1]+" "+this.objects[selectedoffset].scale[2];
			if(Input.comma) {
				//rotate
				var rotate = vec3.create();
				vec3.add(this.objects[selectedoffset].rotate,this.objects[selectedoffset].rotate,vec3.scale(rotate,dir,Math.PI/16));
				
				if(Input.r)
				vec3.set(this.objects[selectedoffset].rotate,0,0,0);
			} else if(Input.c) {
				this.toggle(selectedoffset);
				this.generateLevel();
			}
			
			else if(Input.dot) {
				//scale
				var scale = vec3.create();
				vec3.add(this.objects[selectedoffset].scale,this.objects[selectedoffset].scale,vec3.scale(scale,[1,1,1],dir[0]*0.1));
				
				if(Input.r)
				vec3.set(this.objects[selectedoffset].scale,1,1,1);
			} else if(Input.del) {
				this.objects[selectedoffset] = 0;
			} 
		} else { //nothing selected
		//move cursor
		vec3.scale(dir,dir,0.5);
		document.getElementById("COORD").innerHTML = this.cursor.pos;
		
		if(Input.comma) {
			//rotate
			var rotate = vec3.create();
			vec3.add(this.cursor.rotate,this.cursor.rotate,vec3.scale(rotate,dir,Math.PI/16));
				
			if(Input.r)
				vec3.set(this.cursor.rotate,0,0,0);
			} else if(Input.dot) {
				//scale
				var scale = vec3.create();
				vec3.add(this.cursor.scale,this.cursor.scale,vec3.scale(scale,[1,1,1],dir[0]*0.1));
				
				if(Input.r)
					vec3.set(this.cursor.scale,1,1,1);
			}
		else 		
		if(Input.circum) {//switch cursor model
			if(this.cursormodel<this.models.length-1)
				++this.cursormodel;
			else
				this.cursormodel = 0;
			
			// switch to active model
			this.cursor.model = this.models[this.cursormodel];
		} else 
		vec3.add(this.cursor.pos,this.cursor.pos,dir);
		
		//add level object if possible
		if(Input.space) {
			//already sth at this position?
			if(selectedoffset>=0) return;
			
			var curscale = vec3.clone(this.cursor.scale);
			var currotate = vec3.clone(this.cursor.rotate);
			this.objects[this.objects.length] = new Object([this.cursor.pos[0],this.cursor.pos[1],this.cursor.pos[2]],curscale,currotate,this.models[this.cursormodel]);
			this.objects[this.objects.length-1].modeloffset = this.cursormodel;
			//console.log(this.objects.length);
			
			if(this.modelatlas[this.cursormodel]) {
				this.objects[this.objects.length-1].atlas = new Atlas(0,0,new Array([0]));
				this.objects[this.objects.length-1].atlas.clone(this.modelatlas[this.cursormodel]);
				
				console.log(this.objects[this.objects.length-1].atlas);
				console.log("modelatlas added");
			}
			
			this.generateLevel();
		}
		
		}
	}
	
	// toggles next animation
	this.toggle = function(off) {
		if(this.objects[off].atlas.actualanim<this.objects[off].atlas.animation.length-1)
			this.objects[off].atlas.actualanim++;
		else
			this.objects[off].atlas.actualanim = 0;
	}
	
	this.addModel = function(filename,atlas) {
		this.modelfile[this.modelfile.length] = filename;
		this.models[this.models.length] = Resource.getModel(filename);
		if(atlas) {
			this.modelatlas[this.models.length-1] = atlas;
		}
		else
			this.modelatlas[this.models.length-1] = 0;
	}
	
	this.generateLevel = function() {
		var out = document.getElementById("editout");
		var str = "";
		
		for(var i=0;i<this.modelfile.length;i++) {
			str+= "var model"+i+" = Resource.getModel(\""+this.modelfile[i]+"\");\n"
		}
		
		for(var i=0;i<this.modelatlas.length;i++) {
			if(!this.modelatlas[i]) {
				str+="var modelatlas"+i+" = 0;\n"; continue;
			}
			
			str+= "var modelatlas"+i+" = new Atlas("+this.modelatlas[i].rows+","+this.modelatlas[i].cols+",new Array(";
			
			
			for(var j=0;j<this.modelatlas[i].animation.length;j++) {
				
				str+= "[";
				for(var k=0;k<this.modelatlas[i].animation[j].length;k++)
				str += this.modelatlas[i].animation[j][k]+","
			
				str+= "]";
				if(j!=this.modelatlas[i].animation.length-1)
				str+= ",";
			}
			
			str+= "));\n";
			
		}
		
		
		for(var i=0;i<this.objects.length;i++) {
			str+= "this.objects[this.objects.length] = new Object(["+this.objects[i].pos[0]+","+this.objects[i].pos[1]+","+this.objects[i].pos[2]+"],";
			str+= "["+this.objects[i].scale[0]+","+this.objects[i].scale[1]+","+this.objects[i].scale[2]+"],";
			str+= "["+this.objects[i].rotate[0]+","+this.objects[i].rotate[1]+","+this.objects[i].rotate[2]+"],";
			str+= "model"+this.objects[i].modeloffset+",";
			str+= "modelatlas"+this.objects[i].modeloffset+",";
			
			if(this.objects[i].atlas)
				str+= this.objects[i].atlas.actualanim+")\n";
			else
				str+= 0+")\n";
		}
		out.value = str;
	}
	
	this.loadLevel = function() {
		var out = document.getElementById("editout");
		eval(out.value);
	}
	
	this.reset = function() {
		this.objects = new Array();
	}
};

function Loop() {
	Edit.update(TS);
	
	Renderer.render(Edit.objects);
	Renderer.render(new Array(Edit.cursor));
	
	if(Edit.gamemode==1)
		Game.step();
	
	Renderer.step();
}
