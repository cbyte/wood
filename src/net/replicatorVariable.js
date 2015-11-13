function ReplicatorVariable(type, destination, owner, identifier, parentObject, variableName, serializeWriteFn, deserializeReadFn) {
  this.type = type;
  this.destination = destination;
  this.owner = owner;
  this.identifier = identifier;
  this.parent = parentObject; // target object in this game instance
  this.name = variableName;
  this.serializeWriteFn = serializeWriteFn;
  this.deserializeReadFn = deserializeReadFn;

  //this._history = [];
  //this._unconfirmed = [];
}
