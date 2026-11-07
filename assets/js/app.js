/* ==========================================================================
   FoodTown – Main Script
   1. Settings (defaults + localStorage)   3. UI behaviour
   2. Apply settings to the page           4. Charts
   5-12. Page modules (POS, Orders, Reservations, Calendar, Tables, Menu, Kitchen, Customers, Staff, Inventory, Finance, Marketing, System): each one
   runs only when its page markup exists, so one file serves every page.
   Loaded in <head> so saved settings are applied BEFORE first paint
   (prevents a flash of the wrong theme/direction).
   ========================================================================== */

/* 1. SETTINGS ------------------------------------------------------------ */
const STORAGE_KEY = "foodtown-settings";

const DEFAULTS = {
  mode: "light",            // light | dark
  color: "#f97316",         // theme colour
  sidebar: "dark",          // dark | light | custom
  sidebarColor: "#1e293b",  // used when sidebar = custom
  topbar: "light",          // light | dark | transparent
  layout: "full",           // full | boxed
  sidebarStyle: "expanded", // expanded | collapsed
  radius: "medium",         // sharp | medium | rounded
  font: "Inter",
  dir: "ltr"                // ltr | rtl
};

const FONTS = {
  "Inter": '"Inter", sans-serif',
  "Poppins": '"Poppins", sans-serif',
  "Roboto": '"Roboto", sans-serif',
  "Nunito": '"Nunito", sans-serif',
  "Open Sans": '"Open Sans", sans-serif',
  "Lato": '"Lato", sans-serif',
  "System Default": 'system-ui, -apple-system, "Segoe UI", sans-serif'
};

const BOOTSTRAP_CSS = {
  ltr: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.css",
  rtl: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.css"
};

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch (e) {
    return { ...DEFAULTS };
  }
}
function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* storage blocked */ }
}

let settings = loadSettings();

