(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function safeRead(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Kayıt yapılamadı:", error);
      notice("Tarayıcı depolama alanına kaydedilemedi.");
      return false;
    }
  }

  let toastTimer;

  function notice(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  // --------------------------------------------------
  // SAYFA GEÇİŞLERİ VE MOBİL MENÜ
  // --------------------------------------------------

  function showPage(name) {
    const target = $("#page-" + name);
    if (!target) return;

    $$(".page").forEach(page => page.classList.remove("active"));
    target.classList.add("active");

    $$(".nav-item").forEach(button => {
      button.classList.toggle("active", button.dataset.page === name);
    });

    document.body.classList.remove("menu-open");
    $("#menuToggle")?.setAttribute("aria-expanded", "false");

    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      history.replaceState(null, "", "#" + name);
    } catch {}
  }

  $$(".nav-item").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  $$("[data-page-link]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.pageLink));
  });

  $("#menuToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    $("#menuToggle").setAttribute(
      "aria-expanded",
      String(document.body.classList.contains("menu-open"))
    );
  });

  $("#menuClose")?.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
  });

  $("#overlay")?.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      document.body.classList.remove("menu-open");
    }
  });

  $$("[data-notice]").forEach(button => {
    button.addEventListener("click", () => notice(button.dataset.notice));
  });

  // --------------------------------------------------
  // GLOBAL SOHBET
  // --------------------------------------------------

  const channelNames = {
    general: "Genel sohbet",
    introductions: "Tanışma",
    technology: "Teknoloji",
    games: "Oyun",
    art: "Sanat",
    anime: "Anime & Manga",
    ideas: "Fikirler",
    offtopic: "Serbest"
  };

  let currentChannel = "general";
  let posts = safeRead("kageGlobalPosts", []);

  if (!Array.isArray(posts)) posts = [];

  function renderPosts() {
    $("#channelTitle").textContent = channelNames[currentChannel];

    const list = $("#globalPosts");
    list.replaceChildren();

    const filtered = posts
      .filter(post => post.channel === currentChannel)
      .sort((a, b) => b.created - a.created);

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";

      const symbol = document.createElement("div");
      symbol.className = "empty-symbol";
      symbol.textContent = "◎";

      const title = document.createElement("h3");
      title.textContent = "Henüz mesaj yok";

      const description = document.createElement("p");
      description.textContent = "Bu başlıkta ilk paylaşımı sen yap.";

      empty.append(symbol, title, description);
      list.append(empty);
      return;
    }

    filtered.forEach(post => {
      const card = document.createElement("article");
      card.className = "global-post";

      const head = document.createElement("div");
      head.className = "post-head";

      const avatar = document.createElement("span");
      avatar.className = "post-avatar";
      avatar.textContent = "影";

      const author = document.createElement("b");
      author.className = "post-author";
      author.textContent = post.author || "Kage Kullanıcısı";

      const time = document.createElement("span");
      time.className = "post-time";
      time.textContent = new Date(post.created).toLocaleString();

      head.append(avatar, author, time);

      const channel = document.createElement("div");
      channel.className = "post-channel";
      channel.textContent = (channelNames[post.channel] || "GENEL").toUpperCase();

      const body = document.createElement("p");
      body.className = "post-body";
      body.textContent = post.text;

      const actions = document.createElement("div");
      actions.className = "post-actions";

      const like = document.createElement("button");
      like.type = "button";
      like.textContent = `♡ ${post.likes || 0} Beğeni`;

      like.addEventListener("click", () => {
        post.likes = (post.likes || 0) + 1;
        safeWrite("kageGlobalPosts", posts);
        renderPosts();
      });

      const translate = document.createElement("button");
      translate.type = "button";
      translate.textContent = "🌐 Mesajı çevir";

      const translation = document.createElement("div");
      translation.className = "post-translation";
      translation.style.display = "none";

      translate.addEventListener("click", async () => {
        const targetLanguage = localStorage.getItem("kageLanguage") || "tr";

        if (translation.dataset.translated === targetLanguage) {
          translation.style.display =
            translation.style.display === "none" ? "block" : "none";
          return;
        }

        translate.disabled = true;
        translate.textContent = "Çevriliyor...";
        translation.style.display = "block";
        translation.textContent = "Mesaj çevriliyor...";

        try {
          const endpoint = new URL("https://api.mymemory.translated.net/get");
          endpoint.searchParams.set("q", post.text);
          endpoint.searchParams.set("langpair", "autodetect|" + targetLanguage);

          const response = await fetch(endpoint.toString());

          if (!response.ok) throw new Error("Çeviri servisine ulaşılamadı.");

          const data = await response.json();

          if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
            throw new Error("Çeviri sonucu alınamadı.");
          }

          translation.textContent = data.responseData.translatedText;
          translation.dataset.translated = targetLanguage;

        } catch (error) {
          translation.textContent =
            "Çeviri şu anda yapılamıyor. Daha sonra tekrar dene.";
          console.error(error);
        } finally {
          translate.disabled = false;
          translate.textContent = "🌐 Mesajı çevir";
        }
      });

      actions.append(like, translate);

      const comments = document.createElement("div");
      comments.className = "post-comments";

      const input = document.createElement("input");
      input.placeholder = "Yorum yaz...";
      input.maxLength = 300;

      const send = document.createElement("button");
      send.type = "button";
      send.className = "secondary-button";
      send.textContent = "Yorum";

      const commentList = document.createElement("div");
      commentList.className = "comment-list";

      (post.comments || []).forEach(comment => {
        const line = document.createElement("p");
        line.textContent = "• " + comment;
        commentList.append(line);
      });

      function addComment() {
        const value = input.value.trim();
        if (!value) return;

        post.comments = post.comments || [];
        post.comments.push(value);

        safeWrite("kageGlobalPosts", posts);
        renderPosts();
      }

      send.addEventListener("click", addComment);

      input.addEventListener("keydown", event => {
        if (event.key === "Enter") addComment();
      });

      comments.append(input, send);

      card.append(
        head,
        channel,
        body,
        actions,
        translation,
        comments,
        commentList
      );

      list.append(card);
    });
  }

  $$(".channel-chip").forEach(button => {
    button.addEventListener("click", () => {
      $$(".channel-chip").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      currentChannel = button.dataset.channel;
      renderPosts();
    });
  });

  $("#globalPostForm").addEventListener("submit", event => {
    event.preventDefault();

    const field = $("#globalPostText");
    const text = field.value.trim();

    if (!text) {
      notice("Önce bir mesaj yaz.");
      return;
    }

    const profile = safeRead("kageProfileV2", {});

    posts.push({
      id: Date.now(),
      channel: currentChannel,
      text,
      author: profile.name || "Kage Kullanıcısı",
      created: Date.now(),
      likes: 0,
      comments: []
    });

    safeWrite("kageGlobalPosts", posts);
    field.value = "";
    renderPosts();
    notice("Mesaj bu cihazdaki Global akışına eklendi.");
  });

  renderPosts();

  // --------------------------------------------------
  // OYUNLAR
  // Yalnızca yayınlanmış oyunlar listelenir.
  // Kullanıcı oyun ekleme formu bulunmaz.
  // --------------------------------------------------

  const publishedGames = safeRead("kagePublishedGames", []);

  function renderGames() {
    const box = $("#gameList");
    box.replaceChildren();

    if (!Array.isArray(publishedGames) || !publishedGames.length) {
      const empty = document.createElement("article");
      empty.className = "game-empty";

      const icon = document.createElement("div");
      icon.textContent = "🎮";

      const title = document.createElement("h3");
      title.textContent = "Oyunlar hazırlanıyor";

      const description = document.createElement("p");
      description.textContent = "Yayınlanan oyunlar burada listelenecek.";

      empty.append(icon, title, description);
      box.append(empty);
      return;
    }

    publishedGames.forEach(game => {
      const card = document.createElement("article");
      card.className = "game-card";

      const icon = document.createElement("div");
      icon.textContent = "🎮";
      icon.style.fontSize = "30px";

      const title = document.createElement("h3");
      title.textContent = game.name || "İsimsiz oyun";

      const description = document.createElement("p");
      description.textContent = game.description || "";

      const link = document.createElement("a");
      link.href = game.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Oyunu aç ↗";

      card.append(icon, title, description, link);
      box.append(card);
    });
  }

  renderGames();

  // --------------------------------------------------
  // ROZET KATALOĞU
  // --------------------------------------------------

  const badgeGroups = [
    {
      cat: "fun",
      label: "Mizahi",
      names: [
        "Bildirim Canavarı",
        "Sertifikalı Darlayıcı",
        "Görüldü Koleksiyoneri",
        "Boş Yapma Uzmanı",
        "Sabır Testi",
        "Darlamatik",
        "Parazit",
        "Israrcı",
        "Gereksiz",
        "Meşguliyet",
        "Bahane Bakanı",
        "Drama Mıknatısı",
        "Klavye Delikanlısı",
        "Uyku Kaçağı",
        "Son Dakika Efsanesi",
        "Dedikodu Arşivcisi",
        "Kahkaha Krizi",
        "Ciddiyet Düşmanı",
        "Plan Bozucu",
        "Şaka Makinesi"
      ]
    },
    {
      cat: "warning",
      label: "Uyarı",
      names: [
        "Sessize Alındı",
        "Dikkat: Darlayabilir",
        "Engel Adayı",
        "Tehlikeli Bölge",
        "Spam Makinesi"
      ]
    },
    {
      cat: "romance",
      label: "Romantik",
      names: [
        "Kalp Hırsızı","Gizli Hayran","İlk Mesaj Cesareti",
        "Aşk Sarhoşu","Kırık Kalp","Sadık Ruh","Gece Mesajı",
        "Romantik Ruh","Bakışların Dili","Sonsuz Sevda",
        "Aşk Mektubu","Kıskançlık Alarmı","Biricik İnsan",
        "Çiçekli Kalp","Ruh Eşi"
      ]
    },
    {
      cat: "warrior",
      label: "Savaşçı",
      names: [
        "Son Nefese Kadar","Kızıl Kılıç","Gölge Savaşçısı",
        "Demir İrade","Sessiz Suikastçı","Onur Yemini",
        "Tek Başına Ordu","Ejderha Yumruğu","Karanlık Muhafız",
        "Kırılmaz Zırh","Son Kale","Kanlı Ay","Fırtına Adımı",
        "Kayıp Ronin","Savaşın Efendisi"
      ]
    },
    {
      cat: "creator",
      label: "Üretici",
      names: [
        "Fikir Mimarı","Kod Ustası","Piksel Avcısı",
        "Gece Geliştiricisi","İlk Proje","Hata Avcısı",
        "Tasarım Gözü","Üreten Zihin","Sistem Kurucu",
        "Yaratıcı Kıvılcım","Prototipçi","Dijital Zanaatkâr",
        "Usta Editör","Dünya İnşa Eden","Sıfırdan Başlayan"
      ]
    },
    {
      cat: "social",
      label: "Sosyal",
      names: [
        "Topluluk Sesi","Sohbet Başlatan","Barış Elçisi",
        "Yardımsever","Küresel Dost","Sessiz Takipçi",
        "Sohbet Kralı","Yorum Ustası","İyi Dinleyici",
        "Yeni Yüz","Bağlantı Kurucu","Günün Enerjisi",
        "Pozitif Etki","Söz Ustası","Topluluk Efsanesi"
      ]
    },
    {
      cat: "mystic",
      label: "Gizemli",
      names: [
        "Kayıp Gölge","Gece Bekçisi","Sislerin Ardında",
        "Kızıl Ay","Sessiz Tanık","Unutulmuş İsim",
        "Kara Mühür","Gizli Dosya","Rüya Gezgini",
        "Ay Işığı","Gölge Adım","Sırların Efendisi",
        "Karanlık Kehanet","Hiçlik","Son Fısıltı"
      ]
    },
    {
      cat: "wealth",
      label: "Ticaret",
      names: [
        "İlk Satış","Pazar Kurdu","Altın Dokunuş",
        "Pazarlık Ustası","Girişimci Ruh","Kâr Avcısı",
        "Risk Yöneticisi","Dijital Tüccar","Mağaza Sahibi",
        "Komisyon Kralı","Koleksiyoner","Yatırımcı Aklı",
        "Bütçe Ninjası","Fırsat Avcısı","Ticaret Efsanesi"
      ]
    },
    {
      cat: "wisdom",
      label: "Bilgelik",
      names: [
        "Meraklı Zihin","Tarih Kaşifi","Felsefe Taşı",
        "Bilgi Avcısı","Sakin Akıl","Stratejist",
        "Soğukkanlı","Analiz Ustası","Öğrenme Makinesi",
        "Uzak Görüşlü","Bilge Baykuş","Soru Ustası",
        "Düşünce Mimarı","Hakikat Arayıcısı","Usta Öğrenci"
      ]
    },
    {
      cat: "founder",
      label: "YK Özel",
      names: [
        "İlk Gölge","YK Kurucusu","Kage Mührü",
        "Sıfır Noktası","Efsanenin Başlangıcı",
        "Kurucu İrade","İlk Kıvılcım","Gölge Konseyi",
        "YK Öncüsü","Kage Hanedanı"
      ]
    },
    {
      cat: "premium",
      label: "Premium",
      names: [
        "Altın İmparator","Neon Hükümdar","Kozmik Taç",
        "Ejderha Ruhu","Sonsuz Alev","Kızıl Elmas",
        "Gölge Prensi","Kara Güneş","Yıldız Lordu",
        "Efsanevi Aura","Kraliyet Mührü","Ay Tanrıçası",
        "Zümrüt Hayalet","Ateş Kuşu","Mutlak Hâkim"
      ]
    }
  ];

  const systemBadgeNames = new Set([
    "Bildirim Canavarı",
    "Sertifikalı Darlayıcı",
    "Görüldü Koleksiyoneri",
    "Boş Yapma Uzmanı",
    "Sabır Testi",
    "Sessize Alındı",
    "Dikkat: Darlayabilir",
    "Engel Adayı",
    "Tehlikeli Bölge",
    "Spam Makinesi",
    "Darlamatik",
    "Parazit",
    "Israrcı",
    "Gereksiz",
    "Meşguliyet"
  ]);

  const badgeData = [];
  let badgeId = 0;

  badgeGroups.forEach(group => {
    group.names.forEach((name, index) => {
      badgeId++;

      const systemOnly = systemBadgeNames.has(name);
      const premium = group.cat === "premium" ||
        (group.cat === "founder") ||
        (!systemOnly && index % 5 === 4);

      badgeData.push({
        id: badgeId,
        cat: group.cat,
        label: group.label,
        name,
        systemOnly,
        premium,
        price: premium ? 0 : 250 + (index * 50)
      });
    });
  });

  const owned = safeRead("kageOwnedBadges", []);
  if (!Array.isArray(owned)) owned.length = 0;

  let badgeFilter = "all";
  let tierFilter = "all";

  function renderBadges() {
    const grid = $("#badgeCatalog");
    grid.replaceChildren();

    const filtered = badgeData.filter(badge => {
      const categoryMatch =
        badgeFilter === "all" || badge.cat === badgeFilter;

      const tierMatch =
        tierFilter === "all" ||
        (tierFilter === "premium" && badge.premium) ||
        (tierFilter === "free" && !badge.premium);

      return categoryMatch && tierMatch;
    });

    filtered.forEach(badge => {
      const card = document.createElement("article");
      card.className = "badge-card" + (badge.premium ? " badge-premium" : "");

      const plaque = document.createElement("div");
      plaque.className = "badge-plaque";
      plaque.textContent = badge.name;

      const type = document.createElement("span");
      type.className = "badge-type" + (badge.systemOnly ? " system-type" : "");
      type.textContent = badge.label.toUpperCase() +
        (badge.systemOnly ? " • SİSTEM ROZETİ" : badge.premium ? " • PREMIUM" : " • KOLEKSİYON");

      const title = document.createElement("h3");
      title.textContent = badge.name;

      const description = document.createElement("p");

      if (badge.systemOnly) {
        description.textContent = "Davranış ve platform etkinliklerine göre sistem tarafından verilir. Satın alınamaz.";
      } else if (badge.premium) {
        description.textContent = "Premium koleksiyonuna ait özel rozet.";
      } else {
        description.textContent = "Kage Points ile alınabilecek koleksiyon rozeti.";
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "badge-action";

      if (badge.systemOnly) {
        button.textContent = "SİSTEM VERİR";
        button.disabled = true;
      } else if (owned.includes(badge.id)) {
        button.textContent = "KOLEKSİYONUNDA";
        button.disabled = true;
      } else if (badge.premium) {
        button.textContent = "PREMIUM GEREKLİ";
        button.addEventListener("click", () => {
          notice("Bu rozet Premium üyelik gerektirir.");
        });
      } else {
        button.textContent = badge.price + " KP";
        button.addEventListener("click", () => {
          notice("Gerçek Kage Points bakiyesi ve güvenli satın alma henüz sunucuya bağlanmadı.");
        });
      }

      card.append(plaque, type, title, description, button);
      grid.append(card);
    });
  }

  $$(".badge-filter-row [data-badge-filter]").forEach(button => {
    button.addEventListener("click", () => {
      $$(".badge-filter-row [data-badge-filter]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      badgeFilter = button.dataset.badgeFilter;
      renderBadges();
    });
  });

  $$("[data-tier]").forEach(button => {
    button.addEventListener("click", () => {
      $$("[data-tier]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      tierFilter = button.dataset.tier;
      renderBadges();
    });
  });

  function renderProfileBadges() {
    const box = $("#profileBadges");
    box.replaceChildren();

    const selected = badgeData.filter(badge => owned.includes(badge.id));
    $("#profileBadgeCount").textContent = selected.length;

    if (!selected.length) {
      const empty = document.createElement("span");
      empty.className = "muted-copy";
      empty.textContent = "Henüz rozet kazanılmadı.";
      box.append(empty);
      return;
    }

    selected.forEach(badge => {
      const item = document.createElement("div");
      item.className = "profile-badge";

      const type = document.createElement("span");
      type.className = "badge-symbol";
   
