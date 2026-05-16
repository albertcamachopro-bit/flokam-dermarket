const PRODUCTS = {
  "champu-alquitran-120": {
    id: "champu-alquitran-120",
    name: "Champú de Alquitrán",
    size: "120 cc",
    price: 40000,
    image: "assets/producto-presentaciones.webp",
    catalog: "flokam",
    catalogLabel: "FLOKAM",
    category: "cuidado-cuero-cabelludo",
    categoryLabel: "Cuidado del cuero cabelludo"
  },
  "champu-alquitran-500": {
    id: "champu-alquitran-500",
    name: "Champú de Alquitrán",
    size: "500 cc",
    price: 100000,
    image: "assets/producto-presentaciones.webp",
    catalog: "flokam",
    catalogLabel: "FLOKAM",
    category: "cuidado-cuero-cabelludo",
    categoryLabel: "Cuidado del cuero cabelludo"
  }
};

const PHONE = "573122225545";
const CUSTOMER_KEY = "flokamCustomer";
const PENDING_CHECKOUT_KEY = "flokamPendingCheckout";
const REQUIRED_CUSTOMER_FIELDS = ["fullName", "address", "idType", "idNumber", "paymentMethod"];
let activeCatalog = "all";
let activeCategory = "all";
let activeSort = "relevance";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const formatMoney = (value) => currency.format(value).replace(/\s/g, "");

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

const getCustomer = () => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}");
  } catch {
    return {};
  }
};

const normalizeCustomer = (customer) => ({
  fullName: (customer.fullName || "").trim(),
  address: (customer.address || "").trim(),
  idType: (customer.idType || "").trim(),
  idNumber: (customer.idNumber || "").trim(),
  paymentMethod: (customer.paymentMethod || "").trim()
});

const saveCustomer = (customer) => {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(normalizeCustomer(customer)));
  renderCustomerState();
};

const customerComplete = (customer = getCustomer()) => {
  const data = normalizeCustomer(customer);
  return REQUIRED_CUSTOMER_FIELDS.every((field) => data[field]);
};

const upper = (value) => String(value || "").trim().toLocaleUpperCase("es-CO");

const escapeHtml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const securityCode = (idNumber, date = new Date()) => {
  const digits = String(idNumber || "").replace(/\D/g, "");
  const lastFour = digits.slice(-4).padStart(4, "0");
  const two = (value) => String(value).padStart(2, "0");
  const datePart = `${two(date.getDate())}${two(date.getMonth() + 1)}${String(date.getFullYear()).slice(-2)}`;
  const timePart = `${two(date.getHours())}${two(date.getMinutes())}`;
  return `${lastFour}${datePart}${timePart}`.split("").reverse().join("");
};

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
  const entries = validCartEntries();
  const customer = normalizeCustomer(getCustomer());
  const lines = entries.map(({ product, qty }, index) => {
    const label = upper(productDisplayName(product));
    return `${index + 1}. ${qty} x ${label} por valor de ${formatMoney(product.price * qty)}`;
  });
  const total = entries.reduce((sum, { product, qty }) => sum + product.price * qty, 0);

  if (!lines.length) {
    return "Hola, quiero información sobre los productos disponibles.";
  }

  if (!customerComplete(customer)) {
    return "Hola, quiero completar mis datos para hacer un pedido en FLOKAM.";
  }

  return `El usuario ${upper(customer.fullName)} con ${upper(customer.idType)} ${customer.idNumber} en ${upper(customer.address)} va a pagar ${upper(customer.paymentMethod)} los siguientes artículos: ${lines.join("; ")}. Por valor total de ${formatMoney(total)}. Mensaje recibido desde el marketplace de FLOKAM #${securityCode(customer.idNumber)}`;
};

const whatsappUrl = () => `https://wa.me/${PHONE}?text=${encodeURIComponent(orderMessage())}`;

const cartProducts = () => {
  const q24Products = (window.Q24_PRODUCTS || []).reduce((products, product) => {
    products[product.id] = {
      id: product.id,
      name: product.name,
      size: "",
      price: product.price,
      image: product.image,
      detail: product.detail,
      catalog: "q24",
      catalogLabel: "Q24",
      category: product.category,
      categoryLabel: product.categoryLabel
    };
    return products;
  }, {});

  return { ...PRODUCTS, ...q24Products };
};

const productDisplayName = (product) => [product.name, product.size].filter(Boolean).join(" ");

const validCartEntries = () => {
  const products = cartProducts();
  return Object.entries(getCart())
    .filter(([id, qty]) => products[id] && qty > 0)
    .map(([id, qty]) => ({ id, qty, product: products[id] }));
};

