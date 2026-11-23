const themeButton = document.querySelector("#toggleTheme");
const themeColor = document.querySelector('meta[name="theme-color"]');
const root = document.documentElement;

function applyTheme(theme) {
  const isDark = theme === "dark";
  root.dataset.theme = theme;
  themeButton.textContent = isDark ? "day" : "night";
  themeColor.content = isDark ? "#14151b" : "#ece3d4";
}

applyTheme(root.dataset.theme === "dark" ? "dark" : "light");

themeButton.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem("themePreference", nextTheme);
  } catch {}
});

const volume = 0.06;
let context;

function startMusic() {
  if (context) {
    if (context.state !== "running") context.resume().catch(() => {});
    return;
  }

  context = new AudioContext();
  context.resume().catch(() => {});
  context.addEventListener("statechange", () => {
    if (!document.hidden) startMusic();
  });

  const gain = context.createGain();
  gain.gain.value = volume;
  gain.connect(context.destination);

  fetch("./music.mp3")
    .then((response) => response.arrayBuffer())
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start();
    })
    .catch(() => {});
}

for (const eventName of ["click", "keydown", "touchend"]) {
  document.addEventListener(eventName, startMusic, true);
}

document.addEventListener("visibilitychange", () => {
  if (context && !document.hidden) startMusic();
});
