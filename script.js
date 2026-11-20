const themeButton = document.querySelector("#toggleTheme");
const themeColor = document.querySelector('meta[name="theme-color"]');
const root = document.documentElement;

function applyTheme(theme) {
  const isDark = theme === "dark";
  root.dataset.theme = theme;
  themeButton.textContent = isDark ? "Light mode" : "Dark mode";
  themeColor.content = isDark ? "#18181c" : "#d3ccc6";
}

applyTheme(root.dataset.theme === "dark" ? "dark" : "light");

themeButton.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem("themePreference", nextTheme);
  } catch {}
});

const timelineEntries = document.querySelectorAll(".timeline details");
document.querySelector(".timeline-actions").addEventListener("click", (event) => {
  const control = event.target.closest("button[data-action]");
  if (!control) return;

  const open = control.dataset.action === "expand";
  timelineEntries.forEach((entry) => {
    entry.open = open;
  });
});

const hobbies = document.querySelector("#hobbiesPopup");
document.querySelector("#openHobbies").addEventListener("click", () => {
  hobbies.showModal();
});
hobbies.addEventListener("click", (event) => {
  if (event.target !== hobbies) return;

  const bounds = hobbies.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) hobbies.close();
});

const audio = document.querySelector("#backgroundMusic");
audio.volume = 0.08;
const musicUnlock = new AbortController();

function startMusic() {
  audio.play()
    .then(() => musicUnlock.abort())
    .catch(() => {});
}

for (const eventName of ["click", "keydown", "touchend"]) {
  document.addEventListener(eventName, startMusic, {
    capture: true,
    signal: musicUnlock.signal,
  });
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted && audio.paused) startMusic();
});

startMusic();