const catalogProducts = () => {
  const flokamProducts = Object.values(PRODUCTS).map((product) => ({
    id: product.id,
    cartProductId: product.id,
    name: `${product.name} ${product.size}`,
    catalog: product.catalog,
    catalogLabel: product.catalogLabel,
    category: product.category,
    categoryLabel: product.categoryLabel,
    price: product.price,
    image: product.image,
    detail: "Producto dermocosmético de uso frecuente para apoyar la limpieza, equilibrio y cuidado del cuero cabelludo.",
    source: "FLOKAM Dermarket"
  }));

  const q24Products = (window.Q24_PRODUCTS || []).map((product) => ({
    ...product,
    catalog: "q24",
    catalogLabel: "Q24"
  }));

  return [...flokamProducts, ...q24Products];
};

const catalogCategories = (products) => {
  const categories = products.reduce((items, product) => {
    if (!items.some((item) => item.id === product.category)) {
      items.push({ id: product.category, label: product.categoryLabel });
    }
    return items;
  }, []);

  return [{ id: "all", label: "Todos" }, ...categories];
};

const catalogSources = (products) => {
  const sources = products.reduce((items, product) => {
    if (!items.some((item) => item.id === product.catalog)) {
      items.push({ id: product.catalog, label: product.catalogLabel });
    }
    return items;
  }, []);

  return [{ id: "all", label: "Todos" }, ...sources];
};

const productsForActiveCatalog = () => {
  const products = catalogProducts();
  return activeCatalog === "all"
    ? products
    : products.filter((product) => product.catalog === activeCatalog);
};

const renderCatalogFilters = () => {
  const container = document.querySelector("[data-catalog-filters]");
  if (!container) return;

  container.innerHTML = catalogSources(catalogProducts()).map((catalog) => `
    <button class="market-filter ${activeCatalog === catalog.id ? "active" : ""}" type="button" data-catalog-filter="${catalog.id}">
      ${catalog.label}
    </button>
  `).join("");
};

const renderCategoryFilters = () => {
  const container = document.querySelector("[data-category-filters]");
  if (!container) return;

  const categories = catalogCategories(productsForActiveCatalog());
  if (!categories.some((category) => category.id === activeCategory)) {
    activeCategory = "all";
  }

  container.innerHTML = categories.map((category) => `
    <button class="category-filter ${activeCategory === category.id ? "active" : ""}" type="button" data-category-filter="${category.id}">
      ${category.label}
    </button>
  `).join("");
};

