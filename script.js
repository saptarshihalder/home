const themeButton = document.querySelector("#toggleTheme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)");
const themeColor = document.querySelector('meta[name="theme-color"]');
const root = document.documentElement;

function savedTheme() {
  try {
    return localStorage.getItem("themePreference");
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  root.dataset.theme = theme;
  themeButton.querySelector(".theme-label").textContent = isDark ? "Light" : "Dark";
  themeButton.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
  themeColor.content = isDark ? "#20231d" : "#eeece2";
}

applyTheme(root.dataset.theme === "dark" ? "dark" : "light");

themeButton.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem("themePreference", nextTheme);
  } catch {
    // The current page can still switch themes when storage is unavailable.
  }
});

preferredTheme.addEventListener("change", (event) => {
  const stored = savedTheme();
  if (stored !== "dark" && stored !== "light") {
    applyTheme(event.matches ? "dark" : "light");
  }
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
const soundButtons = document.querySelectorAll("[data-sound]");
audio.volume = 0.08;

function updateSound(isPlaying) {
  soundButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(isPlaying));
    button.querySelector(".sound-label").textContent = isPlaying ? "Pause music" : "Play music";
  });
}

function markSoundUnavailable() {
  soundButtons.forEach((button) => {
    button.dataset.unavailable = "true";
    button.setAttribute("aria-pressed", "false");
    button.querySelector(".sound-label").textContent = "Music unavailable";
  });
}

audio.addEventListener("playing", () => updateSound(true));
audio.addEventListener("pause", () => updateSound(false));
audio.addEventListener("error", markSoundUnavailable);

soundButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
      soundButtons.forEach((control) => delete control.dataset.unavailable);
    } catch {
      if (audio.paused) markSoundUnavailable();
    }
  });
});
