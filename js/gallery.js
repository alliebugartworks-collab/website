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
      <div class="art-card-meta">
        <span class="art-card-tag">${getCategoryLabel(artwork.category)}</span>
      </div>
      <h2 class="art-card-title">${artwork.title}</h2>
      <p class="art-card-price">${formatPrice(artwork)}</p>
    `;

    card.appendChild(imageWrap);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function wireFilterButtons(allArtworks) {
  const buttons = document.querySelectorAll(".filter-button");
  const grid = document.getElementById("gallery-grid");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      buttons.forEach((item) => item.classList.toggle("active", item === button));

      if (filter === "all") {
        renderGallery(allArtworks);
        return;
      }

      const filteredArtworks = allArtworks.filter((artwork) => artwork.category === filter);
      renderGallery(filteredArtworks);

      if (filteredArtworks.length === 0) {
        grid.innerHTML = `<p class="loading">No ${getCategoryLabel(filter).toLowerCase()} pieces available right now.</p>`;
      }
    });
  });
}

async function initGallery() {
  const grid = document.getElementById("gallery-grid");

  try {
    const artworks = await loadArtworks();
    renderGallery(artworks);
    wireFilterButtons(artworks);
  } catch (error) {
    grid.innerHTML = `<p class="error-message">${error.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", initGallery);
