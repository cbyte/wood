var Serializer = new(function Serializer() {
  Serializer.prototype.writeNumber = function(number) {
    return number;
  }

  Serializer.prototype.readNumber = function(stream) {
    return stream;
  }

  Serializer.prototype.writeArray = function(array) {
    return Array.prototype.slice.call(array);
  }

  Serializer.prototype.readArray = function(stream) {
    return stream;
  }

  Serializer.prototype.writeFloat32Array = function(array) {
    return Array.prototype.slice.call(array);
  }

  Serializer.prototype.readFloat32Array = function(stream) {
    // console.log(stream)
    return new Float32Array(stream);
  }
})();
