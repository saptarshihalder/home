import { createGlass } from "./glass.js";

const root = document.documentElement;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const glass = createGlass(document.querySelector(".glass"), { still });
const title = document.querySelector("h1");
const threshold = document.querySelector(".threshold");
const weather = document.querySelector("#weather");
const now = document.querySelector("#now");
const late = document.querySelector(".late");
const pulse = document.querySelector(".pulse");
const pulsePen = pulse.getContext("2d");
const name = document.title;

const weathers = {
  drizzle: { rain: 0.35, fog: 0.7, phrase: "it's drizzling" },
  rain: { rain: 0.7, fog: 0.82, phrase: "it's raining" },
  downpour: { rain: 1, fog: 0.95, phrase: "it's pouring" },
  fog: { rain: 0.12, fog: 1, phrase: "it's foggy" },
  clearing: { rain: 0.1, fog: 0.4, phrase: "it's clearing up" },
};

const scene = { rain: 0.7, fog: 0.82, depth: 0, pulse: 0, daylight: 0 };
let forecast = weathers.rain;
let entered = false;
let lastWritten = 0;
let finger = null;

root.classList.toggle("glass-on", Boolean(glass));

const level = 0.22;
const track = fetch("./music.mp3").then((response) => response.arrayBuffer());
const samples = new Uint8Array(1024);
let context;
let analyser;

track.catch(() => {});

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
  analyser = context.createAnalyser();
  analyser.fftSize = samples.length;
  analyser.connect(gain);
  gain.connect(context.destination);

  track
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(analyser);
      source.start();
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(level, context.currentTime + 6);
    })
    .catch(() => {});
}

for (const eventName of ["click", "keydown", "touchend"]) {
  document.addEventListener(eventName, startMusic, true);
}

document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? "it's still raining here" : name;
  if (context && !document.hidden) startMusic();
});

function writeName() {
  if (!glass) return;
  const style = getComputedStyle(title);
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  glass.write([...title.children].map((word) => {
    const box = word.getBoundingClientRect();
    return { text: word.textContent.toLowerCase(), left: box.left, top: box.top, height: box.height, font };
  }));
  lastWritten = performance.now();
  if (still) glass.render(0, scene);
}

function maybeWrite() {
  const due = !lastWritten || (!still && performance.now() - lastWritten > 36000);
  if (entered && due && !document.hidden && scrollY < innerHeight * 0.3) writeName();
}

function enter() {
  if (entered) return;
  entered = true;
  document.fonts.ready.then(() => setTimeout(maybeWrite, 700));
}

threshold.addEventListener("submit", (event) => {
  event.preventDefault();
  startMusic();
  threshold.classList.add("leaving");
  setTimeout(() => threshold.close(), 1000);
});

threshold.addEventListener("close", enter);
threshold.showModal();

setInterval(maybeWrite, 2000);

addEventListener("pointerdown", (event) => {
  if (!glass || !entered) return;
  finger = { x: event.clientX, y: event.clientY };
  glass.wipe(finger.x, finger.y, finger.x, finger.y);
});

addEventListener("pointermove", (event) => {
  if (!finger) return;
  glass.wipe(finger.x, finger.y, event.clientX, event.clientY);
  finger = { x: event.clientX, y: event.clientY };
});

addEventListener("pointerup", () => {
  if (finger && Math.random() < 0.6) glass.drip(finger.x, finger.y);
  finger = null;
});

addEventListener("pointercancel", () => {
  finger = null;
});

const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

function tell() {
  const date = new Date();
  const hours = date.getHours() + date.getMinutes() / 60;
  now.textContent = `${clock.format(date).toLowerCase()} where you are · ${forecast.phrase}`;
  scene.daylight = Math.max(0, Math.sin(((hours - 6) / 12) * Math.PI)) * 0.6;
  late.hidden = date.getHours() >= 5;
}

weather.addEventListener("change", () => {
  forecast = weathers[weather.value];
  tell();
  if (still) glass?.render(0, { ...scene, ...forecast });
});

tell();
setInterval(tell, 15000);

document.querySelector(".memory-controls").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  for (const entry of document.querySelectorAll("details")) {
    entry.open = button.value === "remember";
  }
});

function splitWords(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        fragment.append(part);
        continue;
      }
      const word = document.createElement("span");
      word.className = "word";
      word.textContent = part;
      word.style.setProperty("--delay", `${Math.round(Math.random() * 900)}ms`);
      fragment.append(word);
    }
    node.replaceWith(fragment);
  }
}

if (!still) {
  const memory = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle("remembered", entry.isIntersecting);
    }
  }, { rootMargin: "-6% 0px" });

  for (const element of document.querySelectorAll(".epigraph, .preface p, .aside, details p, .stanza li, footer p")) {
    splitWords(element);
    element.classList.add("memory");
    memory.observe(element);
  }
}

function drawPulse() {
  const { width, height } = pulse;
  pulsePen.clearRect(0, 0, width, height);
  pulsePen.strokeStyle = "rgba(235, 230, 222, 0.5)";
  pulsePen.lineWidth = 2;
  pulsePen.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const sample = analyser ? (samples[Math.floor((x / width) * (samples.length - 1))] - 128) / 128 : 0;
    const y = height / 2 + sample * height * 1.4;
    if (x) pulsePen.lineTo(x, y);
    else pulsePen.moveTo(x, y);
  }
  pulsePen.stroke();
}

function frame(time) {
  requestAnimationFrame(frame);

  let loudness = 0;
  if (analyser) {
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
    loudness = Math.sqrt(sum / samples.length);
  }

  scene.rain += (forecast.rain - scene.rain) * 0.02;
  scene.fog += (forecast.fog - scene.fog) * 0.02;
  scene.depth += (Math.min(scrollY / innerHeight, 1) - scene.depth) * 0.08;
  scene.pulse += (Math.min(loudness * 2.5, 1) - scene.pulse) * 0.12;

  glass?.render(time / 1000, scene);
  drawPulse();
}

if (still) {
  scene.rain = forecast.rain;
  scene.fog = forecast.fog;
  document.fonts.ready.then(() => glass?.render(0, scene));
  drawPulse();
} else {
  requestAnimationFrame(frame);
}
