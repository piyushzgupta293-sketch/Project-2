/* Remember the selected theme on every page of Project-2. */
(() => {
  const key = "project2-theme";
  let saved = "dark";
  try { saved = localStorage.getItem(key) || "dark"; } catch (_) {}
  function applySiteTheme(theme) {
    const chosen = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = chosen;
    try { localStorage.setItem(key, chosen); } catch (_) {}
    document.dispatchEvent(new CustomEvent("site-theme-change", { detail: chosen }));
  }
  window.applySiteTheme = applySiteTheme;
  applySiteTheme(saved);
})();