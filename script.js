// ========== GLOBAL VARIABLES ==========
let cart = [];
let navStack = [];
let slideIndex = 0;
let activeCard = null;
const BACKEND_URL = "https://aridiitech-backend.onrender.com";
console.log("NEW SCRIPT LOADED");
let backendCategories = [];
let backendSubcategories = [];
let backendProducts = [];
let popupBannerData = null;

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ===============================
// RAMADAN COUPON SYSTEM
// ===============================
let appliedCoupon = null;
const RAMADAN_COUPON = "Ramadan26";

/*
🔥🔥🔥 EDIT DISCOUNTED PRICES HERE 🔥🔥🔥
Item name MUST match EXACT text inside .item-name
*/

const discountedPrices = {
  // ===== Phones & Accessories =====
  "iPhone Adapter": 21.00,
  "HOCO K17 Broadcast Stand": 9.60,
  "Yesido Gaming Keyboard": 19.20,
  "Maxmate Stereo Earbuds": 15.40,
  "Maxmate Powerbank 10000mAh": 14.00,
  "SKE Mini DC UPS 10800mAh": 16.00,
  "Samsung AKG USB-C Earphones": 7.00,
  "HOCO Y20 Smartwatch": 28.00,
  "HOCO Y24 Smartwatch": 32.00,

  // ===== Canva =====
  "Canva Pro - 1 Year": 3.5,

  // ===== ChatGPT =====
  "ChatGPT Plus - 1 Month": 2.80,
  "ChatGPT Plus - 6 Months": 16.50,
  "ChatGPT Plus - 1 Year": 24.50,

  // ===== Netflix =====
  "One Month / One User": 2.10,
  "Three Months / One User": 6.30,
  "One Year / One User": 20.00,
  "One Month / Full Account": 8.00,
  "One Year / Full Account": 92.40,

  // ===== OSN =====
  "One Month/One User": 3.50,
  "One Year/One User": 20.00,
  "One Month/Full Account": 9.10,
  "One Year/Full Account": 77.00,

  // ===== Shahid =====
  "Shahid VIP One Month/One User": 2.10,
  "Shahid VIP Three Months/One User": 3.50,
  "Shahid VIP One Year/One User": 9.60,
  "Shahid VIP One Month/Full Account": 5.50,
  "Shahid VIP One Year/Full Account": 34.10,

  // ===== Spotify =====
  "Spotify Premium Six Months": 16.50,
  "Spotify Premium One Year": 30.80,

  // ===== Anghami =====
  "Anghami Plus Three Months": 7.00,
  "Anghami Plus Six Months": 10.5,
  "Anghami Plus One Year": 16.5,
};


// History/popstate guard (prevents loops)
let isApplyingPopState = false;

// ===== DOM ELEMENTS =====
let categoryCards, subcategories, items, providerItems, mainCategories;
let cartIcon, cartModal, cartItems, cartTotal, cartCount, closeCartBtn, checkoutBtn;
let paymentSelection, searchInput, paymentCards, infoBox, slides, prizeModal;

// ===== QUOTES DATA =====
const emptyCartQuotes = [
  "Your cart is waiting to be filled with amazing deals! 🛒",
  "Great things await - start adding items to your cart! ✨",
  "Your shopping journey begins with that first item! 🚀",
  "Empty cart, endless possibilities! Fill it up! 🌟",
  "The best deals are just a click away! Start shopping! 💫",
  "Your perfect purchase is waiting to be discovered! 🔍",
  "Every great order starts with that first item!",
  "Ready to fill your cart with awesome products? Let's go! 🎯"
];

const emptyCategoryQuotes = [
  "Exciting new products coming soon! Stay tuned! 🚀",
  "We're working on amazing additions for this category! ✨",
  "Great things are on the way for this section! 🌟",
  "Our team is curating the best products for you! 💫",
  "Stay connected - new items arriving shortly! 🔥",
  "We're expanding this category with awesome deals! 🎯",
  "Fresh products are being added soon!",
  "Keep checking back for new arrivals! 📦"
];

// ========== PHONE BACK BUTTON (History API) ==========
function getHistoryState() {
  const searchResultsOpen = !!document.querySelector(".search-results");
  const q = (searchInput?.value || "").trim();

  return {
    stack: Array.isArray(navStack) ? navStack.map((x) => ({ ...x })) : [],
    searchOpen: searchResultsOpen,
    searchQuery: q
  };
}

function stateToHash(state) {
  if (!state) return "#/main";
  if (state.searchOpen && state.searchQuery) return `#/search/${encodeURIComponent(state.searchQuery)}`;
  const last = state.stack?.length ? state.stack[state.stack.length - 1] : null;
  if (!last) return "#/main";
  return `#/${last.type}/${encodeURIComponent(last.id || "")}`;
}

function syncHistory(replace = false) {
  if (isApplyingPopState) return; // prevent push during popstate apply
  const state = getHistoryState();
  const hash = stateToHash(state);

  if (replace) history.replaceState(state, "", hash);
  else history.pushState(state, "", hash);
}

