(function () {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  // mobile menu
  if (burger && nav) {
    burger.addEventListener("click", () => nav.classList.toggle("open"));
  }

  // theme init
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");
  setTheme(initial);

  function setTheme(mode) {
    root.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);
    if (btn) btn.textContent = mode === "dark" ? "☾" : "☀";
  }

  if (btn) {
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "dark";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }
})();
