var Serializer = new(function Serializer() {
  Serializer.prototype.writeNumber = function(number) {
  	return number;
  }

  Serializer.prototype.readNumber = function(stream) {
  	return stream;
  }

  Serializer.prototype.writeArray = function(array) {
  	return array;
  }

  Serializer.prototype.readArray = function(stream) {
  	return stream;
  }
})();