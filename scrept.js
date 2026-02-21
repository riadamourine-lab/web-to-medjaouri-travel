const whatsappNumber = "213799544182";

const root = document.documentElement;
const brand = document.querySelector(".brand");
const brandLogo = document.querySelector(".brand-logo");
const heroBrand = document.querySelector(".hero-brand");
const heroLogo = document.querySelector(".hero-logo");
const footerBrand = document.querySelector(".footer-brand");
const footerLogo = document.querySelector(".footer-logo");
const themeToggle = document.querySelector(".theme-toggle");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const yearNode = document.getElementById("current-year");
const leadForm = document.getElementById("lead-form");
const formStatus = document.getElementById("form-status");
const themeMeta = document.querySelector("meta[name='theme-color']");
const themeMedia = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const popupElement = document.getElementById("promo-popup");
const popupCloseTriggers = document.querySelectorAll("[data-popup-close]");
const popupBookingLinks = document.querySelectorAll("[data-popup-booking]");
const bookingCtaLinks = document.querySelectorAll("[data-booking-cta]");

const themeStorageKey = "mt-theme";
const promoStorageKey = "mt-promo-dismissed-at";
const promoOpenDelayMs = 2400;
const promoCooldownMs = 18 * 60 * 60 * 1000;

function trackEvent(eventName, params = {}) {
  if (typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", eventName, params);
}

function getLinkLocation(link) {
  if (!(link instanceof Element)) {
    return "unknown";
  }
  const host = link.closest("section, header, footer, main, aside");
  if (host && host.id) {
    return host.id;
  }
  return host ? host.tagName.toLowerCase() : "unknown";
}

function bindWhatsappClickTracking() {
  const links = document.querySelectorAll("a[href*='wa.me/']");
  links.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement) || link.dataset.trackBound === "1") {
      return;
    }
    link.dataset.trackBound = "1";
    link.addEventListener("click", () => {
      const href = link.getAttribute("href") || "";
      const numberMatch = href.match(/wa\.me\/(\d+)/);
      const waNumber = numberMatch ? numberMatch[1] : whatsappNumber;
      trackEvent("whatsapp_click", {
        event_category: "conversion",
        event_label: waNumber,
        link_location: getLinkLocation(link),
        link_text: (link.textContent || "").trim().slice(0, 48)
      });
    });
  });
}

function bindBookingCtaTracking() {
  bookingCtaLinks.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement) || link.dataset.bookingTrackBound === "1") {
      return;
    }
    link.dataset.bookingTrackBound = "1";
    link.addEventListener("click", () => {
      const ctaId = link.getAttribute("data-booking-cta") || "unknown";
      trackEvent("booking_cta_click", {
        event_category: "conversion",
        cta_id: ctaId,
        link_location: getLinkLocation(link)
      });
    });
  });
}

const themeColor = {
  light: "#0d5c63",
  dark: "#0f171e"
};

function revealLogo(host) {
  if (host) {
    host.classList.add("has-logo");
  }
}

function initLogo(host, image) {
  if (!host || !image) {
    return;
  }

  if (image.complete && image.naturalWidth > 0) {
    revealLogo(host);
    return;
  }

  image.addEventListener("load", () => revealLogo(host), { once: true });
}

function getSystemTheme() {
  return themeMedia && themeMedia.matches ? "dark" : "light";
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem(themeStorageKey);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }
  return root.getAttribute("data-theme") || getSystemTheme();
}

function setTheme(theme, persistPreference = true) {
  root.setAttribute("data-theme", theme);

  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن";
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  }

  if (themeMeta) {
    themeMeta.setAttribute("content", themeColor[theme] || themeColor.light);
  }

  if (persistPreference) {
    localStorage.setItem(themeStorageKey, theme);
  }
}

function setPromoOpenState(isOpen) {
  if (!popupElement) {
    return;
  }
  popupElement.classList.toggle("is-open", isOpen);
  popupElement.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("has-popup-open", isOpen);
}

function canShowPromoPopup() {
  if (!popupElement) {
    return false;
  }
  const lastDismissedAt = Number(localStorage.getItem(promoStorageKey) || "0");
  if (!Number.isFinite(lastDismissedAt) || lastDismissedAt <= 0) {
    return true;
  }
  return Date.now() - lastDismissedAt > promoCooldownMs;
}

function closePromoPopup(reason) {
  if (!popupElement || !popupElement.classList.contains("is-open")) {
    return;
  }
  setPromoOpenState(false);
  localStorage.setItem(promoStorageKey, String(Date.now()));
  trackEvent("promo_popup_close", {
    event_category: "engagement",
    close_reason: reason || "dismiss"
  });
}

function openPromoPopup(source) {
  if (!popupElement) {
    return;
  }
  setPromoOpenState(true);
  trackEvent("promo_popup_open", {
    event_category: "engagement",
    open_source: source || "timer"
  });
}