function applyState(state) {
  isApplyingPopState = true;

  // Close modals first
  if (prizeModal && prizeModal.style.display === "block") closePrizeModal();
  if (cartModal && cartModal.style.display === "block") closeCart();

  // Reset UI
  const sr = document.querySelector(".search-results");
  if (sr) sr.remove();

  navStack = Array.isArray(state?.stack) ? state.stack.map((x) => ({ ...x })) : [];

  // Apply view
  const wantSearch = !!state?.searchOpen && (state?.searchQuery || "").trim() !== "";
  if (wantSearch) {
    if (searchInput) searchInput.value = state.searchQuery;
    enhancedSearch(state.searchQuery); // guarded by isApplyingPopState so it won't push history
  } else {
    if (searchInput) searchInput.value = "";
    const last = navStack.length ? navStack[navStack.length - 1] : null;

    if (!last || last.type === "main") {
      showMainCategories();
    } else if (last.type === "sub") {
      showSubcategory(last.id);
    } else if (last.type === "items") {
      showItems(last.id);
    } else if (last.type === "provider") {
      showProviderItems(last.id);
    } else {
      showMainCategories();
    }
  }

  setTimeout(scrollToTop, 50);
  isApplyingPopState = false;
}

window.addEventListener("popstate", (e) => {
  // If no state (first entry), go main
  applyState(e.state || { stack: [], searchOpen: false, searchQuery: "" });
});

// ========== SEARCH ==========
function enhancedSearch(query) {
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedQuery === "") {
    clearSearch();
    return;
  }

  const allSearchableElements = document.querySelectorAll("[data-keywords], .item-card");
  const directItemMatches = [];
  const categoryMatches = [];

  allSearchableElements.forEach((element) => {
    let elementKeywords = "";

    if (element.hasAttribute("data-keywords")) {
      elementKeywords = element.getAttribute("data-keywords").toLowerCase();
    } else if (element.classList.contains("item-card")) {
      const itemName = element.querySelector(".item-name")?.textContent.toLowerCase() || "";
      const itemPrice = element.querySelector(".item-price")?.textContent.toLowerCase() || "";
      elementKeywords = itemName + " " + itemPrice;
    }

    if (
      elementKeywords.includes(normalizedQuery) ||
      normalizedQuery.split(" ").some((word) => elementKeywords.includes(word))
    ) {
      if (element.classList.contains("item-card")) directItemMatches.push(element);
      else if (element.classList.contains("category-card") || element.classList.contains("sub-card"))
        categoryMatches.push(element);
    }
  });

  displaySearchResults(directItemMatches, categoryMatches, normalizedQuery);
}

