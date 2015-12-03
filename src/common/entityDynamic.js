function EntityDynamic(game, id, owner, model, collisionShape, mass) {
  Entity.call(this, game, model);

  this.owner = owner;

  var transform = new Ammo.btTransform();
  transform.setIdentity();

  var rot = new Ammo.btQuaternion(this.rotation[0], this.rotation[1], this.rotation[2], this.rotation[3]);
  transform.setRotation(rot);
  transform.setOrigin(new Ammo.btVector3(this.position[0], this.position[1], this.position[2]));

  var motionState = new Ammo.btDefaultMotionState(transform);
  if (!collisionShape) {
    collisionShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
  }
  var localInertia = new Ammo.btVector3(0, 0, 0);
  if (!mass) {
    mass = 1;
  }
  collisionShape.calculateLocalInertia(mass, localInertia);
  this.body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(mass, motionState, collisionShape, localInertia));
  this.body.entityReference = this;
  game.dynamicsWorld.addRigidBody(this.body);
  game.collisionObjects.push(this.body);

  this.linVel = [0, 0, 0]
  this.angVel = [0, 0, 0]

  this.positionSync = game.replicatorSession.registerVariable(new ReplicatorVariable(game.replicator, REPLICATE_UNRELIABLE, REPLICATE_SVCL, this.game.replicatorSession.owner, id + '_position', this, 'position', Serializer.writeArray, Serializer.readArray, Serializer.interpolateArray));
  this.rotationSync = game.replicatorSession.registerVariable(new ReplicatorVariable(game.replicator, REPLICATE_UNRELIABLE, REPLICATE_SVCL, this.game.replicatorSession.owner, id + '_rotation', this, 'rotation', Serializer.writeFloat32Array, Serializer.readFloat32Array));
  this.linVelocitySync = game.replicatorSession.registerVariable(new ReplicatorVariable(game.replicator, REPLICATE_UNRELIABLE, REPLICATE_SVCL, this.game.replicatorSession.owner, id + '_linvel', this, 'linVel', Serializer.writeFloat32Array, Serializer.readFloat32Array));
  this.angVelocitySync = game.replicatorSession.registerVariable(new ReplicatorVariable(game.replicator, REPLICATE_UNRELIABLE, REPLICATE_SVCL, this.game.replicatorSession.owner, id + '_angvel', this, 'angVel', Serializer.writeFloat32Array, Serializer.readFloat32Array));
}

EntityDynamic.prototype = Object.create(Entity.prototype);
EntityDynamic.prototype.constructor = EntityDynamic;


// get information from physic simulation (which had been stepped before)
EntityDynamic.prototype.setPositionRotationVelocityFromPhysicSimulation = function(trans) {
  // stay in sync with physics step calculation
  var obj = this.body;

  var motionState = obj.getMotionState();
  motionState.getWorldTransform(trans);

  var origin = trans.getOrigin();
  var rotat = trans.getRotation();
  var linVel = obj.getLinearVelocity();
  var angVel = obj.getAngularVelocity();

  this.position = [origin.x(), origin.y(), origin.z()]
  this.rotation = quat.fromValues(rotat.x(), rotat.y(), rotat.z(), rotat.w());
  this.linVel = [linVel.x(), linVel.y(), linVel.z()];
  this.angVel = [angVel.x(), angVel.y(), angVel.z()];
}


EntityDynamic.prototype.setPhysicsTransformFromPositionRotationVelocity = function() {
  var body = this.body;
  var motionState = body.getMotionState();

  var position = this.positionSync;
  var rotation = this.rotationSync;
  var linVel = this.linVelocitySync;
  var angVel = this.angVelocitySync;
  var transform = new Ammo.btTransform();
  transform.setOrigin(new Ammo.btVector3(this.position[0], this.position[1], this.position[2]));
  transform.setRotation(new Ammo.btQuaternion(this.rotation[0], this.rotation[1], this.rotation[2], this.rotation[3]))

  body.setLinearVelocity(new Ammo.btVector3(this.linVel[0], this.linVel[1], this.linVel[2]));
  body.setAngularVelocity(new Ammo.btVector3(this.angVel[0], this.angVel[1], this.angVel[2]));
  body.setWorldTransform(transform)
  motionState.setWorldTransform(transform);
}

EntityDynamic.prototype.update = function(ts) {}

// Update the position and rotation after it has been changed manually
EntityDynamic.prototype.updateCollision = function() {
  var transform = new Ammo.btTransform();
  transform.setIdentity();

  var rot = new Ammo.btQuaternion(this.rotation[0], this.rotation[1], this.rotation[2], this.rotation[3]);
  transform.setRotation(rot);
  transform.setOrigin(new Ammo.btVector3(this.position[0], this.position[1], this.position[2]));
  this.body.setWorldTransform(transform)
}

EntityDynamic.prototype.setRotationX = function(degree) {
  Object.getPrototypeOf(EntityDynamic.prototype).setRotationX.call(this, degree);
  this.updateCollision();
}

EntityDynamic.prototype.setRotationY = function(degree) {
  Object.getPrototypeOf(EntityDynamic.prototype).setRotationY.call(this, degree);
  this.updateCollision();
}

EntityDynamic.prototype.setRotationZ = function(degree) {
  Object.getPrototypeOf(EntityDynamic.prototype).setRotationZ.call(this, degree);
  this.updateCollision();
}
