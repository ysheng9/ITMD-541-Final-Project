// Ye Sheng - Final (Capstone) Lab Project

/* =========================================================================
   Mini Store — Final (Capstone) Lab Project
   Web Development I

   Completed TODOs:
     1. cart.addItem()
     2. cart.decreaseItem()
     3. cart.removeItem()
     4. cart.getTotal()
     5. cart.getItemCount()
     6. Checkout form submit handler

   Graduate Extension:
     - loadProducts() runs exactly once per page load.
     - renderProducts() and renderCartSummary() are independent.
     - console.count() added to loadProducts() and renderProducts() to
       demonstrate that cart changes trigger neither a re-fetch nor a
       product-grid re-render.
   ========================================================================= */

/* ---- Demo overrides -----------------------------------------------------
   The real API has no idea which products WE want to mark on sale or out
   of stock for this project. This object layers that information on top of
   the real data, keyed by real product ids from dummyjson.com/products. */
const demoOverrides = {
  1: { onSale: true, salePrice: 7.99 },
  4: { inStock: false },
  7: { onSale: true, salePrice: 15.99 },
  14: { inStock: false },
};

let products = [];           // fetched + merged catalog
let currentCategory = "all"; // updated by the category dropdown
let currentSort = "default"; // updated by the sort dropdown

/* =========================================================================
   THE CART
   `items` is the state. Every method below changes that state and then
   calls this.render() so the UI stays in sync.
   ========================================================================= */
const cart = {
  // Each entry: { id, name, price, quantity }
  items: [],

  /**
   * TODO 1: Add a product to the cart, or bump its quantity if it is
   * already there. Sale items are added at their effective (sale) price.
   */
  addItem(product) {
    const existing = this.items.find((i) => i.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: effectivePrice(product),
        quantity: 1,
      });
    }

    this.render();
  },

  /**
   * TODO 2: Decrease a quantity by one. Remove the entry entirely when
   * the quantity reaches zero, so it can never go negative.
   */
  decreaseItem(id) {
    const item = this.items.find((i) => i.id === id);

    if (!item) {
      console.warn(`decreaseItem: cart item ${id} not found.`);
      return;
    }

    item.quantity -= 1;

    if (item.quantity <= 0) {
      this.items = this.items.filter((i) => i.id !== id);
    }

    this.render();
  },

  /**
   * TODO 3: Remove an item completely, regardless of quantity.
   */
  removeItem(id) {
    this.items = this.items.filter((i) => i.id !== id);
    this.render();
  },

  /**
   * TODO 4: Grand total = sum of (price × quantity) across all entries.
   */
  getTotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  /**
   * TODO 5: Total number of units in the cart (not the number of rows).
   */
  getItemCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  // Turns the items array into HTML, and keeps the checkout button in sync.
  render() {
    renderCartSummary(this.items, this.getTotal(), this.getItemCount());

    const checkoutBtn = document.querySelector("#checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.disabled = this.items.length === 0;
    }
  },
};

/* ---- DOM references ----------------------------------------------------- */
const productGrid = document.querySelector("#product-grid");
const statusMessage = document.querySelector("#status-message");
const categoryFilter = document.querySelector("#category-filter");
const sortSelect = document.querySelector("#sort-select");
const cartItemsEl = document.querySelector("#cart-items");
const cartTotalEl = document.querySelector("#cart-total");
const cartCountEl = document.querySelector("#cart-count");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutMessage = document.querySelector("#checkout-message");

/* =========================================================================
   FETCHING REAL PRODUCT DATA
   ========================================================================= */
async function loadProducts() {
  // Graduate Extension: proves the fetch runs once per page load.
  console.count("loadProducts");

  statusMessage.className = "status-message";
  statusMessage.textContent = "Loading products…";
  productGrid.innerHTML = "";

  try {
    const response = await fetch("https://dummyjson.com/products");

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const raw = data.products;

    products = raw.map((item) => {
      const overrides = demoOverrides[item.id] || {};
      return {
        id: item.id,
        name: item.title,
        price: item.price,
        category: item.category,
        inStock: true,
        onSale: false,
        ...overrides,
      };
    });

    populateCategoryFilter(products);
    statusMessage.textContent = "";
    renderProducts(getVisibleProducts());
  } catch (error) {
    console.error("loadProducts failed:", error);
    statusMessage.className = "status-message error";
    statusMessage.textContent =
      "Couldn't load products right now. Please check your connection and try again.";
  }
}

// Rebuild the category dropdown from whatever categories actually exist.
function populateCategoryFilter(list) {
  categoryFilter.innerHTML = '<option value="all">All categories</option>';

  const categories = [...new Set(list.map((p) => p.category))];
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(option);
  });
}

// Effective price used by cart, sort, and display.
function effectivePrice(product) {
  return product.onSale ? product.salePrice : product.price;
}

