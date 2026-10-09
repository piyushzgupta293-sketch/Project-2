/* Save and apply the user's selected Project-2 color theme on every page. */
(() => {
  const key = "project2-theme";
  const allowed = ["light-blue","light-red","light-yellow","light-green","dark-blue","dark-red","dark-yellow","dark-green"];
  let saved = "dark-blue";
  try {
    const stored = localStorage.getItem(key);
    if (allowed.includes(stored)) saved = stored;
    else if (stored === "light") saved = "light-blue";
    else if (stored === "dark") saved = "dark-blue";
  } catch (_) {}
  function applySiteTheme(theme) {
    const chosen = allowed.includes(theme) ? theme : "dark-blue";
    document.documentElement.dataset.theme = chosen;
    try { localStorage.setItem(key, chosen); } catch (_) {}
    document.dispatchEvent(new CustomEvent("site-theme-change", { detail: chosen }));
  }
  window.applySiteTheme = applySiteTheme;
  applySiteTheme(saved);
})();