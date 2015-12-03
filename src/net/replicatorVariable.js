function ReplicatorVariable(replicator, type, destination, owner, identifier, parentObject, variableName, serializeWriteFn, deserializeReadFn, interpolateFn) {
  this.type = type;
  this.destination = destination;
  // this.owner = (destination == REPLICATE_SVCL) ? replicator.id : owner;
  this.owner = owner;
  this.identifier = identifier;
  this.parent = parentObject; // target object in this game instance
  this.name = variableName;
  this.serializeFn = serializeWriteFn;
  this.deserializeFn = deserializeReadFn;
  this.interpolateFn = interpolateFn;

  this.shouldUpdate = false;
  this.history = []; // holds past unacked values, if we own this variable.
                     // on server, it holds inputs which not yet are used for steps
}

ReplicatorVariable.prototype.setHistoryStep = function(index) {

}