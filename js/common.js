/* ==========================================================
   common.js - DÙNG CHUNG CHO CẢ NHÓM
   Mọi trang đặt 2 thẻ:  <div id="site-header"></div> ... <div id="site-footer"></div>
   và nhúng:  <script src="js/common.js"></script>  (cuối <body>)
   ========================================================== */

/* ---- 1. KHÓA localStorage (cả nhóm dùng đúng tên này) ---- */
const KEYS = {
  users: "users",              // danh sách tài khoản
  currentUser: "currentUser",  // người đang đăng nhập (null = khách vãng lai)
  cart: "shopping_cart",       // giỏ hàng
  orders: "orders"             // đơn hàng
};

/* ---- 2. Đọc / ghi localStorage ---- */
function load(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

/* ---- 3. Đăng nhập (giả lập) - module Tài khoản gọi các hàm này ---- */
function getCurrentUser() { return load(KEYS.currentUser); }
function isLoggedIn() { return getCurrentUser() !== null; }
function logout() {
  localStorage.removeItem(KEYS.currentUser);
  location.href = "index.html";
}
/* Trang cần đăng nhập (thanh toán, đơn hàng, tài khoản) gọi dòng này đầu file JS: requireLogin(); */
function requireLogin() {
  if (!isLoggedIn()) {
    sessionStorage.setItem("afterLogin", location.pathname.split("/").pop());
    location.href = "login.html";
  }
}

/* ---- 4. Giỏ hàng ---- */
function getCart() { return load(KEYS.cart, []); }
function cartCount() { return getCart().reduce((sum, item) => sum + item.quantity, 0); }
function updateCartBadge() {
  const el = document.getElementById("cart-badge");
  if (el) { const n = cartCount(); el.textContent = n; el.style.display = n ? "" : "none"; }
}

/* Tra cứu sản phẩm / biến thể trong PRODUCTS (data/products.js) */
function findProduct(id) {
  return typeof PRODUCTS !== "undefined" ? PRODUCTS.find(p => p.id === id) || null : null;
}
function findVariant(variantId) {
  if (typeof PRODUCTS === "undefined") return null;
  for (const p of PRODUCTS) {
    const v = p.variants.find(v => v.variantId === variantId);
    if (v) return { product: p, variant: v };
  }
  return null;
}
/* Thêm vào giỏ: cộng dồn nếu đã có, không vượt tồn kho. Trả về true nếu thành công. */
function addToCart(variantId, quantity = 1) {
  const found = findVariant(variantId);
  if (!found) { showToast("Không tìm thấy sản phẩm", true); return false; }
  const cart = getCart();
  const item = cart.find(i => i.variantId === variantId);
  const newQty = (item ? item.quantity : 0) + quantity;
  if (found.variant.stock <= 0) { showToast("Sản phẩm tạm hết hàng", true); return false; }
  if (newQty > found.variant.stock) { showToast("Chỉ còn " + found.variant.stock + " sản phẩm trong kho", true); return false; }
  if (item) item.quantity = newQty;
  else cart.push({ variantId, quantity, selected: true });
  save(KEYS.cart, cart);
  updateCartBadge();
  showToast("Đã thêm vào giỏ hàng");
  return true;
}

/* ---- 5. Tiện ích ---- */
function formatPrice(n) { return Number(n).toLocaleString("vi-VN") + "₫"; }
function showToast(msg, isError = false) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.toggle("error", isError);
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ---- 6. HEADER ---- */
/* Icon SVG dùng trong header (không cần thư viện ngoài) */
const ICON = {
  grid:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  user:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  cart:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a1 1 0 001 .8h9.6a1 1 0 001-.8L21 7H6"/></svg>',
  order: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h8"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>',
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/><path d="M20 20c0 1.1-1.8 2-4 2h-2"/></svg>',
  leaf:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z"/><path d="M5 19c3-4 6-7 10-9"/></svg>'
};

function renderHeader() {
  const box = document.getElementById("site-header");
  if (!box) return;
  const user = getCurrentUser();

  /* Đăng nhập / Đăng ký gộp một nút; đã đăng nhập thì hiện tên */
  const accountHtml = user
    ? `<a href="account.html" class="hbtn">${ICON.user}<span class="hbtn-text">${user.fullName}</span></a>
       <a href="#" id="btn-logout" class="logout-link">Đăng xuất</a>`
    : `<a href="login.html" class="hbtn" title="Đăng nhập / Đăng ký">${ICON.user}<span class="hbtn-text">Đăng nhập</span></a>`;

  box.innerHTML = `
  <header class="site-header">
    <div class="header-strip">
      <div class="container">
        <a href="orders.html">${ICON.order}Tra cứu đơn hàng</a>
        <a href="tel:19000000">${ICON.phone}Hotline: 1900 0000</a>
      </div>
    </div>
    <div class="container header-main">
      <a href="index.html" class="logo"><span class="logo-mark">${ICON.leaf}</span>GreenPhone</a>

      <div class="cat-wrap">
        <button type="button" class="hbtn" id="cat-btn" aria-expanded="false" aria-controls="cat-menu">${ICON.grid}<span class="hbtn-text">Danh mục</span></button>
        <nav class="cat-menu" id="cat-menu" aria-label="Danh mục">
          <a href="products.html">Tất cả điện thoại</a>
          <a href="products.html?brand=Apple">Apple</a>
          <a href="products.html?brand=Samsung">Samsung</a>
          <a href="products.html?brand=Xiaomi">Xiaomi</a>
          <a href="products.html?brand=OPPO">OPPO</a>
          <a href="products.html?brand=Vivo">Vivo</a>
          <hr>
          <a href="compare.html">So sánh sản phẩm</a>
        </nav>
      </div>

      <form class="search-box" action="products.html" method="get">
        ${ICON.search}
        <input type="search" name="q" placeholder="Bạn muốn tìm điện thoại nào?" aria-label="Tìm kiếm">
        <button type="submit">Tìm kiếm</button>
      </form>

      <div class="header-actions">
        ${accountHtml}
        <a href="cart.html" class="hbtn">${ICON.cart}<span class="hbtn-text">Giỏ hàng</span><span class="cart-badge" id="cart-badge">0</span></a>
      </div>
    </div>
  </header>`;

  /* Đăng xuất */
  const out = document.getElementById("btn-logout");
  if (out) out.addEventListener("click", e => { e.preventDefault(); logout(); });

  /* Mở/đóng menu Danh mục: bấm nút, bấm ra ngoài hoặc phím Esc để đóng */
  const catBtn = document.getElementById("cat-btn");
  const catMenu = document.getElementById("cat-menu");
  const setCat = open => { catMenu.classList.toggle("open", open); catBtn.setAttribute("aria-expanded", open); };
  catBtn.addEventListener("click", e => { e.stopPropagation(); setCat(!catMenu.classList.contains("open")); });
  document.addEventListener("click", () => setCat(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setCat(false); });

  updateCartBadge();
}

/* ---- 7. FOOTER ---- */
function renderFooter() {
  const box = document.getElementById("site-footer");
  if (!box) return;
  box.innerHTML = `
  <footer class="site-footer">
    <div class="container footer-cols">
      <div>
        <h4>GreenPhone</h4>
        <p>Website bán điện thoại di động, được xây dựng trong khuôn khổ bài tập lớn môn Thiết kế Web.</p>
      </div>
      <div>
        <h4>Mua sắm</h4>
        <ul>
          <li><a href="products.html">Tất cả điện thoại</a></li>
          <li><a href="compare.html">So sánh sản phẩm</a></li>
          <li><a href="cart.html">Giỏ hàng</a></li>
        </ul>
      </div>
      <div>
        <h4>Tài khoản</h4>
        <ul>
          <li><a href="login.html">Đăng nhập</a></li>
          <li><a href="register.html">Đăng ký</a></li>
          <li><a href="orders.html">Đơn hàng của tôi</a></li>
        </ul>
      </div>
      <div>
        <h4>Liên hệ (minh họa)</h4>
        <ul>
          <li>Hotline: 1900 0000</li>
          <li>Email: hotro@greenphone.vn</li>
          <li>Giờ làm việc: 8:00 - 21:00</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">© 2026 GreenPhone - Bài tập lớn Thiết kế Web</div>
  </footer>`;
}

/* ---- 8. NÚT HOTLINE GHIM Ở GÓC PHẢI DƯỚI (hiện ở mọi trang) ---- */
function renderFloatingContact() {
  if (document.querySelector(".float-contact")) return;
  const a = document.createElement("a");
  a.className = "float-contact";
  a.href = "tel:19000000";
  a.title = "Gọi hotline 1900 0000 (số minh họa)";
  a.setAttribute("aria-label", "Liên hệ hotline 1900 0000");
  a.innerHTML = ICON.headset + "<span>Liên hệ</span>";
  document.body.appendChild(a);
}

document.addEventListener("DOMContentLoaded", () => { renderHeader(); renderFooter(); renderFloatingContact(); });
