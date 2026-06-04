document.addEventListener("DOMContentLoaded", () => {
    const MOBILE_BREAKPOINT = 992;

    // Navbar Scroll Effect
    const header = document.querySelector(".header");
    if (header) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        });
    }

    // Mobile Menu Toggle
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");
    const navActions = document.getElementById("nav-actions");

    const syncMobileMenuActions = () => {
        if (!navLinks || !navActions) return;

        const actionMarkup = navActions.innerHTML.trim();
        let mobileActions = navLinks.querySelector(".mobile-menu-actions");

        if (!actionMarkup) {
            if (mobileActions) mobileActions.remove();
            return;
        }

        if (!mobileActions) {
            mobileActions = document.createElement("li");
            mobileActions.className = "mobile-menu-actions";
            navLinks.appendChild(mobileActions);
        }

        mobileActions.innerHTML = actionMarkup;
    };

    const closeMenu = () => {
        if (!navToggle || !navLinks) return;
        navLinks.classList.remove("open");
        navToggle.classList.remove("active");
        document.body.classList.remove("menu-open");
    };

    const toggleMenu = () => {
        if (!navToggle || !navLinks) return;
        const isOpen = navLinks.classList.toggle("open");
        navToggle.classList.toggle("active", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
    };

    if (navToggle && navLinks) {
        navToggle.addEventListener("click", toggleMenu);
    }

    // Keep mobile actions synced with auth-rendered nav actions
    if (navLinks && navActions) {
        syncMobileMenuActions();
        setTimeout(syncMobileMenuActions, 0);

        const actionsObserver = new MutationObserver(syncMobileMenuActions);
        actionsObserver.observe(navActions, { childList: true, subtree: true });
    }

    // Close menu when any mobile drawer action is clicked
    if (navLinks) {
        navLinks.addEventListener("click", (event) => {
            if (!event.target.closest("a, button")) return;
            closeMenu();
        });
    } else {
        document.querySelectorAll(".header .nav-link").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });
    }

    document.querySelectorAll("#nav-actions a, #nav-actions button").forEach((item) => {
        item.addEventListener("click", closeMenu);
    });

    // Close menu with Escape key
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    // Reset mobile menu if resized to desktop width
    window.addEventListener("resize", () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            closeMenu();
        }
    });

    // Live Ticker Animation Logic
    const tickerItems = [
        "Physics Question #992 just solved!",
        "Calculus Expert online now.",
        "Chemistry assignment completed.",
        "Economics solution delivered.",
        "Programming help active."
    ];
    let tickerIndex = 0;
    const tickerEl = document.querySelector(".ticker-item");
    if (tickerEl) {
        setInterval(() => {
            tickerIndex = (tickerIndex + 1) % tickerItems.length;
            tickerEl.style.opacity = 0;
            setTimeout(() => {
                tickerEl.textContent = tickerItems[tickerIndex];
                tickerEl.style.opacity = 1;
            }, 500);
        }, 3000);
    }

    // Real stats are handled by loadStats() in index.html

    // Reveal on Scroll (Intersection Observer)
    const reveals = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach((reveal) => revealObserver.observe(reveal));

    // Smooth Scroll for Navigation
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const href = this.getAttribute("href") || "";
            const targetId = href.slice(1);
            if (!targetId) return;

            const target = document.getElementById(targetId);
            if (!target) return;

            e.preventDefault();
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        });
    });
});
