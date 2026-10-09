/* Set Light + Blue only for visitors who have not chosen a theme yet. */
(() => {
  try {
    if (!localStorage.getItem("project2-theme")) {
      localStorage.setItem("project2-theme", "light-blue");
    }
  } catch (_) {}
})();