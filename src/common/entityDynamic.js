function EntityDynamic(game, model, collisionShape, mass) {
  Entity.call(this, model);

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

  this.positionSync = Replicator.getSession().registerVariable(new ReplicatorVariable(REPLICATE_UNRELIABLE, REPLICATE_SVCL, null, this.id + '_position', this, 'position', Serializer.writeArray, Serializer.readArray));
  this.rotationSync = Replicator.getSession().registerVariable(new ReplicatorVariable(REPLICATE_UNRELIABLE, REPLICATE_SVCL, null, this.id + '_rotation', this, 'rotation', Serializer.writeFloat32Array, Serializer.readFloat32Array));
  this.linVelocitySync = Replicator.getSession().registerVariable(new ReplicatorVariable(REPLICATE_UNRELIABLE, REPLICATE_SVCL, null, this.id + '_linvel', this, 'linVel', Serializer.writeFloat32Array, Serializer.readFloat32Array));
  this.angVelocitySync = Replicator.getSession().registerVariable(new ReplicatorVariable(REPLICATE_UNRELIABLE, REPLICATE_SVCL, null, this.id + '_angvel', this, 'angVel', Serializer.writeFloat32Array, Serializer.readFloat32Array));
}

EntityDynamic.prototype = Object.create(Entity.prototype);
EntityDynamic.prototype.constructor = EntityDynamic;

EntityDynamic.prototype.updatePhysics = function(trans) {
  // stay in sync with physics step calculation
  // console.log('set to server position')
  var obj = this.body;

  var motionState = obj.getMotionState();
  motionState.getWorldTransform(trans);

  var origin = trans.getOrigin();
  var rotat = trans.getRotation();
  var linVel = obj.getLinearVelocity();
  var angVel = obj.getAngularVelocity();

  obj.entityReference.position = [origin.x(), origin.y(), origin.z()]
  obj.entityReference.rotation = quat.fromValues(rotat.x(), rotat.y(), rotat.z(), rotat.w());
  obj.entityReference.linVel = [linVel.x(), linVel.y(), linVel.z()];
  obj.entityReference.angVel = [angVel.x(), angVel.y(), angVel.z()];
}

EntityDynamic.prototype.update = function(ts) {
  console.log(this)
  if (this.positionSync.shouldUpdate) {
    this.positionSync.shouldUpdate = false;
    var body = this.body;
    var motionState = body.getMotionState();

    var position = this.positionSync;
    var rotation = this.rotationSync;
    var linVel = this.linVelocitySync;
    var angVel = this.angVelocitySync;
    var transform = new Ammo.btTransform();
    transform.setOrigin(new Ammo.btVector3(position.history[0], position.history[1], position.history[2]));
    transform.setRotation(new Ammo.btQuaternion(rotation.history[0], rotation.history[1], rotation.history[2], rotation.history[3]))

    body.setLinearVelocity(new Ammo.btVector3(linVel.history[0], linVel.history[1], linVel.history[2]));
    body.setAngularVelocity(new Ammo.btVector3(angVel.history[0], angVel.history[1], angVel.history[2]));
    body.setWorldTransform(transform)
    motionState.setWorldTransform(transform)

    // step forward to be right in time: do not stay in the old server time but recalculate to the clients present time
    // todo: fix that we render just at this moment, this would lead to laggy movement
    // maybe it would be good to pause when we update the data, better it would be maybe to not write in the drawable arrays but temporary ones (above after calculation)
    // Game.stepCollision(1 / 30, 2);
  }
}

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