function displaySearchResults(directItemMatches, categoryMatches, query) {
  hideAllSubcategories();
  hideAllItems();
  hideAllProviderItems();
  if (mainCategories) mainCategories.style.display = "none";

  const existingResults = document.querySelector(".search-results");
  if (existingResults) existingResults.remove();

  const totalResults = directItemMatches.length + categoryMatches.length;
  const searchResults = document.createElement("div");
  searchResults.className = "search-results";

  if (totalResults === 0) {
    searchResults.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>No results found for "${query}"</h3>
        <p>Try searching for:</p>
        <div class="suggestions">
          <span class="suggestion-tag" data-search="mtc">MTC Touch</span>
          <span class="suggestion-tag" data-search="netflix">Netflix</span>
          <span class="suggestion-tag" data-search="pubg">PUBG UC</span>
          <span class="suggestion-tag" data-search="canva">Canva</span>
          <span class="suggestion-tag" data-search="chatgpt">ChatGPT</span>
        </div>
        <button class="back-btn" onclick="clearSearch()">← Back to Categories</button>
      </div>
    `;
  } else {
    searchResults.innerHTML = `
      <div class="search-header">
        <h3>Search Results for "${query}"</h3>
        <p>Found ${totalResults} related items</p>
      </div>
      <div class="search-results-grid"></div>
      <button class="back-btn" onclick="clearSearch()">← Back to Categories</button>
    `;

    const resultsGrid = searchResults.querySelector(".search-results-grid");
    directItemMatches.forEach((item) => resultsGrid.appendChild(createSearchResultCard(item, "direct-item")));
    categoryMatches.forEach((el) => resultsGrid.appendChild(createSearchResultCard(el, "category")));
  }

  const categoriesContainer = document.querySelector(".categories");
  if (categoriesContainer) categoriesContainer.appendChild(searchResults);

  // ✅ Push search state into browser history
  syncHistory(false);

  setTimeout(() => {
    document.querySelectorAll(".suggestion-tag").forEach((tag) => {
      tag.addEventListener("click", function () {
        const searchTerm = this.getAttribute("data-search");
        if (searchInput) {
          searchInput.value = searchTerm;
          enhancedSearch(searchTerm);
        }
      });
    });
  }, 50);
}

function createSearchResultCard(element, type) {
  const card = document.createElement("div");
  card.className = "search-result-card";

  if (type === "direct-item") {
    const name = element.querySelector(".item-name")?.textContent || "Product";
    const price = element.querySelector(".item-price")?.textContent || "$0.00";
    const image = element.querySelector("img")?.src || "";

    card.innerHTML = `
      <div class="search-result-image">
        <img src="${image}" alt="${name}" onerror="this.style.display='none'">
      </div>
      <div class="search-result-content">
        <h4>${name}</h4>
        <p class="search-item-price">${price}</p>
      </div>
      <button class="search-add-cart-btn" onclick="addSearchItemToCart(this)">
        <i class="fas fa-cart-plus"></i> Add
      </button>
    `;
    card.originalElement = element;
  } else {
    const name = element.querySelector("p")?.textContent || "Category";
    const isCategory = element.classList.contains("category-card");
    const icon = isCategory ? "📂" : "📦";
    const description = isCategory ? "Product Category" : "Subcategory";

    card.innerHTML = `
      <div class="search-result-icon">${icon}</div>
      <div class="search-result-content">
        <h4>${name}</h4>
        <p>${description}</p>
      </div>
      <button class="search-view-btn" onclick="navigateToSearchCategory(this)">View</button>
    `;
    card.originalElement = element;
  }

  return card;
}

function addSearchItemToCart(button) {
  const card = button.closest(".search-result-card");
  const originalElement = card?.originalElement;
  if (!originalElement || !originalElement.classList.contains("item-card")) return;

  const itemName = originalElement.querySelector(".item-name")?.textContent || "Product";
  const priceText = originalElement.querySelector(".item-price")?.textContent || "$0.00";
  const price = parseFloat(priceText.replace("$", "")) || 0;

  addToCart(itemName, price, 1);

  const originalBtn = button.innerHTML;
  button.innerHTML = '<i class="fas fa-check"></i> Added';
  button.disabled = true;

  setTimeout(() => {
    button.innerHTML = originalBtn;
    button.disabled = false;
  }, 1200);
}

function navigateToSearchCategory(button) {
  const card = button.closest(".search-result-card");
  const originalElement = card?.originalElement;
  if (!originalElement) return;

  const searchResults = document.querySelector(".search-results");
  if (searchResults) searchResults.remove();
  if (searchInput) searchInput.value = "";

  if (originalElement.classList.contains("category-card")) {
    const category = originalElement.getAttribute("data-category");
    const directItemsId = originalElement.getAttribute("data-direct-items-id");

    if (directItemsId) {
      navStack.push({ type: "items", id: directItemsId });
      showItems(directItemsId);
    } else {
      navStack.push({ type: "sub", id: category });
      showSubcategory(category);
    }
  } else if (originalElement.classList.contains("sub-card")) {
    const itemsId = originalElement.getAttribute("data-items-id");
    if (!itemsId) return;

    navStack.push({ type: "items", id: itemsId });
    showItems(itemsId);
  }

  syncHistory(false);
}

function clearSearch() {
  const searchResults = document.querySelector(".search-results");
  if (searchResults) searchResults.remove();
  if (searchInput) searchInput.value = "";
  showMainCategories();

  // ✅ update history
  syncHistory(false);
}

// ========== NAVIGATION ==========
function showMainCategories() {
  hideAllSubcategories();
  hideAllItems();
  hideAllProviderItems();
  if (mainCategories) mainCategories.style.display = "grid";
}

function showSubcategory(categoryId) {
  hideAllSubcategories();
  hideAllItems();
  hideAllProviderItems();
  if (mainCategories) mainCategories.style.display = "none";

  const subcategory = document.getElementById(categoryId);
  if (subcategory) {
    subcategory.style.display = "block";
    subcategory.classList.add("active");
  }
}

function showItems(itemsId) {
  hideAllSubcategories();
  hideAllItems();
  hideAllProviderItems();
  if (mainCategories) mainCategories.style.display = "none";

  const itemsDiv = document.getElementById(itemsId);
  console.log("Opening items:", itemsId, itemsDiv);
  if (itemsDiv) {
    itemsDiv.style.display = "block";
    itemsDiv.classList.add("active");

    if (itemsId === "internet-items") showInternetProviders();
  }
}

function showProviderItems(providerId) {
  hideAllSubcategories();
  hideAllItems();
  hideAllProviderItems();
  if (mainCategories) mainCategories.style.display = "none";

  const internetProviders = document.querySelector(".internet-providers");
  if (internetProviders) internetProviders.style.display = "none";

  const providerDiv = document.getElementById(providerId);
  if (providerDiv) {
    providerDiv.style.display = "block";
    providerDiv.classList.add("active");
  }

  const internetItems = document.getElementById("internet-items");
  if (internetItems) {
    internetItems.style.display = "block";
    internetItems.classList.add("active");
  }
}

function showInternetProviders() {
  hideAllProviderItems();
  const internetProviders = document.querySelector(".internet-providers");
  if (internetProviders) internetProviders.style.display = "block";

  const internetItems = document.getElementById("internet-items");
  if (internetItems) {
    internetItems.style.display = "block";
    internetItems.classList.add("active");
  }
}

function hideAllSubcategories() {
  subcategories?.forEach((sub) => {
    sub.style.display = "none";
    sub.classList.remove("active");
  });
}

function hideAllItems() {
  items?.forEach((item) => {
    item.style.display = "none";
    item.classList.remove("active");
  });
}

function hideAllProviderItems() {
  providerItems?.forEach((provider) => {
    provider.style.display = "none";
    provider.classList.remove("active");
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBack() {
  const searchResults = document.querySelector(".search-results");
  if (searchResults) {
    clearSearch();
    return;
  }

  if (navStack.length === 0) {
    showMainCategories();
    setTimeout(scrollToTop, 50);
    syncHistory(false);
    return;
  }

  navStack.pop();

  if (navStack.length === 0) {
    showMainCategories();
    setTimeout(scrollToTop, 50);
    syncHistory(false);
    return;
  }

  const previousView = navStack[navStack.length - 1];

  if (previousView.type === "main") showMainCategories();
  else if (previousView.type === "sub") showSubcategory(previousView.id);
  else if (previousView.type === "items") showItems(previousView.id);
  else if (previousView.type === "provider") showProviderItems(previousView.id);

  setTimeout(scrollToTop, 50);
  syncHistory(false);
}

// ===== EMPTY CATEGORY =====
function getRandomEmptyCategoryQuote() {
  return emptyCategoryQuotes[Math.floor(Math.random() * emptyCategoryQuotes.length)];
}

function showEmptyCategoryMessage(categoryName) {
  hideAllSubcategories();
  hideAllItems();
  hideAllProviderItems();
  if (mainCategories) mainCategories.style.display = "none";

  const old = document.querySelector(".empty-category-message");
  if (old) old.remove();

  const emptyCategoryDiv = document.createElement("div");
  emptyCategoryDiv.className = "empty-category-message";
  emptyCategoryDiv.innerHTML = `
    <div class="empty-category-content">
      <div class="empty-category-icon">📦</div>
      <h3>${categoryName}</h3>
      <h4>${getRandomEmptyCategoryQuote()}</h4>
      <p>We're constantly updating our inventory with the latest products.</p>
      <p>In the meantime, explore our other categories!</p>
      <button class="back-btn" onclick="goBack()">← Back</button>
    </div>
  `;

  const categoriesContainer = document.querySelector(".categories");
  if (categoriesContainer) categoriesContainer.appendChild(emptyCategoryDiv);

  syncHistory(false);
}

// ========== CART HELPERS ==========
function isDiscountedItem(itemName) {
  return Object.prototype.hasOwnProperty.call(discountedPrices, itemName);
}

function getFinalPrice(item) {
  // ✅ Apply discount ONLY when coupon is applied AND item has a discounted value
  if (appliedCoupon === RAMADAN_COUPON && isDiscountedItem(item.name)) {
    const discounted = Number(discountedPrices[item.name]);

    // if discounted value is valid (not NaN and > 0), use it
    if (!Number.isNaN(discounted) && discounted > 0) return discounted;
  }

  return item.price;
}


// ========== CART ==========
function getRandomQuote() {
  return emptyCartQuotes[Math.floor(Math.random() * emptyCartQuotes.length)];
}

function updateCartDisplay() {
  if (!cartItems) return;
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    const emptyCartDiv = document.createElement("div");
    emptyCartDiv.className = "empty-cart";
    emptyCartDiv.innerHTML = `
      <div class="empty-cart-content">
        <div class="empty-cart-icon">🛒</div>
        <h4>${getRandomQuote()}</h4>
        <p>Browse our categories and discover amazing products!</p>
        <button class="continue-shopping-btn" onclick="closeCartAndShop()">Continue Shopping</button>
      </div>
    `;
    cartItems.appendChild(emptyCartDiv);

    if (cartCount) cartCount.textContent = "0";
    if (cartTotal) cartTotal.textContent = "0.00";
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (paymentSelection) paymentSelection.style.display = "none";
    return;
  }

  let total = 0;
  let hasPricedItems = false;

  if (cartCount) {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  cart.forEach((item, index) => {
    const finalPrice = getFinalPrice(item);
    const itemTotal = finalPrice * item.quantity;

    if (finalPrice > 0) {
      total += itemTotal;
      hasPricedItems = true;
    }

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";

    const showDiscountUI =
      appliedCoupon === RAMADAN_COUPON &&
      isDiscountedItem(item.name) &&
      item.price > 0;

    let priceDisplay = "";

    if (showDiscountUI) {
      priceDisplay = `
        <div class="item-price">
          <span style="text-decoration:line-through;opacity:.6;">
            $${item.price.toFixed(2)}
          </span>
          <br>
          <span style="color:#F5C542;font-weight:900;">
            $${finalPrice.toFixed(2)} × ${item.quantity}
          </span>
        </div>
      `;
    } else {
      priceDisplay =
        finalPrice > 0
          ? `<div class="item-price">$${finalPrice.toFixed(2)} × ${item.quantity}</div>`
          : `<div class="item-price">Price to be determined</div>`;
    }

    cartItem.innerHTML = `
      <div class="item-details">
        <h4>${item.name}</h4>
        ${priceDisplay}
      </div>
      <div class="item-quantity">
        <button class="quantity-btn minus" data-index="${index}">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn plus" data-index="${index}">+</button>
      </div>
      <button class="remove-btn" data-index="${index}">Remove</button>
    `;

    cartItems.appendChild(cartItem);
  });

  if (cartTotal) {
    cartTotal.textContent = hasPricedItems ? total.toFixed(2) : "TBD";
  }

  if (paymentSelection) paymentSelection.style.display = "block";
  if (checkoutBtn) checkoutBtn.disabled = false;
}

function closeCartAndShop() {
  closeCart();
}

function addToCart(itemName, itemPrice, quantity = 1) {
  const existingItemIndex = cart.findIndex(
    (item) => item.name === itemName && item.price === itemPrice
  );

  if (existingItemIndex !== -1) cart[existingItemIndex].quantity += quantity;
  else cart.push({ name: itemName, price: itemPrice, quantity });

  updateCartDisplay();
  showCartNotification(`${itemName} added to cart!`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
}

function changeQuantity(index, change) {
  const newQuantity = cart[index].quantity + change;
  if (newQuantity < 1) removeFromCart(index);
  else {
    cart[index].quantity = newQuantity;
    updateCartDisplay();
  }
}

function showCartNotification(message) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 90px;
    right: 16px;
    background: rgba(245,197,66,.95);
    color: #1A1A1A;
    padding: 10px 14px;
    border-radius: 14px;
    font-weight: 900;
    z-index: 3000;
    box-shadow: 0 12px 24px rgba(0,0,0,.35);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 1600);
}

async function checkout() {
    console.log("Checkout clicked");
    console.log("Cart:", cart);
    console.log("Selected payment:", document.querySelector('input[name="payment"]:checked'));

    if (cart.length === 0) return;

    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (!selectedPayment) {
        showCartNotification("Please select a payment method");
        return;
    }

    const paymentMethod = selectedPayment.value;

    const paymentMethods = {
        wishmoney: "wish",
        omt: "omt",
        cash: "cash"
    };

    const paymentLabels = {
        wishmoney: "Wish Money",
        omt: "OMT",
        cash: "Cash"
    };

    const backendPaymentMethod = paymentMethods[paymentMethod] || "cash";

    let total = 0;

    const orderItems = cart.map((item) => {
        const finalPrice = getFinalPrice(item);
        const itemTotal = finalPrice * item.quantity;
        total += itemTotal;

        return {
            name: item.name,
            price: finalPrice,
            quantity: item.quantity
        };
    });

    const customerNameInput = document.getElementById("customerName");
    const customerPhoneInput = document.getElementById("customerPhone");
    const customerNotesInput = document.getElementById("customerNotes");

    const customerName = customerNameInput?.value.trim();
    if (!customerName) {
        showCartNotification("Customer name is required");
        return;
    }

    const phone = customerPhoneInput?.value.trim();
    if (!phone) {
        showCartNotification("Phone number is required");
        return;
    }

    const notes = customerNotesInput?.value.trim() || "";

    const orderData = {
        customerName,
        phone,
        paymentMethod: backendPaymentMethod,
        items: orderItems,
        totalAmount: total
    };

    try {
        await sendOrderToBackend(orderData);

        let message = `Hello! I would like to purchase the following items:\n\n`;

        orderItems.forEach((item) => {
            const itemTotal = item.price * item.quantity;
            message += `• ${item.name} (Qty: ${item.quantity}) - $${itemTotal.toFixed(2)}\n`;
        });

        message += `\nTotal: $${total.toFixed(2)}`;
        if (appliedCoupon) message += `\nCoupon: ${appliedCoupon}`;
        message += `\nPayment Method: ${paymentLabels[paymentMethod] || paymentMethod}`;
        message += `\nCustomer Name: ${customerName}`;
        message += `\nPhone: ${phone}`;
        if (notes) message += `\nNotes: ${notes}`;
        message += `\n\nPlease confirm my order.`;

        const whatsappUrl = `https://wa.me/96171450495?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");

        showCartNotification("Order saved successfully! 🎉");

        cart = [];
        appliedCoupon = null;
        updateCartDisplay();

        if (customerNameInput) customerNameInput.value = "";
        if (customerPhoneInput) customerPhoneInput.value = "";
        if (customerNotesInput) customerNotesInput.value = "";

        closeCart();

    } catch (error) {
        console.error(error);
        showCartNotification("Failed to save order to server");
    }
}

