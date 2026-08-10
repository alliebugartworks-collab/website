const CART_STORAGE_KEY = "allie-bug-cart";

let siteConfig = null;

function getCart() {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) return [];

    const parsedCart = JSON.parse(rawCart);
    if (!Array.isArray(parsedCart)) return [];

    return parsedCart.filter((item) => item && typeof item.id === "string" && Number(item.quantity) > 0);
  } catch (error) {
    console.error("Could not load cart from storage.", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  renderCartBadge();
}

function getCartCount() {
  return getCart().reduce((count, item) => count + Number(item.quantity || 0), 0);
}

function normalizeAddons(addons) {
  if (!addons || typeof addons !== "object") return {};

  return {
    ribbon: Boolean(addons.ribbon),
    stars: Boolean(addons.stars),
  };
}

function getArtworkAddonPrice(artworkId, addons = {}) {
  const supportedIds = new Set(["casey-name", "name-banner"]);
  if (!supportedIds.has(String(artworkId))) return 0;

  const normalizedAddons = normalizeAddons(addons);
  const addonPrices = {
    ribbon: 5,
    stars: 10,
  };

  return (normalizedAddons.ribbon ? addonPrices.ribbon : 0) + (normalizedAddons.stars ? addonPrices.stars : 0);
}

function addToCart(artworkId, quantity = 1, customization = "", selectedAddons = {}) {
  const normalizedQuantity = Number(quantity) || 1;
  const normalizedCustomization = typeof customization === "string" ? customization.trim() : "";
  const normalizedAddons = normalizeAddons(selectedAddons);
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === artworkId);

  if (existingItem) {
    existingItem.quantity = Math.max(0, Number(existingItem.quantity || 0) + normalizedQuantity);
    if (normalizedCustomization) {
      existingItem.customization = normalizedCustomization;
    }
    existingItem.addons = normalizedAddons;
    if (existingItem.quantity <= 0) {
      const itemIndex = cart.findIndex((item) => item.id === artworkId);
      cart.splice(itemIndex, 1);
    }
  } else {
    cart.push({
      id: artworkId,
      quantity: Math.max(1, normalizedQuantity),
      customization: normalizedCustomization,
      addons: normalizedAddons,
    });
  }

  saveCart(cart);
  return cart;
}

function updateCartItem(artworkId, quantity) {
  const cart = getCart();
  const itemIndex = cart.findIndex((item) => item.id === artworkId);

  if (itemIndex === -1) return cart;

  const nextQuantity = Number(quantity);
  if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
    cart.splice(itemIndex, 1);
    saveCart(cart);
    return cart;
  }

  cart[itemIndex].quantity = nextQuantity;
  saveCart(cart);
  return cart;
}

function updateCartItemCustomization(artworkId, customization) {
  const cart = getCart();
  const itemIndex = cart.findIndex((item) => item.id === artworkId);

  if (itemIndex === -1) return cart;

  const normalizedCustomization = typeof customization === "string" ? customization.trim() : "";
  cart[itemIndex].customization = normalizedCustomization;
  saveCart(cart);
  return cart;
}

function removeCartItem(artworkId) {
  const nextCart = getCart().filter((item) => item.id !== artworkId);
  saveCart(nextCart);
  return nextCart;
}

function renderCartBadge() {
  const cartLink = document.getElementById("cart-link");
  const cartCount = document.getElementById("cart-count");
  const count = getCartCount();

  if (cartCount) {
    cartCount.textContent = String(count);
    cartCount.hidden = count === 0;
  }

  if (cartLink) {
    cartLink.setAttribute("aria-label", `View cart with ${count} item${count === 1 ? "" : "s"}`);
  }
}

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
    renderCartBadge();
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", initSite);
