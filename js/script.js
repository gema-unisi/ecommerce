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
    const cartStorageKey = "tastehub-cart";
    let cartItems = [];
    let toastTimer;

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

    const getItemCount = () => cartItems.reduce((total, item) => total + item.quantity, 0);

    const updateCartBadge = () => {
        const itemCount = getItemCount();
        if (cartCount) cartCount.textContent = String(itemCount);
        if (cartButton) cartButton.setAttribute("aria-label", `Keranjang, ${itemCount} item`);
    };

    const loadCart = () => {
        try {
            const storedCart = localStorage.getItem(cartStorageKey);
            if (!storedCart) {
                localStorage.removeItem("tastehub-cart-count");
                return [];
            }

            const parsedCart = JSON.parse(storedCart);
            if (!Array.isArray(parsedCart)) throw new TypeError("Format keranjang bukan array.");

            return parsedCart.filter((item) => {
                const isValid = item && typeof item.id === "string" &&
                    typeof item.name === "string" && Number.isFinite(item.price) &&
                    Number.isInteger(item.quantity) && item.quantity > 0;
                if (!isValid) console.warn("Item keranjang yang tidak valid dilewati.", item);
                return isValid;
            });
        } catch (error) {
            console.error("Gagal membaca keranjang dari localStorage.", error);
            showToast("Keranjang tidak dapat dibaca. Coba muat ulang halaman.");
            return [];
        }
    };

    const renderCheckout = () => {
        const checkoutList = document.getElementById("checkout-items");
        if (!checkoutList) return;

        const emptyState = document.getElementById("checkout-empty");
        const subtotalDisplay = document.getElementById("checkout-subtotal");
        const shippingDisplay = document.getElementById("checkout-shipping");
        const totalDisplay = document.getElementById("checkout-total");
        const submitButton = document.getElementById("place-order");
        const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
        const shipping = subtotal === 0 || subtotal >= 100000 ? 0 : 10000;
        const formatRupiah = (amount) => `Rp ${amount.toLocaleString("id-ID")}`;

        checkoutList.replaceChildren();
        cartItems.forEach((item) => {
            const row = document.createElement("article");
            row.className = "checkout-item";

            const image = document.createElement("img");
            image.className = "checkout-item-image";
            image.src = item.image || "";
            image.alt = item.name;
            image.loading = "lazy";
            row.appendChild(image);

            const details = document.createElement("div");
            details.className = "checkout-item-details";
            const title = document.createElement("h3");
            title.textContent = item.name;
            details.appendChild(title);

            const options = item.options || {};
            const optionText = [
                options.spice,
                ...(Array.isArray(options.addons) ? options.addons : []),
                options.note ? `Catatan: ${options.note}` : ""
            ].filter(Boolean).join(" · ");
            if (optionText) {
                const optionDescription = document.createElement("p");
                optionDescription.className = "checkout-item-options";
                optionDescription.textContent = optionText;
                details.appendChild(optionDescription);
            }

            const unitPrice = document.createElement("strong");
            unitPrice.className = "checkout-item-price";
            unitPrice.textContent = formatRupiah(item.price);
            details.appendChild(unitPrice);
            row.appendChild(details);

            const actions = document.createElement("div");
            actions.className = "checkout-item-actions";
            const quantityControls = document.createElement("div");
            quantityControls.className = "checkout-quantity";

            const decreaseButton = document.createElement("button");
            decreaseButton.type = "button";
            decreaseButton.dataset.cartAction = "decrease";
            decreaseButton.dataset.cartId = item.id;
            decreaseButton.setAttribute("aria-label", `Kurangi ${item.name}`);
            decreaseButton.textContent = "-";
            decreaseButton.disabled = item.quantity <= 1;

            const quantity = document.createElement("span");
            quantity.textContent = String(item.quantity);
            quantity.setAttribute("aria-label", `Jumlah ${item.quantity}`);

            const increaseButton = document.createElement("button");
            increaseButton.type = "button";
            increaseButton.dataset.cartAction = "increase";
            increaseButton.dataset.cartId = item.id;
            increaseButton.setAttribute("aria-label", `Tambah ${item.name}`);
            increaseButton.textContent = "+";

            quantityControls.append(decreaseButton, quantity, increaseButton);
            actions.appendChild(quantityControls);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "checkout-remove";
            removeButton.dataset.cartAction = "remove";
            removeButton.dataset.cartId = item.id;
            removeButton.textContent = "Hapus";
            actions.appendChild(removeButton);
            row.appendChild(actions);
            checkoutList.appendChild(row);
        });

        if (emptyState) emptyState.hidden = cartItems.length > 0;
        if (subtotalDisplay) subtotalDisplay.textContent = formatRupiah(subtotal);
        if (shippingDisplay) shippingDisplay.textContent = shipping ? formatRupiah(shipping) : "Gratis";
        if (totalDisplay) totalDisplay.textContent = formatRupiah(subtotal + shipping);
        if (submitButton) submitButton.disabled = cartItems.length === 0;
    };

    const saveCart = (nextCart) => {
        try {
            localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
            localStorage.removeItem("tastehub-cart-count");
            cartItems = nextCart;
            updateCartBadge();
            renderCheckout();
            return true;
        } catch (error) {
            console.error("Gagal menyimpan keranjang ke localStorage.", error);
            showToast("Keranjang gagal disimpan. Periksa penyimpanan browser.");
            return false;
        }
    };

    const addCartItem = (newItem) => {
        const existingItem = cartItems.find((item) => item.id === newItem.id);
        let nextCart;

        if (existingItem) {
            nextCart = cartItems.map((item) => item.id === newItem.id
                ? { ...item, quantity: Math.min(item.quantity + newItem.quantity, 99) }
                : item);
        } else {
            nextCart = [...cartItems, newItem];
        }

        return saveCart(nextCart);
    };

    cartItems = loadCart();
    updateCartBadge();
    renderCheckout();

    window.addEventListener("storage", (event) => {
        if (event.key === cartStorageKey) {
            cartItems = loadCart();
            updateCartBadge();
            renderCheckout();
        }
    });

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

    const checkoutItems = document.getElementById("checkout-items");
    if (checkoutItems) {
        checkoutItems.addEventListener("click", (event) => {
            const actionButton = event.target.closest("button[data-cart-action]");
            if (!actionButton) return;

            const { cartAction, cartId } = actionButton.dataset;
            const selectedItem = cartItems.find((item) => item.id === cartId);
            if (!selectedItem) return;

            if (cartAction === "remove") {
                saveCart(cartItems.filter((item) => item.id !== cartId));
                return;
            }

            if (cartAction === "increase") {
                saveCart(cartItems.map((item) => item.id === cartId
                    ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
                    : item));
            } else if (cartAction === "decrease" && selectedItem.quantity > 1) {
                saveCart(cartItems.map((item) => item.id === cartId
                    ? { ...item, quantity: item.quantity - 1 }
                    : item));
            }
        });
    }

    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", (event) => {
            event.preventDefault();
            if (cartItems.length === 0) return;

            const orderNumber = `TH-${String(Date.now()).slice(-6)}`;
            const orderNumberDisplay = document.getElementById("order-number");
            const successMessage = document.getElementById("order-success");

            if (!saveCart([])) return;
            checkoutForm.reset();
            if (orderNumberDisplay) orderNumberDisplay.textContent = orderNumber;
            if (successMessage) {
                successMessage.hidden = false;
                successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            showToast(`Pesanan ${orderNumber} berhasil dicatat.`);
        });
    }

    document.querySelectorAll(".favorite-button").forEach((button) => {
        button.addEventListener("click", () => {
            const isFavorite = button.getAttribute("aria-pressed") !== "true";
            const product = button.closest(".product-card, #detail-product");
            const dishTitle = product.querySelector("h3")?.textContent.trim() ||
                product.dataset.productName || "Menu pilihan";
            button.setAttribute("aria-pressed", String(isFavorite));
            button.setAttribute("aria-label", `${isFavorite ? "Hapus" : "Tambahkan"} ${dishTitle} ${isFavorite ? "dari" : "ke"} favorit`);
            button.innerHTML = `<i class="fa-${isFavorite ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>`;
            showToast(isFavorite ? `${dishTitle} ditambahkan ke favorit.` : `${dishTitle} dihapus dari favorit.`);
        });
    });

    document.querySelectorAll(".add-button").forEach((button) => {
        button.addEventListener("click", () => {
            const card = button.closest(".product-card");
            const title = card.querySelector("h3").textContent.trim();
            const priceText = card.querySelector(".product-bottom strong").textContent;
            const price = Number(card.dataset.price || priceText.replace(/\D/g, ""));
            const image = card.querySelector(".product-image-wrap img");

            if (!Number.isFinite(price) || price <= 0) {
                showToast(`Harga ${title} tidak tersedia.`);
                return;
            }

            const productId = title.toLocaleLowerCase("id")
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const wasAdded = addCartItem({
                id: productId,
                name: title,
                price,
                quantity: 1,
                image: image ? image.src : "",
                options: {}
            });

            if (wasAdded) showToast(`${title} ditambahkan ke keranjang.`);
        });
    });

    if (cartButton) {
        cartButton.addEventListener("click", () => {
            if (window.location.pathname.toLocaleLowerCase("id").endsWith("/checkout.html")) {
                document.getElementById("checkout-items")?.scrollIntoView({ behavior: "smooth" });
                return;
            }
            window.location.href = "checkout.html";
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
                const selectedAddons = Array.from(addonCheckboxes)
                    .filter((checkbox) => checkbox.checked);
                const addonNames = selectedAddons.map((checkbox) => checkbox.value);
                const addonPrice = selectedAddons.reduce((total, checkbox) =>
                    total + Number(checkbox.dataset.addonPrice || 0), 0);
                const noteInput = document.getElementById("order-notes");
                const note = noteInput ? noteInput.value.trim() : "";
                const options = {
                    spice: selectedSpice,
                    addons: addonNames,
                    note
                };
                const productId = productName.toLocaleLowerCase("id")
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                const wasAdded = addCartItem({
                    id: `${productId}|${JSON.stringify(options)}`,
                    name: productName,
                    price: basePrice + addonPrice,
                    quantity,
                    image: mainImage ? mainImage.src : "",
                    options
                });

                if (wasAdded) showToast(`${quantity}x ${productName} (${selectedSpice}) berhasil masuk keranjang!`);
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

    // =========================================================================
    // Logika Accordion FAQ pada Halaman Tentang Kami (about.html)
    // =========================================================================
    const faqQuestions = document.querySelectorAll(".faq-question");

    faqQuestions.forEach((questionBtn) => {
        questionBtn.addEventListener("click", () => {
            const isExpanded = questionBtn.getAttribute("aria-expanded") === "true";
            const answerPanel = questionBtn.nextElementSibling;

            // Tutup FAQ lain agar tetap rapi
            faqQuestions.forEach((otherBtn) => {
                otherBtn.setAttribute("aria-expanded", "false");
                if (otherBtn.nextElementSibling) {
                    otherBtn.nextElementSibling.hidden = true;
                }
            });

            // Buka/tutup FAQ yang diklik
            questionBtn.setAttribute("aria-expanded", String(!isExpanded));
            if (answerPanel) {
                answerPanel.hidden = isExpanded;
            }
        });
    });

    // =========================================================================
    // Logika Halaman Ulasan Pelanggan (ulasan.html)
    // =========================================================================
    const reviewFilterButtons = document.querySelectorAll("[data-review-filter]");
    const reviewsGrid = document.getElementById("reviews-grid");
    const reviewVisibleCount = document.getElementById("review-visible-count");
    const starPickButtons = document.querySelectorAll(".star-pick-btn");
    const selectedRatingInput = document.getElementById("selected-rating");
    const submitReviewForm = document.getElementById("submit-review-form");

    // Filter Kartu Ulasan
    const filterReviews = (filterValue) => {
        if (!reviewsGrid) return;
        const cards = reviewsGrid.querySelectorAll(".wall-review-card");
        let count = 0;

        cards.forEach((card) => {
            const tags = card.dataset.tags || "";
            const isMatch = filterValue === "all" || tags.includes(filterValue);
            card.hidden = !isMatch;
            if (isMatch) count += 1;
        });

        if (reviewVisibleCount) {
            reviewVisibleCount.textContent = String(count);
        }
    };

    reviewFilterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const filterValue = btn.dataset.reviewFilter;
            reviewFilterButtons.forEach((b) => {
                const isActive = b === btn;
                b.classList.toggle("active", isActive);
                b.setAttribute("aria-pressed", String(isActive));
            });
            filterReviews(filterValue);
        });
    });

    // Tombol "Terbantu" (Helpful Vote)
    if (reviewsGrid) {
        reviewsGrid.addEventListener("click", (event) => {
            const helpfulBtn = event.target.closest(".helpful-btn");
            if (!helpfulBtn) return;

            const isPressed = helpfulBtn.getAttribute("aria-pressed") === "true";
            const countEl = helpfulBtn.querySelector(".helpful-count");
            let currentCount = Number(countEl.textContent || 0);

            helpfulBtn.setAttribute("aria-pressed", String(!isPressed));
            currentCount = isPressed ? currentCount - 1 : currentCount + 1;
            countEl.textContent = String(currentCount);
        });
    }

    // Pemilih Bintang Interaktif pada Form
    starPickButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const ratingValue = Number(btn.dataset.value || 5);
            if (selectedRatingInput) selectedRatingInput.value = String(ratingValue);

            starPickButtons.forEach((star) => {
                const starVal = Number(star.dataset.value);
                star.classList.toggle("active", starVal <= ratingValue);
            });
        });
    });

    // Submit Ulasan Baru & Tambahkan Langsung ke Grid
    if (submitReviewForm && reviewsGrid) {
        submitReviewForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const name = document.getElementById("reviewer-name").value.trim();
            const menuSelect = document.getElementById("reviewed-menu");
            const menuName = menuSelect.value;
            const menuCat = menuSelect.options[menuSelect.selectedIndex].dataset.cat || "indonesia";
            const rating = Number(selectedRatingInput.value || 5);
            const comment = document.getElementById("review-comment").value.trim();

            const newCard = document.createElement("article");
            newCard.className = "wall-review-card";
            newCard.dataset.tags = `${rating === 5 ? "5star " : ""}${menuCat}`;

            newCard.innerHTML = `
                <div class="wall-review-header">
                    <div class="review-user">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" alt="${name}">
                        <div>
                            <strong>${name} <span class="verified-check" title="Pembeli Terverifikasi"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></span></strong>
                            <small>Baru saja</small>
                        </div>
                    </div>
                    <span class="product-rating"><i class="fa-solid fa-star" aria-hidden="true"></i> ${rating}.0</span>
                </div>
                <span class="reviewed-dish-tag"><i class="fa-solid fa-utensils" aria-hidden="true"></i> ${menuName}</span>
                <p class="wall-review-text">“${comment}”</p>
                <div class="wall-review-footer">
                    <button class="helpful-btn" type="button" aria-pressed="false">
                        <i class="fa-regular fa-thumbs-up" aria-hidden="true"></i>
                        <span>Terbantu (<strong class="helpful-count">0</strong>)</span>
                    </button>
                </div>
            `;

            reviewsGrid.prepend(newCard);
            submitReviewForm.reset();
            starPickButtons.forEach((star) => star.classList.add("active"));
            if (selectedRatingInput) selectedRatingInput.value = "5";

            // Reset filter ke "Semua Ulasan" agar ulasan baru langsung terlihat
            reviewFilterButtons.forEach((b) => {
                const isAll = b.dataset.reviewFilter === "all";
                b.classList.toggle("active", isAll);
                b.setAttribute("aria-pressed", String(isAll));
            });
            filterReviews("all");

            showToast("Terima kasih! Ulasanmu berhasil ditampilkan.");
            document.getElementById("daftar-ulasan").scrollIntoView({ behavior: "smooth" });
        });
    }
});