const sortCatalogProducts = (products) => {
  const sorted = [...products];
  if (activeSort === "price-asc") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (activeSort === "price-desc") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (activeSort === "name-asc") {
    sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  return sorted;
};

const renderQ24Catalog = () => {
  const grid = document.querySelector("[data-q24-grid]");
  if (!grid) return;

  const searchInput = document.querySelector("[data-q24-search]");
  const sortInput = document.querySelector("[data-sort-select]");
  activeSort = sortInput?.value || activeSort;
  const query = (searchInput?.value || "").trim().toLowerCase();
  const allProducts = catalogProducts();
  const products = sortCatalogProducts(allProducts.filter((product) => {
    const haystack = `${product.name} ${product.catalogLabel} ${product.categoryLabel} ${product.detail}`.toLowerCase();
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesCatalog = activeCatalog === "all" || product.catalog === activeCatalog;
    return matchesCatalog && matchesCategory && (!query || haystack.includes(query));
  }));

  document.querySelectorAll("[data-q24-total]").forEach((el) => {
    el.textContent = String(allProducts.length);
  });

  document.querySelectorAll("[data-q24-count]").forEach((el) => {
    el.textContent = `${products.length} productos encontrados`;
  });

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state">No encontré referencias con esa búsqueda.</div>`;
    return;
  }

  grid.innerHTML = products.map((product) => `
    <article class="q24-card">
      <a class="q24-image" href="${product.image}" target="_blank" rel="noreferrer" aria-label="Abrir imagen de ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </a>
      <div class="q24-body">
        <span class="q24-chip">${product.categoryLabel}</span>
        <span class="q24-catalog-label">Catálogo: ${product.catalogLabel}</span>
        <h3>${product.name}</h3>
        <p>${product.detail}</p>
        <div class="q24-prices">
          <span>Precio</span>
          <strong>${formatMoney(product.price)}</strong>
        </div>
        <div class="q24-actions">
          <button class="btn btn-primary" type="button" data-add-product="${product.cartProductId || product.id}">
            <i data-lucide="plus" class="icon"></i> Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-add-product]").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.addProduct);
      const previous = button.innerHTML;
      button.classList.add("is-added");
      button.innerHTML = `<i data-lucide="check" class="icon"></i> Agregado`;
      window.setTimeout(() => {
        button.classList.remove("is-added");
        button.innerHTML = previous;
        if (window.lucide) {
          window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } });
        }
      }, 1100);
    });
  });

  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } });
  }
};

const q24BenefitBullets = (product) => {
  if (product.category === "relojeria") {
    return [
      "Accesorio visible para elevar looks casuales o formales.",
      "Buen producto para regalo por su presentación fotogénica.",
      "Referencia útil para publicar por estilo, color y acabado."
    ];
  }

  if (product.category === "cuidado-cuero-cabelludo") {
    return [
      "Apoya rutinas de limpieza cuando hay caspa, escamas visibles u oleosidad.",
      "Formato claro para venta directa por presentación y cantidad.",
      "Producto de cuidado capilar con comunicación responsable y precauciones visibles."
    ];
  }

  if (product.category === "perfumes-arabes") {
    return [
      "Fragancia de presencia intensa para clientes que buscan novedad.",
      "La imagen conserva acordes principales para orientar la elección.",
      "Buen formato para vender por regalo, colección o uso en ocasión especial."
    ];
  }

  if (product.category === "perfumes-femeninos") {
    return [
      "Opción útil para regalo, rutina diaria o una ocasión especial.",
      "La referencia visual permite vender por familia aromática y presentación.",
      "Funciona bien en publicaciones con enfoque de estilo y personalidad."
    ];
  }

  return [
    "Referencia para uso personal, oficina, salidas o regalo.",
    "La ficha visual conserva acordes principales para responder dudas rápidas.",
    "Producto fácil de comparar por marca, presentación y precio de venta."
  ];
};

const renderQ24Details = () => {
  const list = document.querySelector("[data-q24-details]");
  if (!list) return;

  const searchInput = document.querySelector("[data-q24-benefit-search]");
  const query = (searchInput?.value || "").trim().toLowerCase();
  const products = catalogProducts().filter((product) => {
    const benefitText = q24BenefitBullets(product).join(" ");
    const haystack = `${product.name} ${product.categoryLabel} ${product.detail} ${benefitText}`.toLowerCase();
    return !query || haystack.includes(query);
  });

  document.querySelectorAll("[data-q24-detail-count]").forEach((el) => {
    el.textContent = `${products.length} referencias disponibles`;
  });

  if (!products.length) {
    list.innerHTML = `<div class="empty-state">No encontré referencias con esa búsqueda.</div>`;
    return;
  }

  list.innerHTML = products.map((product) => `
    <article class="benefit-card">
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <div>
        <span class="q24-chip">${product.categoryLabel}</span>
        <h3>${product.name}</h3>
        <p class="benefit-price">Precio: <strong>${formatMoney(product.price)}</strong></p>
        <ul>
          ${q24BenefitBullets(product).map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    </article>
  `).join("");
};

const customerFormData = (form) => {
  const data = {};
  form.querySelectorAll("[data-customer-field]").forEach((field) => {
    data[field.dataset.customerField] = field.value;
  });
  return data;
};

const fillCustomerForms = () => {
  const customer = normalizeCustomer(getCustomer());
  document.querySelectorAll("[data-customer-form]").forEach((form) => {
    form.querySelectorAll("[data-customer-field]").forEach((field) => {
      field.value = customer[field.dataset.customerField] || "";
    });
  });
};

const renderCustomerState = () => {
  const customer = normalizeCustomer(getCustomer());
  const complete = customerComplete(customer);

  document.querySelectorAll("[data-customer-home-status]").forEach((el) => {
    el.textContent = complete
      ? `Datos guardados para ${customer.fullName}.`
      : "Datos pendientes.";
    el.classList.toggle("ready", complete);
  });

  document.querySelectorAll("[data-customer-summary]").forEach((el) => {
    if (!complete) {
      el.innerHTML = `
        <div class="checkout-alert">
          <strong>Faltan datos de entrega.</strong>
          <span>Completa el formulario de Inicio antes de enviar el pedido.</span>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="customer-summary-row"><span>Cliente</span><strong>${escapeHtml(customer.fullName)}</strong></div>
      <div class="customer-summary-row"><span>Identificación</span><strong>${escapeHtml(customer.idType)} ${escapeHtml(customer.idNumber)}</strong></div>
      <div class="customer-summary-row"><span>Dirección</span><strong>${escapeHtml(customer.address)}</strong></div>
      <div class="customer-summary-row"><span>Pago</span><strong>${escapeHtml(customer.paymentMethod)}</strong></div>
    `;
  });
};

const renderCheckoutActions = (hasItems, total) => {
  const complete = customerComplete();

  document.querySelectorAll("[data-whatsapp-order]").forEach((link) => {
    if (!hasItems) {
      link.href = "catalogo-q24.html";
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.innerHTML = `<i data-lucide="shopping-bag" class="icon"></i> Agregar productos`;
      return;
    }

    if (!complete) {
      link.href = "index.html#datos-comprador";
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.innerHTML = `<i data-lucide="clipboard-check" class="icon"></i> Completar datos`;
      return;
    }

    link.href = whatsappUrl();
    link.target = "_blank";
    link.rel = "noreferrer";
    link.innerHTML = `<i data-lucide="message-circle" class="icon"></i> Enviar pedido por WhatsApp`;
  });

  document.querySelectorAll("[data-checkout-code-preview]").forEach((el) => {
    const customer = normalizeCustomer(getCustomer());
    el.textContent = complete && hasItems
      ? `Código del pedido: #${securityCode(customer.idNumber)}`
      : "El código se genera al completar datos y carrito.";
  });

  document.querySelectorAll("[data-checkout-total-label]").forEach((el) => {
    el.textContent = hasItems ? formatMoney(total) : "$0";
  });

  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } });
  }
};

