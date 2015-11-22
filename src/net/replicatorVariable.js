function ReplicatorVariable(type, destination, owner, identifier, parentObject, variableName, serializeWriteFn, deserializeReadFn) {
  this.type = type;
  this.destination = destination;
  this.owner = (destination == REPLICATE_SVCL) ? Replicator.id : owner;
  this.identifier = identifier;
  this.parent = parentObject; // target object in this game instance
  this.name = variableName;
  this.serializeFn = serializeWriteFn;
  this.deserializeFn = deserializeReadFn;

  this.shouldUpdate = false;
  //this._history = [];
  //this._unconfirmed = [];
}
