
var Resource = new function() {
  this.resources = [];

  // Returns when all resources are loaded
  this.init = function(){
    var self = this;

    var loadResources = []
    console.log('this.resources',this.resources)
    for(var i=0;i<this.resources.length;i++){
      loadResources.push(this.resources[i].init())
    }

    console.log('loadResources',loadResources)
    
    return Q.all([loadResources]);
  }

  this.add = function(resource) {
    this.resources.push(resource);
    return this.resources.length-1;
  }

  this.get = function(index) {
    for(var i=0;i<this.resources.length;i++){
      if(this.resources[i].filename==index){
        return this.resources[i];
      }
    }
    return this.resources[0];
  }
};