const sendToCustomerForm = () => {
  localStorage.setItem(PENDING_CHECKOUT_KEY, "1");
  window.location.href = "index.html#datos-comprador";
};

const renderCartPage = () => {
  const container = document.querySelector("[data-cart-items]");
  if (!container) return;

  const entries = validCartEntries();
  const total = entries.reduce((sum, { product, qty }) => sum + product.price * qty, 0);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">Tu carrito está vacío. Agrega una referencia para preparar el pedido.</div>`;
  } else {
    container.innerHTML = entries.map(({ id, qty, product }) => {
      const label = productDisplayName(product);
      const detail = product.size || product.categoryLabel || "Referencia";
      return `
        <article class="cart-item">
          <img class="cart-thumb" src="${product.image}" alt="${label}" loading="lazy">
          <div class="cart-item-main">
            <h3>${label}</h3>
            <div class="cart-line-meta">
              <span>${product.categoryLabel || "Producto"}</span>
              <span>${formatMoney(product.price)} unidad</span>
            </div>
            <div class="qty-controls" aria-label="Cantidad ${detail}">
              <button type="button" data-cart-minus="${id}" aria-label="Restar ${detail}">-</button>
              <strong>${qty}</strong>
              <button type="button" data-cart-plus="${id}" aria-label="Sumar ${detail}">+</button>
            </div>
          </div>
          <strong class="price">${formatMoney(product.price * qty)}</strong>
        </article>
      `;
    }).join("");
  }

  document.querySelectorAll("[data-cart-total]").forEach((el) => {
    el.textContent = formatMoney(total);
  });

  renderCustomerState();
  renderCheckoutActions(Boolean(entries.length), total);
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
  fillCustomerForms();
  renderCustomerState();
  renderCatalogFilters();
  renderCategoryFilters();
  renderCartPage();
  renderQ24Catalog();
  renderQ24Details();

  document.querySelectorAll("[data-q24-search]").forEach((input) => {
    input.addEventListener("input", renderQ24Catalog);
  });

  document.querySelectorAll("[data-sort-select]").forEach((input) => {
    input.addEventListener("change", renderQ24Catalog);
  });

  document.querySelectorAll("[data-q24-benefit-search]").forEach((input) => {
    input.addEventListener("input", renderQ24Details);
  });

  document.querySelectorAll("[data-customer-form]").forEach((form) => {
    form.addEventListener("input", () => saveCustomer(customerFormData(form)));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveCustomer(customerFormData(form));
      if (customerComplete()) {
        showToast("Datos de entrega guardados.");
        if (localStorage.getItem(PENDING_CHECKOUT_KEY) === "1") {
          localStorage.removeItem(PENDING_CHECKOUT_KEY);
          window.location.href = "carrito.html";
        }
      } else {
        showToast("Completa todos los datos de entrega.");
      }
    });
  });

  document.addEventListener("click", (event) => {
    const catalog = event.target.closest("[data-catalog-filter]");
    const category = event.target.closest("[data-category-filter]");
    const minus = event.target.closest("[data-cart-minus]");
    const plus = event.target.closest("[data-cart-plus]");
    const order = event.target.closest("[data-whatsapp-order]");
    if (catalog) {
      activeCatalog = catalog.dataset.catalogFilter || "all";
      activeCategory = "all";
      renderCatalogFilters();
      renderCategoryFilters();
      renderQ24Catalog();
    }
    if (category) {
      activeCategory = category.dataset.categoryFilter || "all";
      renderCategoryFilters();
      renderQ24Catalog();
    }
    if (order) {
      const hasItems = validCartEntries().length > 0;
      if (!hasItems) {
        event.preventDefault();
        window.location.href = "catalogo-q24.html";
        return;
      }

      if (!customerComplete()) {
        event.preventDefault();
        sendToCustomerForm();
        return;
      }

      order.href = whatsappUrl();
    }
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
});
