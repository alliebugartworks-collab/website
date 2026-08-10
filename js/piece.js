function getArtworkId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function formatPrice(artwork) {
  if (artwork.priceDisplay) return artwork.priceDisplay;
  if (typeof artwork.price === "number") {
    return `$${artwork.price.toLocaleString()}`;
  }
  return "";
}

function getCategoryLabel(category) {
  if (category === "felt-piece") return "Felt piece";
  if (category === "card") return "Card";
  return "Artwork";
}

function createImageElement(src, alt) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;

  img.addEventListener("error", () => {
    const placeholder = document.createElement("div");
    placeholder.className = "image-placeholder";
    placeholder.textContent = "Add image to images folder";
    img.replaceWith(placeholder);
  });

  return img;
}

async function loadArtworks() {
  const response = await fetch("data/artworks.json");
  if (!response.ok) {
    throw new Error("Could not load artworks.");
  }

  const data = await response.json();
  return data.artworks || [];
}

function renderPiece(artwork, siteConfig) {
  const container = document.getElementById("piece-content");
  const images = artwork.images?.length ? artwork.images : [artwork.thumbnail];

  document.title = `${artwork.title} — ${siteConfig?.siteTitle || "Allie Bug Studio"}`;

  container.innerHTML = `
    <div class="piece-layout">
      <div class="piece-gallery">
        <div class="piece-main-image" id="piece-main-image"></div>
        <div class="piece-thumbnails" id="piece-thumbnails"></div>
      </div>
      <div class="piece-info">
        <p class="piece-category">${getCategoryLabel(artwork.category)}</p>
        <h1>${artwork.title}</h1>
        <p class="piece-price">${formatPrice(artwork)}</p>
        <p class="piece-description">${artwork.description}</p>
        <div class="order-box">
          <h2>Place an order</h2>
          <p>Customize your piece and add it to your cart to start the order process.</p>
          <label class="customization-field" for="customization-input">
            <span>Customization details</span>
            <input
              id="customization-input"
              type="text"
              maxlength="120"
              value=""
              placeholder="Add a name, date, or note"
            >
          </label>
          <button type="button" class="primary-button" id="add-to-cart" data-artwork-id="${artwork.id}">Add to cart</button>
        </div>
      </div>
    </div>
  `;

  const addToCartButton = document.getElementById("add-to-cart");
  const customizationInput = document.getElementById("customization-input");

  if (addToCartButton) {
    addToCartButton.addEventListener("click", () => {
      const customization = customizationInput ? customizationInput.value : "";
      addToCart(artwork.id, 1, customization);
      addToCartButton.textContent = "Added to cart";
      addToCartButton.disabled = true;
      if (customizationInput) customizationInput.value = "";
    });
  }

  const mainImage = document.getElementById("piece-main-image");
  const thumbnails = document.getElementById("piece-thumbnails");

  function setMainImage(src, index) {
    mainImage.innerHTML = "";
    mainImage.appendChild(createImageElement(src, `${artwork.title} — photo ${index + 1}`));

    thumbnails.querySelectorAll(".piece-thumb").forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });
  }

  images.forEach((src, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `piece-thumb${index === 0 ? " active" : ""}`;
    button.setAttribute("aria-label", `View photo ${index + 1}`);
    button.appendChild(createImageElement(src, `${artwork.title} thumbnail ${index + 1}`));
    button.addEventListener("click", () => setMainImage(src, index));
    thumbnails.appendChild(button);
  });

  setMainImage(images[0], 0);
}

async function initPiece() {
  const container = document.getElementById("piece-content");
  const id = getArtworkId();

  if (!id) {
    container.innerHTML = '<p class="error-message">No artwork selected. <a href="index.html">Return to gallery</a></p>';
    return;
  }

  try {
    const [artworks, siteResponse] = await Promise.all([
      loadArtworks(),
      fetch("data/site.json"),
    ]);

    const siteConfig = siteResponse.ok ? await siteResponse.json() : null;
    const artwork = artworks.find((item) => item.id === id);

    if (!artwork) {
      container.innerHTML = '<p class="error-message">Artwork not found. <a href="index.html">Return to gallery</a></p>';
      return;
    }

    renderPiece(artwork, siteConfig);
  } catch (error) {
    container.innerHTML = `<p class="error-message">${error.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", initPiece);
