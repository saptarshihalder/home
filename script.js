const volume = 0.22;
let context;
let track;

function fetchTrack() {
  track ??= fetch("./music.mp3").then((response) => response.arrayBuffer());
  return track;
}

function startMusic() {
  if (context) {
    if (context.state !== "running") context.resume().catch(() => {});
    return;
  }

  if ("audioSession" in navigator) navigator.audioSession.type = "playback";
  context = new AudioContext();
  context.resume().catch(() => {});
  context.addEventListener("statechange", () => {
    if (!document.hidden) startMusic();
  });

  const gain = context.createGain();
  gain.gain.value = 0;
  gain.connect(context.destination);

  fetchTrack()
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start();
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(volume, context.currentTime + 8);
    })
    .catch(() => {});
}

for (const eventName of ["click", "keydown", "touchend"]) {
  document.addEventListener(eventName, startMusic, true);
}

document.addEventListener("visibilitychange", () => {
  if (context && !document.hidden) startMusic();
});

addEventListener("load", () => {
  fetchTrack().catch(() => {});
});

const drawer = document.querySelector(".drawer");

document.querySelector(".menu").addEventListener("click", () => {
  drawer.showModal();
});

drawer.addEventListener("click", (event) => {
  if (event.target === drawer && event.clientX < drawer.getBoundingClientRect().left) drawer.close();
});
