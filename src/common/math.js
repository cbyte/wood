function max(a, b) {
  return a > b ? a : b;
}

function rand(min, max) {
  if (min > max) return rand(max, min);
  if (min == max) return min;
  return min + parseInt(Math.random() * (max - min + 1));
}