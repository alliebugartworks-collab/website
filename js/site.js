let siteConfig = null;

async function loadSiteConfig() {
  if (siteConfig) return siteConfig;

  const response = await fetch("data/site.json");
  if (!response.ok) {
    throw new Error("Could not load site configuration.");
  }

  siteConfig = await response.json();
  return siteConfig;
}

function renderContactLinks(config, container) {
  container.innerHTML = `
    <a href="tel:${config.phoneLink}">${config.phone}</a>
    <a href="${config.venmoLink}" target="_blank" rel="noopener noreferrer">Venmo ${config.venmo}</a>
  `;
}

function renderFooter(config, container) {
  container.innerHTML = `
    <p><strong>${config.artistName}</strong> · ${config.siteTitle}</p>
    <p>Interested in a piece? Reach out to place an order.</p>
    <div class="footer-links">
      <a href="tel:${config.phoneLink}">${config.phone}</a>
      <a href="${config.venmoLink}" target="_blank" rel="noopener noreferrer">Venmo ${config.venmo}</a>
    </div>
  `;
}

async function initSite() {
  try {
    const config = await loadSiteConfig();

    const titleEl = document.getElementById("site-title");
    const taglineEl = document.getElementById("site-tagline");
    const headerContact = document.getElementById("header-contact");
    const footerContact = document.getElementById("footer-contact");

    if (titleEl) titleEl.textContent = config.siteTitle;
    if (taglineEl) taglineEl.textContent = config.tagline;
    document.title = document.title.includes("—")
      ? document.title.replace(/—.*$/, `— ${config.siteTitle}`)
      : config.siteTitle;

    if (headerContact) renderContactLinks(config, headerContact);
    if (footerContact) renderFooter(config, footerContact);
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", initSite);
