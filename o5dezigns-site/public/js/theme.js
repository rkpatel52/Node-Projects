// theme.js
(function () {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  // mobile menu
  if (burger && nav) {
    burger.addEventListener("click", () => nav.classList.toggle("open"));
  }

  // ✅ Update theme-dependent images (WWD icons etc.)
  function syncThemeAssets() {
    const theme = root.getAttribute("data-theme") || "dark";

    // Swap WWD icons based on data-light / data-dark attrs
    document.querySelectorAll(".ico-img").forEach((img) => {
      const lightSrc = img.getAttribute("data-light");
      const darkSrc = img.getAttribute("data-dark");
      if (!lightSrc || !darkSrc) return;

      img.src = theme === "light" ? lightSrc : darkSrc;
    });

    // Optional: close mobile menu after switching theme (nice UX)
    // nav?.classList.remove("open");
  }

  // theme init
  const saved = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");
  setTheme(initial);

  function setTheme(mode) {
    root.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);
    if (btn) btn.textContent = mode === "dark" ? "☾" : "☀";

    // ✅ Apply light/dark assets immediately
    syncThemeAssets();
  }

  if (btn) {
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "dark";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }

  // ✅ If system theme changes and user hasn't manually chosen, you can auto-sync
  // (Keeping it simple: always just sync assets if media query changes)
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", () => syncThemeAssets());
  }
})();
