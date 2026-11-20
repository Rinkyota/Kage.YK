"use strict";

(function () {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const menuToggle = document.getElementById("menuToggle");
  const menuClose = document.getElementById("menuClose");
  const toast = document.getElementById("toast");
  let toastTimer;

  function openMenu() {
    sidebar.classList.add("open");
    overlay.classList.add("show");
    menuToggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  function showNotice(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
  }

  function showPage(id) {
    const target = document.getElementById("page-" + id);
    if (!target) return;

    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle("active", button.dataset.page === id);
    });

    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", "#" + id);
  }

  menuToggle.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  document.addEventListener("click", event => {
    const navButton = event.target.closest("[data-page]");
    const pageLink = event.target.closest("[data-page-link]");
    const noticeButton = event.target.closest("[data-notice]");

    if (navButton) showPage(navButton.dataset.page);
    if (pageLink) {
      event.preventDefault();
      showPage(pageLink.dataset.pageLink);
    }
    if (noticeButton) showNotice(noticeButton.dataset.notice);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  // Rozet kategorileri
  document.querySelectorAll("[data-badge-filter]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-badge-filter]").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.badgeFilter;
      document.querySelectorAll(".badge-card").forEach(card => {
        card.hidden = filter !== "all" && card.dataset.badge !== filter;
      });
    });
  });

  // Ulaşım arama formu: gerçek API olmadan sahte sonuç üretmez.
  document.getElementById("flightSearch").addEventListener("click", () => {
    const from = document.getElementById("flightFrom").value.trim();
    const to = document.getElementById("flightTo").value.trim();
    const date = document.getElementById("flightDate").value;
    if (!from || !to || !date) {
      showNotice("Lütfen kalkış, varış ve gidiş tarihini gir.");
      return;
    }
    document.getElementById("flightStatus").textContent =
      "Arama bilgilerin hazır. Gerçek uçuş sonuçları için sağlayıcı API bağlantısı henüz eklenmedi.";
    showNotice("Arama formu doğrulandı. Canlı sonuçlar API bağlantısından sonra gelecek.");
  });

  // AI alanı: bağlantı yokken mesaj gönderilmiş gibi davranmaz.
  document.getElementById("aiSend").addEventListener("click", () => {
    const prompt = document.getElementById("aiPrompt").value.trim();
    if (!prompt) {
      showNotice("Önce ne üretmek istediğini yaz.");
      return;
    }
    showNotice("İsteğin hazır. Yapay zekâ yanıtı için sunucu ve AI API bağlantısı gerekiyor.");
  });

  // Dil tercihi şimdilik kaydedilir; tam çeviri sözlüğü sonraki aşamada bağlanacak.
  const languageSelect = document.getElementById("languageSelect");
  const languageButton = document.getElementById("languageButton");
  const savedLanguage = localStorage.getItem("kageLanguage") || "tr";
  languageSelect.value = savedLanguage;
  languageButton.textContent = savedLanguage.toUpperCase();

  function setLanguage(language) {
    localStorage.setItem("kageLanguage", language);
    languageButton.textContent = language.toUpperCase();
    languageSelect.value = language;
    showNotice("Dil tercihin kaydedildi. Tüm arayüz çevirileri dil sistemi aşamasında bağlanacak.");
  }
  languageSelect.addEventListener("change", event => setLanguage(event.target.value));
  languageButton.addEventListener("click", () => {
    showPage("settings");
    languageSelect.focus();
  });

  // Hareket azaltma tercihi
  const reduceMotion = document.getElementById("reduceMotion");
  reduceMotion.checked = localStorage.getItem("kageReduceMotion") === "true";
  document.body.classList.toggle("reduce-motion", reduceMotion.checked);
  reduceMotion.addEventListener("change", () => {
    localStorage.setItem("kageReduceMotion", String(reduceMotion.checked));
    document.body.classList.toggle("reduce-motion", reduceMotion.checked);
  });

  // Sayfa içi arama: mevcut bölümleri bulur, veri olmayan ürün/proje uydurmaz.
  const globalSearch = document.getElementById("globalSearch");
  globalSearch.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    const query = globalSearch.value.trim().toLocaleLowerCase("tr");
    if (!query) return;
    const pages = [
      ["home", "ana sayfa"],
      ["shops", "kage shops mağaza ürün"],
      ["projects", "proje ortak yatırımcı"],
      ["ai", "yapay zeka ai kod üret"],
      ["badges", "rozet başarı premium"],
      ["analytics", "analiz istatistik"],
      ["premium", "premium gif"],
      ["points", "kage points puan"],
      ["travel", "ulaşım uçak bilet"],
      ["markets", "borsa hisse kripto"],
      ["profile", "profil hesap"],
      ["settings", "ayarlar dil"]
    ];
    const match = pages.find(item => item[1].includes(query) || query.includes(item[1].split(" ")[0]));
    if (match) showPage(match[0]);
    else showNotice("Bu aramayla eşleşen bir bölüm bulunamadı.");
  });

  // Kategori ve piyasa sekmeleri görsel seçim olarak çalışır; henüz veri filtrelemez.
  document.querySelectorAll(".category-chip").forEach(button => {
    if (button.dataset.category) {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-category]").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
      });
    }
  });

  document.querySelectorAll("[data-market-tab]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-market-tab]").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      showNotice("Piyasa kategorisi seçildi. Gerçek varlık listesi veri API'si bağlandığında yüklenecek.");
    });
  });

  const initialPage = location.hash.replace("#", "");
  if (initialPage && document.getElementById("page-" + initialPage)) showPage(initialPage);
})();
      
