(() => {
  const key = "ay_cookie_preferences_v1";
  const banner = document.querySelector("[data-cookie-banner]");
  const dialog = document.querySelector("[data-cookie-dialog]");
  const analytics = document.querySelector("[data-cookie-analytics]");
  const marketing = document.querySelector("[data-cookie-marketing]");

  function readPrefs() {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (_) {
      return null;
    }
  }

  function applyPrefs(prefs) {
    const normalized = {
      necessary: true,
      analytics: Boolean(prefs && prefs.analytics),
      marketing: Boolean(prefs && prefs.marketing),
      updatedAt: (prefs && prefs.updatedAt) || new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(normalized));
    document.documentElement.dataset.cookieAnalytics = normalized.analytics ? "allowed" : "blocked";
    document.documentElement.dataset.cookieMarketing = normalized.marketing ? "allowed" : "blocked";
    if (banner) banner.hidden = true;
  }

  function syncControls() {
    const prefs = readPrefs() || { analytics: false, marketing: false };
    if (analytics) analytics.checked = Boolean(prefs.analytics);
    if (marketing) marketing.checked = Boolean(prefs.marketing);
  }

  function openPreferences() {
    syncControls();
    if (dialog && typeof dialog.showModal === "function") {
      if (banner) banner.hidden = true;
      dialog.showModal();
    } else if (banner) {
      banner.hidden = false;
    }
  }

  function closePreferences() {
    if (dialog && dialog.open) dialog.close();
    if (!readPrefs() && banner) banner.hidden = false;
  }

  const existing = readPrefs();
  if (existing) {
    applyPrefs(existing);
  } else if (banner) {
    banner.hidden = false;
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-cookie-preferences], [data-cookie-manage]")) {
      openPreferences();
    }
    if (event.target.closest("[data-cookie-accept]")) {
      applyPrefs({ analytics: true, marketing: true });
    }
    if (event.target.closest("[data-cookie-reject]")) {
      applyPrefs({ analytics: false, marketing: false });
    }
    if (event.target.closest("[data-cookie-save]")) {
      applyPrefs({
        analytics: analytics && analytics.checked,
        marketing: marketing && marketing.checked,
      });
      if (dialog && dialog.open) dialog.close();
    }
    if (event.target.closest("[data-cookie-close]")) {
      closePreferences();
    }
  });
})();
