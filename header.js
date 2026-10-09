/* Shared signed-in account header for every app page. */
(() => {
  const card = document.querySelector(".auth-card");
  if (!card || typeof supabaseClient === "undefined") return;

  const header = document.createElement("div");
  header.className = "account-topbar";
  header.innerHTML = `
    <div class="top-balance" aria-live="polite">
      <span class="top-balance-label">Available balance</span>
      <strong id="topBalanceValue">Loading…</strong>
    </div>
    <div class="topbar-actions">
      <div class="theme-wrap">
        <button type="button" class="theme-toggle" id="themeToggle" aria-label="Choose theme" title="Choose theme" aria-expanded="false">🎨</button>
        <div class="theme-dropdown" id="themeDropdown" hidden>
          <div class="theme-dropdown-title">Choose your theme</div>
          <div class="theme-group-label">Light themes</div>
          <button type="button" class="theme-choice" data-theme-choice="light-blue"><span class="theme-dot dot-blue"></span>Light + Blue</button>
          <button type="button" class="theme-choice" data-theme-choice="light-red"><span class="theme-dot dot-red"></span>Light + Red</button>
          <button type="button" class="theme-choice" data-theme-choice="light-yellow"><span class="theme-dot dot-yellow"></span>Light + Yellow</button>
          <button type="button" class="theme-choice" data-theme-choice="light-green"><span class="theme-dot dot-green"></span>Light + Green</button>
          <div class="theme-group-label">Black themes</div>
          <button type="button" class="theme-choice" data-theme-choice="dark-blue"><span class="theme-dot dot-blue"></span>Black + Blue</button>
          <button type="button" class="theme-choice" data-theme-choice="dark-red"><span class="theme-dot dot-red"></span>Black + Red</button>
          <button type="button" class="theme-choice" data-theme-choice="dark-yellow"><span class="theme-dot dot-yellow"></span>Black + Yellow</button>
          <button type="button" class="theme-choice" data-theme-choice="dark-green"><span class="theme-dot dot-green"></span>Black + Green</button>
        </div>
      </div>
      <div class="profile-wrap">
      <button type="button" class="profile-circle" id="profileButton" aria-label="Open profile menu" aria-expanded="false">👤</button>
      <div class="profile-dropdown" id="profileDropdown" hidden>
        <div class="profile-dropdown-label">Signed in as</div>
        <div class="profile-email" id="profileEmail">Loading…</div>
        <button type="button" class="profile-logout" id="profileLogout">Log out</button>
        <p class="profile-error" id="profileError" role="status"></p>
      </div>
      </div>
    </div>`;
  const nav = document.createElement("nav");
  nav.className = "site-menu";
  nav.setAttribute("aria-label", "Main navigation");
  nav.innerHTML = `
    <button type="button" class="menu-toggle" aria-expanded="false" aria-controls="siteMenuLinks">☰ Menu</button>
    <div class="site-menu-links" id="siteMenuLinks" hidden>
      <a href="dashboard.html">Dashboard</a>
      <a href="faucet.html">Faucet</a>
      <a href="ptc.html">PTC Ads</a>
      <a href="transactions.html">Transactions</a>
      <span class="menu-coming-soon">Withdrawals <small>Coming soon</small></span>
      <span class="menu-coming-soon">Deposits <small>Coming soon</small></span>
    </div>`;
  card.insertBefore(nav, card.firstChild);
  card.insertBefore(header, nav);
  const pageContent = document.createElement("div");
  pageContent.className = "page-content";
  Array.from(card.children).forEach(child => {
    if (child !== header && child !== nav) pageContent.appendChild(child);
  });
  card.appendChild(pageContent);
  const menuButton = nav.querySelector(".menu-toggle");
  const menuLinks = nav.querySelector("#siteMenuLinks");
  menuButton.addEventListener("click", () => {
    const opening = menuLinks.hidden;
    menuLinks.hidden = !opening;
    menuButton.setAttribute("aria-expanded", String(opening));
    menuButton.textContent = opening ? "✕ Close Menu" : "☰ Menu";
  });
  document.addEventListener("click", event => {
    if (!nav.contains(event.target)) {
      menuLinks.hidden = true;
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.textContent = "☰ Menu";
    }
  });

  const profileButton = header.querySelector("#profileButton");
  const dropdown = header.querySelector("#profileDropdown");
  const emailNode = header.querySelector("#profileEmail");
  const balanceNode = header.querySelector("#topBalanceValue");
  const logoutButton = header.querySelector("#profileLogout");
  const errorNode = header.querySelector("#profileError");
  const themeButton = header.querySelector("#themeToggle");
  const themeDropdown = header.querySelector("#themeDropdown");
  function syncThemeButton() {
    themeButton.textContent = "🎨";
    themeButton.setAttribute("aria-label", "Choose theme");
    themeButton.title = "Choose theme";
    themeButton.setAttribute("aria-expanded", String(!themeDropdown.hidden));
    themeDropdown.querySelectorAll("[data-theme-choice]").forEach(option => {
      option.classList.toggle("selected", option.dataset.themeChoice === document.documentElement.dataset.theme);
    });
  }
  syncThemeButton();
  themeButton.addEventListener("click", event => {
    event.stopPropagation();
    themeDropdown.hidden = !themeDropdown.hidden;
    syncThemeButton();
  });
  themeDropdown.querySelectorAll("[data-theme-choice]").forEach(option => {
    option.addEventListener("click", () => {
      if (typeof window.applySiteTheme === "function") window.applySiteTheme(option.dataset.themeChoice);
      themeDropdown.hidden = true;
      syncThemeButton();
    });
  });
  document.addEventListener("click", event => {
    if (!header.querySelector(".theme-wrap").contains(event.target)) {
      themeDropdown.hidden = true;
      syncThemeButton();
    }
  });
  document.addEventListener("site-theme-change", syncThemeButton);

  function closeProfile() {
    dropdown.hidden = true;
    profileButton.setAttribute("aria-expanded", "false");
  }
  profileButton.addEventListener("click", () => {
    const opening = dropdown.hidden;
    dropdown.hidden = !opening;
    profileButton.setAttribute("aria-expanded", String(opening));
  });
  document.addEventListener("click", event => {
    if (!header.querySelector(".profile-wrap").contains(event.target)) closeProfile();
  });

  let currentUserId = null;
  async function refreshAccountHeader() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
      window.location.href = "index.html";
      return;
    }
    const user = data.session.user;
    currentUserId = user.id;
    emailNode.textContent = user.email || "Signed-in user";
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles").select("balance").eq("id", user.id).maybeSingle();
    if (profileError) {
      balanceNode.textContent = "Unavailable";
      return;
    }
    balanceNode.textContent = String(profile?.balance ?? 0) + " points";
  }
  window.refreshAccountHeader = refreshAccountHeader;

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out…";
    errorNode.textContent = "";
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      errorNode.textContent = error.message || "Could not log out. Please try again.";
      logoutButton.disabled = false;
      logoutButton.textContent = "Log out";
      return;
    }
    window.location.href = "index.html";
  });

  refreshAccountHeader();
  window.addEventListener("focus", refreshAccountHeader);
  window.setInterval(() => {
    if (currentUserId) refreshAccountHeader();
  }, 20000);
})();