/* 2. APPLY SETTINGS ------------------------------------------------------ */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${n >> 16}, ${(n >> 8) & 255}, ${n & 255}`;
}

function applySettings() {
  const html = document.documentElement;

  // Direction + language + matching Bootstrap stylesheet (LTR or RTL build)
  html.setAttribute("dir", settings.dir);
  html.setAttribute("lang", settings.dir === "rtl" ? "ar" : "en");
  const bsLink = document.getElementById("bootstrap-css");
  if (bsLink && bsLink.getAttribute("href") !== BOOTSTRAP_CSS[settings.dir]) {
    bsLink.setAttribute("href", BOOTSTRAP_CSS[settings.dir]);
  }

  // Attribute-driven variants (see style.css section 2)
  html.setAttribute("data-bs-theme", settings.mode);
  html.setAttribute("data-sidebar", settings.sidebar);
  html.setAttribute("data-topbar", settings.topbar);
  html.setAttribute("data-layout", settings.layout);
  html.setAttribute("data-sidebar-style", settings.sidebarStyle);
  html.setAttribute("data-radius", settings.radius);

  // CSS variables
  html.style.setProperty("--primary", settings.color);
  html.style.setProperty("--primary-rgb", hexToRgb(settings.color));
  html.style.setProperty("--bs-primary", settings.color);
  html.style.setProperty("--bs-primary-rgb", hexToRgb(settings.color));
  html.style.setProperty("--font-family", FONTS[settings.font] || FONTS.Inter);
  if (settings.sidebar === "custom") {
    html.style.setProperty("--sidebar-bg", settings.sidebarColor);
    html.style.setProperty("--sidebar-color", "#cbd5e1");
  } else {
    html.style.removeProperty("--sidebar-bg");
    html.style.removeProperty("--sidebar-color");
  }
}

applySettings(); // run immediately (before first paint)

/* 3. UI BEHAVIOUR -------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  syncCustomizerInputs();
  if (document.getElementById("sidebar")) { // shell pages only (the login page has no shell)
    bindCustomizer();
    bindSidebar();
    bindTopbar();
  }
  initCharts();
  if (document.getElementById("rangeToggle")) bindDateFilter(); // dashboard only
  initPOS();
  initOrders();
  initReservations();
  initCalendar();
  initTables();
  initMenu();
  initCategories();
  initDemoForms();
  initKitchen();
  initKitchenDisplay();
  initCustomers();
  initStaff();
  initInventory();
  initSuppliers();
  initPurchases();
  initRecipes();
  initPayments();
  initExpenses();
  initReportCharts();
  initExport();
  initOffers();
  initCoupons();
  initUsers();
  initActivityLog();
  initNotifications();
  initLogin();
  initMessages();
  // Any element with data-print opens the browser print dialog
  document.querySelectorAll("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));
});

/* Tick the customizer inputs so they match the saved settings */
function syncCustomizerInputs() {
  document.querySelectorAll("[data-setting]").forEach((el) => {
    const value = settings[el.dataset.setting];
    if (el.type === "radio") el.checked = el.value === value;
    else el.value = value;
  });
}

/* Every control carries data-setting="<key>"; one handler covers them all */
function bindCustomizer() {
  document.querySelectorAll("[data-setting]").forEach((el) => {
    el.addEventListener("input", () => {
      if (el.type === "radio" && !el.checked) return;
      settings[el.dataset.setting] = el.value;
      // Picking a custom sidebar colour switches the sidebar to "custom"
      if (el.dataset.setting === "sidebarColor") settings.sidebar = "custom";
      afterChange();
    });
  });

  document.getElementById("resetSettings").addEventListener("click", () => {
    settings = { ...DEFAULTS };
    afterChange();
  });

  // Language dropdown also flips direction (Arabic = RTL)
  document.querySelectorAll("[data-lang]").forEach((el) => {
    el.addEventListener("click", () => {
      settings.dir = el.dataset.lang === "ar" ? "rtl" : "ltr";
      afterChange();
    });
  });
}

function afterChange() {
  applySettings();
  syncCustomizerInputs();
  saveSettings();
  updateChartTheme();
  updateReportCharts();
}

/* Sidebar: collapse on desktop, drawer on mobile */
function bindSidebar() {
  const sidebar = document.getElementById("sidebar");
  document.getElementById("sidebarToggle").addEventListener("click", () => {
    if (window.innerWidth >= 992) {
      settings.sidebarStyle = settings.sidebarStyle === "collapsed" ? "expanded" : "collapsed";
      afterChange();
    } else {
      sidebar.classList.toggle("show");
    }
  });
  document.getElementById("sidebarBackdrop").addEventListener("click", () => sidebar.classList.remove("show"));
}

function bindTopbar() {
  // Today's date in the topbar
  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  // Fullscreen toggle
  document.getElementById("fullscreenBtn").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  });
}

/* Dashboard date filter ---------------------------------------------------
   DEMO DATA: replace RANGE_DATA with a fetch() to your backend later.
   The update logic (applyRange) can stay exactly as it is. */
const RANGE_DATA = {
  "Today": {
    kpi: { revenue: "$4,280", orders: "218", aov: "$19.63", customers: "164", pending: "24" },
    growth: { revenue: "+7.6%", orders: "+4.1%", aov: "+3.2%", customers: "+5.0%" },
    period: "daily", category: [30, 26, 16, 10, 12, 6]
  },
  "This Week": {
    kpi: { revenue: "$6,150", orders: "312", aov: "$19.71", customers: "402", pending: "24" },
    growth: { revenue: "+9.3%", orders: "+6.0%", aov: "+3.1%", customers: "+7.4%" },
    period: "daily", category: [31, 25, 15, 11, 12, 6]
  },
  "This Month": {
    kpi: { revenue: "$24,580", orders: "1,248", aov: "$19.69", customers: "856", pending: "24" },
    growth: { revenue: "+12.5%", orders: "+8.4%", aov: "+5.2%", customers: "+10.8%" },
    period: "weekly", category: [32, 24, 15, 11, 12, 6]
  },
  "This Year": {
    kpi: { revenue: "$286,400", orders: "14,520", aov: "$19.72", customers: "3,940", pending: "24" },
    growth: { revenue: "+18.2%", orders: "+14.7%", aov: "+3.9%", customers: "+16.5%" },
    period: "monthly", category: [33, 23, 14, 12, 12, 6]
  }
};

/* Builds demo numbers for any custom date range (scaled by number of days) */
function buildCustomRange(days) {
  const revenue = Math.round(days * 820);
  const orders = Math.round(days * 41.6);
  return {
    kpi: {
      revenue: "$" + revenue.toLocaleString("en-US"),
      orders: orders.toLocaleString("en-US"),
      aov: "$" + (revenue / orders).toFixed(2),
      customers: Math.round(days * 13.4).toLocaleString("en-US"),
      pending: "24"
    },
    growth: { revenue: "+6.0%", orders: "+4.5%", aov: "+1.4%", customers: "+5.2%" },
    period: days <= 14 ? "daily" : days <= 90 ? "weekly" : "monthly",
    category: [32, 24, 15, 11, 12, 6]
  };
}

/* Push one data set into the KPI cards and both charts */
function applyRange(label, data) {
  document.getElementById("rangeLabel").textContent = label;
  document.querySelectorAll("[data-kpi]").forEach((el) => {
    el.textContent = data.kpi[el.dataset.kpi];
  });
  document.querySelectorAll("[data-kpi-trend]").forEach((el) => {
    el.innerHTML = '<i class="bi bi-arrow-up-right"></i> ' + data.growth[el.dataset.kpiTrend];
  });
  setPeriod(data.period);
  if (categoryChart) {
    categoryChart.data.datasets[0].data = data.category;
    categoryChart.update();
  }
}

/* Local-time YYYY-MM-DD for <input type="date"> (avoids UTC off-by-one) */
function toDateInput(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function bindDateFilter() {
  const dropdown = bootstrap.Dropdown.getOrCreateInstance(document.getElementById("rangeToggle"));
  const customBox = document.getElementById("customRange");
  const fromInput = document.getElementById("rangeFrom");
  const toInput = document.getElementById("rangeTo");
  const errorBox = document.getElementById("rangeError");

  // Custom range starts as "last 7 days" and cannot go past today
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 6);
  fromInput.value = toDateInput(weekAgo);
  toInput.value = toDateInput(today);
  fromInput.max = toInput.max = toDateInput(today);

  // Preset ranges
  document.querySelectorAll("[data-range]").forEach((el) => {
    el.addEventListener("click", () => {
      customBox.classList.add("d-none");
      applyRange(el.dataset.range, RANGE_DATA[el.dataset.range]);
      dropdown.hide();
    });
  });

  // "Custom Range" reveals the calendar inputs
  document.querySelector("[data-range-custom]").addEventListener("click", () => {
    customBox.classList.toggle("d-none");
  });

  // Apply custom range
  document.getElementById("applyRange").addEventListener("click", () => {
    const from = new Date(fromInput.value);
    const to = new Date(toInput.value);
    if (!fromInput.value || !toInput.value || from > to) {
      errorBox.classList.remove("d-none");
      return;
    }
    errorBox.classList.add("d-none");
    const days = Math.round((to - from) / 86400000) + 1;
    const fmt = (d) => d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    applyRange(`${fmt(from)} – ${fmt(to)}`, buildCustomRange(days));
    dropdown.hide();
  });

  applyRange("This Month", RANGE_DATA["This Month"]); // initial state
}

/* 4. CHARTS -------------------------------------------------------------- */
const SALES_DATA = {
  daily:   { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
             revenue: [2650, 2980, 3120, 3340, 4280, 5120, 4690], orders: [138, 152, 161, 174, 218, 262, 240] },
  weekly:  { labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
             revenue: [21400, 23850, 22600, 26100], orders: [1090, 1210, 1160, 1330] },
  monthly: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
             revenue: [78e3, 71e3, 84e3, 88e3, 93e3, 97e3, 102e3, 99e3, 94e3, 105e3, 112e3, 124e3],
             orders: [3900, 3600, 4200, 4450, 4700, 4900, 5150, 5000, 4750, 5300, 5650, 6200] }
};

let salesChart, categoryChart;

function initCharts() {
  if (typeof Chart === "undefined") return;
  const salesCanvas = document.getElementById("salesChart");
  const catCanvas = document.getElementById("categoryChart");
  if (!salesCanvas || !catCanvas) return;

  Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue("--font-family");
  const primary = settings.color;

  salesChart = new Chart(salesCanvas, {
    data: {
      labels: SALES_DATA.daily.labels,
      datasets: [
        { type: "line", label: "Revenue ($)", data: SALES_DATA.daily.revenue, borderColor: primary,
          backgroundColor: primary + "22", fill: true, tension: .35, yAxisID: "y" },
        { type: "bar", label: "Orders", data: SALES_DATA.daily.orders, backgroundColor: "#94a3b866",
          borderRadius: 4, yAxisID: "y1" }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom", rtl: settings.dir === "rtl" }, tooltip: { rtl: settings.dir === "rtl" } },
      scales: {
        y:  { beginAtZero: true, position: settings.dir === "rtl" ? "right" : "left", grid: { color: "#8884" } },
        y1: { beginAtZero: true, position: settings.dir === "rtl" ? "left" : "right", grid: { display: false } },
        x:  { grid: { display: false }, reverse: settings.dir === "rtl" }
      }
    }
  });

  categoryChart = new Chart(catCanvas, {
    type: "doughnut",
    data: {
      labels: ["Pizza", "Burger", "Drinks", "Dessert", "Pasta", "Others"],
      datasets: [{ data: [32, 24, 15, 11, 12, 6], borderWidth: 0,
        backgroundColor: ["#f97316", "#ef4444", "#3b82f6", "#a855f7", "#22c55e", "#94a3b8"] }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: "68%",
      plugins: { legend: { position: "bottom", rtl: settings.dir === "rtl" } } }
  });

  // Daily / Weekly / Monthly switch
  document.querySelectorAll("[data-period]").forEach((el) => {
    el.addEventListener("change", () => setPeriod(el.dataset.period));
  });
}

/* Show one period (daily | weekly | monthly) in the sales chart */
function setPeriod(period) {
  const radio = document.querySelector(`[data-period="${period}"]`);
  if (radio) radio.checked = true;
  if (!salesChart) return;
  const d = SALES_DATA[period];
  salesChart.data.labels = d.labels;
  salesChart.data.datasets[0].data = d.revenue;
  salesChart.data.datasets[1].data = d.orders;
  salesChart.update();
}

/* Keep charts in sync when colour / font / direction change */
function updateChartTheme() {
  if (!salesChart) return;
  const rtl = settings.dir === "rtl";
  Chart.defaults.font.family = FONTS[settings.font];
  salesChart.data.datasets[0].borderColor = settings.color;
  salesChart.data.datasets[0].backgroundColor = settings.color + "22";
  salesChart.options.scales.y.position = rtl ? "right" : "left";
  salesChart.options.scales.y1.position = rtl ? "left" : "right";
  salesChart.options.scales.x.reverse = rtl;
  [salesChart, categoryChart].forEach((c) => {
    c.options.plugins.legend.rtl = rtl;
    c.update();
  });
}


/* 5. POS PAGE -------------------------------------------------------------
   Menu grid, category filter, search, cart, totals and "Place Order".
   Replace the MENU array with backend data when integrating. */
const MENU = [
  { id: 1,  name: "Margherita Pizza",     cat: "Pizza",   price: 14.00, emoji: "🍕" },
  { id: 2,  name: "Pepperoni Pizza",      cat: "Pizza",   price: 16.00, emoji: "🍕" },
  { id: 3,  name: "Classic Cheeseburger", cat: "Burger",  price: 11.50, emoji: "🍔" },
  { id: 4,  name: "Double Beef Burger",   cat: "Burger",  price: 14.50, emoji: "🍔" },
  { id: 5,  name: "Chicken Pasta",        cat: "Pasta",   price: 14.00, emoji: "🍝" },
  { id: 6,  name: "Creamy Alfredo",       cat: "Pasta",   price: 15.00, emoji: "🍝" },
  { id: 7,  name: "French Fries",         cat: "Sides",   price: 5.00,  emoji: "🍟" },
  { id: 8,  name: "Grilled Chicken",      cat: "Mains",   price: 14.00, emoji: "🍗" },
  { id: 9,  name: "Fresh Lemonade",       cat: "Drinks",  price: 4.00,  emoji: "🍋" },
  { id: 10, name: "Iced Coffee",          cat: "Drinks",  price: 4.50,  emoji: "☕" },
  { id: 11, name: "Chocolate Brownie",    cat: "Dessert", price: 6.50,  emoji: "🍫" },
  { id: 12, name: "Cheesecake Slice",     cat: "Dessert", price: 7.00,  emoji: "🍰" }
];

const TAX_RATE = 0.08;

const cart = {};          // { itemId: quantity }
let activeCategory = "All";
let searchQuery = "";
let orderNumber = 1249;

const $ = (id) => document.getElementById(id);
const money = (n) => "$" + n.toFixed(2);
const findItem = (id) => MENU.find((m) => m.id === Number(id));

function initPOS() {
  if (!document.getElementById("posGrid")) return; // POS page only
  renderCategories();
  renderGrid();
  renderCart();
  bindPosEvents();
}

/* Category chips: "All" + every category found in MENU */
function renderCategories() {
  const cats = ["All", ...new Set(MENU.map((m) => m.cat))];
  $("posCategories").innerHTML = cats.map((c) => `
    <button type="button" class="btn btn-sm text-nowrap ${c === activeCategory ? "btn-primary" : "btn-outline-secondary"}"
            data-cat="${c}">${c}</button>`).join("");
}

/* Menu grid, filtered by category and search text */
function renderGrid() {
  const items = MENU.filter((m) =>
    (activeCategory === "All" || m.cat === activeCategory) &&
    m.name.toLowerCase().includes(searchQuery));

  $("posGrid").innerHTML = items.length ? items.map((m) => `
    <div class="col-6 col-md-4">
      <button type="button" class="pos-item" data-id="${m.id}">
        <span class="pos-emoji">${m.emoji}</span>
        <span class="fw-semibold d-block">${m.name}</span>
        <small class="text-body-secondary">${m.cat}</small>
        <span class="text-primary fw-bold d-block mt-1">${money(m.price)}</span>
      </button>
    </div>`).join("") : '<p class="text-body-secondary text-center py-5 mb-0">No menu items match your search.</p>';
}

/* Cart lines + totals */
function renderCart() {
  const ids = Object.keys(cart);

  $("cartItems").innerHTML = ids.length ? ids.map((id) => {
    const m = findItem(id);
    return `
      <div class="cart-line d-flex align-items-center gap-2 py-2">
        <span class="pos-emoji pos-emoji-sm">${m.emoji}</span>
        <div class="me-auto">
          <div class="fw-medium small">${m.name}</div>
          <small class="text-body-secondary">${money(m.price)}</small>
        </div>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" data-action="dec" data-id="${id}" aria-label="Decrease">&minus;</button>
          <span class="btn btn-outline-secondary disabled">${cart[id]}</span>
          <button class="btn btn-outline-secondary" data-action="inc" data-id="${id}" aria-label="Increase">+</button>
        </div>
        <strong class="cart-line-total small">${money(m.price * cart[id])}</strong>
      </div>`;
  }).join("") : '<p class="text-body-secondary text-center py-4 mb-0">No items yet. Tap a menu item to add it.</p>';

  // Totals
  const subtotal = ids.reduce((sum, id) => sum + findItem(id).price * cart[id], 0);
  const discount = subtotal * Number($("discountRate").value) / 100;
  const tax = (subtotal - discount) * TAX_RATE;
  $("subTotal").textContent = money(subtotal);
  $("discountAmount").textContent = "-" + money(discount);
  $("taxAmount").textContent = money(tax);
  $("grandTotal").textContent = money(subtotal - discount + tax);
  $("placeOrder").disabled = ids.length === 0;
}

function bindPosEvents() {
  // Category chips
  $("posCategories").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    renderCategories();
    renderGrid();
  });

  // Search
  $("posSearch").addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderGrid();
  });

  // Add item to cart
  $("posGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id]");
    if (!btn) return;
    cart[btn.dataset.id] = (cart[btn.dataset.id] || 0) + 1;
    renderCart();
  });

  // Quantity buttons
  $("cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    cart[id] += btn.dataset.action === "inc" ? 1 : -1;
    if (cart[id] <= 0) delete cart[id];
    renderCart();
  });

  $("discountRate").addEventListener("change", renderCart);

  // Order type: table picker only makes sense for dine-in
  document.querySelectorAll('[name="orderType"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      $("tableField").classList.toggle("d-none", radio.value !== "dine" || !radio.checked);
    });
  });

  // Clear cart
  $("clearCart").addEventListener("click", () => {
    Object.keys(cart).forEach((id) => delete cart[id]);
    renderCart();
  });

  // Place order (demo: shows a toast, then starts a fresh order)
  $("placeOrder").addEventListener("click", () => {
    $("orderToastText").textContent = `Order #ORD-${orderNumber} sent to the kitchen.`;
    bootstrap.Toast.getOrCreateInstance($("orderToast")).show();
    orderNumber++;
    $("orderNumber").innerHTML = "<bdi>#ORD-" + orderNumber + "</bdi>";
    $("clearCart").click();
  });
}


