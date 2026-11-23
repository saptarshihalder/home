const themeButton = document.querySelector("#toggleTheme");
const themeColor = document.querySelector('meta[name="theme-color"]');
const root = document.documentElement;

function applyTheme(theme) {
  const isDark = theme === "dark";
  root.dataset.theme = theme;
  themeButton.textContent = isDark ? "Light mode" : "Dark mode";
  themeColor.content = isDark ? "#18181c" : "#ebe5dc";
}

applyTheme(root.dataset.theme === "dark" ? "dark" : "light");

themeButton.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem("themePreference", nextTheme);
  } catch {}
});

const music = document.querySelector("#music");
const volume = 0.06;
let context;

music.volume = volume;

if (music.volume !== volume && window.AudioContext) {
  context = new AudioContext();
  const gain = context.createGain();
  gain.gain.value = volume;
  context.createMediaElementSource(music).connect(gain).connect(context.destination);
}

function playMusic() {
  if (context && context.state !== "running") context.resume().catch(() => {});
  if (music.paused) music.play().catch(() => {});
}

for (const eventName of ["click", "keydown", "touchend"]) {
  document.addEventListener(eventName, playMusic, true);
}

music.addEventListener("pause", () => {
  if (!document.hidden) playMusic();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) playMusic();
});

window.addEventListener("pageshow", playMusic);

if ("mediaSession" in navigator) {
  for (const action of ["pause", "stop"]) {
    try {
      navigator.mediaSession.setActionHandler(action, () => {});
    } catch {}
  }
}
