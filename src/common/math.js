const DEGREE_TO_RAD = Math.PI / 180

function max(a, b) {
  return a > b ? a : b;
}

function rand(min, max) {
  if (min > max) return rand(max, min);
  if (min == max) return min;
  return min + parseInt(Math.random() * (max - min + 1));
}

// source: http://stackoverflow.com/a/105074
Math.getUniqueNumber = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

// returns index if found else -1
Array.prototype.exists = function(param, value) {
  var found = -1;
  this.forEach(function(e, i) {
    if (typeof e[param] != 'undefined') {
      if (e[param] == value) {
        found = i;
      }
    }
  })
  return found;
}