/* 6. SHARED TABLE FILTER (Orders + Reservations) -------------------------
   Tabs filter by row[data-status], the search box filters by row text and
   an optional <select> filters by row[data-type]. Tab counts update live. */
function setupTableFilter(cfg) {
  const table = document.getElementById(cfg.table);
  const search = document.getElementById(cfg.search);
  if (!table || !search) return null; // not on this page (or the markup is incomplete)
  const select = cfg.select ? document.getElementById(cfg.select) : null;
  const empty = document.getElementById(cfg.empty);
  const tabs = document.querySelectorAll(`[data-filter-group="${cfg.table}"]`);
  let status = "all";

  function refresh() {
    const rows = [...table.querySelectorAll("tbody tr")];
    const query = search.value.trim().toLowerCase();
    let visible = 0;

    rows.forEach((row) => {
      const show =
        (status === "all" || row.dataset.status === status) &&
        (!select || !select.value || row.dataset.type === select.value) &&
        row.textContent.toLowerCase().includes(query);
      row.classList.toggle("d-none", !show);
      if (show) visible++;
    });
    empty.classList.toggle("d-none", visible > 0);

    tabs.forEach((tab) => {
      const key = tab.dataset.filter;
      tab.querySelector("[data-count]").textContent =
        key === "all" ? rows.length : rows.filter((r) => r.dataset.status === key).length;
    });
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => {
    status = tab.dataset.filter;
    tabs.forEach((t) => t.classList.toggle("active", t === tab));
    refresh();
  }));
  search.addEventListener("input", refresh);
  if (select) select.addEventListener("change", refresh);

  refresh();
  return { refresh };
}

/* Small helper: escape user text before putting it into innerHTML */
function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

/* 7. ORDERS PAGE --------------------------------------------------------- */
function initOrders() {
  setupTableFilter({ table: "ordersTable", search: "orderSearch", select: "orderTypeFilter", empty: "ordersEmpty" });
}

