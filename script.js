const volume = 0.22;
const lines = [
  "the past is just a slower connection.",
  "everything loads eventually. not everything stays.",
  "nothing here is new. it has only been waiting for someone.",
  "this takes a moment. so did everything that ended.",
  "most of what i remember never happened quite like this.",
  "you came here on purpose. that already says something.",
];

const loading = document.querySelector(".loading");
const bar = loading.querySelector(".bar");
const percent = loading.querySelector(".percent");
const enter = loading.querySelector("button");
let context;

loading.querySelector(".line").textContent = lines[Math.floor(Math.random() * lines.length)];
loading.close();
loading.showModal();

function show(fraction) {
  const value = `${Math.round(Math.min(fraction, 1) * 100)}%`;
  bar.style.setProperty("--loaded", value);
  percent.textContent = value;
}

async function download() {
  const response = await fetch("./music.mp3");
  const total = Number(response.headers.get("content-length"));
  if (!response.ok || !response.body || !total) return response.arrayBuffer();

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    show(received / total);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes.buffer;
}

const track = download();
track.catch(() => {});

Promise.allSettled([track, document.fonts.ready]).then(() => {
  show(1);
  loading.classList.add("ready");
  enter.hidden = false;
  enter.focus();
});

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

  track
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
