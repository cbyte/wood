var Serializer = new(function Serializer() {
  Serializer.prototype.writeNumber = function(number) {
    return number;
  }

  Serializer.prototype.readNumber = function(stream) {
    return stream;
  }

  Serializer.prototype.interpolateNumber = function(INTERP, oldValue, newValue) {
    return newValue * INTERP + oldValue * (1 - INTERP);
  }

  Serializer.prototype.writeArray = function(array) {
    return Array.prototype.slice.call(array);
  }

  Serializer.prototype.readArray = function(stream) {
    return stream;
  }

  Serializer.prototype.interpolateArray = function(INTERP, oldValue, newValue) {
    return [newValue[0] * INTERP + oldValue[0] * (1 - INTERP),
      newValue[1] * INTERP + oldValue[1] * (1 - INTERP),
      newValue[2] * INTERP + oldValue[2] * (1 - INTERP)
    ];
  }

  Serializer.prototype.writeFloat32Array = function(array) {
    return Array.prototype.slice.call(array);
  }

  Serializer.prototype.readFloat32Array = function(stream) {
    // console.log(stream)
    return new Float32Array(stream);
  }

  Serializer.prototype.interpolateFloat32Array = function(INTERP, oldValue, newValue) {
    return new Float32Array([newValue[0] * INTERP + oldValue[0] * (1 - INTERP),
      newValue[1] * INTERP + oldValue[1] * (1 - INTERP),
      newValue[2] * INTERP + oldValue[2] * (1 - INTERP)
    ]);
  }
})();