async function sendOrderToBackend(orderData) {
    try {
        const response = await fetch("https://aridiitech-backend.onrender.com/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to save order");
        }

        return data;
    } catch (error) {
        console.error("Error sending order to backend:", error);
        throw error;
    }
}

// ========== ITEM MANAGEMENT ==========
function handleAddToCart(e) {
  const card = e.target.closest(".item-card");
  if (!card) return;

  const itemName = card.querySelector(".item-name")?.textContent || "Product";
  const priceElement = card.querySelector(".item-price");
  const quantityInput = card.querySelector(".qty-input");

  const price = priceElement ? parseFloat(priceElement.textContent.replace("$", "")) || 0 : 0;
  const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

  if (quantity > 0) addToCart(itemName, price, quantity);
  else showCartNotification("Please check the item quantity");
}

function handleQuantityButtons(e) {
  if (!e.target.classList.contains("qty-btn")) return;

  const card = e.target.closest(".item-card");
  const input = card?.querySelector(".qty-input");
  if (!input) return;

  const value = parseInt(input.value) || 1;

  if (e.target.classList.contains("minus")) {
    if (value > 1) input.value = value - 1;
  } else if (e.target.classList.contains("plus")) {
    input.value = value + 1;
  }
}

function addInternetCardToCart(baseName, provider) {
  const providerDiv = document.getElementById(`${provider}-items`);
  if (!providerDiv) return;

  const input = providerDiv.querySelector(".customer-input");
  const cardName = input?.value.trim() || "";

  if (cardName === "") {
    showCartNotification("Please enter card name/number");
    return;
  }

  addToCart(`${baseName} - ${cardName}`, 0, 1);
  if (input) input.value = "";
  showCartNotification(`${baseName} added to cart!`);
}