/* 8. RESERVATIONS PAGE --------------------------------------------------- */
function initReservations() {
  const filter = setupTableFilter({ table: "reservationsTable", search: "reservationSearch", empty: "reservationsEmpty" });
  if (!filter) return;

  const form = document.getElementById("reservationForm");
  const dateInput = document.getElementById("rsvDate");
  dateInput.value = toDateInput(new Date());

  // Save: add the new booking to the top of the table as "Pending"
  document.getElementById("saveReservation").addEventListener("click", () => {
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const count = document.querySelectorAll("#reservationsTable tbody tr").length;
    const when = new Date(data.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

    const row = document.createElement("tr");
    row.dataset.status = "pending";
    row.innerHTML = `
      <td class="fw-medium"><bdi>#RSV-${310 + count}</bdi></td><td>${escapeHtml(data.guest)}</td><td>${escapeHtml(data.phone)}</td>
      <td>${when} · ${escapeHtml(data.time)}</td><td>${escapeHtml(data.party)}</td><td>${escapeHtml(data.table)}</td>
      <td><span class="badge text-bg-warning">Pending</span></td>`;
    document.querySelector("#reservationsTable tbody").prepend(row);

    form.reset();
    dateInput.value = toDateInput(new Date());
    bootstrap.Modal.getInstance(document.getElementById("reservationModal")).hide();
    filter.refresh();
  });
}

/* 9a. RESERVATION CALENDAR ----------------------------------------------
   DEMO DATA: reservationsFor() generates repeatable sample bookings for any
   date. Replace it with a lookup into your real bookings. */
const CAL_GUESTS = ["Sarah Collins", "Michael Reyes", "Emma Wilson", "James Carter", "Olivia Brown", "Liam Johnson", "Sophia Davis", "Noah Patel"];
const CAL_TIMES = ["12:00 PM", "12:30 PM", "1:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"];

function reservationsFor(date) {
  const seed = date.getDate() * 13 + date.getMonth() * 5 + date.getDay() * 3; // varies from day to day
  return Array.from({ length: seed % 7 }, (_, i) => ({
    time: CAL_TIMES[(seed + i * 3) % CAL_TIMES.length],
    guest: CAL_GUESTS[(seed + i * 5) % CAL_GUESTS.length],
    party: 2 + ((seed + i) % 6),
    table: "T-" + String(1 + ((seed * 3 + i * 7) % 39)).padStart(2, "0")
  })).sort((a, b) => CAL_TIMES.indexOf(a.time) - CAL_TIMES.indexOf(b.time));
}

function initCalendar() {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;

  let view = new Date();      // month being shown
  view.setDate(1);
  let selected = new Date();  // day shown in the side panel

  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  function render() {
    const year = view.getFullYear();
    const month = view.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let html = '<div class="cal-cell cal-empty"></div>'.repeat(view.getDay());

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const list = reservationsFor(date);
      const classes = ["cal-cell", sameDay(date, new Date()) ? "today" : "", sameDay(date, selected) ? "selected" : ""].join(" ");
      html += `
        <button type="button" class="${classes}" data-day="${d}">
          <span class="cal-day">${d}</span>
          ${list.slice(0, 2).map((r) => `<span class="cal-chip">${r.time.replace(" ", "")} ${r.guest.split(" ")[0]}</span>`).join("")}
          ${list.length > 2 ? `<small class="cal-more text-body-secondary">+${list.length - 2} more</small>` : ""}
          ${list.length ? `<span class="cal-count">${list.length}</span>` : ""}
        </button>`;
    }
    grid.innerHTML = html;
    document.getElementById("calTitle").textContent = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    renderDay();
  }

  // Side panel: bookings for the selected day
  function renderDay() {
    const list = reservationsFor(selected);
    document.getElementById("dayTitle").textContent =
      selected.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    document.getElementById("dayList").innerHTML = list.length ? list.map((r) => `
      <li class="list-group-item bg-transparent">
        <div class="d-flex justify-content-between"><strong>${r.time}</strong><span class="badge text-bg-secondary">${r.table}</span></div>
        <div>${r.guest}</div><small class="text-body-secondary">${r.party} guests</small>
      </li>`).join("") : '<li class="list-group-item bg-transparent text-body-secondary text-center py-4">No reservations on this day.</li>';
  }

  grid.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-day]");
    if (!cell) return;
    selected = new Date(view.getFullYear(), view.getMonth(), Number(cell.dataset.day));
    render();
  });
  document.getElementById("calPrev").addEventListener("click", () => { view.setMonth(view.getMonth() - 1); render(); });
  document.getElementById("calNext").addEventListener("click", () => { view.setMonth(view.getMonth() + 1); render(); });
  document.getElementById("calToday").addEventListener("click", () => {
    view = new Date(); view.setDate(1); selected = new Date(); render();
  });

  render();
}

/* 9b. TABLES PAGE --------------------------------------------------------
   DEMO DATA: 39 tables in three areas (matches the dashboard: 12 available,
   18 occupied, 6 reserved, 3 cleaning). Replace with backend data later. */
const TABLE_STATUS = {
  available: { label: "Available", color: "success" },
  occupied:  { label: "Occupied",  color: "danger" },
  reserved:  { label: "Reserved",  color: "warning" },
  cleaning:  { label: "Cleaning",  color: "info" }
};

function initTables() {
  const board = document.getElementById("tablesBoard");
  if (!board) return;

  const areas = [["Main Hall", 20], ["Terrace", 10], ["Private Room", 9]];
  const pool = [
    ...Array(18).fill("occupied"), ...Array(12).fill("available"),
    ...Array(6).fill("reserved"), ...Array(3).fill("cleaning")
  ];
  const tables = [];
  let n = 0;
  areas.forEach(([area, count]) => {
    for (let i = 0; i < count; i++, n++) {
      const seats = [2, 2, 4, 4, 4, 6, 8][n % 7];
      tables.push({
        id: n + 1, area, seats,
        status: pool[(n * 17) % 39],          // 17 and 39 are coprime, so every status is used exactly once per slot
        guests: Math.min(seats, 2 + (n % 5)),
        minutes: 10 + ((n * 7) % 80),
        bookedFor: ["6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM"][n % 4]
      });
    }
  });

  let filter = "all";
  let current = null;
  const name = (t) => "T-" + String(t.id).padStart(2, "0");
  const info = (t) => ({
    available: "Ready for guests",
    occupied: `${t.guests} guests · seated ${t.minutes} min ago`,
    reserved: `Booked for ${t.bookedFor}`,
    cleaning: "Being cleaned"
  })[t.status];

  function render() {
    // Filter chip counts
    document.querySelectorAll("[data-table-filter]").forEach((chip) => {
      const key = chip.dataset.tableFilter;
      chip.classList.toggle("active", key === filter);
      chip.querySelector("[data-count]").textContent = key === "all" ? tables.length : tables.filter((t) => t.status === key).length;
    });

    // One section per area
    board.innerHTML = areas.map(([area]) => {
      const list = tables.filter((t) => t.area === area && (filter === "all" || t.status === filter));
      if (!list.length) return "";
      return `
        <h2 class="h6 fw-semibold mb-3 mt-4">${area}</h2>
        <div class="row g-3">${list.map((t) => `
          <div class="col-6 col-md-4 col-xl-3 col-xxl-2">
            <button type="button" class="table-card is-${t.status}" data-id="${t.id}">
              <span class="d-flex justify-content-between align-items-center">
                <strong>${name(t)}</strong>
                <span class="badge text-bg-${TABLE_STATUS[t.status].color}">${TABLE_STATUS[t.status].label}</span>
              </span>
              <span class="d-block small text-body-secondary mt-2"><i class="bi bi-people me-1"></i>${t.seats} seats</span>
              <span class="d-block small mt-1">${info(t)}</span>
            </button>
          </div>`).join("")}
        </div>`;
    }).join("") || '<p class="text-body-secondary text-center py-5">No tables with this status.</p>';
  }

  // Filter chips
  document.querySelectorAll("[data-table-filter]").forEach((chip) => {
    chip.addEventListener("click", () => { filter = chip.dataset.tableFilter; render(); });
  });

  // Open the detail modal
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("tableModal"));
  board.addEventListener("click", (e) => {
    const card = e.target.closest("[data-id]");
    if (!card) return;
    current = tables.find((t) => t.id === Number(card.dataset.id));
    document.getElementById("tableModalTitle").textContent = `${name(current)} · ${current.area}`;
    document.getElementById("tableModalInfo").textContent = `${current.seats} seats · ${info(current)}`;
    modal.show();
  });

  // Change status
  document.querySelectorAll("[data-set-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      current.status = btn.dataset.setStatus;
      modal.hide();
      render();
    });
  });

  render();
}