// Apply the current filter and sort without re-fetching or mutating products.
function getVisibleProducts() {
  let list = [...products];

  if (currentCategory !== "all") {
    list = list.filter((p) => p.category === currentCategory);
  }

  if (currentSort === "asc") {
    list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
  } else if (currentSort === "desc") {
    list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
  }

  return list;
}

/* =========================================================================
   RENDERING PRODUCTS
   This function only depends on product data + filter/sort.
   It is never called from cart methods.
   ========================================================================= */
function renderProducts(list) {
  // Graduate Extension: proves cart changes do not re-render the grid.
  console.count("renderProducts");

  productGrid.innerHTML = "";

  if (list.length === 0) {
    productGrid.innerHTML = "<p>No products match this filter.</p>";
    return;
  }

  list.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    let badgeHtml = "";
    if (product.onSale) {
      badgeHtml = `<span class="badge badge-sale">Sale</span>`;
    } else if (!product.inStock) {
      badgeHtml = `<span class="badge badge-stock">Out of Stock</span>`;
    }

    const priceHtml = product.onSale
      ? `<span class="price-original">$${product.price.toFixed(2)}</span>` +
        `<span class="price-sale">$${product.salePrice.toFixed(2)}</span>`
      : `<span class="price">$${product.price.toFixed(2)}</span>`;

    card.innerHTML = `
      ${badgeHtml}
      <h3 class="product-name">${escapeHtml(product.name)}</h3>
      <p class="product-category">${escapeHtml(product.category)}</p>
      <p class="product-price">${priceHtml}</p>
      <button class="add-to-cart-btn" data-id="${product.id}" ${product.inStock ? "" : "disabled"}>
        ${product.inStock ? "Add to Cart" : "Out of Stock"}
      </button>
    `;

    productGrid.appendChild(card);
  });
}

/* =========================================================================
   RENDERING THE CART PANEL
   This function only depends on cart state. It is never called from
   loadProducts() or renderProducts().
   ========================================================================= */
function renderCartSummary(items, total, count) {
  cartItemsEl.innerHTML = "";

  if (items.length === 0) {
    cartItemsEl.innerHTML = `<li class="cart-empty">Your cart is empty.</li>`;
  } else {
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${escapeHtml(item.name)} &times; ${item.quantity}</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
        <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
        <button class="qty-btn" data-action="remove" data-id="${item.id}" aria-label="Remove item">&times;</button>
      `;
      cartItemsEl.appendChild(li);
    });
  }

  cartTotalEl.textContent = total.toFixed(2);
  cartCountEl.textContent = count;
}

// Small safeguard against broken HTML from weird product text.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================================================
   EVENT WIRING — one listener per container (event delegation)
   ========================================================================= */
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart-btn");
  if (!button) return;

  const id = Number(button.dataset.id);
  const product = products.find((p) => p.id === id);
  if (!product) {
    console.warn(`Add to Cart clicked, but product ${id} was not found.`);
    return;
  }

  // Defensive check: an out-of-stock product must never enter the cart.
  if (!product.inStock) return;

  cart.addItem(product);
});

cartItemsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".qty-btn");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === "decrease") {
    cart.decreaseItem(id);
  } else if (button.dataset.action === "remove") {
    cart.removeItem(id);
  }
});

categoryFilter.addEventListener("change", (event) => {
  currentCategory = event.target.value;
  renderProducts(getVisibleProducts());
});

sortSelect.addEventListener("change", (event) => {
  currentSort = event.target.value;
  renderProducts(getVisibleProducts());
});

document.querySelector("#cart-toggle").addEventListener("click", () => {
  document.querySelector("#cart-panel").scrollIntoView({ behavior: "smooth" });
});

/* =========================================================================
   TODO 6: Checkout form validation and confirmation
   ========================================================================= */
checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // 6a: Block checkout when the cart is empty.
  if (cart.items.length === 0) {
    checkoutMessage.textContent =
      "Your cart is empty — add something before checking out.";
    checkoutMessage.className = "checkout-message checkout-error";
    return;
  }

  // 6b: Validate required fields and email format.
  if (!checkoutForm.checkValidity()) {
    checkoutMessage.textContent =
      "Please fill in all required fields with a valid email and address.";
    checkoutMessage.className = "checkout-message checkout-error";
    return;
  }

  // 6c: Confirm the order with item count and total.
  const count = cart.getItemCount();
  const total = cart.getTotal();

  checkoutMessage.textContent =
    `Thanks! Your order of ${count} item(s) totaling $${total.toFixed(2)} has been placed.`;
  checkoutMessage.className = "checkout-message checkout-success";

  // 6d: Empty the cart and reset the form for the next order.
  cart.items = [];
  cart.render();
  checkoutForm.reset();
});

/* ---- Kick things off ----------------------------------------------------- */
loadProducts();
cart.render(); // shows "Your cart is empty" and disables checkout immediately