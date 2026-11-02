document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const themeButtons = document.querySelectorAll(".theme-toggle");
    const mobileMenuButton = document.querySelector(".mobile-menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("dish-search");
    const categoryButtons = document.querySelectorAll(".category-chip");
    const productCards = document.querySelectorAll(".product-card");
    const emptyState = document.getElementById("empty-state");
    const cartButton = document.querySelector(".cart-button");
    const cartCount = document.querySelector(".cart-count");
    const toast = document.getElementById("toast-message");
    let activeCategory = "all";
    let itemCount = 0;
    let toastTimer;

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
        toast.textContent = message;
        toast.classList.add("visible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
    };

    const applyFilters = () => {
        const query = searchInput.value.trim().toLocaleLowerCase("id");
        let visibleCount = 0;

        productCards.forEach((card) => {
            const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
            const matchesQuery = !query || card.dataset.name.includes(query) || card.textContent.toLocaleLowerCase("id").includes(query);
            const isVisible = matchesCategory && matchesQuery;
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        emptyState.hidden = visibleCount > 0;
    };

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        applyFilters();
        document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
    });

    searchInput.addEventListener("input", applyFilters);

    document.querySelectorAll("[data-search]").forEach((button) => {
        button.addEventListener("click", () => {
            searchInput.value = button.dataset.search;
            activeCategory = "all";
            categoryButtons.forEach((categoryButton) => {
                const isActive = categoryButton.dataset.category === "all";
                categoryButton.classList.toggle("active", isActive);
                categoryButton.setAttribute("aria-pressed", String(isActive));
            });
            applyFilters();
            document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
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

    document.querySelectorAll(".favorite-button").forEach((button) => {
        button.addEventListener("click", () => {
            const isFavorite = button.getAttribute("aria-pressed") !== "true";
            button.setAttribute("aria-pressed", String(isFavorite));
            button.setAttribute("aria-label", `${isFavorite ? "Hapus" : "Tambahkan"} ${button.closest(".product-card").querySelector("h3").textContent} ${isFavorite ? "dari" : "ke"} favorit`);
            button.innerHTML = `<i class="fa-${isFavorite ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>`;
            showToast(isFavorite ? "Ditambahkan ke menu favorit." : "Dihapus dari menu favorit.");
        });
    });

    document.querySelectorAll(".add-button").forEach((button) => {
        button.addEventListener("click", () => {
            itemCount += 1;
            cartCount.textContent = String(itemCount);
            cartButton.setAttribute("aria-label", `Keranjang, ${itemCount} item`);
            showToast(`${button.closest(".product-card").querySelector("h3").textContent} ditambahkan ke keranjang.`);
        });
    });

    cartButton.addEventListener("click", () => {
        showToast(itemCount ? `Ada ${itemCount} item di keranjangmu.` : "Keranjangmu masih kosong. Yuk, pilih menu favorit!");
    });

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

    document.getElementById("newsletter-form").addEventListener("submit", (event) => {
        event.preventDefault();
        event.currentTarget.reset();
        showToast("Terima kasih! Kamu akan menerima kabar seru dari TasteHub.");
    });
});
