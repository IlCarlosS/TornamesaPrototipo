function setTheme(theme) {
  const root = document.documentElement;
  const colors = {
    "lightpurple": [
        "--bg", "var(--bg-lightpurple)",
        "--card", "var(--card-lightpurple)",
        "--accent", "var(--accent-lightpurple)",
        "--muted", "var(--muted-lightpurple)",
        "--glass", "var(--glass-lightpurple)",
        "--surco", "var(--surco-lightpurple)"
    ],
    "green": [
        "--bg", "var(--bg-green)",
        "--card", "var(--card-green)",
        "--accent", "var(--accent-green)",
        "--muted", "var(--muted-green)",
        "--glass", "var(--glass-green)",
        "--surco", "var(--surco-green)"
    ],
    "electric": [
        "--bg", "var(--bg-electric)",
        "--card", "var(--card-electric)",
        "--accent", "var(--accent-electric)",
        "--muted", "var(--muted-electric)",
        "--glass", "var(--glass-electric)",
        "--surco", "var(--surco-electric)"
    ],
    "vintage": [
        "--bg", "var(--bg-vintage)",
        "--card", "var(--card-vintage)",
        "--accent", "var(--accent-vintage)",
        "--muted", "var(--muted-vintage)",
        "--glass", "var(--glass-vintage)",
        "--surco", "var(--surco-vintage)"
    ],
    "default":[
        "--bg", "#1e2a3a",
        "--card", "#2d3e50",
        "--accent", "#ffc107",
        "--muted", "#b0bec5",
        "--glass", "rgba(255,255,255,0.03)",
        "--surco", "#4a4d4e"
    ],
    "fender": [
        "--bg", "var(--bg-fender)",
        "--card", "var(--card-fender)",
        "--accent", "var(--accent-fender)",
        "--muted", "var(--muted-fender)",
        "--glass", "var(--glass-fender)",
        "--surco", "var(--surco-fender)"
    ],
    "gibson": [
        "--bg", "var(--bg-gibson)",
        "--card", "var(--card-gibson)",
        "--accent", "var(--accent-gibson)",
        "--muted", "var(--muted-gibson)",
        "--glass", "var(--glass-gibson)",
        "--surco", "var(--surco-gibson)"
    ],
  };

  const selected = colors[theme];
  if (selected) {
    for (let i = 0; i < selected.length; i += 2) {
      root.style.setProperty(selected[i], selected[i + 1]);
    }
    localStorage.setItem("theme", theme); // guardar preferencia
  }
}

// Cargar el tema guardado al iniciar
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "default";
  setTheme(savedTheme);
});

//Menu barra colores
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const themeMenu = document.getElementById("themeMenu");

  themeToggle.addEventListener("click", () => {
    themeMenu.classList.toggle("active");
  });

  themeMenu.addEventListener("click", (e) => {
    if (e.target.matches("button[data-theme]")) {
      const theme = e.target.getAttribute("data-theme");
      setTheme(theme);
      themeMenu.classList.remove("active");
    }
  });
});