/* 10. MENU MANAGEMENT ----------------------------------------------------- */

/* Menu Items: reuse the shared table filter; the switch changes row status */
function initMenu() {
  const filter = setupTableFilter({ table: "menuTable", search: "menuSearch", select: "menuCategoryFilter", empty: "menuEmpty" });
  if (!filter) return;

  document.getElementById("menuTable").addEventListener("change", (e) => {
    const toggle = e.target.closest(".form-check-input");
    if (!toggle) return;
    toggle.closest("tr").dataset.status = toggle.checked ? "available" : "unavailable";
    filter.refresh();
  });
}

/* Categories: add (modal) and delete (with confirmation) */
function initCategories() {
  const grid = document.getElementById("categoryGrid");
  if (!grid) return;
  const form = document.getElementById("categoryForm");

  document.getElementById("saveCategory").addEventListener("click", () => {
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-xl-3 category-col";
    col.innerHTML = `
      <div class="card h-100"><div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <span class="pos-emoji">${escapeHtml(data.emoji || "🍽️")}</span>
          <button type="button" class="btn btn-sm btn-outline-danger" data-delete-category aria-label="Delete category"><i class="bi bi-trash"></i></button>
        </div>
        <h2 class="h6 mb-1" data-cat-name>${escapeHtml(data.name)}</h2><small class="text-body-secondary">0 items</small>
      </div></div>`;
    grid.append(col);
    form.reset();
    bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide();
  });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-category]");
    if (!btn) return;
    const col = btn.closest(".category-col");
    const name = col.querySelector("[data-cat-name]").textContent;
    if (confirm(`Delete the "${name}" category?`)) col.remove();
  });
}

/* Generic helpers for demo forms (used by Add Menu Item, reusable later):
   - data-preview-target="id"   : mirrors the input value into that element
   - data-image-preview="id"    : shows the chosen photo in that <img>
   - form[data-demo-form]       : shows a success toast instead of submitting */
function initDemoForms() {
  document.querySelectorAll("[data-preview-target]").forEach((input) => {
    const target = document.getElementById(input.dataset.previewTarget);
    const fallback = target.textContent;
    input.addEventListener("input", () => {
      target.textContent = input.value ? (input.dataset.previewPrefix || "") + input.value : fallback;
    });
  });

  document.querySelectorAll("[data-image-preview]").forEach((input) => {
    const img = document.getElementById(input.dataset.imagePreview);
    const placeholder = document.getElementById(input.dataset.imageHide);
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (file) img.src = URL.createObjectURL(file);
      img.classList.toggle("d-none", !file);
      if (placeholder) placeholder.classList.toggle("d-none", Boolean(file));
    });
  });

  document.querySelectorAll("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      document.getElementById("formToastText").textContent = form.dataset.message || "Saved.";
      bootstrap.Toast.getOrCreateInstance(document.getElementById("formToast")).show();
      if ("keep" in form.dataset) return; // settings-style forms keep their values
      form.reset();
      // reset() does not fire events, so refresh previews by hand
      form.querySelectorAll("[data-preview-target], [data-image-preview]").forEach((i) => {
        i.dispatchEvent(new Event(i.type === "file" ? "change" : "input"));
      });
    });
  });
}

/* 11. KITCHEN -------------------------------------------------------------
   DEMO DATA shared by Kitchen Orders and Kitchen Display.
   mins = how long ago the ticket was fired. Replace with live data later. */
const KITCHEN_TICKETS = [
  { id: "#ORD-1250", type: "Dine-in",  place: "Table 4",  status: "new",       mins: 1,  items: [["Pepperoni Pizza", 1], ["French Fries", 2]] },
  { id: "#ORD-1249", type: "Delivery", place: "",         status: "new",       mins: 3,  items: [["Double Beef Burger", 2], ["Fresh Lemonade", 2]] },
  { id: "#ORD-1248", type: "Dine-in",  place: "Table 7",  status: "preparing", mins: 7,  items: [["Margherita Pizza", 1], ["Classic Cheeseburger", 1], ["Chicken Pasta", 1]] },
  { id: "#ORD-1247", type: "Takeaway", place: "",         status: "preparing", mins: 11, items: [["Grilled Chicken", 1], ["French Fries", 1]] },
  { id: "#ORD-1243", type: "Delivery", place: "",         status: "preparing", mins: 18, items: [["Creamy Alfredo", 2], ["Cheesecake Slice", 1]] },
  { id: "#ORD-1242", type: "Dine-in",  place: "Table 12", status: "ready",     mins: 4,  items: [["Classic Cheeseburger", 3], ["Iced Coffee", 3]] },
  { id: "#ORD-1241", type: "Takeaway", place: "",         status: "ready",     mins: 2,  items: [["Chocolate Brownie", 2]] }
];

/* How urgent is a ticket? (used for colours on both pages) */
const ticketAge = (mins) => (mins >= 15 ? "late" : mins >= 10 ? "warn" : "ok");
const ticketItems = (items) => items.map(([name, qty]) => `<li class="d-flex gap-2"><strong>${qty}×</strong> ${name}</li>`).join("");

/* Kitchen Orders: three columns, each button moves a ticket one step forward */
function initKitchen() {
  const board = document.getElementById("kitchenBoard");
  if (!board) return;

  const tickets = KITCHEN_TICKETS.map((t) => ({ ...t }));
  const columns = [
    { key: "new",       label: "New Orders",     color: "secondary", action: "Start Cooking", next: "preparing" },
    { key: "preparing", label: "Preparing",      color: "warning",   action: "Mark Ready",    next: "ready" },
    { key: "ready",     label: "Ready to Serve", color: "success",   action: "Mark Served",   next: null }
  ];

  function render() {
    board.innerHTML = columns.map((col) => {
      const list = tickets.filter((t) => t.status === col.key);
      return `
        <div class="col-md-4">
          <h2 class="h6 d-flex align-items-center gap-2 mb-3">${col.label}<span class="badge text-bg-${col.color}">${list.length}</span></h2>
          ${list.map((t) => `
            <div class="card mb-3"><div class="card-body">
              <div class="d-flex justify-content-between"><strong><bdi>${t.id}</bdi></strong>
                <span class="ticket-age ${ticketAge(t.mins)}"><i class="bi bi-clock me-1"></i>${t.mins} min</span></div>
              <div class="small text-body-secondary mb-2">${[t.type, t.place].filter(Boolean).join(" · ")}</div>
              <ul class="list-unstyled mb-3">${ticketItems(t.items)}</ul>
              <button class="btn btn-sm btn-primary w-100" data-ticket="${t.id}">${col.action}</button>
            </div></div>`).join("") || '<p class="text-body-secondary text-center py-4">No tickets here.</p>'}
        </div>`;
    }).join("");
  }

  board.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ticket]");
    if (!btn) return;
    const index = tickets.findIndex((t) => t.id === btn.dataset.ticket);
    const step = columns.find((c) => c.key === tickets[index].status);
    if (step.next) tickets[index].status = step.next;
    else tickets.splice(index, 1);   // served: ticket leaves the board
    render();
  });

  render();
}

