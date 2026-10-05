/* ==========================================================
   home.js - Logic riêng của trang chủ.
   Dữ liệu sản phẩm lấy từ PRODUCTS (data/products.js).
   Dùng addToCart(), formatPrice() trong common.js.
   ========================================================== */

/* ---------- Tiện ích ---------- */

/* Biến thể mặc định: biến thể còn hàng đầu tiên (nếu hết thì lấy biến thể đầu) */
function getDefaultVariant(product) {
  return product.variants.find(v => v.stock > 0) || product.variants[0];
}
function discountOf(product) {
  const v = getDefaultVariant(product);
  return v.originalPrice > v.price ? Math.round((1 - v.price / v.originalPrice) * 100) : 0;
}

/* HTML một thẻ sản phẩm.
   opts.flash = { sold, quota } -> thêm thanh "Đã bán x/y suất"
   opts.noCart = true           -> không có nút thêm giỏ (suất chưa mở bán) */
function productCardHtml(p, opts = {}) {
  const v = getDefaultVariant(p);
  const discount = discountOf(p);
  const soldOut = v.stock <= 0;
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  const flash = opts.flash
    ? `<div class="home-flash-sold">Đã bán ${opts.flash.sold}/${opts.flash.quota} suất
         <div class="home-progress"><span style="width:${Math.round(opts.flash.sold / opts.flash.quota * 100)}%"></span></div>
       </div>`
    : `<div class="home-product-stars" aria-label="Đánh giá ${p.rating} trên 5">${stars} ${p.rating}</div>`;
  const cartBtn = opts.noCart ? "" :
    `<button class="btn btn-primary" data-variant="${v.variantId}" ${soldOut ? "disabled" : ""}>${soldOut ? "Hết hàng" : "Thêm vào giỏ"}</button>`;
  return `
  <article class="card home-product">
    ${discount ? `<span class="badge home-product-badge">-${discount}%</span>` : ""}
    <a class="home-product-img" href="product-detail.html?id=${p.id}">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
    </a>
    <h3><a href="product-detail.html?id=${p.id}">${p.name}</a></h3>
    <div class="home-product-spec">${v.storage} | RAM ${p.specs.ram}</div>
    <div class="home-product-price">
      <span class="price">${formatPrice(v.price)}</span>
      ${discount ? `<span class="home-product-old">${formatPrice(v.originalPrice)}</span>` : ""}
    </div>
    ${flash}
    <div class="home-product-actions ${opts.noCart ? "single" : ""}">
      <a class="btn btn-outline" href="product-detail.html?id=${p.id}">Xem chi tiết</a>
      ${cartBtn}
    </div>
  </article>`;
}

function renderList(containerId, list, opts) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = list.length
    ? list.map(p => productCardHtml(p, opts)).join("")
    : '<p class="text-soft">Chưa có sản phẩm để hiển thị.</p>';
}

/* ---------- 2. FLASH SALE (suất và số lượng đã bán là dữ liệu minh họa) ---------- */
const FLASH_SLOTS = [
  { label: "20h - 22h hôm nay", items: [
    { id: "redmi-note-13", quota: 50, sold: 34 }, { id: "galaxy-a55", quota: 30, sold: 12 },
    { id: "oppo-reno11", quota: 40, sold: 27 },   { id: "iphone-15", quota: 20, sold: 5 } ] },
  { label: "20h - 22h ngày mai", items: [
    { id: "xiaomi-14", quota: 30, sold: 0 },        { id: "vivo-v30", quota: 30, sold: 0 },
    { id: "galaxy-s24-ultra", quota: 20, sold: 0 }, { id: "iphone-15-pro-max", quota: 20, sold: 0 } ] }
];
let flashIndex = 0;

function renderFlash() {
  const slotBox = document.getElementById("flash-slots");
  slotBox.innerHTML = FLASH_SLOTS.map((s, i) =>
    `<button type="button" class="home-slot ${i === flashIndex ? "active" : ""}" data-slot="${i}">${s.label}</button>`).join("");
  const list = FLASH_SLOTS[flashIndex].items.map(it => ({ p: findProduct(it.id), it })).filter(x => x.p);
  document.getElementById("flash-products").innerHTML = list
    .map(x => productCardHtml(x.p, { flash: { sold: x.it.sold, quota: x.it.quota }, noCart: flashIndex > 0 })).join("");
  tickTimer();
}

/* Đồng hồ: suất hôm nay "kết thúc sau" tới 22h; suất ngày mai "bắt đầu sau" tới 20h */
function slotTarget(i) {
  const d = new Date();
  if (i === 0) {
    d.setHours(22, 0, 0, 0);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    return { time: d, label: "Kết thúc sau" };
  }
  d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0);
  return { time: d, label: "Bắt đầu sau" };
}
function tickTimer() {
  const { time, label } = slotTarget(flashIndex);
  const sec = Math.max(0, Math.floor((time - new Date()) / 1000));
  const pad = n => String(n).padStart(2, "0");
  document.getElementById("timer-label").textContent = label;
  document.getElementById("t-h").textContent = pad(Math.floor(sec / 3600));
  document.getElementById("t-m").textContent = pad(Math.floor(sec % 3600 / 60));
  document.getElementById("t-s").textContent = pad(sec % 60);
}

/* ---------- 3. BA TAB ---------- */
const TAB_RULES = {
  deal: list => [...list].sort((a, b) => discountOf(b) - discountOf(a)),   // giảm sâu nhất
  hot:  list => [...list].sort((a, b) => b.sold - a.sold),                 // bán chạy nhất
  new:  list => [...list].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt)) // mới nhất
};
function renderTab(name) {
  document.querySelectorAll(".home-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  renderList("tab-products", TAB_RULES[name](PRODUCTS).slice(0, 4));
}

/* ---------- 4. DANH MỤC ĐIỆN THOẠI (lọc theo hãng) ---------- */
function renderPhones(brand = "all") {
  const brands = [...new Set(PRODUCTS.map(p => p.brand))];
  document.getElementById("home-pills").innerHTML = ["all", ...brands].map(b =>
    `<button type="button" class="home-pill ${b === brand ? "active" : ""}" data-brand="${b}">${b === "all" ? "Tất cả" : b}</button>`).join("");
  renderList("phone-products", brand === "all" ? PRODUCTS : PRODUCTS.filter(p => p.brand === brand));
}

/* ---------- Khởi tạo ---------- */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof PRODUCTS === "undefined") return; // chưa có data/products.js

  renderFlash();
  renderTab("deal");
  renderPhones();
  setInterval(tickTimer, 1000);

  /* Một chỗ lắng nghe cho mọi nút trong trang (event delegation) */
  document.querySelector(".main").addEventListener("click", e => {
    const cart = e.target.closest("button[data-variant]");
    if (cart) return addToCart(cart.dataset.variant, 1);
    const slot = e.target.closest("[data-slot]");
    if (slot) { flashIndex = Number(slot.dataset.slot); return renderFlash(); }
    const tab = e.target.closest("[data-tab]");
    if (tab) return renderTab(tab.dataset.tab);
    const pill = e.target.closest("[data-brand]");
    if (pill) return renderPhones(pill.dataset.brand);
  });
});
