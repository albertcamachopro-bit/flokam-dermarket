const PRODUCTS = {
  "champu-alquitran-120": {
    id: "champu-alquitran-120",
    name: "Champú de Alquitrán",
    size: "120 cc",
    price: 40000
  },
  "champu-alquitran-500": {
    id: "champu-alquitran-500",
    name: "Champú de Alquitrán",
    size: "500 cc",
    price: 100000
  }
};

const PHONE = "573122225545";
const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem("flokamCart") || "{}");
  } catch {
    return {};
  }
};

const saveCart = (cart) => {
  localStorage.setItem("flokamCart", JSON.stringify(cart));
  renderCartCount();
};

const cartCount = () => Object.values(getCart()).reduce((sum, qty) => sum + qty, 0);

const renderCartCount = () => {
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = String(cartCount());
  });
};

const showToast = (message) => {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
};

const addToCart = (id, quantity = 1) => {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + quantity;
  saveCart(cart);
  showToast("Producto agregado al carrito.");
};

const setQty = (id, quantity) => {
  const cart = getCart();
  if (quantity <= 0) {
    delete cart[id];
  } else {
    cart[id] = quantity;
  }
  saveCart(cart);
  renderCartPage();
};

const orderMessage = () => {
  const cart = getCart();
  const lines = Object.entries(cart).map(([id, qty]) => {
    const product = PRODUCTS[id];
    return `- ${qty} x ${product.name} ${product.size}: ${currency.format(product.price * qty)}`;
  });
  const total = Object.entries(cart).reduce((sum, [id, qty]) => sum + PRODUCTS[id].price * qty, 0);

  if (!lines.length) {
    return "Hola, quiero información sobre el Champú de Alquitrán.";
  }

  return [
    "Hola, quiero hacer este pedido:",
    ...lines,
    `Total: ${currency.format(total)}`,
    "Nombre:",
    "Dirección:",
    "Forma de entrega:"
  ].join("\n");
};

const whatsappUrl = () => `https://wa.me/${PHONE}?text=${encodeURIComponent(orderMessage())}`;

const renderCartPage = () => {
  const container = document.querySelector("[data-cart-items]");
  if (!container) return;

  const cart = getCart();
  const entries = Object.entries(cart);
  const total = entries.reduce((sum, [id, qty]) => sum + PRODUCTS[id].price * qty, 0);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">Tu carrito está vacío. Agrega una presentación para preparar el pedido.</div>`;
  } else {
    container.innerHTML = entries.map(([id, qty]) => {
      const product = PRODUCTS[id];
      return `
        <article class="cart-item">
          <div>
            <h3>${product.name} ${product.size}</h3>
            <p>${currency.format(product.price)} por unidad</p>
            <div class="qty-controls" aria-label="Cantidad ${product.size}">
              <button type="button" data-cart-minus="${id}" aria-label="Restar ${product.size}">-</button>
              <strong>${qty}</strong>
              <button type="button" data-cart-plus="${id}" aria-label="Sumar ${product.size}">+</button>
            </div>
          </div>
          <strong class="price">${currency.format(product.price * qty)}</strong>
        </article>
      `;
    }).join("");
  }

  document.querySelectorAll("[data-cart-total]").forEach((el) => {
    el.textContent = currency.format(total);
  });

  document.querySelectorAll("[data-whatsapp-order]").forEach((link) => {
    link.href = whatsappUrl();
  });
};

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } });
  }

  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.classList.add("active");
  });

  renderCartCount();
  renderCartPage();

  document.querySelectorAll("[data-add-product]").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.addProduct));
  });

  document.addEventListener("click", (event) => {
    const minus = event.target.closest("[data-cart-minus]");
    const plus = event.target.closest("[data-cart-plus]");
    if (minus) {
      const cart = getCart();
      setQty(minus.dataset.cartMinus, (cart[minus.dataset.cartMinus] || 0) - 1);
    }
    if (plus) {
      const cart = getCart();
      setQty(plus.dataset.cartPlus, (cart[plus.dataset.cartPlus] || 0) + 1);
    }
  });

  document.querySelectorAll("[data-mock-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast(form.dataset.success || "Solicitud recibida.");
    });
  });

  document.querySelectorAll("[data-whatsapp-order]").forEach((link) => {
    link.href = whatsappUrl();
  });
});