/* Kitchen Display: big tickets with live timers, "Bump" removes a ticket */
function initKitchenDisplay() {
  const board = document.getElementById("kdsBoard");
  if (!board) return;

  let tickets = KITCHEN_TICKETS.map((t) => ({ ...t, startedAt: Date.now() - t.mins * 60000 }));
  const statusLabel = { new: "New", preparing: "Preparing", ready: "Ready" };

  function render() {
    document.getElementById("kdsCount").textContent = tickets.length;
    board.innerHTML = tickets.map((t) => `
      <div class="col-sm-6 col-xl-4 col-xxl-3">
        <div class="kds-ticket age-${ticketAge(t.mins)}" data-started="${t.startedAt}">
          <div class="kds-head d-flex justify-content-between align-items-center">
            <strong><bdi>${t.id}</bdi></strong><span class="kds-timer" data-timer>00:00</span>
          </div>
          <div class="p-3">
            <div class="small text-body-secondary mb-2">${[t.type, t.place].filter(Boolean).join(" · ")} · ${statusLabel[t.status]}</div>
            <ul class="list-unstyled kds-items mb-3">${ticketItems(t.items)}</ul>
            <button class="btn btn-outline-secondary w-100" data-bump="${t.id}">Bump</button>
          </div>
        </div>
      </div>`).join("") || '<p class="text-body-secondary text-center py-5">All caught up. No active tickets.</p>';
    tick();
  }

  // Runs every second: update timers, urgency colours and the clock
  function tick() {
    document.querySelectorAll(".kds-ticket").forEach((ticket) => {
      const seconds = Math.floor((Date.now() - Number(ticket.dataset.started)) / 1000);
      const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
      const ss = String(seconds % 60).padStart(2, "0");
      ticket.querySelector("[data-timer]").textContent = `${mm}:${ss}`;
      ticket.className = `kds-ticket age-${ticketAge(Math.floor(seconds / 60))}`;
    });
    document.getElementById("kdsClock").textContent =
      new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  board.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bump]");
    if (!btn) return;
    tickets = tickets.filter((t) => t.id !== btn.dataset.bump);
    render();
  });
  document.getElementById("kdsFullscreen").addEventListener("click", () => {
    const wrap = document.getElementById("kdsWrap");
    if (document.fullscreenElement) document.exitFullscreen();
    else wrap.requestFullscreen();
  });

  render();
  setInterval(tick, 1000);
}


/* 12. CUSTOMERS + 13. STAFF ----------------------------------------------- */

/* "AB" initials for avatar circles */
function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

/* Reusable "add a row from a modal form" helper.
   cfg: { form, saveButton, modal, table, filter, status, type?(data), html(data) } */
function setupAddRow(cfg) {
  const form = document.getElementById(cfg.form);
  document.getElementById(cfg.saveButton).addEventListener("click", () => {
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const row = document.createElement("tr");
    row.dataset.status = typeof cfg.status === "function" ? cfg.status(data) : cfg.status; // fixed value or computed from the form
    if (cfg.type) row.dataset.type = cfg.type(data);
    row.innerHTML = cfg.html(data);
    document.querySelector(`#${cfg.table} tbody`).prepend(row);
    form.reset();
    bootstrap.Modal.getInstance(document.getElementById(cfg.modal)).hide();
    cfg.filter.refresh();
  });
}

/* Avatar + name + secondary line, used in the first column of new rows */
function personCell(name, sub, href) {
  return `<div class="d-flex align-items-center gap-3"><span class="avatar">${initials(escapeHtml(name))}</span>
    <div><a href="${href}" class="fw-medium">${escapeHtml(name)}</a><div class="small text-body-secondary">${escapeHtml(sub)}</div></div></div>`;
}

function initCustomers() {
  const filter = setupTableFilter({ table: "customersTable", search: "customerSearch", empty: "customersEmpty" });
  if (!filter) return;
  setupAddRow({
    form: "customerForm", saveButton: "saveCustomer", modal: "customerModal", table: "customersTable", filter,
    status: "new", // every newly added customer starts in the "New" tier
    html: (d) => `<td>${personCell(d.name, d.email, "customer-details.html")}</td><td>${escapeHtml(d.phone)}</td>
      <td>0</td><td>$0</td><td>—</td><td><span class="badge text-bg-info">New</span></td>`
  });
}

function initStaff() {
  const filter = setupTableFilter({ table: "staffTable", search: "staffSearch", select: "staffDeptFilter", empty: "staffEmpty" });
  if (!filter) return;
  setupAddRow({
    form: "staffForm", saveButton: "saveStaff", modal: "staffModal", table: "staffTable", filter,
    status: "off-duty", type: (d) => d.department,
    html: (d) => `<td>${personCell(d.name, d.email, "staff-details.html")}</td><td>${escapeHtml(d.role)}</td><td>${escapeHtml(d.phone)}</td><td>—</td>
      <td><span class="badge text-bg-secondary">Off Duty</span></td>
      <td class="text-end"><a href="staff-details.html" class="btn btn-sm btn-outline-secondary" aria-label="View employee"><i class="bi bi-eye"></i></a></td>`
  });
}


/* 14. INVENTORY SECTION (Inventory, Suppliers, Purchases, Recipes) -------- */

/* Stock status from current vs minimum quantity */
function stockStatus(current, minimum) {
  if (current <= 0) return { key: "out", color: "danger", label: "Out of Stock" };
  if (current < minimum) return { key: "low", color: "warning", label: "Low Stock" };
  return { key: "in", color: "success", label: "In Stock" };
}

function initInventory() {
  const filter = setupTableFilter({ table: "inventoryTable", search: "inventorySearch", select: "inventoryCategoryFilter", empty: "inventoryEmpty" });
  if (!filter) return;
  const read = (d) => stockStatus(Number(d.current), Number(d.minimum));

  setupAddRow({
    form: "inventoryForm", saveButton: "saveInventory", modal: "inventoryModal", table: "inventoryTable", filter,
    status: (d) => read(d).key, type: (d) => d.category,
    html: (d) => {
      const s = read(d);
      const pct = Math.min(100, Math.round(Number(d.current) / (Number(d.minimum) * 2) * 100));
      return `<td><a href="inventory-details.html" class="fw-medium">${escapeHtml(d.name)}</a></td><td>${escapeHtml(d.category)}</td>
        <td>${escapeHtml(d.current)} ${escapeHtml(d.unit)}</td><td>${escapeHtml(d.minimum)} ${escapeHtml(d.unit)}</td>
        <td><div class="progress stock-bar" role="progressbar" aria-label="Stock level"><div class="progress-bar bg-${s.color}" style="width: ${pct}%"></div></div></td>
        <td>—</td><td><span class="badge text-bg-${s.color}">${s.label}</span></td>`;
    }
  });
}

function initSuppliers() {
  const filter = setupTableFilter({ table: "suppliersTable", search: "supplierSearch", empty: "suppliersEmpty" });
  if (!filter) return;
  setupAddRow({
    form: "supplierForm", saveButton: "saveSupplier", modal: "supplierModal", table: "suppliersTable", filter, status: "active",
    html: (d) => `<td>${personCell(d.name, d.email, "supplier-details.html")}</td><td>${escapeHtml(d.category)}</td>
      <td>${escapeHtml(d.contact)}</td><td>${escapeHtml(d.phone)}</td><td>—</td><td><span class="badge text-bg-success">Active</span></td>`
  });
}

function initPurchases() {
  const filter = setupTableFilter({ table: "purchasesTable", search: "purchaseSearch", empty: "purchasesEmpty" });
  if (!filter) return;
  const short = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  setupAddRow({
    form: "purchaseForm", saveButton: "savePurchase", modal: "purchaseModal", table: "purchasesTable", filter, status: "ordered",
    html: (d) => {
      const number = 2041 + document.querySelectorAll("#purchasesTable tbody tr").length; // next PO number
      return `<td><a href="purchase-details.html" class="fw-medium">PO-${number}</a></td><td>${escapeHtml(d.supplier)}</td><td>—</td>
        <td>${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td><td>${short(new Date(d.expected))}</td>
        <td>$${Number(d.total).toFixed(2)}</td><td><span class="badge text-bg-info">Ordered</span></td>
        <td class="text-end"><a href="purchase-details.html" class="btn btn-sm btn-outline-secondary" aria-label="View purchase order"><i class="bi bi-eye"></i></a></td>`;
    }
  });
}