// ========== SLIDER (RESPONSIVE) ==========
function nextSlide() {
  slideIndex = (slideIndex + 1) % 8;
  const slider = document.querySelector(".slider");
  const slideWidth = slider ? slider.clientWidth : 0;

  if (slides && slideWidth) {
    slides.style.transform = `translateX(-${slideIndex * slideWidth}px)`;
  }
}

function startSlider() {
  if (!slides) return;

  const snap = () => {
    const slider = document.querySelector(".slider");
    const slideWidth = slider ? slider.clientWidth : 0;
    if (slideWidth) slides.style.transform = `translateX(-${slideIndex * slideWidth}px)`;
  };

  snap();
  window.addEventListener("resize", snap);
  setInterval(nextSlide, 3200);
}

// ========== PAYMENT INFO ==========
function handlePaymentCardClick(card) {
  const info = card.getAttribute("data-info");
  if (activeCard === card) {
    if (infoBox) infoBox.style.display = "none";
    card.classList.remove("active");
    activeCard = null;
    return;
  }
  paymentCards?.forEach((c) => c.classList.remove("active"));
  card.classList.add("active");
  if (infoBox) {
    infoBox.textContent = info;
    infoBox.style.display = "block";
  }
  activeCard = card;
}

// ========== MODALS ==========
function openPrizeModal() {
  if (!prizeModal) return;
  prizeModal.style.display = "block";
  document.body.style.overflow = "hidden";
}
function closePrizeModal() {
  if (!prizeModal) return;
  prizeModal.style.display = "none";
  document.body.style.overflow = "auto";
}

