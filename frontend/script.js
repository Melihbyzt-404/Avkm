document.addEventListener("DOMContentLoaded", () => {
    
    // 1. SCROLLSPY (SAYFA DOCK MENÜ AKTİFLİĞİ)
    const sections = document.querySelectorAll("section");
    const dockItems = document.querySelectorAll(".dock-item");

    window.addEventListener("scroll", () => {
        let currentSection = "";
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 200) {
                currentSection = section.getAttribute("id");
            }
        });

        dockItems.forEach((item) => {
            item.classList.remove("active");
            if (item.getAttribute("href") === "#" + currentSection) {
                item.classList.add("active");
            }
        });
    });

    // 2. ARAMA KUTUSU TEMİZLEME
    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");

    if (searchInput && clearSearchBtn) {
        searchInput.addEventListener("input", () => {
            clearSearchBtn.style.display = searchInput.value.trim().length > 0 ? "flex" : "none";
        });

        clearSearchBtn.addEventListener("click", () => {
            searchInput.value = "";
            clearSearchBtn.style.display = "none";
            searchInput.focus();
        });
    }

    // 3. FİLTRE PANELİ
    const filterToggleBtn = document.getElementById("filterToggleBtn");
    const filterPanel = document.getElementById("filterPanel");

    if (filterToggleBtn && filterPanel) {
        filterToggleBtn.addEventListener("click", () => {
            filterToggleBtn.classList.toggle("active");
            filterPanel.classList.toggle("open");
        });
    }

    // 4. BEDEN BUTONLARI
    const sizeBtns = document.querySelectorAll(".size-btn");
    sizeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            sizeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // 5. 3D COVERFLOW CAROUSEL
    const cards = document.querySelectorAll(".product-card");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    let currentIndex = 0;

    function updateCarousel() {
        cards.forEach((card, i) => {
            card.classList.remove("active", "prev", "next", "hidden");

            if (i === currentIndex) {
                card.classList.add("active");
            } else if (i === (currentIndex - 1 + cards.length) % cards.length) {
                card.classList.add("prev");
            } else if (i === (currentIndex + 1) % cards.length) {
                card.classList.add("next");
            } else {
                card.classList.add("hidden");
            }
        });
    }

    if (cards.length > 0) {
        updateCarousel();

        nextBtn.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % cards.length;
            updateCarousel();
        });

        prevBtn.addEventListener("click", () => {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            updateCarousel();
        });

        cards.forEach((card, index) => {
            card.addEventListener("click", (e) => {
                if (e.target.closest(".add-to-cart-btn") || e.target.closest(".fav-btn")) {
                    return;
                }
                if (index !== currentIndex) {
                    currentIndex = index;
                    updateCarousel();
                }
            });
        });
    }

    // 6. SEPETE EKLEME & FAVORİ
    let cartCount = 0;
    const cartBadge = document.getElementById("cartBadge");
    const toast = document.getElementById("toast");

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    document.querySelectorAll(".fav-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            btn.classList.toggle("is-favorite");
            if (btn.classList.contains("is-favorite")) {
                showToast("Ürün Favorilere Eklendi! ❤️");
            } else {
                showToast("Ürün Favorilerden Çıkarıldı.");
            }
        });
    });

    document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            cartCount++;
            cartBadge.textContent = cartCount;
            cartBadge.classList.add("bump");
            setTimeout(() => cartBadge.classList.remove("bump"), 300);

            showToast("Ürün Sepetinize Eklendi! 🛒");
        });
    });
});