function initRecipes() {
  const filter = setupTableFilter({ table: "recipesTable", search: "recipeSearch", select: "recipeCategoryFilter", empty: "recipesEmpty" });
  if (!filter) return;
  setupAddRow({
    form: "recipeForm", saveButton: "saveRecipe", modal: "recipeModal", table: "recipesTable", filter,
    status: "draft", type: (d) => d.category,
    html: (d) => `<td><div class="d-flex align-items-center gap-3"><span class="pos-emoji pos-emoji-sm">🍽️</span>
      <a href="recipe-details.html" class="fw-medium">${escapeHtml(d.name)}</a></div></td><td>${escapeHtml(d.category)}</td><td>0</td><td>—</td>
      <td>$${Number(d.price).toFixed(2)}</td><td>—</td><td>—</td><td><span class="badge text-bg-secondary">Draft</span></td>`
  });
}


/* 15. FINANCE (Payments, Expenses, Reports) -------------------------------- */

function initPayments() {
  const filter = setupTableFilter({ table: "paymentsTable", search: "paymentSearch", select: "paymentMethodFilter", empty: "paymentsEmpty" });
  if (!filter) return;
  setupAddRow({
    form: "paymentForm", saveButton: "savePayment", modal: "paymentModal", table: "paymentsTable", filter,
    status: "paid", type: (d) => d.method,
    html: (d) => {
      const number = 5021 + document.querySelectorAll("#paymentsTable tbody tr").length; // next transaction id
      return `<td class="fw-medium"><bdi>#PAY-${number}</bdi></td><td><a href="order-details.html"><bdi>${escapeHtml(d.order)}</bdi></a></td><td>${escapeHtml(d.customer)}</td>
        <td>${escapeHtml(d.method)}</td><td>$${Number(d.amount).toFixed(2)}</td><td><span class="badge text-bg-success">Paid</span></td><td>Just now</td>`;
    }
  });
}

function initExpenses() {
  const filter = setupTableFilter({ table: "expensesTable", search: "expenseSearch", select: "expenseCategoryFilter", empty: "expensesEmpty" });
  if (!filter) return;
  setupAddRow({
    form: "expenseForm", saveButton: "saveExpense", modal: "expenseModal", table: "expensesTable", filter,
    status: "pending", type: (d) => d.category, // new expenses wait for approval
    html: (d) => {
      const number = 1033 + document.querySelectorAll("#expensesTable tbody tr").length;
      const when = new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      return `<td><a href="expense-details.html" class="fw-medium">EXP-${number}</a></td><td>${escapeHtml(d.title)}</td><td>${escapeHtml(d.category)}</td>
        <td>${when}</td><td>${escapeHtml(d.via)}</td><td>$${Number(d.amount).toFixed(2)}</td><td><span class="badge text-bg-warning">Pending</span></td>
        <td class="text-end"><a href="expense-details.html" class="btn btn-sm btn-outline-secondary" aria-label="View expense"><i class="bi bi-eye"></i></a></td>`;
    }
  });
}

/* Report charts. Each entry is keyed by its <canvas> id.
   type: bar | line | doughnut      horizontal: true for sideways bars
   Datasets with usePrimary follow the theme colour chosen in the customizer.
   DEMO DATA: replace the numbers with your own reporting data. */
const CHART_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#94a3b8", "#14b8a6", "#eab308"];
const MONTHS_6 = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];

const REPORT_CHARTS = {
  revenueExpenseChart: { type: "bar", labels: MONTHS_6, datasets: [
    { label: "Revenue ($)", data: [93000, 97000, 102000, 99000, 94000, 105000], usePrimary: true },
    { label: "Expenses ($)", data: [61000, 63000, 65000, 64000, 62000, 66000], color: "#94a3b8" }] },
  salesTrendChart: { type: "line",
    labels: ["Sep 20", "Sep 21", "Sep 22", "Sep 23", "Sep 24", "Sep 25", "Sep 26", "Sep 27", "Sep 28", "Sep 29", "Sep 30", "Oct 1", "Oct 2", "Oct 3"],
    datasets: [{ label: "Sales ($)", data: [780, 820, 910, 1180, 1420, 1260, 860, 840, 880, 960, 1240, 1510, 1390, 1010], usePrimary: true }] },
  salesTypeChart: { type: "doughnut", labels: ["Dine-in", "Takeaway", "Delivery"], datasets: [{ label: "Share (%)", data: [52, 28, 20] }] },
  ordersHourChart: { type: "bar",
    labels: ["10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM"],
    datasets: [{ label: "Orders", data: [24, 48, 112, 130, 76, 38, 34, 62, 118, 146, 121, 64], usePrimary: true }] },
  ordersStatusChart: { type: "doughnut", labels: ["Completed", "Preparing", "Pending", "Cancelled"], datasets: [{ label: "Orders", data: [1096, 90, 24, 38] }] },
  invCategoryChart: { type: "bar", horizontal: true,
    labels: ["Meat", "Dairy", "Beverages", "Bakery", "Dry Goods", "Frozen", "Sauces", "Produce"],
    datasets: [{ label: "Stock value ($)", data: [1850, 920, 780, 640, 600, 560, 480, 410], usePrimary: true }] },
  wastageChart: { type: "line", labels: MONTHS_6, datasets: [{ label: "Wastage ($)", data: [180, 240, 205, 190, 225, 212], usePrimary: true }] },
  customerGrowthChart: { type: "bar", labels: MONTHS_6, datasets: [
    { label: "New", data: [52, 58, 61, 66, 69, 74], usePrimary: true },
    { label: "Returning", data: [120, 134, 148, 159, 171, 186], color: "#94a3b8" }] },
  customerTierChart: { type: "doughnut", labels: ["VIP", "Regular", "New"], datasets: [{ label: "Customers", data: [42, 318, 496] }] },
  staffHoursChart: { type: "bar", labels: ["Management", "Kitchen", "Front of House", "Delivery"],
    datasets: [{ label: "Hours", data: [260, 1480, 1720, 560], usePrimary: true }] },
  staffOrdersChart: { type: "bar", horizontal: true,
    labels: ["Isabella Rossi", "Carlos Diaz", "Priya Nair", "Tom Becker", "Hannah Kim", "Ahmed Hassan"],
    datasets: [{ label: "Orders handled", data: [612, 488, 412, 286, 241, 198], usePrimary: true }] }
};

const reportCharts = []; // { chart, def } for every chart on the page

function initReportCharts() {
  if (typeof Chart === "undefined") return;
  Chart.defaults.font.family = FONTS[settings.font] || FONTS.Inter;

  Object.keys(REPORT_CHARTS).forEach((id) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const def = REPORT_CHARTS[id];
    const pie = def.type === "doughnut";
    const rtl = settings.dir === "rtl";

    const chart = new Chart(canvas, {
      type: def.type,
      data: {
        labels: def.labels,
        datasets: def.datasets.map((ds) => {
          const color = ds.usePrimary ? settings.color : ds.color;
          if (pie) return { label: ds.label, data: ds.data, backgroundColor: CHART_COLORS, borderWidth: 0 };
          if (def.type === "line") return { label: ds.label, data: ds.data, borderColor: color, backgroundColor: color + "22", fill: true, tension: 0.35 };
          return { label: ds.label, data: ds.data, backgroundColor: color, borderRadius: 4 };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: def.horizontal ? "y" : "x",
        cutout: pie ? "68%" : undefined,
        plugins: {
          legend: { display: pie || def.datasets.length > 1, position: "bottom", rtl },
          tooltip: { rtl }
        },
        scales: pie ? {} : {
          x: { grid: { display: false }, reverse: rtl && !def.horizontal },
          y: { beginAtZero: true, grid: { color: "#8884" }, position: rtl && !def.horizontal ? "right" : "left" }
        }
      }
    });
    reportCharts.push({ chart, def });
  });
}

/* Called after any customizer change: theme colour, font and direction */
function updateReportCharts() {
  if (typeof Chart === "undefined") return; // page without charts
  const rtl = settings.dir === "rtl";
  Chart.defaults.font.family = FONTS[settings.font] || FONTS.Inter;

  reportCharts.forEach(({ chart, def }) => {
    def.datasets.forEach((ds, i) => {
      if (!ds.usePrimary) return;
      chart.data.datasets[i].backgroundColor = def.type === "line" ? settings.color + "22" : settings.color;
      if (def.type === "line") chart.data.datasets[i].borderColor = settings.color;
    });
    chart.options.plugins.legend.rtl = rtl;
    chart.options.plugins.tooltip.rtl = rtl;
    if (def.type !== "doughnut" && !def.horizontal) {
      chart.options.scales.x.reverse = rtl;
      chart.options.scales.y.position = rtl ? "right" : "left";
    }
    chart.update();
  });
}

/* Export any table to CSV: <button data-export-table="tableId" data-export-name="file"> */
function initExport() {
  document.querySelectorAll("[data-export-table]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const table = document.getElementById(btn.dataset.exportTable);
      const clean = (cell) => '"' + cell.textContent.trim().replace(/\s+/g, " ").replace(/"/g, '""') + '"';
      const csv = [...table.querySelectorAll("tr")]
        .filter((row) => !row.classList.contains("d-none"))   // respect the current filters
        .map((row) => [...row.children].map(clean).join(","))
        .join("\n");

      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      link.download = (btn.dataset.exportName || "export") + ".csv";
      link.click();
      URL.revokeObjectURL(link.href);
    });
  });
}