function openCart() {
  if (!cartModal) return;
  cartModal.style.display = "block";
  document.body.style.overflow = "hidden";
}
function closeCart() {
  if (!cartModal) return;
  cartModal.style.display = "none";
  document.body.style.overflow = "auto";
}


// ========== EVENTS ==========
function setupEventListeners() {
  categoryCards = document.querySelectorAll(".category-card");
  subcategories = document.querySelectorAll(".subcategories");
  items = document.querySelectorAll(".items");
  providerItems = document.querySelectorAll(".provider-items");
  mainCategories = document.querySelector(".main-categories");

  cartIcon = document.getElementById("cartIcon");
  cartModal = document.getElementById("cartModal");
  cartItems = document.getElementById("cartItems");
  cartTotal = document.getElementById("cartTotal");
  cartCount = document.querySelector(".cart-count");
  closeCartBtn = document.querySelector(".close-cart");
  checkoutBtn = document.getElementById("checkoutBtn");
  paymentSelection = document.querySelector(".payment-selection");

  searchInput = document.getElementById("searchInput");
  paymentCards = document.querySelectorAll(".payment-card");
  infoBox = document.getElementById("payment-info");

  slides = document.querySelector(".slides");
  prizeModal = document.getElementById("prizeModal");

// Category navigation
categoryCards?.forEach((card) => {
  card.addEventListener("click", () => {
    const category = card.getAttribute("data-category");
    const directItemsId = card.getAttribute("data-direct-items-id");

    if (directItemsId) {
      navStack.push({ type: "items", id: directItemsId });
      showItems(directItemsId);
    } else {
      navStack.push({ type: "sub", id: category });
      showSubcategory(category);
    }

    syncHistory(false);
  });
});

  // Sub-card navigation (delegation)
  document.addEventListener("click", (e) => {
    const subCard = e.target.closest(".sub-card");
    if (!subCard) return;

    const itemsId = subCard.getAttribute("data-items-id");
    if (!itemsId) return;

    navStack.push({ type: "items", id: itemsId });
    showItems(itemsId);
    syncHistory(false);
  });

  // Back buttons (delegation)
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("back-btn")) return;
    document.querySelectorAll(".empty-category-message").forEach((m) => m.remove());
    goBack();
  });

  // Cart open/close
  if (cartIcon) cartIcon.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);

  if (cartModal) {
    cartModal.addEventListener("click", (e) => {
      if (e.target === cartModal) closeCart();
    });
  }

  if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

  // Coupon apply button
  const couponBtn = document.getElementById("applyCouponBtn");
  if (couponBtn) {
    couponBtn.addEventListener("click", function () {
      const input = document.getElementById("couponInput");
      if (!input) return;

      if (input.value.trim() === RAMADAN_COUPON) {
        appliedCoupon = RAMADAN_COUPON;
        showCartNotification("Ramadan discount applied 🎉");
      } else {
        appliedCoupon = null;
        showCartNotification("Invalid coupon code");
      }

      updateCartDisplay();
    });
  }

  // Item + quantity + cart controls
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart")) handleAddToCart(e);
    if (e.target.classList.contains("qty-btn")) handleQuantityButtons(e);

    if (e.target.classList.contains("quantity-btn")) {
      const index = parseInt(e.target.getAttribute("data-index"));
      if (!isNaN(index)) {
        if (e.target.classList.contains("minus")) changeQuantity(index, -1);
        else if (e.target.classList.contains("plus")) changeQuantity(index, 1);
      }
    }

    if (e.target.classList.contains("remove-btn")) {
      const index = parseInt(e.target.getAttribute("data-index"));
      if (!isNaN(index)) removeFromCart(index);
    }
  });

  // Debounced search
  let searchTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value;
      searchTimer = setTimeout(() => enhancedSearch(val), 120);
    });
  }

  // Payment cards
  paymentCards?.forEach((card) =>
    card.addEventListener("click", () => handlePaymentCardClick(card))
  );

  // Prize modal outside click
  window.addEventListener("click", (event) => {
    if (event.target === prizeModal) closePrizeModal();
  });

  // ESC closes modals
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (prizeModal && prizeModal.style.display === "block") closePrizeModal();
    if (cartModal && cartModal.style.display === "block") closeCart();
  });
}


