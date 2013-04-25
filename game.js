var g_objects;
var g_player;
var g_gamestate;
var testmodel;
var Game = new function() {
	this.init = function() {
		document.getElementById("info2").style.display = "none";
		document.getElementById("info").style.display = "none"; // debug
		
		//Tilemap.addTile(new Sprite("grass.png",1,1)); //0 simple asphalt
		//Tilemap.addTile(new Sprite("roof.png",1,1,1)); //1 dach left
		//Tilemap.addTile(new Sprite("roof2.png",1,1,1)); //2 dach
		
		testmodel = new Model("asset/box.json");
	}

	this.level = function() {
		var map = [ 2 ,2 ,2 ,2 ,2 ,
					1 ,1 ,1 ,0 ,0 ,
					2,0 ,0 ,0 ,0 ,
					2,0 ,0 ,0 ,2
					];
		
		Tilemap.load(map,5,4);
		g_objects = Tilemap.getRenderData();
		//console.log(g_objects.length);
		g_test = new Object([-2.5,-2,0],[1,1,1],[0,0,0],testmodel);
		g_player = new Object([-2,-2,1],[.1,.1,.1],[0,0,0],testmodel);
		g_player.update = PlayerActor;
		Camera.target = g_player;
		Camera.dist = [0,0,1];
		Camera.pos = [0,0,1];
		Camera.follow = 1;
		stepold = Time.time();
		
		
	}
};

function PlayerActor(ts) {
	// ignore lags which causes the player to jump a far distance
	if(ts>10) console.log(ts);
	
	this.playerspeed = ts*0.01;
	//this.spcoll.c = vec3.fromValues(this.pos[0],this.pos[1],this.pos[2]);
	
	var dir = vec2.create();
	dir[0] = Input.rt-Input.lt;
	dir[1] = Input.up-Input.dn;
	
	//var tsp = new Sphere([this.pos[0]+this.playerspeed*ts*dir[0]*this.playerspeed,this.pos[1]+this.playerspeed*ts*dir[1]*this.playerspeed,0],this.spcoll.r);
	
	//if(!testSphere(tsp, g_objects)) {
		//document.getElementById("info2").innerHTML = ""+ts+"<br/>"+this.pos[0]+""+this.pos[1];
		this.pos[0] += this.playerspeed*ts*dir[0]*this.playerspeed;
		this.pos[1] += this.playerspeed*ts*dir[1]*this.playerspeed;
	//}
	//else
		//document.getElementById("info2").innerHTML = "COLLISION";
	
	//if(!Input.lt&&!Input.rt&&!Input.up&&!Input.dn)
	//	this.sprite.atlas.play(2);
	
	//document.getElementById("info").innerHTML = "pos: "+WorldToTile(this.x)+","+WorldToTile(this.y);
}


function Loop() {
	
	if(Input.space) {
		Game.level();
		g_gamestate = 1;
		document.getElementById("info2").style.display = "block";
		document.getElementById("webgl").style.display = "block";
	}

	if(!g_gamestate)
		return;
	
	//calculate timestep
	var now = Time.time();;
	//var ts = now - stepold;
	var ts = 5;
	
	stepold = now;
	
	g_player.update(ts);
	
	//Renderer.render(g_objects);
	Renderer.render(new Array(g_player,g_test));
	
	Renderer.step();
}
