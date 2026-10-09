/* Add a font picker beside the existing colour-theme button on signed-in pages. */
(() => {
  const header = document.querySelector(".account-topbar");
  if (!header || header.querySelector("#fontToggle")) return;

  const style = document.createElement("style");
  style.textContent = `
    .topbar-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .font-wrap{position:relative;flex-shrink:0}
    .font-toggle{min-width:46px;font-size:17px;font-weight:800;letter-spacing:-1px}
    .font-dropdown{right:0;width:230px}
    .font-sample{display:inline-flex;align-items:center;justify-content:center;width:28px;min-width:28px;height:28px;border-radius:7px;background:rgba(128,150,180,.15);font-size:16px;font-weight:700}
    .sample-default{font-family:Arial,Helvetica,sans-serif}
    .sample-modern{font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif}
    .sample-rounded{font-family:"Trebuchet MS",sans-serif}
    .sample-serif{font-family:Georgia,"Times New Roman",serif}
    .sample-rough{font-family:"Comic Sans MS","Segoe Print","Bradley Hand",cursive;font-style:italic}
    html[data-font="default"] body,html[data-font="default"] body *{font-family:Arial,Helvetica,sans-serif!important}
    html[data-font="modern"] body,html[data-font="modern"] body *{font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif!important}
    html[data-font="rounded"] body,html[data-font="rounded"] body *{font-family:"Trebuchet MS","Arial Rounded MT Bold",sans-serif!important}
    html[data-font="serif"] body,html[data-font="serif"] body *{font-family:Georgia,"Times New Roman",serif!important}
    html[data-font="rough"] body,html[data-font="rough"] body *{font-family:"Comic Sans MS","Segoe Print","Bradley Hand",cursive!important}
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "font-wrap";
  wrap.innerHTML = '<button type="button" class="theme-toggle font-toggle" id="fontToggle" aria-label="Choose font" title="Choose font" aria-expanded="false">Aa</button><div class="theme-dropdown font-dropdown" id="fontDropdown" hidden><div class="theme-dropdown-title">Choose your font</div><button type="button" class="theme-choice" data-font-choice="default"><span class="font-sample sample-default">Aa</span> Default</button><button type="button" class="theme-choice" data-font-choice="modern"><span class="font-sample sample-modern">Aa</span> Clean Modern</button><button type="button" class="theme-choice" data-font-choice="rounded"><span class="font-sample sample-rounded">Aa</span> Rounded</button><button type="button" class="theme-choice" data-font-choice="serif"><span class="font-sample sample-serif">Aa</span> Classic Serif</button><button type="button" class="theme-choice" data-font-choice="rough"><span class="font-sample sample-rough">Aa</span> Rough Notes</button></div>';
  const actions = header.querySelector(".topbar-actions");
  const themeWrap = actions && actions.querySelector(".theme-wrap");
  if (!actions || !themeWrap) return;
  actions.insertBefore(wrap, themeWrap);

  const button = wrap.querySelector("#fontToggle");
  const dropdown = wrap.querySelector("#fontDropdown");
  const fonts = {
    default: 'Arial, Helvetica, sans-serif',
    modern: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
    rounded: '"Trebuchet MS", "Arial Rounded MT Bold", sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    rough: '"Comic Sans MS", "Segoe Print", "Bradley Hand", cursive'
  };
  function applyFont(name) {
    const chosen = Object.prototype.hasOwnProperty.call(fonts, name) ? name : "default";
    document.documentElement.dataset.font = chosen;
    document.documentElement.style.setProperty("--project-font", fonts[chosen]);
    try { localStorage.setItem("project2-font", chosen); } catch (_) {}
    dropdown.querySelectorAll("[data-font-choice]").forEach(option => {
      option.classList.toggle("selected", option.dataset.fontChoice === chosen);
    });
  }
  let saved = "default";
  try {
    const stored = localStorage.getItem("project2-font");
    if (stored && Object.prototype.hasOwnProperty.call(fonts, stored)) saved = stored;
  } catch (_) {}
  applyFont(saved);
  button.addEventListener("click", event => {
    event.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
    const themes = header.querySelector("#themeDropdown");
    if (themes) themes.hidden = true;
    button.setAttribute("aria-expanded", String(!dropdown.hidden));
  });
  dropdown.querySelectorAll("[data-font-choice]").forEach(option => {
    option.addEventListener("click", () => {
      applyFont(option.dataset.fontChoice);
      dropdown.hidden = true;
      button.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("click", event => {
    if (!wrap.contains(event.target)) {
      dropdown.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
  });
})();