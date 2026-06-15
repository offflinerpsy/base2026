(() => {
  function pageUrl() {
    return window.location.href.split("#")[0];
  }

  function pageTitle(root) {
    const localTitle = root?.getAttribute?.("data-share-title");
    if (localTitle) return localTitle;
    return document.querySelector("h1")?.textContent?.trim() || document.title || "Base2026";
  }

  function pageDescription(root) {
    const localDescription = root?.getAttribute?.("data-share-description");
    if (localDescription) return localDescription;
    return document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  }

  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  function setStatus(root, text) {
    const status = root.querySelector("[data-share-status]");
    if (!status) return;
    status.textContent = text;
    window.clearTimeout(status._timer);
    status._timer = window.setTimeout(() => {
      status.textContent = "";
    }, 2200);
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-share-action]");
    if (!button) return;
    const root = button.closest("[data-share-root]") || document;
    const action = button.getAttribute("data-share-action");
    const title = pageTitle(root);
    const url = pageUrl();
    const description = pageDescription(root);

    try {
      if (action === "share" && navigator.share) {
        await navigator.share({ title, text: description, url });
        setStatus(root, "Shared");
        return;
      }
      if (action === "print") {
        window.print();
        setStatus(root, "Print dialog opened");
        return;
      }
      if (action === "copy-citation") {
        await writeClipboard(`${title} - Base2026. ${url}`);
        setStatus(root, "Citation copied");
        return;
      }
      await writeClipboard(url);
      setStatus(root, "Link copied");
    } catch (error) {
      if (action === "share") {
        try {
          await writeClipboard(url);
          setStatus(root, "Link copied");
          return;
        } catch (_) {
          // Fall through to visible error.
        }
      }
      setStatus(root, "Could not copy");
    }
  });
})();