initLogo(brand, brandLogo);
initLogo(heroBrand, heroLogo);
initLogo(footerBrand, footerLogo);
setTheme(getInitialTheme(), false);
bindWhatsappClickTracking();
bindBookingCtaTracking();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(nextTheme, true);
  });
}

if (themeMedia && !localStorage.getItem(themeStorageKey)) {
  themeMedia.addEventListener("change", (event) => {
    setTheme(event.matches ? "dark" : "light", false);
  });
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("a")) {
      return;
    }
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (popupElement) {
  popupCloseTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => closePromoPopup("close_click"));
  });

  popupBookingLinks.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }
    link.addEventListener("click", () => {
      const channel = link.getAttribute("data-popup-booking") || "unknown";
      trackEvent("promo_popup_booking_click", {
        event_category: "conversion",
        channel
      });
      closePromoPopup(`booking_${channel}`);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePromoPopup("escape_key");
    }
  });

  if (canShowPromoPopup()) {
    window.setTimeout(() => openPromoPopup("timer"), promoOpenDelayMs);
  }
}

if (leadForm && formStatus) {
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(leadForm);
    const fullName = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const destination = String(formData.get("destination") || "غير محددة").trim();
    const dateRaw = String(formData.get("date") || "").trim();
    const budget = String(formData.get("budget") || "غير محددة").trim();
    const details = String(formData.get("message") || "لا توجد ملاحظات إضافية").trim();

    const travelDate = dateRaw ? new Date(dateRaw).toLocaleDateString("fr-FR") : "غير محدد";
    const messageLines = [
      "سلام فريق Medjaouri Travel،",
      "عندي طلب رحلة جديدة:",
      `الاسم: ${fullName}`,
      `الهاتف: ${phone}`,
      `الوجهة: ${destination}`,
      `تاريخ السفر: ${travelDate}`,
      `الميزانية: ${budget}`,
      `تفاصيل: ${details}`
    ];
    const messageBody = messageLines.join("\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageBody)}`;

    trackEvent("lead_form_submit", {
      event_category: "conversion",
      event_label: "whatsapp_form",
      destination: destination || "unspecified",
      has_date: Boolean(dateRaw),
      has_budget: Boolean(String(formData.get("budget") || "").trim()),
      has_details: Boolean(String(formData.get("message") || "").trim())
    });

    const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    if (popup) {
      trackEvent("whatsapp_open_success", {
        event_category: "conversion",
        method: "form_submit"
      });
      formStatus.textContent = "تم فتح واتساب. راجع الرسالة ثم أرسلها مباشرة.";
      leadForm.reset();
      return;
    }

    formStatus.textContent = "تم تجهيز الرسالة ولكن المتصفح منع فتح واتساب تلقائيًا.";
    trackEvent("whatsapp_open_blocked", {
      event_category: "conversion",
      method: "form_submit"
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(messageBody).catch(() => null);
    }
  });
}

const travelCards = document.querySelectorAll(".travel-card");
const cardFaceImages = document.querySelectorAll(".travel-card-face .travel-card-image");

cardFaceImages.forEach((image) => {
  const face = image.closest(".travel-card-face");
  if (!face) {
    return;
  }

  function markAsLoaded() {
    if (image.naturalWidth > 0) {
      face.classList.add("has-image");
      face.classList.remove("is-missing");
    }
  }

  function markAsMissing() {
    face.classList.remove("has-image");
    face.classList.add("is-missing");
  }

  if (image.complete) {
    if (image.naturalWidth > 0) {
      markAsLoaded();
    } else {
      markAsMissing();
    }
    return;
  }

  image.addEventListener("load", markAsLoaded, { once: true });
  image.addEventListener("error", markAsMissing, { once: true });
});

travelCards.forEach((card) => {
  const maxTiltX = 11;
  const maxTiltY = 13;

  function setTilt(clientX, clientY) {
    const rect = card.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;
    const tiltY = (relativeX - 0.5) * (maxTiltY * 2);
    const tiltX = (0.5 - relativeY) * (maxTiltX * 2);

    card.style.setProperty("--rx", `${tiltX.toFixed(2)}deg`);
    card.style.setProperty("--ry", `${tiltY.toFixed(2)}deg`);
  }

  function resetTilt() {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  }

  function toggleFlip() {
    card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(card.classList.contains("is-flipped")));
  }

  card.addEventListener("pointermove", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") {
      return;
    }
    setTilt(event.clientX, event.clientY);
  });

  card.addEventListener("pointerleave", resetTilt);
  card.addEventListener("pointercancel", resetTilt);
  card.addEventListener("click", toggleFlip);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    toggleFlip();
  });
});

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealElements.length > 0) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealElements.forEach((el) => observer.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("is-visible"));
}
