async function loadArtworks() {
  const response = await fetch("data/artworks.json");
  if (!response.ok) {
    throw new Error("Could not load artworks.");
  }

  const data = await response.json();
  return data.artworks || [];
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseArtworkPrice(artwork) {
  if (typeof artwork.price === "number") return artwork.price;
  const rawPrice = Number(String(artwork.priceDisplay || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(rawPrice) ? rawPrice : 0;
}

async function getCartWithArtworkDetails() {
  const [cart, artworks] = await Promise.all([Promise.resolve(getCart()), loadArtworks()]);
  const artworkMap = new Map(artworks.map((artwork) => [artwork.id, artwork]));

  return cart
    .map((item) => {
      const artwork = artworkMap.get(item.id);
      if (!artwork) return null;

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = parseArtworkPrice(artwork);

      return {
        ...artwork,
        quantity,
        customization: typeof item.customization === "string" ? item.customization.trim() : "",
        unitPrice: price,
        lineTotal: quantity * price,
      };
    })
    .filter(Boolean);
}

function renderEmptyCart() {
  const content = document.getElementById("cart-content");
  if (!content) return;

  content.innerHTML = `
    <div class="empty-cart">
      <h2>Your cart is empty.</h2>
      <p>Add a piece you love to start your order.</p>
      <a href="index.html" class="primary-button">Browse artwork</a>
    </div>
  `;
}

function buildCheckoutMessage(orderItems, customer) {
  const intro = [
    "Hi Allie, I would like to purchase these items:",
    "Customer information:",
    `Name: ${customer.name}`,
    "",
    "Order details:",
  ];

  const details = orderItems.map((item) => {
    const customizationText = item.customization ? ` | Customization: ${item.customization}` : "";
    return `- ${item.title} x${item.quantity}${customizationText} | ${formatCurrency(item.lineTotal)}`;
  });

  const footer = [
    "",
    `Order total: ${formatCurrency(orderItems.reduce((sum, item) => sum + item.lineTotal, 0))}`,
  ];

  return [...intro, ...details, ...footer].join("\n");
}

function getSmsLink(orderItems, customerName = "Customer") {
  const message = encodeURIComponent(buildCheckoutMessage(orderItems, {
    name: customerName
  }));
  return `sms:+14194299460&body=${message}`;
}

function openCheckoutModal() {
  const existingModal = document.getElementById("checkout-confirmation-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "checkout-confirmation-modal";
  modal.className = "checkout-modal-backdrop";

  modal.innerHTML = `
    <div class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
      <button type="button" class="checkout-close" aria-label="Close checkout form">×</button>
      <h2 id="checkout-modal-title">Confirm your order</h2>
      <p class="checkout-confirmation-copy">Confirm you want to place this order with Allie. A text message containing all your order information will be sent to Allie. They will reach out to you to confirm your order as well as Venmo request payment.</p>
      <form id="checkout-form" class="checkout-form">
        <label>
          <span>Name</span>
          <input type="text" name="name" required>
        </label>
        <div class="checkout-actions single-action">
          <button type="button" class="secondary-button" id="checkout-cancel">Cancel</button>
          <button type="submit" class="primary-button">Text order to Allie</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeButton = modal.querySelector(".checkout-close");
  const cancelButton = document.getElementById("checkout-cancel");
  const form = document.getElementById("checkout-form");

  closeButton.addEventListener("click", () => modal.remove());
  cancelButton.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.remove();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const customerName = String(formData.get("name") || "").trim();

    if (!customerName) {
      alert("Please enter your name before sending your order.");
      return;
    }

    const selectedItems = await getCartWithArtworkDetails();
    const textLink = getSmsLink(selectedItems, customerName);
    modal.remove();
    window.location.href = textLink;
  });
}

function renderCart() {
  const content = document.getElementById("cart-content");
  if (!content) return;

  if (!getCart().length) {
    renderEmptyCart();
    return;
  }

  getCartWithArtworkDetails()
    .then((items) => {
      const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      content.innerHTML = `
        <div class="cart-shell">
          <div class="cart-list" aria-live="polite">
            ${items
              .map(
                (item) => `
                  <article class="cart-item" data-artwork-id="${item.id}">
                    <div class="cart-item-image">
                      <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="cart-item-details">
                      <div>
                        <p class="cart-item-category">${(item.category === "felt-piece" ? "Felt piece" : item.category === "card" ? "Card" : "Artwork")}</p>
                        <h2 class="cart-item-title">${item.title}</h2>
                      </div>
                      <div class="cart-item-meta">
                        <p class="cart-item-price">${formatCurrency(item.unitPrice)}</p>
                        <div class="cart-qty-control" aria-label="Update quantity for ${item.title}">
                          <button type="button" class="cart-qty-button" data-action="decrease" data-artwork-id="${item.id}" aria-label="Decrease quantity for ${item.title}">-</button>
                          <input class="cart-qty-input" type="number" min="1" value="${item.quantity}" data-artwork-id="${item.id}" aria-label="Quantity for ${item.title}">
                          <button type="button" class="cart-qty-button" data-action="increase" data-artwork-id="${item.id}" aria-label="Increase quantity for ${item.title}">+</button>
                        </div>
                      </div>
                      <div class="customization-field cart-customization-field">
                        <label for="customization-${item.id}">Customization</label>
                        <input
                          id="customization-${item.id}"
                          class="cart-customization-input"
                          type="text"
                          maxlength="120"
                          value="${escapeHtml(item.customization)}"
                          data-artwork-id="${item.id}"
                          placeholder="Add a name or custom note"
                        >
                        <button type="button" class="text-button cart-clear-customization" data-artwork-id="${item.id}">Remove customization</button>
                      </div>
                    </div>
                    <div class="cart-item-actions">
                      <p class="cart-item-line-total">${formatCurrency(item.lineTotal)}</p>
                      <button type="button" class="text-button" data-remove-id="${item.id}">Remove</button>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>

          <aside class="cart-summary">
            <h2>Order summary</h2>
            <div class="summary-row">
              <span>Items</span>
              <span>${itemCount}</span>
            </div>
            <div class="summary-row total-row">
              <span>Total</span>
              <span>${formatCurrency(total)}</span>
            </div>
            <a href="index.html" class="secondary-button cart-continue">Continue Shopping</a>
            <button type="button" class="primary-button cart-checkout">Checkout</button>
          </aside>
        </div>
      `;

      const addQuantityHandlers = () => {
        document.querySelectorAll(".cart-qty-button").forEach((button) => {
          button.addEventListener("click", () => {
            const artworkId = button.dataset.artworkId;
            const action = button.dataset.action;
            const currentItem = getCart().find((item) => item.id === artworkId);
            const currentQuantity = currentItem ? Number(currentItem.quantity) || 1 : 1;
            const nextQuantity = action === "increase" ? currentQuantity + 1 : currentQuantity - 1;
            updateCartItem(artworkId, nextQuantity);
            renderCart();
          });
        });

        document.querySelectorAll(".cart-qty-input").forEach((input) => {
          input.addEventListener("change", () => {
            const artworkId = input.dataset.artworkId;
            const value = Number(input.value);
            updateCartItem(artworkId, value);
            renderCart();
          });
        });

        document.querySelectorAll(".cart-customization-input").forEach((input) => {
          input.addEventListener("change", () => {
            const artworkId = input.dataset.artworkId;
            updateCartItemCustomization(artworkId, input.value);
            renderCart();
          });
        });

        document.querySelectorAll(".cart-clear-customization").forEach((button) => {
          button.addEventListener("click", () => {
            const artworkId = button.dataset.artworkId;
            updateCartItemCustomization(artworkId, "");
            renderCart();
          });
        });

        document.querySelectorAll("[data-remove-id]").forEach((button) => {
          button.addEventListener("click", () => {
            removeCartItem(button.dataset.removeId);
            renderCart();
          });
        });

        const checkoutButton = document.querySelector(".cart-checkout");
        if (checkoutButton) {
          checkoutButton.addEventListener("click", openCheckoutModal);
        }
      };

      addQuantityHandlers();
    })
    .catch((error) => {
      content.innerHTML = `<p class="error-message">${error.message}</p>`;
    });
}

async function initCart() {
  renderCart();
}

document.addEventListener("DOMContentLoaded", initCart);
