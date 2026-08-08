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
        <h1>${artwork.title}</h1>
        <p class="piece-price">${formatPrice(artwork)}</p>
        <p class="piece-description">${artwork.description}</p>
        <div class="order-box">
          <h2>Place an order</h2>
          <p>Contact ${siteConfig?.artistName || "me"} to purchase this piece. Mention the title when you reach out.</p>
          <div class="order-links">
            <a class="order-link order-link-primary" href="tel:${siteConfig?.phoneLink || ""}">Call ${siteConfig?.phone || ""}</a>
            <a class="order-link order-link-secondary" href="${siteConfig?.venmoLink || "#"}" target="_blank" rel="noopener noreferrer">Pay via Venmo ${siteConfig?.venmo || ""}</a>
          </div>
        </div>
      </div>
    </div>
  `;

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