async function loadPopupBanner() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/popup-banner`);
    const data = await res.json();

    if (!data.success || !data.popupBanner) {
      return;
    }

    popupBannerData = data.popupBanner;
  } catch (error) {
    console.error("Error loading popup banner:", error);
  }
}


async function loadStoreData() {
  try {
    const [categoriesRes, subcategoriesRes, productsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/categories`),
      fetch(`${BACKEND_URL}/api/subcategories`),
      fetch(`${BACKEND_URL}/api/products`)
    ]);

    const categoriesData = await categoriesRes.json();
    const subcategoriesData = await subcategoriesRes.json();
    const productsData = await productsRes.json();

    backendCategories = categoriesData.categories || [];
    backendSubcategories = subcategoriesData.subcategories || [];
    backendProducts = productsData.products || [];

    renderDynamicStore();
  } catch (error) {
    console.error("Error loading store:", error);
  }
}

function renderDynamicStore() {
  const main = document.getElementById("dynamicMainCategories");
  const sub = document.getElementById("dynamicSubcategoriesContainer");
  const itemsContainer = document.getElementById("dynamicItemsContainer");

  if (!main || !sub || !itemsContainer) return;

  main.innerHTML = "";
  sub.innerHTML = "";
  itemsContainer.innerHTML = "";

  backendCategories
    .filter(category => category.isActive !== false)
    .forEach((category) => {
      const slug = slugify(category.name);

      const card = document.createElement("div");
	  card.className = "category-card";
	  card.setAttribute("data-category", slug);
   	  card.setAttribute("data-keywords", category.name.toLowerCase());

      const categoryImage =
        category.image && category.image.trim() !== ""
          ? category.image
          : "https://via.placeholder.com/300x300?text=Aridii+Tech";

      card.innerHTML = `
        <img src="${categoryImage}" alt="${category.name}">
        <p>${category.name}</p>
      `;

      main.appendChild(card);

      const relatedSubs = backendSubcategories.filter(
        (s) =>
          String(s.category?._id || s.category) === String(category._id) &&
          s.isActive !== false
      );

      const directProducts = backendProducts.filter(
        (p) =>
          String(p.category?._id || p.category) === String(category._id) &&
          (!p.subcategory || p.subcategory === null) &&
          p.isActive !== false
      );

      if (relatedSubs.length > 0) {
        const subWrap = document.createElement("div");
        subWrap.className = "subcategories";
        subWrap.id = slug;

        let subHtml = `<h3>${category.name}</h3><div class="sub-grid">`;

        relatedSubs.forEach((subcat) => {
          const subSlug = slugify(subcat.name);
          const itemsId = `${slug}-${subSlug}-items`;

          const subImage =
            subcat.image && subcat.image.trim() !== ""
              ? subcat.image
              : "https://via.placeholder.com/300x300?text=Aridii+Tech";

          subHtml += `
            <div class="sub-card" data-items-id="${itemsId}" data-keywords="${subcat.name.toLowerCase()}">
              <img src="${subImage}" alt="${subcat.name}">
              <p>${subcat.name}</p>
            </div>
          `;

          const relatedProducts = backendProducts.filter(
            (p) =>
              String(p.subcategory?._id || p.subcategory) === String(subcat._id) &&
              p.isActive !== false
          );

          const itemSection = document.createElement("div");
          itemSection.className = "items";
          itemSection.id = itemsId;

          let itemHtml = `<h4>${subcat.name}</h4><div class="items-grid">`;

          if (relatedProducts.length === 0) {
            itemHtml += `<p style="padding:20px;">No products found in this section.</p>`;
          } else {
            relatedProducts.forEach((product) => {
              const productImage =
                product.image && product.image.trim() !== ""
                  ? product.image
                  : "https://via.placeholder.com/300x300?text=Aridii+Tech";

              itemHtml += `
                <div class="item-card" data-keywords="${(product.name || "").toLowerCase()} ${(product.description || "").toLowerCase()}">
                  <img src="${productImage}" alt="${product.name}">
                  <p class="item-name">${product.name}</p>
                  <p class="item-price">$${Number(product.price).toFixed(2)}</p>
                  <div class="quantity-container">
                    <button class="qty-btn minus">-</button>
                    <input type="number" class="qty-input" value="1" min="1">
                    <button class="qty-btn plus">+</button>
                  </div>
                  <button class="add-to-cart">Add to Cart</button>
                </div>
              `;
            });
          }

          itemHtml += `</div><button class="back-btn">← Back</button>`;
          itemSection.innerHTML = itemHtml;
          itemsContainer.appendChild(itemSection);
        });

        subHtml += `</div><button class="back-btn">← Back</button>`;
        subWrap.innerHTML = subHtml;
        sub.appendChild(subWrap);
      }

      if (relatedSubs.length === 0) {
        const directItemsId = `${slug}-items`;

        const itemSection = document.createElement("div");
        itemSection.className = "items";
        itemSection.id = directItemsId;

        let itemHtml = `<h4>${category.name}</h4><div class="items-grid">`;

        if (directProducts.length === 0) {
          itemHtml += `<p style="padding:20px;">No products found in this section.</p>`;
        } else {
          directProducts.forEach((product) => {
            const productImage =
              product.image && product.image.trim() !== ""
                ? product.image
                : "https://via.placeholder.com/300x300?text=Aridii+Tech";

            itemHtml += `
              <div class="item-card" data-keywords="${(product.name || "").toLowerCase()} ${(product.description || "").toLowerCase()}">
                <img src="${productImage}" alt="${product.name}">
                <p class="item-name">${product.name}</p>
                <p class="item-price">$${Number(product.price).toFixed(2)}</p>
                <div class="quantity-container">
                  <button class="qty-btn minus">-</button>
                  <input type="number" class="qty-input" value="1" min="1">
                  <button class="qty-btn plus">+</button>
                </div>
                <button class="add-to-cart">Add to Cart</button>
              </div>
            `;
          });
        }

        itemHtml += `</div><button class="back-btn">← Back</button>`;
        itemSection.innerHTML = itemHtml;
        itemsContainer.appendChild(itemSection);

        card.setAttribute("data-direct-items-id", directItemsId);
      }
    });
}


