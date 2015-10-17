function PlaySound(s) {
  var audio = new Audio();
  audio.volume = 0.2;
  audio.src = s;
  audio.play();
}
