const API_BASE = "https://aridiitech-backend.onrender.com/api";

let orders = [];
let products = [];
let categories = [];
let subcategories = [];
let coupons = [];

function getToken() {
  return localStorage.getItem("adminToken");
}

function setToken(token) {
  localStorage.setItem("adminToken", token);
}

function clearToken() {
  localStorage.removeItem("adminToken");
}

function logoutAdmin() {
  clearToken();
  window.location.href = "login.html";
}

async function loginAdmin(event) {
  if (event) event.preventDefault();

  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");
  const message = document.getElementById("loginMessage");

  const username = usernameInput ? usernameInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (message) message.textContent = "";

  if (!username || !password) {
    if (message) message.textContent = "Please enter username and password";
    return;
  }

  try {
    if (message) message.textContent = "Logging in...";

    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Login failed");
    }

    setToken(data.token);

    if (message) message.textContent = "Login successful";

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Login error:", error);
    if (message) message.textContent = error.message || "Something went wrong";
  }
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}

async function apiGet(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  const data = await res.json();

  if (res.status === 401) {
    clearToken();
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function apiSend(url, method, body) {
  const config = {
    method,
    headers: authHeaders()
  };

  if (method !== "DELETE") {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (res.status === 401) {
    clearToken();
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadOrders() {
  const data = await apiGet(`${API_BASE}/orders`);
  orders = safeArray(data.orders);
}

async function loadProducts() {
  const data = await apiGet(`${API_BASE}/products`);
  products = safeArray(data.products);
}

async function loadCategories() {
  const data = await apiGet(`${API_BASE}/categories`);
  categories = safeArray(data.categories);
}

async function loadSubcategories() {
  const data = await apiGet(`${API_BASE}/subcategories`);
  subcategories = safeArray(data.subcategories);
}

async function loadCoupons() {
  const data = await apiGet(`${API_BASE}/coupons`);
  coupons = safeArray(data.coupons);
}

function getAnalytics() {
  const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const transactions = orders.length;
  const completed = orders.filter(order => order.status === "completed").length;

  const itemMap = {};

  orders.forEach(order => {
    safeArray(order.items).forEach(item => {
      const name = item.name || "Unnamed Item";
      const quantity = Number(item.quantity || 1);
      itemMap[name] = (itemMap[name] || 0) + quantity;
    });
  });

  let bestSeller = "—";
  let bestSellerQty = 0;

  Object.entries(itemMap).forEach(([name, qty]) => {
    if (qty > bestSellerQty) {
      bestSeller = name;
      bestSellerQty = qty;
    }
  });

  return {
    revenue,
    transactions,
    completed,
    bestSeller,
    bestSellerQty
  };
}

function updateDashboardStats() {
  const analytics = getAnalytics();

  const statRevenue = document.getElementById("statRevenue");
  const statTransactions = document.getElementById("statTransactions");
  const statCompleted = document.getElementById("statCompleted");
  const statBestSeller = document.getElementById("statBestSeller");
  const statBestSellerQty = document.getElementById("statBestSellerQty");
  const businessSummary = document.getElementById("businessSummary");
  const quickCounts = document.getElementById("quickCounts");
  const reportSummary = document.getElementById("reportSummary");

  if (statRevenue) statRevenue.textContent = formatMoney(analytics.revenue);
  if (statTransactions) statTransactions.textContent = analytics.transactions;
  if (statCompleted) statCompleted.textContent = analytics.completed;
  if (statBestSeller) statBestSeller.textContent = analytics.bestSeller;
  if (statBestSellerQty) statBestSellerQty.textContent = `${analytics.bestSellerQty} sold`;

  if (businessSummary) {
    businessSummary.textContent =
`Total Revenue: ${formatMoney(analytics.revenue)}
Transactions: ${analytics.transactions}
Completed Orders: ${analytics.completed}
Best Selling Item: ${analytics.bestSeller}
Best Seller Quantity: ${analytics.bestSellerQty}`;
  }

  if (quickCounts) {
    quickCounts.textContent =
`Products: ${products.length}
Categories: ${categories.length}
Subcategories: ${subcategories.length}
Coupons: ${coupons.length}
Orders: ${orders.length}`;
  }

  if (reportSummary) {
    reportSummary.textContent =
`ARIDII TECH REPORT

Revenue: ${formatMoney(analytics.revenue)}
Transactions: ${analytics.transactions}
Completed Orders: ${analytics.completed}
Best Selling Item: ${analytics.bestSeller}
Quantity Sold: ${analytics.bestSellerQty}

Products: ${products.length}
Categories: ${categories.length}
Subcategories: ${subcategories.length}
Coupons: ${coupons.length}
Orders: ${orders.length}`;
  }
}

function populateCategorySelects() {
  const categorySelects = [
    document.getElementById("productCategory"),
    document.getElementById("subcategoryCategory")
  ];

  categorySelects.forEach(select => {
    if (!select) return;
    select.innerHTML =
      `<option value="">Select category</option>` +
      categories.map(cat => `<option value="${cat._id}">${escapeHtml(cat.name)}</option>`).join("");
  });
}

function populateSubcategorySelects(categoryId = "") {
  const select = document.getElementById("productSubcategory");
  if (!select) return;

  const filtered = categoryId
    ? subcategories.filter(sub => {
        const subCatId = typeof sub.category === "object" ? sub.category?._id : sub.category;
        return subCatId === categoryId;
      })
    : subcategories;

  select.innerHTML =
    `<option value="">No subcategory</option>` +
    filtered.map(sub => `<option value="${sub._id}">${escapeHtml(sub.name)}</option>`).join("");
}

function renderOrders() {
  const body = document.getElementById("ordersTableBody");
  const searchInput = document.getElementById("orderSearch");
  if (!body || !searchInput) return;

  const search = searchInput.value.trim().toLowerCase();

  const filtered = orders.filter(order => {
    const text = `
      ${order.customerName || ""}
      ${order.phone || ""}
      ${order.paymentMethod || ""}
      ${order.status || ""}
    `.toLowerCase();

    return text.includes(search);
  });

  if (!filtered.length) {
    body.innerHTML = `<tr><td colspan="8"><div class="empty">No orders found</div></td></tr>`;
    return;
  }

  body.innerHTML = filtered.map(order => {
    const itemsHtml = safeArray(order.items).map(item => `
      <div class="item-row">
        ${escapeHtml(item.name || "Item")} — ${Number(item.quantity || 1)} x ${formatMoney(item.price || 0)}
      </div>
    `).join("");

    return `
      <tr>
        <td>${escapeHtml(order.customerName || "—")}</td>
        <td>${escapeHtml(order.phone || "—")}</td>
        <td>${escapeHtml(order.paymentMethod || "—")}</td>
        <td><div class="item-list">${itemsHtml || '<span class="muted">No items</span>'}</div></td>
        <td>${formatMoney(order.totalAmount)}</td>
        <td><span class="badge ${escapeHtml(order.status || "pending")}">${escapeHtml(order.status || "pending")}</span></td>
        <td>${formatDate(order.createdAt)}</td>
        <td>
          <div class="actions">
            <select onchange="changeOrderStatus('${order._id}', this.value)">
              <option value="">Change</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function changeOrderStatus(id, status) {
  if (!status) return;

  try {
    await apiSend(`${API_BASE}/orders/${id}/status`, "PUT", { status });
    alert("Order status updated successfully");
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

function renderProducts() {
  const body = document.getElementById("productsTableBody");
  const searchInput = document.getElementById("productSearch");
  if (!body || !searchInput) return;

  const search = searchInput.value.trim().toLowerCase();

  const filtered = products.filter(product => {
    const categoryName = product.category?.name || "";
    const subcategoryName = product.subcategory?.name || "";
    const text = `${product.name || ""} ${categoryName} ${subcategoryName}`.toLowerCase();
    return text.includes(search);
  });

  if (!filtered.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty">No products found</div></td></tr>`;
    return;
  }

  body.innerHTML = filtered.map(product => `
    <tr>
      <td>${escapeHtml(product.name || "—")}</td>
      <td>${escapeHtml(product.category?.name || "—")}</td>
      <td>${escapeHtml(product.subcategory?.name || "—")}</td>
      <td>${formatMoney(product.price)}</td>
      <td>${product.isActive ? "Active" : "Inactive"}</td>
      <td>
        <div class="actions">
          <button class="btn btn-dark btn-sm" onclick="editProduct('${product._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderCategories() {
  const body = document.getElementById("categoriesTableBody");
  if (!body) return;

  if (!categories.length) {
    body.innerHTML = `<tr><td colspan="3"><div class="empty">No categories found</div></td></tr>`;
    return;
  }

  body.innerHTML = categories.map(category => `
    <tr>
      <td>${escapeHtml(category.name)}</td>
      <td>${category.isActive ? "Active" : "Inactive"}</td>
      <td>
        <div class="actions">
          <button class="btn btn-dark btn-sm" onclick="editCategory('${category._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory('${category._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderSubcategories() {
  const body = document.getElementById("subcategoriesTableBody");
  if (!body) return;

  if (!subcategories.length) {
    body.innerHTML = `<tr><td colspan="4"><div class="empty">No subcategories found</div></td></tr>`;
    return;
  }

  body.innerHTML = subcategories.map(subcategory => `
    <tr>
      <td>${escapeHtml(subcategory.name)}</td>
      <td>${escapeHtml(subcategory.category?.name || "—")}</td>
      <td>${subcategory.isActive ? "Active" : "Inactive"}</td>
      <td>
        <div class="actions">
          <button class="btn btn-dark btn-sm" onclick="editSubcategory('${subcategory._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteSubcategory('${subcategory._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderCoupons() {
  const body = document.getElementById("couponsTableBody");
  if (!body) return;

  if (!coupons.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty">No coupons found</div></td></tr>`;
    return;
  }

  body.innerHTML = coupons.map(coupon => `
    <tr>
      <td>${escapeHtml(coupon.code)}</td>
      <td>${escapeHtml(coupon.discountType)}</td>
      <td>${coupon.discountType === "percentage" ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue)}</td>
      <td>${formatMoney(coupon.minOrderAmount)}</td>
      <td>${coupon.isActive ? "Active" : "Inactive"}</td>
      <td>
        <div class="actions">
          <button class="btn btn-dark btn-sm" onclick="editCoupon('${coupon._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCoupon('${coupon._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function saveCategory() {
  try {
    const id = document.getElementById("categoryId").value;
    const payload = {
      name: document.getElementById("categoryName").value.trim(),
      image: document.getElementById("categoryImage").value.trim(),
      isActive: document.getElementById("categoryIsActive").value === "true"
    };

    if (!payload.name) return alert("Category name is required");

    if (id) {
      await apiSend(`${API_BASE}/categories/${id}`, "PUT", payload);
      alert("Category updated successfully");
    } else {
      await apiSend(`${API_BASE}/categories`, "POST", payload);
      alert("Category created successfully");
    }

    resetCategoryForm();
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

function editCategory(id) {
  const category = categories.find(c => c._id === id);
  if (!category) return;

  document.getElementById("categoryId").value = category._id;
  document.getElementById("categoryName").value = category.name || "";
  document.getElementById("categoryImage").value = category.image || "";
  document.getElementById("categoryIsActive").value = String(category.isActive);
  document.getElementById("categoryFormTitle").textContent = "Edit Category";
}

function resetCategoryForm() {
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryName").value = "";
  document.getElementById("categoryImage").value = "";
  document.getElementById("categoryIsActive").value = "true";
  document.getElementById("categoryFormTitle").textContent = "Add Category";
}

async function deleteCategory(id) {
  if (!confirm("Delete this category?")) return;
  try {
    await apiSend(`${API_BASE}/categories/${id}`, "DELETE", {});
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

async function saveSubcategory() {
  try {
    const id = document.getElementById("subcategoryId").value;
    const payload = {
      name: document.getElementById("subcategoryName").value.trim(),
      category: document.getElementById("subcategoryCategory").value,
      image: document.getElementById("subcategoryImage").value.trim(),
      isActive: document.getElementById("subcategoryIsActive").value === "true"
    };

    if (!payload.name || !payload.category) {
      return alert("Subcategory name and category are required");
    }

    if (id) {
      await apiSend(`${API_BASE}/subcategories/${id}`, "PUT", payload);
      alert("Subcategory updated successfully");
    } else {
      await apiSend(`${API_BASE}/subcategories`, "POST", payload);
      alert("Subcategory created successfully");
    }

    resetSubcategoryForm();
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

function editSubcategory(id) {
  const subcategory = subcategories.find(s => s._id === id);
  if (!subcategory) return;

  const categoryId = typeof subcategory.category === "object"
    ? subcategory.category?._id
    : subcategory.category;

  document.getElementById("subcategoryId").value = subcategory._id;
  document.getElementById("subcategoryName").value = subcategory.name || "";
  document.getElementById("subcategoryCategory").value = categoryId || "";
  document.getElementById("subcategoryImage").value = subcategory.image || "";
  document.getElementById("subcategoryIsActive").value = String(subcategory.isActive);
  document.getElementById("subcategoryFormTitle").textContent = "Edit Subcategory";
}

function resetSubcategoryForm() {
  document.getElementById("subcategoryId").value = "";
  document.getElementById("subcategoryName").value = "";
  document.getElementById("subcategoryCategory").value = "";
  document.getElementById("subcategoryImage").value = "";
  document.getElementById("subcategoryIsActive").value = "true";
  document.getElementById("subcategoryFormTitle").textContent = "Add Subcategory";
}

async function deleteSubcategory(id) {
  if (!confirm("Delete this subcategory?")) return;
  try {
    await apiSend(`${API_BASE}/subcategories/${id}`, "DELETE", {});
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

async function saveProduct() {
  try {
    const id = document.getElementById("productId").value;
    const payload = {
      name: document.getElementById("productName").value.trim(),
      category: document.getElementById("productCategory").value,
      subcategory: document.getElementById("productSubcategory").value || null,
      price: Number(document.getElementById("productPrice").value),
      image: document.getElementById("productImage").value.trim(),
      description: document.getElementById("productDescription").value.trim(),
      options: document.getElementById("productOptions").value
        .split(",")
        .map(opt => opt.trim())
        .filter(Boolean),
      isActive: document.getElementById("productIsActive").value === "true"
    };

    if (!payload.name || !payload.category || Number.isNaN(payload.price)) {
      return alert("Product name, category and price are required");
    }

    if (id) {
      await apiSend(`${API_BASE}/products/${id}`, "PUT", payload);
      alert("Product updated successfully");
    } else {
      await apiSend(`${API_BASE}/products`, "POST", payload);
      alert("Product created successfully");
    }

    resetProductForm();
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

function editProduct(id) {
  const product = products.find(p => p._id === id);
  if (!product) return;

  document.getElementById("productId").value = product._id;
  document.getElementById("productName").value = product.name || "";

  const categoryId = typeof product.category === "object" ? product.category?._id : product.category;
  const subcategoryId = typeof product.subcategory === "object" ? product.subcategory?._id : product.subcategory;

  document.getElementById("productCategory").value = categoryId || "";
  populateSubcategorySelects(categoryId || "");
  document.getElementById("productSubcategory").value = subcategoryId || "";
  document.getElementById("productPrice").value = product.price ?? "";
  document.getElementById("productImage").value = product.image || "";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productOptions").value = safeArray(product.options).join(", ");
  document.getElementById("productIsActive").value = String(product.isActive);
  document.getElementById("productFormTitle").textContent = "Edit Product";
}

function resetProductForm() {
  document.getElementById("productId").value = "";
  document.getElementById("productName").value = "";
  document.getElementById("productCategory").value = "";
  populateSubcategorySelects("");
  document.getElementById("productSubcategory").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productImage").value = "";
  document.getElementById("productDescription").value = "";
  document.getElementById("productOptions").value = "";
  document.getElementById("productIsActive").value = "true";
  document.getElementById("productFormTitle").textContent = "Add Product";
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    await apiSend(`${API_BASE}/products/${id}`, "DELETE", {});
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

async function saveCoupon() {
  try {
    const id = document.getElementById("couponId").value;
    const expiresAtValue = document.getElementById("couponExpiresAt").value;

    const payload = {
      code: document.getElementById("couponCode").value.trim(),
      discountType: document.getElementById("couponDiscountType").value,
      discountValue: Number(document.getElementById("couponDiscountValue").value),
      minOrderAmount: Number(document.getElementById("couponMinOrderAmount").value || 0),
      expiresAt: expiresAtValue ? new Date(expiresAtValue).toISOString() : null,
      isActive: document.getElementById("couponIsActive").value === "true"
    };

    if (!payload.code || Number.isNaN(payload.discountValue)) {
      return alert("Coupon code and discount value are required");
    }

    if (id) {
      await apiSend(`${API_BASE}/coupons/${id}`, "PUT", payload);
      alert("Coupon updated successfully");
    } else {
      await apiSend(`${API_BASE}/coupons`, "POST", payload);
      alert("Coupon created successfully");
    }

    resetCouponForm();
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

function editCoupon(id) {
  const coupon = coupons.find(c => c._id === id);
  if (!coupon) return;

  document.getElementById("couponId").value = coupon._id;
  document.getElementById("couponCode").value = coupon.code || "";
  document.getElementById("couponDiscountType").value = coupon.discountType || "fixed";
  document.getElementById("couponDiscountValue").value = coupon.discountValue ?? "";
  document.getElementById("couponMinOrderAmount").value = coupon.minOrderAmount ?? 0;
  document.getElementById("couponIsActive").value = String(coupon.isActive);

  if (coupon.expiresAt) {
    const date = new Date(coupon.expiresAt);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    document.getElementById("couponExpiresAt").value = local;
  } else {
    document.getElementById("couponExpiresAt").value = "";
  }

  document.getElementById("couponFormTitle").textContent = "Edit Coupon";
}

function resetCouponForm() {
  document.getElementById("couponId").value = "";
  document.getElementById("couponCode").value = "";
  document.getElementById("couponDiscountType").value = "fixed";
  document.getElementById("couponDiscountValue").value = "";
  document.getElementById("couponMinOrderAmount").value = "";
  document.getElementById("couponExpiresAt").value = "";
  document.getElementById("couponIsActive").value = "true";
  document.getElementById("couponFormTitle").textContent = "Add Coupon";
}

async function deleteCoupon(id) {
  if (!confirm("Delete this coupon?")) return;
  try {
    await apiSend(`${API_BASE}/coupons/${id}`, "DELETE", {});
    await refreshAll();
  } catch (error) {
    alert(error.message);
  }
}

function buildSummaryText() {
  const analytics = getAnalytics();
  return `Aridii Tech Summary

Revenue: ${formatMoney(analytics.revenue)}
Transactions: ${analytics.transactions}
Completed Orders: ${analytics.completed}
Best Selling Item: ${analytics.bestSeller}
Quantity Sold: ${analytics.bestSellerQty}

Products: ${products.length}
Categories: ${categories.length}
Subcategories: ${subcategories.length}
Coupons: ${coupons.length}
Orders: ${orders.length}`;
}

async function shareSummary() {
  const text = buildSummaryText();

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Aridii Tech Summary",
        text
      });
    } catch (error) {}
  } else {
    try {
      await navigator.clipboard.writeText(text);
      alert("Summary copied to clipboard");
    } catch (error) {
      alert(text);
    }
  }
}

function downloadSummaryTxt() {
  const text = buildSummaryText();
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aridii-tech-summary.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function exportOrdersCSV() {
  const rows = [
    ["Customer", "Phone", "Payment", "Total", "Status", "Date", "Items"]
  ];

  orders.forEach(order => {
    const itemsText = safeArray(order.items)
      .map(item => `${item.name || "Item"} (${item.quantity || 1} x ${item.price || 0})`)
      .join(" | ");

    rows.push([
      order.customerName || "",
      order.phone || "",
      order.paymentMethod || "",
      order.totalAmount || 0,
      order.status || "",
      order.createdAt || "",
      itemsText
    ]);
  });

  const csv = rows
    .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "aridii-orders.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function setupDashboardUI() {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const productCategory = document.getElementById("productCategory");

  menuToggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
    sidebarOverlay?.classList.toggle("show");
  });

  sidebarOverlay?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("show");
  });

  document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.target).classList.add("active");

      sidebar?.classList.remove("open");
      sidebarOverlay?.classList.remove("show");
    });
  });

  productCategory?.addEventListener("change", (e) => {
    populateSubcategorySelects(e.target.value);
  });
}

async function refreshAll() {
  try {
    await Promise.all([
      loadOrders(),
      loadProducts(),
      loadCategories(),
      loadSubcategories(),
      loadCoupons()
    ]);

    populateCategorySelects();
    populateSubcategorySelects();
    renderOrders();
    renderProducts();
    renderCategories();
    renderSubcategories();
    renderCoupons();
    updateDashboardStats();
  } catch (error) {
    console.error(error);
    alert("Failed to load dashboard data: " + error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const dashboardRoot = document.getElementById("dashboardRoot");

  if (loginForm) {
    loginForm.addEventListener("submit", loginAdmin);
  }

  if (dashboardRoot) {
    setupDashboardUI();
    refreshAll();
  }
});
