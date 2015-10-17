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