document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const themeButtons = document.querySelectorAll(".theme-toggle");
    const mobileMenuButton = document.querySelector(".mobile-menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("dish-search");
    const categoryButtons = document.querySelectorAll(".category-chip");
    const productGrid = document.getElementById("product-grid");
    const productCards = Array.from(document.querySelectorAll(".product-card"));
    const emptyState = document.getElementById("empty-state");
    const visibleCountEl = document.getElementById("visible-count");
    const sortSelect = document.getElementById("sort-select");
    const resetFilterBtn = document.getElementById("reset-filter");
    const cartButton = document.querySelector(".cart-button");
    const cartCount = document.querySelector(".cart-count");
    const toast = document.getElementById("toast-message");
    const newsletterForm = document.getElementById("newsletter-form");

    let activeCategory = "all";
    let itemCount = Number(localStorage.getItem("tastehub-cart-count") || 0);
    let toastTimer;

    // Sinkronisasi keranjang antar halaman
    if (cartCount && cartButton) {
        cartCount.textContent = String(itemCount);
        cartButton.setAttribute("aria-label", `Keranjang, ${itemCount} item`);
    }

    // Pengaturan Tema Gelap / Terang
    const savedTheme = localStorage.getItem("tastehub-theme");
    if (savedTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
    }

    const updateThemeButtons = () => {
        const isDark = root.classList.contains("dark");
        themeButtons.forEach((button) => {
            button.setAttribute("aria-label", isDark ? "Aktifkan tema terang" : "Aktifkan tema gelap");
            button.innerHTML = `<i class="${isDark ? "fa-solid" : "fa-regular"} ${isDark ? "fa-sun" : "fa-moon"}" aria-hidden="true"></i>`;
        });
    };

    updateThemeButtons();
    themeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const isDark = root.classList.toggle("dark");
            root.classList.toggle("light", !isDark);
            localStorage.setItem("tastehub-theme", isDark ? "dark" : "light");
            updateThemeButtons();
        });
    });

    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("visible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
    };

    // Filter dan Pencarian Produk
    const applyFilters = () => {
        const query = searchInput ? searchInput.value.trim().toLocaleLowerCase("id") : "";
        let visibleCount = 0;

        productCards.forEach((card) => {
            const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
            const matchesQuery = !query || card.dataset.name.includes(query) || card.textContent.toLocaleLowerCase("id").includes(query);
            const isVisible = matchesCategory && matchesQuery;
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        if (emptyState) emptyState.hidden = visibleCount > 0;
        if (visibleCountEl) visibleCountEl.textContent = String(visibleCount);
    };

    // Pengurutan Produk (Sorting di halaman menu)
    const sortProducts = () => {
        if (!sortSelect || !productGrid) return;
        const sortBy = sortSelect.value;

        const sortedCards = [...productCards].sort((a, b) => {
            const priceA = Number(a.dataset.price || 0);
            const priceB = Number(b.dataset.price || 0);
            const ratingA = Number(a.dataset.rating || 0);
            const ratingB = Number(b.dataset.rating || 0);
            const orderA = Number(a.dataset.order || 0);
            const orderB = Number(b.dataset.order || 0);

            if (sortBy === "price-asc") return priceA - priceB;
            if (sortBy === "price-desc") return priceB - priceA;
            if (sortBy === "rating-desc") return ratingB - ratingA;
            return orderA - orderB;
        });

        sortedCards.forEach((card) => productGrid.appendChild(card));
    };

    if (sortSelect) {
        sortSelect.addEventListener("change", sortProducts);
    }

    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            applyFilters();
            const targetSection = document.getElementById("menu") || document.getElementById("katalog-menu");
            if (targetSection) targetSection.scrollIntoView({ behavior: "smooth" });
        });

        searchInput.addEventListener("input", applyFilters);
    }

    document.querySelectorAll("[data-search]").forEach((button) => {
        button.addEventListener("click", () => {
            if (searchInput) searchInput.value = button.dataset.search;
            activeCategory = "all";
            categoryButtons.forEach((categoryButton) => {
                const isActive = categoryButton.dataset.category === "all";
                categoryButton.classList.toggle("active", isActive);
                categoryButton.setAttribute("aria-pressed", String(isActive));
            });
            applyFilters();
            const targetSection = document.getElementById("menu") || document.getElementById("katalog-menu");
            if (targetSection) targetSection.scrollIntoView({ behavior: "smooth" });
        });
    });

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category;
            categoryButtons.forEach((categoryButton) => {
                const isActive = categoryButton === button;
                categoryButton.classList.toggle("active", isActive);
                categoryButton.setAttribute("aria-pressed", String(isActive));
            });
            applyFilters();
        });
    });

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            activeCategory = "all";
            categoryButtons.forEach((categoryButton) => {
                const isActive = categoryButton.dataset.category === "all";
                categoryButton.classList.toggle("active", isActive);
                categoryButton.setAttribute("aria-pressed", String(isActive));
            });
            applyFilters();
        });
    }

    document.querySelectorAll(".favorite-button").forEach((button) => {
        button.addEventListener("click", () => {
            const isFavorite = button.getAttribute("aria-pressed") !== "true";
            const dishTitle = button.closest(".product-card").querySelector("h3").textContent;
            button.setAttribute("aria-pressed", String(isFavorite));
            button.setAttribute("aria-label", `${isFavorite ? "Hapus" : "Tambahkan"} ${dishTitle} ${isFavorite ? "dari" : "ke"} favorit`);
            button.innerHTML = `<i class="fa-${isFavorite ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>`;
            showToast(isFavorite ? `${dishTitle} ditambahkan ke favorit.` : `${dishTitle} dihapus dari favorit.`);
        });
    });

    document.querySelectorAll(".add-button").forEach((button) => {
        button.addEventListener("click", () => {
            itemCount += 1;
            localStorage.setItem("tastehub-cart-count", String(itemCount));
            if (cartCount) cartCount.textContent = String(itemCount);
            if (cartButton) cartButton.setAttribute("aria-label", `Keranjang, ${itemCount} item`);
            showToast(`${button.closest(".product-card").querySelector("h3").textContent} ditambahkan ke keranjang.`);
        });
    });

    if (cartButton) {
        cartButton.addEventListener("click", () => {
            showToast(itemCount ? `Ada ${itemCount} item di keranjangmu.` : "Keranjangmu masih kosong. Yuk, pilih menu favorit!");
        });
    }

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener("click", () => {
            const isExpanded = mobileMenuButton.getAttribute("aria-expanded") === "true";
            mobileMenuButton.setAttribute("aria-expanded", String(!isExpanded));
            mobileMenuButton.setAttribute("aria-label", isExpanded ? "Buka menu" : "Tutup menu");
            mobileMenuButton.innerHTML = `<i class="fa-solid ${isExpanded ? "fa-bars" : "fa-xmark"}" aria-hidden="true"></i>`;
            mobileMenu.hidden = isExpanded;
        });

        mobileMenu.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                mobileMenu.hidden = true;
                mobileMenuButton.setAttribute("aria-expanded", "false");
                mobileMenuButton.setAttribute("aria-label", "Buka menu");
                mobileMenuButton.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
            });
        });
    }

    if (newsletterForm) {
        newsletterForm.addEventListener("submit", (event) => {
            event.preventDefault();
            event.currentTarget.reset();
            showToast("Terima kasih! Kamu akan menerima kabar seru dari TasteHub.");
        });
    }

    // =========================================================================
    // Logika Halaman Detail Menu (detailMenu.html)
    // =========================================================================
    const detailSection = document.getElementById("detail-product");

    if (detailSection) {
        const basePrice = Number(detailSection.dataset.basePrice || 32000);
        const productName = detailSection.dataset.productName || "Menu Pilihan";
        const mainImage = document.getElementById("main-dish-image");
        const thumbButtons = document.querySelectorAll(".thumb-button");
        const qtyInput = document.getElementById("dish-qty");
        const qtyMinus = document.getElementById("qty-minus");
        const qtyPlus = document.getElementById("qty-plus");
        const addonCheckboxes = document.querySelectorAll('input[name="addon"]');
        const totalPriceDisplay = document.getElementById("total-price-display");
        const customizeForm = document.getElementById("customize-dish-form");

        const formatRupiah = (amount) => {
            return "Rp " + amount.toLocaleString("id-ID");
        };

        const calculateTotal = () => {
            const quantity = Number(qtyInput.value || 1);
            let addonTotal = 0;

            addonCheckboxes.forEach((box) => {
                if (box.checked) {
                    addonTotal += Number(box.dataset.addonPrice || 0);
                }
            });

            const grandTotal = (basePrice + addonTotal) * quantity;
            if (totalPriceDisplay) {
                totalPriceDisplay.textContent = formatRupiah(grandTotal);
            }
        };

        // Ganti Foto Utama dari Thumbnail
        thumbButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                thumbButtons.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                if (mainImage) {
                    mainImage.src = btn.dataset.image;
                    mainImage.alt = btn.dataset.alt || productName;
                }
            });
        });

        // Tombol Kurang & Tambah Porsi
        if (qtyMinus && qtyPlus && qtyInput) {
            qtyMinus.addEventListener("click", () => {
                const current = Number(qtyInput.value);
                if (current > 1) {
                    qtyInput.value = String(current - 1);
                    calculateTotal();
                }
            });

            qtyPlus.addEventListener("click", () => {
                const current = Number(qtyInput.value);
                if (current < 20) {
                    qtyInput.value = String(current + 1);
                    calculateTotal();
                }
            });
        }

        // Hitung Ulang Saat Topping Dicentang
        addonCheckboxes.forEach((box) => {
            box.addEventListener("change", calculateTotal);
        });

        // Submit Form Kustomisasi ke Keranjang
        if (customizeForm) {
            customizeForm.addEventListener("submit", (event) => {
                event.preventDefault();
                const quantity = Number(qtyInput.value || 1);
                const selectedSpice = customizeForm.querySelector('input[name="spice"]:checked')?.value || "Normal";

                itemCount += quantity;
                localStorage.setItem("tastehub-cart-count", String(itemCount));

                if (cartCount) cartCount.textContent = String(itemCount);
                if (cartButton) cartButton.setAttribute("aria-label", `Keranjang, ${itemCount} item`);

                showToast(`${quantity}x ${productName} (${selectedSpice}) berhasil masuk keranjang!`);
            });
        }

        // Navigasi Tab Komposisi & Ulasan
        const tabButtons = document.querySelectorAll(".tab-btn");
        const tabPanels = document.querySelectorAll(".tab-panel");

        tabButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("aria-controls");

                tabButtons.forEach((b) => {
                    const isSelected = b === btn;
                    b.classList.toggle("active", isSelected);
                    b.setAttribute("aria-selected", String(isSelected));
                });

                tabPanels.forEach((panel) => {
                    panel.hidden = panel.id !== targetId;
                });
            });
        });
    }
});