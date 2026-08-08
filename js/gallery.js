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
  img.loading = "lazy";

  img.addEventListener("error", () => {
    const placeholder = document.createElement("div");
    placeholder.className = "image-placeholder";
    placeholder.textContent = "Add image";
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

function renderGallery(artworks) {
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = "";

  if (artworks.length === 0) {
    grid.innerHTML = '<p class="loading">No artwork listed yet. Add pieces in data/artworks.json.</p>';
    return;
  }

  artworks.forEach((artwork) => {
    const card = document.createElement("a");
    card.className = "art-card";
    card.href = `piece.html?id=${encodeURIComponent(artwork.id)}`;

    const imageWrap = document.createElement("div");
    imageWrap.className = "art-card-image";
    imageWrap.appendChild(createImageElement(artwork.thumbnail, artwork.title));

    const body = document.createElement("div");
    body.className = "art-card-body";
    body.innerHTML = `
      <h2 class="art-card-title">${artwork.title}</h2>
      <p class="art-card-price">${formatPrice(artwork)}</p>
    `;

    card.appendChild(imageWrap);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

async function initGallery() {
  const grid = document.getElementById("gallery-grid");

  try {
    const artworks = await loadArtworks();
    renderGallery(artworks);
  } catch (error) {
    grid.innerHTML = `<p class="error-message">${error.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", initGallery);