function applyPopupBanner() {
  if (!popupBannerData || popupBannerData.isActive !== true) {
    return;
  }

  const popupTitle = document.getElementById("popupTitle");
  const popupImage = document.getElementById("popupImage");
  const popupButton = document.getElementById("popupButton");
  const prizeModalImage = document.querySelector("#prizeModal img");

  if (popupTitle) {
    popupTitle.textContent = popupBannerData.title || "";
  }

  if (popupImage) {
    popupImage.src = popupBannerData.image || "";
    popupImage.alt = popupBannerData.title || "Popup Banner";
  }

  if (prizeModalImage && popupBannerData.image) {
    prizeModalImage.src = popupBannerData.image;
    prizeModalImage.alt = popupBannerData.title || "Popup Banner";
  }

  if (popupButton) {
    popupButton.textContent = popupBannerData.buttonText || "Start Shopping";
    popupButton.href = popupBannerData.buttonLink || "#";
  }
}


// ========== INIT ========== //
async function initializeApp() {
  await Promise.all([
    loadStoreData(),
    loadPopupBanner()
  ]);

  setupEventListeners();

  categoryCards = document.querySelectorAll(".category-card");
  subcategories = document.querySelectorAll(".subcategories");
  items = document.querySelectorAll(".items");

  applyPopupBanner();

  showMainCategories();
  updateCartDisplay();
  hideAllProviderItems();
  startSlider();

  if (popupBannerData && popupBannerData.isActive === true) {
    setTimeout(openPrizeModal, 800);
  }

  syncHistory(true);
}


// ========== EXPORTS ==========
window.showItems = showItems;
window.showProviderItems = showProviderItems;
window.showInternetProviders = showInternetProviders;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.addInternetCardToCart = addInternetCardToCart;
window.closeCartAndShop = closeCartAndShop;
window.openPrizeModal = openPrizeModal;
window.closePrizeModal = closePrizeModal;
window.goBack = goBack;
window.enhancedSearch = enhancedSearch;
window.clearSearch = clearSearch;
window.addSearchItemToCart = addSearchItemToCart;
window.navigateToSearchCategory = navigateToSearchCategory;

document.addEventListener("DOMContentLoaded", initializeApp);
