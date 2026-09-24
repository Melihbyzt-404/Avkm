// --- SUPABASE VE STATE TANIMLAMALARI ---
const SUPABASE_URL = "https://your-supabase-url.supabase.co"; // Kendi Supabase URL'niz
const SUPABASE_ANON_KEY = "your-anon-key";                  // Kendi Supabase Anon Key'iniz

// Supabase İstemcisi
let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL !== "https://your-supabase-url.supabase.co") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Uygulama Durumu (State)
let currentUser = null;
let cart = [];
let favorites = [];
let currentCarouselIndex = 0;

// Örnek Ürün Veri Tabanı Simülasyonu
const productsData = [
    { id: 0, title: "Dantelli İpek Saten Gecelik", price: 489.90, category: "kadin", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80" },
    { id: 1, title: "Premium Pamuklu Boxer (3'lü Paket)", price: 329.90, category: "erkek", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80" },
    { id: 2, title: "Kadife Detaylı Sabahlık Takımı", price: 749.90, category: "pijama", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80" },
    { id: 3, title: "Desenli %100 Pamuk Çocuk Pijama", price: 259.90, category: "cocuk", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80" }
];

// --- SAYFA YÜKLENDİĞİNDE ÇALIŞACAK KODLAR ---
document.addEventListener("DOMContentLoaded", () => {
    initCarousel();
    setupFilterToggle();
    updateCartBadge();
});

// --- TOAST BİLDİRİMİ ---
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// --- KULLANICI GİRİŞ & KAYIT VE AUTH İŞLEMLERİ ---
function openAuthModal() {
    document.getElementById("authModal").style.display = "flex";
}

function closeAuthModal() {
    document.getElementById("authModal").style.display = "none";
}

function switchTab(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLoginBtn = document.getElementById("tabLoginBtn");
    const tabRegisterBtn = document.getElementById("tabRegisterBtn");

    if (tab === 'login') {
        loginForm.style.display = "flex";
        registerForm.style.display = "none";
        tabLoginBtn.classList.add("active");
        tabRegisterBtn.classList.remove("active");
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "flex";
        tabRegisterBtn.classList.add("active");
        tabLoginBtn.classList.remove("active");
    }
}

function toggleB2BFields() {
    const isB2b = document.getElementById("isB2bCheck").checked;
    document.getElementById("b2bFields").style.display = isB2b ? "block" : "none";
}

function executeLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    
    // Simüle Edilmiş Kullanıcı Girişi
    currentUser = {
        email: email,
        name: email.split('@')[0],
        role: email.includes("admin") ? "admin" : "b2c"
    };

    updateUserUI();
    closeAuthModal();
    showToast(`Hoş geldiniz, ${currentUser.name}!`);
}

function executeRegister(e) {
    e.preventDefault();
    const isB2b = document.getElementById("isB2bCheck").checked;

    showToast(isB2b ? "B2B Başvurunuz Alındı! Onay Bekleniyor." : "Kayıt Başarılı!");
    closeAuthModal();
}

function continueAsGuest() {
    currentUser = { name: "Misafir Müşteri", role: "guest" };
    updateUserUI();
    closeAuthModal();
    showToast("Misafir olarak devam ediliyor.");
}

function handleLogout() {
    currentUser = null;
    updateUserUI();
    showToast("Çıkış yapıldı.");
}

function updateUserUI() {
    const guestView = document.getElementById("authGuestView");
    const userView = document.getElementById("authUserView");
    const adminPanel = document.getElementById("adminPanelSection");

    if (currentUser) {
        guestView.style.display = "none";
        userView.style.display = "flex";
        document.getElementById("userNameDisplay").innerText = currentUser.name;
        document.getElementById("userRoleBadge").innerText = currentUser.role.toUpperCase();

        if (currentUser.role === "admin" && adminPanel) {
            adminPanel.style.display = "block";
            loadAdminPendingB2b();
        } else if (adminPanel) {
            adminPanel.style.display = "none";
        }
    } else {
        guestView.style.display = "flex";
        userView.style.display = "none";
        if (adminPanel) adminPanel.style.display = "none";
    }
}

function loadAdminPendingB2b() {
    const pendingList = document.getElementById("pendingB2bList");
    if (!pendingList) return;
    
    pendingList.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-top:8px;">
            <div>
                <strong style="color:#fff;">Yılmaz Tekstil A.Ş.</strong>
                <div style="font-size:0.8rem; color:#aaa;">Vergi No: 1234567890 | Bursa</div>
            </div>
            <button onclick="showToast('B2B Firması Onaylandı!')" class="btn-gold-outline" style="font-size:0.75rem; padding:4px 10px;">Onayla</button>
        </div>
    `;
}

// --- 3D COVERFLOW CAROUSEL MANİPÜLASYONU ---
function initCarousel() {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => rotateCarousel(-1));
        nextBtn.addEventListener("click", () => rotateCarousel(1));
    }

    updateCarouselLayout();
}

function rotateCarousel(direction) {
    const cards = document.querySelectorAll(".product-card");
    currentCarouselIndex = (currentCarouselIndex + direction + cards.length) % cards.length;
    updateCarouselLayout();
}

function updateCarouselLayout() {
    const cards = document.querySelectorAll(".product-card");
    cards.forEach((card, index) => {
        const offset = index - currentCarouselIndex;
        card.style.transition = "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
        
        if (offset === 0) {
            card.style.transform = "translateX(0) scale(1) rotateY(0deg)";
            card.style.zIndex = "5";
            card.style.opacity = "1";
        } else if (offset === 1 || offset === -(cards.length - 1)) {
            card.style.transform = "translateX(180px) scale(0.8) rotateY(-25deg)";
            card.style.zIndex = "3";
            card.style.opacity = "0.7";
        } else if (offset === -1 || offset === (cards.length - 1)) {
            card.style.transform = "translateX(-180px) scale(0.8) rotateY(25deg)";
            card.style.zIndex = "3";
            card.style.opacity = "0.7";
        } else {
            card.style.transform = "translateX(0) scale(0.5) rotateY(0deg)";
            card.style.zIndex = "1";
            card.style.opacity = "0";
        }
    });
}

// --- FİLTRELEME VE ARAMA PANELİ ---
function setupFilterToggle() {
    const filterBtn = document.getElementById("filterToggleBtn");
    const filterPanel = document.getElementById("filterPanel");
    const arrow = document.getElementById("chevronArrow");

    if (filterBtn && filterPanel) {
        filterBtn.addEventListener("click", () => {
            const isOpen = filterPanel.style.display === "block";
            filterPanel.style.display = isOpen ? "none" : "block";
            if (arrow) arrow.innerText = isOpen ? "▼" : "▲";
        });
    }
}

// --- SEPET İŞLEMLERİ ---
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartBadge();
    showToast(`${product.title} sepete eklendi!`);
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    
    updateCartBadge();
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    updateCartBadge();
    renderCart();
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) badge.innerText = totalCount;
}

function renderCart() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#888; padding: 20px;">Sepetinizde ürün bulunmamaktadır.</p>`;
        document.getElementById('cartSubtotal').innerText = "0,00 ₺";
        document.getElementById('cartTotal').innerText = "0,00 ₺";
        return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${item.price.toFixed(2)} ₺</div>
                </div>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">&times;</button>
            </div>
        `;
    }).join('');

    document.getElementById('cartSubtotal').innerText = `${subtotal.toFixed(2)} ₺`;
    document.getElementById('cartTotal').innerText = `${subtotal.toFixed(2)} ₺`;
}

function openCartModal() {
    renderCart();
    document.getElementById('cartModal').style.display = 'flex';
}

function closeCartModal() {
    document.getElementById('cartModal').style.display = 'none';
}

// --- FAVORİ İŞLEMLERİ ---
function toggleFavorite(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const index = favorites.findIndex(id => id === productId);
    if (index > -1) {
        favorites.splice(index, 1);
        showToast(`${product.title} favorilerden çıkarıldı.`);
    } else {
        favorites.push(productId);
        showToast(`${product.title} favorilere eklendi!`);
    }
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById('favoritesList');
    if (!container) return;

    if (favorites.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#888; grid-column: 1/-1; padding: 20px;">Henüz favori ürün eklemediniz.</p>`;
        return;
    }

    const favProducts = productsData.filter(p => favorites.includes(p.id));
    container.innerHTML = favProducts.map(item => `
        <div class="fav-card">
            <img src="${item.image}" alt="${item.title}">
            <div class="fav-card-title">${item.title}</div>
            <span class="fav-card-price">${item.price.toFixed(2)} ₺</span>
            <button onclick="addToCart(${item.id})" class="btn-gold-outline" style="font-size: 0.75rem; padding: 4px 8px; width: 100%;">Sepete Ekle</button>
            <button onclick="toggleFavorite(${item.id})" class="remove-btn" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); border-radius: 50%; width:24px; height:24px; line-height:20px; text-align:center;">&times;</button>
        </div>
    `).join('');
}

function openFavoritesModal() {
    renderFavorites();
    document.getElementById('favoritesModal').style.display = 'flex';
}

function closeFavoritesModal() {
    document.getElementById('favoritesModal').style.display = 'none';
}

// --- İYZİCO ÖDEME ENTEGRASYON AKIŞI ---
function startCheckout() {
    if (cart.length === 0) {
        alert("Ödemeye geçebilmek için sepetinize ürün eklemelisiniz.");
        return;
    }
    closeCartModal();
    document.getElementById('checkoutModal').style.display = 'flex';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

async function handleCheckoutFormSubmit(e) {
    e.preventDefault();

    showToast("iyzico ödeme formu hazırlanıyor...");

    // iyzico Simülasyonu / Entegrasyon Modeli
    setTimeout(() => {
        const checkoutFormDiv = document.getElementById('iyzipay-checkout-form');
        checkoutFormDiv.style.display = 'block';
        checkoutFormDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; text-align: center; border: 1px dashed #d4af37;">
                <p style="color: #4cd137; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px;">✅ iyzico Ödeme Formu Hazır</p>
                <p style="font-size: 0.9rem; color: #ccc;">Ödenecek Toplam Tutar: <strong style="color:#d4af37;">${document.getElementById('cartTotal').innerText}</strong></p>
                <p style="font-size: 0.8rem; color: #aaa; margin-top: 10px;">(Canlı sistemde iyzico güvenli kredi kartı giriş formu bu alanda render edilecektir.)</p>
            </div>
        `;
        document.getElementById('checkoutAddressForm').style.display = 'none';
    }, 1200);
}