/* 16. MARKETING + SYSTEM ---------------------------------------------------
   Offers, Coupons, User Management, Activity Log, Notifications. */

function initOffers() {
  const filter = setupTableFilter({ table: "offersTable", search: "offerSearch", empty: "offersEmpty" });
  if (!filter) return;
  const short = (value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  setupAddRow({
    form: "offerForm", saveButton: "saveOffer", modal: "offerModal", table: "offersTable", filter, status: "scheduled",
    html: (d) => `<td class="fw-medium">${escapeHtml(d.name)}</td><td>${escapeHtml(d.type)}</td><td>${escapeHtml(d.discount)}</td>
      <td>${short(d.start)} – ${short(d.end)}</td><td>0</td><td><span class="badge text-bg-info">Scheduled</span></td>`
  });
}

function initCoupons() {
  const filter = setupTableFilter({ table: "couponsTable", search: "couponSearch", empty: "couponsEmpty" });
  if (!filter) return;
  setupAddRow({
    form: "couponForm", saveButton: "saveCoupon", modal: "couponModal", table: "couponsTable", filter, status: "active",
    html: (d) => {
      const code = escapeHtml(d.code.toUpperCase());
      return `<td><code class="coupon-code">${code}</code></td><td>${escapeHtml(d.discount)}</td><td>$${escapeHtml(d.min)}</td>
        <td>0 / ${escapeHtml(d.limit)}</td><td>${new Date(d.expires).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</td>
        <td><span class="badge text-bg-success">Active</span></td>
        <td class="text-end"><button type="button" class="btn btn-sm btn-outline-secondary" data-copy="${code}" aria-label="Copy code"><i class="bi bi-clipboard"></i></button></td>`;
    }
  });

  // Copy a coupon code to the clipboard (one handler covers old and new rows)
  document.getElementById("couponsTable").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy).then(() => {
      const icon = btn.querySelector("i");
      icon.className = "bi bi-check2";
      setTimeout(() => { icon.className = "bi bi-clipboard"; }, 1200);
    });
  });
}

function initUsers() {
  const filter = setupTableFilter({ table: "usersTable", search: "userSearch", select: "userRoleFilter", empty: "usersEmpty" });
  if (!filter) return;
  setupAddRow({
    form: "userForm", saveButton: "saveUser", modal: "userModal", table: "usersTable", filter,
    status: "invited", type: (d) => d.role, // new users stay "Invited" until they sign in
    html: (d) => `<td>${personCell(d.name, d.email, "user-details.html")}</td><td>${escapeHtml(d.role)}</td><td>—</td>
      <td><span class="badge text-bg-info">Invited</span></td>
      <td class="text-end"><a href="user-details.html" class="btn btn-sm btn-outline-secondary" aria-label="View user"><i class="bi bi-eye"></i></a></td>`
  });
}

function initActivityLog() {
  setupTableFilter({ table: "activityTable", search: "activitySearch", select: "activityModuleFilter", empty: "activityEmpty" });
}

/* Notifications page: All / Unread tabs, click to mark read, mark all read */
function initNotifications() {
  const list = document.getElementById("notificationList");
  if (!list) return;
  let filter = "all";
  const items = () => [...list.querySelectorAll(".notif-item")];

  function refresh() {
    const unread = items().filter((i) => i.dataset.read === "false").length;
    items().forEach((item) => {
      item.classList.toggle("unread", item.dataset.read === "false");
      item.classList.toggle("d-none", filter === "unread" && item.dataset.read === "true");
    });
    document.querySelector('[data-notif-count="all"]').textContent = items().length;
    document.querySelector('[data-notif-count="unread"]').textContent = unread;
    document.getElementById("notificationsEmpty").classList.toggle("d-none", filter !== "unread" || unread > 0);
  }

  document.querySelectorAll("[data-notif-filter]").forEach((tab) => tab.addEventListener("click", () => {
    filter = tab.dataset.notifFilter;
    document.querySelectorAll("[data-notif-filter]").forEach((t) => t.classList.toggle("active", t === tab));
    refresh();
  }));
  list.addEventListener("click", (e) => {            // opening a notification marks it as read
    const item = e.target.closest(".notif-item");
    if (item) { item.dataset.read = "true"; refresh(); }
  });
  document.getElementById("markAllRead").addEventListener("click", () => {
    items().forEach((i) => { i.dataset.read = "true"; });
    refresh();
  });
  refresh();
}


/* 17. LOGIN PAGE -----------------------------------------------------------
   Front-end demo only: the check below runs in the browser. Replace it with a
   real request to your server before going live. */
const DEMO_LOGIN = { email: "admin@foodtown.com", password: "Admin@123" };

function initLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");
  const error = document.getElementById("loginError");

  // "Use demo credentials" fills both fields
  document.getElementById("fillDemo").addEventListener("click", () => {
    email.value = DEMO_LOGIN.email;
    password.value = DEMO_LOGIN.password;
    error.classList.add("d-none");
  });

  // Show / hide password
  document.getElementById("togglePassword").addEventListener("click", (e) => {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    e.currentTarget.querySelector("i").className = show ? "bi bi-eye-slash" : "bi bi-eye";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valid = email.value.trim().toLowerCase() === DEMO_LOGIN.email && password.value === DEMO_LOGIN.password;
    error.classList.toggle("d-none", valid);
    if (valid) window.location.assign("index.html");
  });
}


/* 18. MESSAGES PAGE ---------------------------------------------------------
   Switch between conversations and add your own message to the open thread.
   DEMO ONLY: messages are not saved. Connect a chat backend to persist them. */
function initMessages() {
  const panes = document.querySelectorAll("[data-thread-pane]");
  if (!panes.length) return;
  const items = document.querySelectorAll("[data-thread]");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");

  function show(key) {
    items.forEach((i) => i.classList.toggle("active", i.dataset.thread === key));
    panes.forEach((p) => p.classList.toggle("d-none", p.dataset.threadPane !== key));
    const body = document.querySelector(`[data-thread-pane="${key}"] .chat-body`);
    body.scrollTop = body.scrollHeight;
  }

  items.forEach((i) => i.addEventListener("click", () => show(i.dataset.thread)));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const body = document.querySelector("[data-thread-pane]:not(.d-none) .chat-body");
    body.insertAdjacentHTML("beforeend", `<div class="chat-msg mine">${escapeHtml(text)}<small>Just now</small></div>`);
    body.scrollTop = body.scrollHeight;
    input.value = "";
  });

  show(items[0].dataset.thread);
}
