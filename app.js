/* =====================================
   KAGE.YK — APPLICATION CORE
===================================== */

(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const STORAGE = {
    profile: "kage_profile_v1",
    posts: "kage_global_posts_v1",
    points: "kage_points_v1",
    badges: "kage_badges_v1",
    games: "kagePublishedGames",
    settings: "kage_settings_v1",
    activity: "kage_activity_v1"
  };

  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      showToast("Veriler kaydedilemedi.");
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  const defaultProfile = {
    name: "Gezgin",
    bio: "KAGE.YK üyesi",
    cover: "default",
    coverUrl: "",
    frame: "default"
  };

  let profile = load(STORAGE.profile, defaultProfile);
  let posts = load(STORAGE.posts, []);
  let points = load(STORAGE.points, 0);
  let badges = load(STORAGE.badges, []);
  let settings = load(STORAGE.settings, {
    language: "tr",
    reduceMotion: false
  });
  let activity = load(STORAGE.activity, []);

  let currentChannel = "general";
  let currentBadgeFilter = "all";
  let currentMarketTab = "all";

  function addActivity(message) {
    activity.unshift({
      message,
      date: new Date().toLocaleString("tr-TR")
    });

    activity = activity.slice(0, 50);
    save(STORAGE.activity, activity);
    renderActivity();
  }

  /* =====================================
     PAGE NAVIGATION
  ===================================== */

  function openPage(pageName) {
    const target = $("#page-" + pageName);

    if (!target) {
      showToast("Bu bölüm henüz hazır değil.");
      return;
    }

    $$(".page").forEach(page => {
      page.classList.remove("active");
    });

    target.classList.add("active");

    $$(".nav-item").forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.page === pageName
      );
    });

    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pageName === "profile") renderProfile();
    if (pageName === "badges") renderBadges();
    if (pageName === "analytics") renderAnalytics();
    if (pageName === "points") renderPoints();
    if (pageName === "games") renderGames();
  }

  $$(".nav-item[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      openPage(button.dataset.page);
    });
  });

  $$("[data-page-link]").forEach(element => {
    element.addEventListener("click", event => {
      event.preventDefault();
      openPage(element.dataset.pageLink);
    });
  });

  /* =====================================
     MOBILE MENU
  ===================================== */

  function openMenu() {
    $("#sidebar")?.classList.add("open");
    $("#overlay")?.classList.add("active");
  }

  function closeMenu() {
    $("#sidebar")?.classList.remove("open");
    $("#overlay")?.classList.remove("active");
  }

  $("#menuToggle")?.addEventListener("click", openMenu);
  $("#menuClose")?.addEventListener("click", closeMenu);
  $("#overlay")?.addEventListener("click", closeMenu);

  /* =====================================
     PROFILE DATA HELPERS
  ===================================== */

  function getProfileName() {
    return profile.name || "Gezgin";
  }

  function getInitials(name) {
    return String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0] || "")
      .join("")
      .toUpperCase() || "YK";
  }

  function updateCounters() {
    const values = {
      "#topbarPoints": points,
      "#homePoints": points + " KP",
      "#homeBadgeCount": badges.length,
      "#badgePoints": points + " KP",
      "#pointsBalance": points,
      "#statPoints": points
    };

    Object.entries(values).forEach(([selector, value]) => {
      const element = $(selector);
      if (element) element.textContent = value;
    });
      }
    /* =====================================
     PROFILE SYSTEM
  ===================================== */

  function renderProfile() {
    const name = getProfileName();

    const nameDisplay = $("#profileNameDisplay");
    const bioDisplay = $("#profileBioDisplay");
    const homeName = $("#homeProfileName");
    const avatar = $("#profileAvatar");
    const nameInput = $("#profileName");
    const bioInput = $("#profileBio");

    if (nameDisplay) nameDisplay.textContent = name;
    if (bioDisplay) bioDisplay.textContent = profile.bio || "";
    if (homeName) homeName.textContent = name;

    if (nameInput) nameInput.value = profile.name || "";
    if (bioInput) bioInput.value = profile.bio || "";

    if (avatar) {
      avatar.textContent = getInitials(name);
    }

    const cover = $("#profileCover");

    if (cover) {
      cover.classList.remove(
        "cover-red",
        "cover-dark",
        "cover-premium"
      );

      if (profile.cover && profile.cover !== "default") {
        cover.classList.add("cover-" + profile.cover);
      }

      if (profile.coverUrl) {
        cover.style.backgroundImage =
          `url("${profile.coverUrl.replace(/["\\]/g, "")}")`;
      } else {
        cover.style.backgroundImage = "";
      }
    }

    const frame = $("#avatarFrame");

    if (frame) {
      frame.classList.remove(
        "frame-red",
        "frame-gold",
        "frame-premium"
      );

      if (profile.frame && profile.frame !== "default") {
        frame.classList.add("frame-" + profile.frame);
      }
    }

    const userPosts = posts.filter(
      post => post.author === getProfileName()
    );

    const receivedLikes = userPosts.reduce(
      (total, post) => total + (post.likes || 0), 0
    );

    const profileCounters = {
      "#profilePostCount": userPosts.length,
      "#profileLikeCount": receivedLikes,
      "#profilePointsDisplay": points + " KP",
      "#homeGlobalPosts": posts.length
    };

    Object.entries(profileCounters).forEach(([selector, value]) => {
      const element = $(selector);
      if (element) element.textContent = value;
    });

    renderProfileBadges();
  }

  $("#saveProfile")?.addEventListener("click", () => {
    const name = $("#profileName")?.value.trim();
    const bio = $("#profileBio")?.value.trim();

    if (!name) {
      showToast("Kullanıcı adı boş bırakılamaz.");
      return;
    }

    if (name.length > 24) {
      showToast("Kullanıcı adı en fazla 24 karakter olabilir.");
      return;
    }

    profile.name = name;
    profile.bio = bio || "";

    save(STORAGE.profile, profile);

    renderProfile();
    addActivity("Profil bilgileri güncellendi.");
    showToast("Profil kaydedildi.");
  });

  /* COVER SELECTION */

  $$("[data-cover]").forEach(button => {
    button.addEventListener("click", () => {
      const cover = button.dataset.cover;

      if (!["default", "red", "dark", "premium"].includes(cover)) {
        return;
      }

      profile.cover = cover;
      profile.coverUrl = "";

      save(STORAGE.profile, profile);
      renderProfile();

      showToast("Profil kapağı güncellendi.");
    });
  });

  $("#applyCoverUrl")?.addEventListener("click", () => {
    const url = $("#coverUrl")?.value.trim();

    if (!url) {
      showToast("Önce bir görsel bağlantısı gir.");
      return;
    }

    if (!/^https:\/\/.+/i.test(url)) {
      showToast("Güvenli bir HTTPS bağlantısı kullan.");
      return;
    }

    profile.coverUrl = url;
    save(STORAGE.profile, profile);
    renderProfile();

    showToast("Kapak görseli uygulandı.");
  });

  /* AVATAR FRAME SELECTION */

  $$("[data-frame]").forEach(button => {
    button.addEventListener("click", () => {
      const frame = button.dataset.frame;

      if (!["default", "red", "gold", "premium"].includes(frame)) {
        return;
      }

      profile.frame = frame;
      save(STORAGE.profile, profile);
      renderProfile();

      showToast("Profil çerçevesi güncellendi.");
    });
  });

  function renderProfileBadges() {
    const container = $("#profileBadges");
    if (!container) return;

    if (badges.length === 0) {
      container.innerHTML =
        '<p class="empty-state">Henüz kazanılmış rozet yok.</p>';
      return;
    }

    container.innerHTML = badges.map(id => {
      const badge = BADGE_CATALOG.find(item => item.id === id);

      if (!badge) return "";

      return `
        <div class="badge-plaque">
          <strong>${escapeHTML(badge.name)}</strong>
          <span>${escapeHTML(badge.description)}</span>
        </div>
      `;
    }).join("");
  }

  /* =====================================
     GLOBAL COMMUNITY
  ===================================== */

  function createPost(text, channel) {
    return {
      id: Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8),
      author: getProfileName(),
      initials: getInitials(getProfileName()),
      content: text,
      channel,
      date: new Date().toISOString(),
      likes: 0,
      liked: false,
      comments: []
    };
  }

  function renderPosts() {
    const container = $("#globalPosts");
    if (!container) return;

    const filtered = posts.filter(post => {
      return currentChannel === "all" ||
        post.channel === currentChannel;
    });

    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Henüz gönderi yok.</h3>
          <p>İlk paylaşımı sen yap.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(post => {
      const date = new Date(post.date);

      return `
        <article class="global-post" data-post-id="${escapeHTML(post.id)}">
          <div class="post-head">
            <div class="post-avatar">
              ${escapeHTML(post.initials || "YK")}
            </div>

            <div class="post-author">
              <strong>${escapeHTML(post.author)}</strong>
              <span class="post-time">
                ${Number.isNaN(date.getTime())
                  ? ""
                  : escapeHTML(date.toLocaleString("tr-TR"))}
              </span>
            </div>

            <span class="post-channel">
              ${escapeHTML(post.channel)}
            </span>
          </div>

          <div class="post-body">
            ${escapeHTML(post.content).replace(/\n/g, "<br>")}
          </div>

          <div class="post-actions">
            <button
              type="button"
              data-like="${escapeHTML(post.id)}"
            >
              ${post.liked ? "♥" : "♡"} ${post.likes || 0}
            </button>

            <button
              type="button"
              data-comment="${escapeHTML(post.id)}"
            >
              Yorum (${(post.comments || []).length})
            </button>

            <button
              type="button"
              data-translate="${escapeHTML(post.id)}"
            >
              Çevir
            </button>
          </div>

          <div class="post-comments" id="comments-${escapeHTML(post.id)}">
            ${(post.comments || []).map(comment => `
              <div class="comment-item">
                <strong>${escapeHTML(comment.author)}</strong>
                <span>${escapeHTML(comment.content)}</span>
              </div>
            `).join("")}
          </div>

          <div class="post-translation" id="translation-${escapeHTML(post.id)}"></div>
        </article>
      `;
    }).join("");
  }

  $("#globalPostForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const input = $("#globalPostText");
    const content = input?.value.trim();

    if (!content) {
      showToast("Bir şeyler yazmalısın.");
      return;
    }

    if (content.length > 1500) {
      showToast("Gönderi en fazla 1500 karakter olabilir.");
      return;
    }

    posts.unshift(createPost(content, currentChannel));

    save(STORAGE.posts, posts);

    if (input) input.value = "";

    renderPosts();
    renderProfile();
    addActivity("Yeni bir topluluk gönderisi paylaşıldı.");

    showToast("Gönderi kaydedildi.");
  });

  $$("[data-channel]").forEach(button => {
    button.addEventListener("click", () => {
      currentChannel = button.dataset.channel;

      $$("[data-channel]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      renderPosts();
    });
  });

  $("#globalPosts")?.addEventListener("click", event => {
    const likeButton = event.target.closest("[data-like]");
    const commentButton = event.target.closest("[data-comment]");
    const translateButton = event.target.closest("[data-translate]");

    if (likeButton) {
      const post = posts.find(
        item => item.id === likeButton.dataset.like
      );

      if (!post) return;

      post.liked = !post.liked;
      post.likes = Math.max(
        0,
        (post.likes || 0) + (post.liked ? 1 : -1)
      );

      save(STORAGE.posts, posts);
      renderPosts();
      renderProfile();
      return;
    }

    if (commentButton) {
      const postId = commentButton.dataset.comment;
      const content = prompt("Yorumunu yaz:");

      if (!content?.trim()) return;

      const post = posts.find(item => item.id === postId);
      if (!post) return;

      post.comments = post.comments || [];
      post.comments.push({
        author: getProfileName(),
        content: content.trim()
      });

      save(STORAGE.posts, posts);
      renderPosts();
      showToast("Yorum eklendi.");
      return;
    }

    if (translateButton) {
      translatePost(translateButton.dataset.translate);
    }
  });
    /* =====================================
     TRANSLATION SYSTEM
  ===================================== */

  async function translatePost(postId) {
    const post = posts.find(item => item.id === postId);
    const output = $("#translation-" + postId);

    if (!post || !output) return;

    if (post.translation) {
      output.textContent = post.translation;
      output.classList.add("active");
      return;
    }

    output.textContent = "Çeviri hazırlanıyor...";
    output.classList.add("active");

    const targetLanguage = settings.language || "tr";

    if (targetLanguage === "tr") {
      output.textContent = post.content;
      return;
    }

    try {
      const url =
        "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(post.content.slice(0, 450)) +
        "&langpair=auto|" +
        encodeURIComponent(targetLanguage);

      const response = await fetch(url);

      if (!response.ok) throw new Error("Translation error");

      const data = await response.json();
      const translated = data?.responseData?.translatedText;

      if (!translated) throw new Error("Empty translation");

      output.textContent = translated;

      post.translation = translated;
      save(STORAGE.posts, posts);

    } catch {
      output.textContent =
        "Çeviri şu anda kullanılamıyor. Daha sonra tekrar dene.";
    }
  }

  /* =====================================
     BADGE SYSTEM
  ===================================== */

  const BADGE_CATALOG = [
    {
      id: "first-step",
      name: "İlk Adım",
      description: "KAGE.YK dünyasına katıldın.",
      price: 0,
      type: "system"
    },
    {
      id: "first-post",
      name: "İlk Ses",
      description: "İlk topluluk gönderini paylaştın.",
      price: 0,
      type: "system"
    },
    {
      id: "veteran",
      name: "Veteran",
      description: "Uzun süreli topluluk üyeliği.",
      price: 0,
      type: "system"
    },
    {
      id: "creator",
      name: "Yaratıcı",
      description: "Üretim ve içerik katkısı.",
      price: 0,
      type: "system"
    },
    {
      id: "red-mark",
      name: "Red Mark",
      description: "Özel profil plaketi.",
      price: 250,
      type: "premium"
    },
    {
      id: "shadow",
      name: "Shadow",
      description: "Karanlık koleksiyon plaketi.",
      price: 400,
      type: "premium"
    },
    {
      id: "ronin",
      name: "Ronin",
      description: "Bağımsız ruh koleksiyonu.",
      price: 600,
      type: "premium"
    },
    {
      id: "dark-emperor",
      name: "Dark Emperor",
      description: "Özel koleksiyon plaketi.",
      price: 1000,
      type: "premium"
    }
  ];

  function renderBadges() {
    const container = $("#badgeCatalog");
    if (!container) return;

    const visible = BADGE_CATALOG.filter(badge => {
      if (currentBadgeFilter === "all") return true;
      return badge.type === currentBadgeFilter;
    });

    container.innerHTML = visible.map(badge => {
      const owned = badges.includes(badge.id);

      return `
        <article class="badge-card ${owned ? "owned" : ""}">
          <div class="badge-plaque">
            <span class="badge-type">
              ${badge.type === "system" ? "SİSTEM ROZETİ" : "KOLEKSİYON"}
            </span>

            <h3>${escapeHTML(badge.name)}</h3>

            <p>${escapeHTML(badge.description)}</p>

            <strong>
              ${badge.price === 0 ? "SİSTEM TARAFINDAN" : badge.price + " KP"}
            </strong>
          </div>

          <button
            class="badge-action"
            type="button"
            data-buy-badge="${badge.id}"
            ${owned || badge.type === "system" ? "disabled" : ""}
          >
            ${
              owned
                ? "SAHİPSİN"
                : badge.type === "system"
                  ? "SİSTEM ROZETİ"
                  : "SATIN AL"
            }
          </button>
        </article>
      `;
    }).join("");
  }

  $$("[data-badge-filter]").forEach(button => {
    button.addEventListener("click", () => {
      currentBadgeFilter = button.dataset.badgeFilter;

      $$("[data-badge-filter]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      renderBadges();
    });
  });

  $("#badgeCatalog")?.addEventListener("click", event => {
    const button = event.target.closest("[data-buy-badge]");
    if (!button) return;

    const badge = BADGE_CATALOG.find(
      item => item.id === button.dataset.buyBadge
    );

    if (!badge || badge.type !== "premium") return;

    if (badges.includes(badge.id)) {
      showToast("Bu rozete zaten sahipsin.");
      return;
    }

    if (points < badge.price) {
      showToast("Yeterli Kage Point bulunmuyor.");
      return;
    }

    const approved = confirm(
      `${badge.name} rozeti ${badge.price} KP karşılığında alınsın mı?`
    );

    if (!approved) return;

    points -= badge.price;
    badges.push(badge.id);

    save(STORAGE.points, points);
    save(STORAGE.badges, badges);

    updateCounters();
    renderBadges();
    renderProfile();
    renderPoints();

    addActivity(`${badge.name} rozeti satın alındı.`);
    showToast("Rozet koleksiyonuna eklendi.");
  });

  function awardLocalBadge(id) {
    if (badges.includes(id)) return;

    const badge = BADGE_CATALOG.find(item => item.id === id);
    if (!badge) return;

    badges.push(id);
    save(STORAGE.badges, badges);

    renderBadges();
    renderProfile();
    updateCounters();
  }

  /* =====================================
     POINTS SYSTEM
  ===================================== */

  function renderPoints() {
    const balance = $("#pointsBalance");
    if (balance) balance.textContent = points;

    updateCounters();

    const history = $("#pointsHistory");
    if (history) {
      history.innerHTML = `
        <div class="empty-state">
          <p>Henüz puan hareketi bulunmuyor.</p>
          <small>Kage Points işlemleri burada görüntülenir.</small>
        </div>
      `;
    }
  }

  function addPoints(amount, reason) {
    if (!Number.isFinite(amount) || amount <= 0) return;

    points += Math.floor(amount);

    save(STORAGE.points, points);
    updateCounters();
    renderPoints();

    addActivity(reason || "Kage Points kazanıldı.");
  }

  /* =====================================
     PUBLISHED GAMES
  ===================================== */

  function renderGames() {
    const container = $("#gameList");
    if (!container) return;

    let games = load(STORAGE.games, []);

    if (!Array.isArray(games)) games = [];

    const search = ($("#gameSearch")?.value || "")
      .trim()
      .toLowerCase();

    games = games.filter(game => {
      const title = String(game.name || game.title || "").toLowerCase();
      return title.includes(search);
    });

    const count = $("#gameCount");
    if (count) count.textContent = games.length;

    if (!games.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Henüz yayınlanmış oyun yok.</h3>
          <p>YK tarafından yayınlanan oyunlar burada yer alacak.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = games.map(game => `
      <article class="game-card">
        ${
          game.image
            ? `<img src="${escapeHTML(game.image)}" alt="${escapeHTML(game.name || game.title || "Oyun")}" loading="lazy">`
            : ""
        }

        <div class="game-card-content">
          <h3>${escapeHTML(game.name || game.title || "İsimsiz oyun")}</h3>

          <p>${escapeHTML(game.description || "YK tarafından yayınlandı.")}</p>

          ${
            /^https:\/\/|^http:\/\//i.test(game.url || game.link || "")
              ? `<a href="${escapeHTML(game.url || game.link)}" target="_blank" rel="noopener noreferrer">OYUNU AÇ</a>`
              : ""
          }
        </div>
      </article>
    `).join("");
  }

  $("#gameSearch")?.addEventListener("input", renderGames);

  /* =====================================
     MARKET FILTER
  ===================================== */

  $$("[data-market-tab]").forEach(button => {
    button.addEventListener("click", () => {
      currentMarketTab = button.dataset.marketTab;

      $$("[data-market-tab]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      renderMarket();
    });
  });

  function renderMarket() {
    const container = $("#shopList");
    if (!container) return;

    const cards = [...container.children];

    cards.forEach(card => {
      const category = card.dataset.category || "all";

      card.hidden =
        currentMarketTab !== "all" &&
        category !== currentMarketTab;
    });
      }
    /* =====================================
     ANALYTICS SYSTEM
  ===================================== */

  function renderAnalytics() {
    const totalPosts = posts.length;

    const totalLikes = posts.reduce(
      (total, post) => total + (post.likes || 0), 0
    );

    const statPosts = $("#statPosts");
    const statLikes = $("#statLikes");
    const statBadges = $("#statBadges");

    if (statPosts) statPosts.textContent = totalPosts;
    if (statLikes) statLikes.textContent = totalLikes;
    if (statBadges) statBadges.textContent = badges.length;

    renderActivity();
  }

  function renderActivity() {
    const container = $("#activityList");
    if (!container) return;

    if (!activity.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Henüz etkinlik bulunmuyor.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = activity.slice(0, 20).map(item => `
      <div class="activity-item">
        <strong>${escapeHTML(item.message)}</strong>
        <span>${escapeHTML(item.date)}</span>
      </div>
    `).join("");
  }

  /* =====================================
     TRAVEL SEARCH
  ===================================== */

  $("#flightSearch")?.addEventListener("click", () => {
    const from = $("#flightFrom")?.value.trim();
    const to = $("#flightTo")?.value.trim();
    const date = $("#flightDate")?.value;
    const passengers = Number($("#flightPassengers")?.value || 1);
    const status = $("#flightStatus");

    if (!from || !to || !date) {
      showToast("Kalkış, varış ve tarih bilgilerini gir.");
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      showToast("Kalkış ve varış noktaları farklı olmalı.");
      return;
    }

    if (status) {
      status.textContent =
        "Arama bilgileri hazırlandı. Gerçek uçuş sonuçları için uçuş sağlayıcısı bağlantısı gerekiyor.";
    }
  });

  /* =====================================
     ASSET / MARKET SEARCH
  ===================================== */

  function filterAssets() {
    const container = $("#assetList");
    if (!container) return;

    const query = ($("#assetSearch")?.value || "")
      .trim()
      .toLowerCase();

    [...container.children].forEach(item => {
      item.hidden = !item.textContent.toLowerCase().includes(query);
    });
  }

  $("#assetSearch")?.addEventListener("input", filterAssets);

  /* =====================================
     SETTINGS
  ===================================== */

  const languageOptions = {
    tr: "Türkçe",
    en: "English",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
    bg: "Български",
    it: "Italiano",
    ru: "Русский",
    de: "Deutsch",
    es: "Español"
  };

  const translations = {
    tr: {
      home: "Ana Sayfa",
      global: "Global",
      games: "Oyunlar",
      shops: "Mağaza",
      projects: "Projeler",
      badges: "Rozetler",
      analytics: "İstatistikler",
      premium: "Premium",
      points: "Kage Points",
      travel: "Seyahat",
      markets: "Pazar",
      profile: "Profil",
      settings: "Ayarlar",
      assistant: "YK Asistan",
      search: "Ara",
      save: "Kaydet",
      publish: "Paylaş"
    },
    en: {
      home: "Home",
      global: "Global",
      games: "Games",
      shops: "Shop",
      projects: "Projects",
      badges: "Badges",
      analytics: "Analytics",
      premium: "Premium",
      points: "Kage Points",
      travel: "Travel",
      markets: "Marketplace",
      profile: "Profile",
      settings: "Settings",
      assistant: "YK Assistant",
      search: "Search",
      save: "Save",
      publish: "Publish"
    },
    ja: {
      home: "ホーム",
      global: "グローバル",
      games: "ゲーム",
      shops: "ショップ",
      projects: "プロジェクト",
      badges: "バッジ",
      analytics: "統計",
      premium: "プレミアム",
      points: "Kage Points",
      travel: "旅行",
      markets: "マーケット",
      profile: "プロフィール",
      settings: "設定",
      assistant: "YKアシスタント",
      search: "検索",
      save: "保存",
      publish: "投稿"
    },
    ko: {
      home: "홈",
      global: "글로벌",
      games: "게임",
      shops: "상점",
      projects: "프로젝트",
      badges: "배지",
      analytics: "통계",
      premium: "프리미엄",
      points: "Kage Points",
      travel: "여행",
      markets: "마켓",
      profile: "프로필",
      settings: "설정",
      assistant: "YK 어시스턴트",
      search: "검색",
      save: "저장",
      publish: "게시"
    },
    zh: {
      home: "首页",
      global: "全球",
      games: "游戏",
      shops: "商店",
      projects: "项目",
      badges: "徽章",
      analytics: "统计",
      premium: "高级会员",
      points: "Kage Points",
      travel: "旅行",
      markets: "市场",
      profile: "个人资料",
      settings: "设置",
      assistant: "YK 助手",
      search: "搜索",
      save: "保存",
      publish: "发布"
    },
    bg: {
      home: "Начало",
      global: "Глобално",
      games: "Игри",
      shops: "Магазин",
      projects: "Проекти",
      badges: "Значки",
      analytics: "Статистика",
      premium: "Премиум",
      points: "Kage Points",
      travel: "Пътуване",
      markets: "Пазар",
      profile: "Профил",
      settings: "Настройки",
      assistant: "YK Асистент",
      search: "Търсене",
      save: "Запази",
      publish: "Публикувай"
    },
    it: {
      home: "Home",
      global: "Globale",
      games: "Giochi",
      shops: "Negozio",
      projects: "Progetti",
      badges: "Distintivi",
      analytics: "Statistiche",
      premium: "Premium",
      points: "Kage Points",
      travel: "Viaggi",
      markets: "Mercato",
      profile: "Profilo",
      settings: "Impostazioni",
      assistant: "Assistente YK",
      search: "Cerca",
      save: "Salva",
      publish: "Pubblica"
    },
    ru: {
      home: "Главная",
      global: "Глобально",
      games: "Игры",
      shops: "Магазин",
      projects: "Проекты",
      badges: "Значки",
      analytics: "Статистика",
      premium: "Премиум",
      points: "Kage Points",
      travel: "Путешествия",
      markets: "Маркет",
      profile: "Профиль",
      settings: "Настройки",
      assistant: "Помощник YK",
      search: "Поиск",
      save: "Сохранить",
      publish: "Опубликовать"
    },
    de: {
      home: "Startseite",
      global: "Global",
      games: "Spiele",
      shops: "Shop",
      projects: "Projekte",
      badges: "Abzeichen",
      analytics: "Statistiken",
      premium: "Premium",
      points: "Kage Points",
      travel: "Reisen",
      markets: "Marktplatz",
      profile: "Profil",
      settings: "Einstellungen",
      assistant: "YK Assistent",
      search: "Suchen",
      save: "Speichern",
      publish: "Veröffentlichen"
    },
    es: {
      home: "Inicio",
      global: "Global",
      games: "Juegos",
      shops: "Tienda",
      projects: "Proyectos",
      badges: "Insignias",
      analytics: "Estadísticas",
      premium: "Premium",
      points: "Kage Points",
      travel: "Viajes",
      markets: "Mercado",
      profile: "Perfil",
      settings: "Ajustes",
      assistant: "Asistente YK",
      search: "Buscar",
      save: "Guardar",
      publish: "Publicar"
    }
  };

  function applyLanguage(language) {
    const dictionary = translations[language] || translations.tr;

    $$(".nav-item[data-page]").forEach(item => {
      const key = item.dataset.page;
      const label = item.querySelector(".nav-label");

      if (label && dictionary[key]) {
        label.textContent = dictionary[key];
      }
    });

    const languageButton = $("#languageButton");

    if (languageButton) {
      languageButton.textContent =
        languageOptions[language] || languageOptions.tr;
    }

    document.documentElement.lang = language;

    settings.language = language;
    save(STORAGE.settings, settings);
  }

  $("#languageSelect")?.addEventListener("change", event => {
    applyLanguage(event.target.value);
    showToast("Dil ayarı güncellendi.");
  });

  $("#reduceMotion")?.addEventListener("change", event => {
    settings.reduceMotion = event.target.checked;

    document.body.classList.toggle(
      "reduce-motion",
      settings.reduceMotion
    );

    save(STORAGE.settings, settings);
  });

  /* =====================================
     ASSISTANT
  ===================================== */

  function addAssistantMessage(message, sender) {
    const container = $("#assistantMessages");
    if (!container) return;

    const item = document.createElement("div");
    item.className = "assistant-message " + sender;
    item.textContent = message;

    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
  }

  function assistantReply(message) {
    const text = message.toLowerCase();

    if (text.includes("merhaba") || text.includes("selam")) {
      return "Selam! KAGE.YK sistemine hoş geldin.";
    }

    if (text.includes("oyun")) {
      return "Oyunlar bölümünden yayınlanmış YK oyunlarını inceleyebilirsin.";
    }

    if (text.includes("puan")) {
      return "Kage Points bakiyeni Puanlar bölümünden görüntüleyebilirsin.";
    }

    if (text.includes("rozet")) {
      return "Rozetler bölümünde sistem rozetlerini ve koleksiyon rozetlerini görebilirsin.";
    }

    if (text.includes("profil")) {
      return "Profil bölümünden kullanıcı adını, biyografini ve görünümünü düzenleyebilirsin.";
    }

    return "Seni dinliyorum. KAGE.YK hakkında ne öğrenmek istiyorsun?";
  }

  $("#aiSend")?.addEventListener("click", () => {
    const input = $("#aiPrompt");
    const message = input?.value.trim();

    if (!message) return;

    addAssistantMessage(message, "user");
    addAssistantMessage(assistantReply(message), "bot");

    input.value = "";
  });

  $("#aiPrompt")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      $("#aiSend")?.click();
    }
  });
    /* =====================================
     PREMIUM BUTTON
  ===================================== */

  $("#premiumSubscribe")?.addEventListener("click", () => {
    showToast(
      "Premium üyelik için güvenli ödeme sistemi bağlantısı gerekiyor."
    );
  });

  /* =====================================
     INITIALIZATION
  ===================================== */

  function initializeApp() {
    // Profil
    renderProfile();

    // Topluluk
    renderPosts();

    // Oyunlar
    renderGames();

    // Rozetler
    renderBadges();

    // Puanlar
    renderPoints();

    // İstatistikler
    renderAnalytics();

    // Mağaza
    renderMarket();

    // Dil
    const languageSelect = $("#languageSelect");

    if (languageSelect) {
      languageSelect.value = settings.language || "tr";
    }

    applyLanguage(settings.language || "tr");

    // Hareket azaltma
    const reduceMotion = $("#reduceMotion");

    if (reduceMotion) {
      reduceMotion.checked = Boolean(settings.reduceMotion);
    }

    document.body.classList.toggle(
      "reduce-motion",
      Boolean(settings.reduceMotion)
    );

    // Sayaçlar
    updateCounters();

    // Varsayılan profil rozeti
    if (!badges.includes("first-step")) {
      awardLocalBadge("first-step");
    }

    console.log("KAGE.YK application initialized.");
  }

  // Sayfa tamamen yüklendiğinde başlat.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }

})();
