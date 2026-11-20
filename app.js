
"use strict";
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const toast = $("#toast");
  let toastTimer;
  const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const safeWrite = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  function notice(message) {
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }
  const sidebar=$("#sidebar"), overlay=$("#overlay"), menuToggle=$("#menuToggle");
  function closeMenu(){sidebar.classList.remove("open");overlay.classList.remove("show");menuToggle.setAttribute("aria-expanded","false");}
  function openMenu(){sidebar.classList.add("open");overlay.classList.add("show");menuToggle.setAttribute("aria-expanded","true");}
  function showPage(id){
    const target=$("#page-"+id); if(!target){notice("Bu bölüm henüz eklenmedi.");return;}
    $$(".page").forEach(p=>p.classList.remove("active")); target.classList.add("active");
    $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
    closeMenu(); window.scrollTo({top:0,behavior:"smooth"}); history.replaceState(null,"","#"+id);
  }
  $("#menuToggle").addEventListener("click",openMenu);
  $("#menuClose").addEventListener("click",closeMenu); overlay.addEventListener("click",closeMenu);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu();});
  document.addEventListener("click",e=>{
    const nav=e.target.closest("[data-page]"), link=e.target.closest("[data-page-link]"), note=e.target.closest("[data-notice]");
    if(nav)showPage(nav.dataset.page);
    if(link){e.preventDefault();showPage(link.dataset.pageLink);}
    if(note)notice(note.dataset.notice);
  });

  // Global conversation: local-first feed, channel filtering, comments, likes and external translation.
  const channelNames={general:"Genel sohbet",introductions:"Tanışma",technology:"Teknoloji",games:"Oyun",art:"Sanat",anime:"Anime & Manga",ideas:"Fikirler",offtopic:"Serbest"};
  let currentChannel="general";
  let posts=safeRead("kageGlobalPosts",[]);
  function renderPosts(){
    $("#channelTitle").textContent=channelNames[currentChannel];
    const list=$("#globalPosts"); list.innerHTML="";
    const filtered=posts.filter(p=>p.channel===currentChannel).sort((a,b)=>b.created-a.created);
    if(!filtered.length){list.innerHTML='<div class="empty-state"><div class="empty-symbol">◎</div><h3>Henüz mesaj yok</h3><p>Bu başlıkta ilk paylaşımı sen yap.</p></div>';return;}
    filtered.forEach(post=>{
      const el=document.createElement("article");el.className="global-post";
      const head=document.createElement("div");head.className="post-head";
      const av=document.createElement("span");av.className="post-avatar";av.textContent="影";
      const author=document.createElement("b");author.className="post-author";author.textContent=post.author||"Kage Kullanıcısı";
      const time=document.createElement("span");time.className="post-time";time.textContent=new Date(post.created).toLocaleString();
      head.append(av,author,time);
      const tag=document.createElement("div");tag.className="post-channel";tag.textContent=channelNames[post.channel].toUpperCase();
      const body=document.createElement("p");body.className="post-body";body.textContent=post.text;
      const actions=document.createElement("div");actions.className="post-actions";
      const like=document.createElement("button");like.textContent=`♡ ${post.likes||0} Beğeni`;like.addEventListener("click",()=>{post.likes=(post.likes||0)+1;safeWrite("kageGlobalPosts",posts);renderPosts();});
      const translate=document.createElement("button");translate.textContent="🌐 Çevir";translate.addEventListener("click",()=>{const lang=localStorage.getItem("kageLanguage")||"tr";const url="https://translate.google.com/?sl=auto&tl="+encodeURIComponent(lang)+"&text="+encodeURIComponent(post.text)+"&op=translate";window.open(url,"_blank","noopener");});
      actions.append(like,translate);
      const comments=document.createElement("div");comments.className="post-comments";
      const input=document.createElement("input");input.placeholder="Yorum yaz...";input.maxLength=300;
      const send=document.createElement("button");send.className="secondary-button";send.textContent="Yorum";
      const commentList=document.createElement("div");commentList.className="comment-list";
      (post.comments||[]).forEach(c=>{const p=document.createElement("p");p.className="muted-copy";p.textContent="• "+c;commentList.append(p);});
      send.addEventListener("click",()=>{const v=input.value.trim();if(!v)return;post.comments=post.comments||[];post.comments.push(v);safeWrite("kageGlobalPosts",posts);renderPosts();});
      comments.append(input,send);el.append(head,tag,body,actions,comments,commentList);list.append(el);
    });
  }
  $$(".channel-chip").forEach(btn=>btn.addEventListener("click",()=>{$$(".channel-chip").forEach(b=>b.classList.toggle("active",b===btn));currentChannel=btn.dataset.channel;renderPosts();}));
  $("#globalPostForm").addEventListener("submit",e=>{e.preventDefault();const field=$("#globalPostText"),text=field.value.trim();if(!text){notice("Önce bir mesaj yaz.");return;}posts.push({id:Date.now(),channel:currentChannel,text,author:$("#profileName")?.value.trim()||"Kage Kullanıcısı",created:Date.now(),likes:0,comments:[]});safeWrite("kageGlobalPosts",posts);field.value="";renderPosts();notice("Mesaj bu cihazdaki Global akışına eklendi.");});
  renderPosts();

  // Games list
  let games=safeRead("kageGames",[]);
  function renderGames(){const box=$("#gameList");box.innerHTML="";if(!games.length){box.innerHTML='<article class="game-empty"><div>🎮</div><h3>İlk oyunun bekleniyor</h3><p>Oyunlarını ekledikçe burada listelenecek.</p></article>';return;}
    games.forEach((g,i)=>{const card=document.createElement("article");card.className="game-card";const icon=document.createElement("div");icon.textContent="🎮";icon.style.fontSize="30px";const h=document.createElement("h3");h.textContent=g.name;const p=document.createElement("p");p.textContent=g.url;const a=document.createElement("a");a.href=g.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Oyunu aç ↗";const del=document.createElement("button");del.className="text-link";del.textContent="Listeden kaldır";del.addEventListener("click",()=>{games.splice(i,1);safeWrite("kageGames",games);renderGames();});card.append(icon,h,p,a,del);box.append(card);});
  }
  $("#gameForm").addEventListener("submit",e=>{e.preventDefault();const name=$("#gameName").value.trim(),url=$("#gameUrl").value.trim();try{const parsed=new URL(url);if(!["http:","https:"].includes(parsed.protocol))throw 0;}catch{notice("Geçerli bir https:// oyun bağlantısı gir.");return;}games.push({name,url});safeWrite("kageGames",games);e.target.reset();renderGames();notice("Oyun listene eklendi.");});
  renderGames();

  // 200 badge catalogue, split into free and premium collections.
  const badgeGroups=[
    ["fun","Mizah & Alay",["Son Görülme Uzmanı","Bahane Bakanı","Yalan Makinesi","Drama Mıknatısı","Boş Yapma Şampiyonu","Klavye Delikanlısı","Uyku Kaçağı","Son Dakika Efsanesi","Dedikodu Arşivcisi","Kendi Kendine Roast","Kahkaha Krizi","Ciddiyet Düşmanı","Plan Bozucu","Yanlış Anlayan","Kayıp Çorap","Çaylak Profesör","Ego Balonu","Trip Lordu","Şaka Makinesi","Felaket Tellalı"]],
    ["romance","Romantik",["Kalp Hırsızı","Gizli Hayran","İlk Mesaj Cesareti","Aşk Sarhoşu","Kırık Kalp","Sadık Ruh","Gece Mesajı","Romantik Ruh","Bakışların Dili","Sonsuz Sevda","Aşk Mektubu","Kıskançlık Alarmı","Biricik İnsan","Çiçekli Kalp","Ruh Eşi"]],
    ["warrior","Savaşçı",["Son Nefese Kadar","Kızıl Kılıç","Gölge Savaşçısı","Demir İrade","Sessiz Suikastçı","Onur Yemini","Tek Başına Ordu","Ejderha Yumruğu","Karanlık Muhafız","Kırılmaz Zırh","Son Kale","Kanlı Ay","Fırtına Adımı","Kayıp Ronin","Savaşın Efendisi"]],
    ["creator","Üretici",["Fikir Mimarı","Kod Ustası","Piksel Avcısı","Gece Geliştiricisi","İlk Proje","Hata Avcısı","Tasarım Gözü","Üreten Zihin","Sistem Kurucu","Yaratıcı Kıvılcım","Prototipçi","Dijital Zanaatkâr","Usta Editör","Dünya İnşa Eden","Sıfırdan Başlayan"]],
    ["social","Sosyal",["Topluluk Sesi","Sohbet Başlatan","Barış Elçisi","Yardımsever","Küresel Dost","Sessiz Takipçi","Sohbet Kralı","Yorum Ustası","İyi Dinleyici","Yeni Yüz","Bağlantı Kurucu","Günün Enerjisi","Pozitif Etki","Söz Ustası","Topluluk Efsanesi"]],
    ["mystic","Gizemli",["Kayıp Gölge","Gece Bekçisi","Sislerin Ardında","Kızıl Ay","Sessiz Tanık","Unutulmuş İsim","Kara Mühür","Gizli Dosya","Rüya Gezgini","Ay Işığı","Gölge Adım","Sırların Efendisi","Karanlık Kehanet","Hiçlik","Son Fısıltı"]],
    ["wealth","Ticaret",["İlk Satış","Pazar Kurdu","Altın Dokunuş","Pazarlık Ustası","Girişimci Ruh","Kâr Avcısı","Risk Yöneticisi","Dijital Tüccar","Mağaza Sahibi","Komisyon Kralı","Koleksiyoner","Yatırımcı Aklı","Bütçe Ninjası","Fırsat Avcısı","Ticaret Efsanesi"]],
    ["wisdom","Bilgelik",["Meraklı Zihin","Tarih Kaşifi","Felsefe Taşı","Bilgi Avcısı","Sakin Akıl","Stratejist","Soğukkanlı","Analiz Ustası","Öğrenme Makinesi","Uzak Görüşlü","Bilge Baykuş","Soru Ustası","Düşünce Mimarı","Hakikat Arayıcısı","Usta Öğrenci"]],
    ["premium","Premium",["Altın İmparator","Neon Hükümdar","Kozmik Taç","Ejderha Ruhu","Sonsuz Alev","Kızıl Elmas","Gölge Prensi","Kara Güneş","Yıldız Lordu","Efsanevi Aura","Kraliyet Mührü","Ay Tanrıçası","Zümrüt Hayalet","Ateş Kuşu","Mutlak Hâkim"]],
    ["founder","YK Özel",["İlk Gölge","YK Kurucusu","Kage Mührü","Sıfır Noktası","Efsanenin Başlangıcı","Kurucu İrade","İlk Kıvılcım","Gölge Konseyi","YK Öncüsü","Kage Hanedanı"]]
  ];
  const symbols=["✦","⚔","♡","影","☾","♛","⚡","❖","☯","✧","♜","🔥","❂","✺","◆","☄","⚙","♠","✿","⛩"];
  let badgeData=[],n=0;
  badgeGroups.forEach(([cat,label,names])=>names.forEach((name,j)=>{n++;badgeData.push({id:n,cat,label,name,symbol:symbols[(n*7+j)%symbols.length],premium:(cat==="premium"||cat==="founder"||j%5===4),animated:n%3!==0});}));
  // Fill to exactly 200 distinct badges, rotating through every category.
  const curatedCount=badgeData.length;
  while(badgeData.length<200){const id=badgeData.length+1;const base=badgeData[(id-curatedCount-1)%curatedCount];badgeData.push({id,cat:base.cat,label:base.label,name:base.name+" • "+(Math.floor((id-curatedCount-1)/curatedCount)+2),symbol:symbols[id%symbols.length],premium:id%4===0,animated:id%3!==0});}
  const owned=safeRead("kageOwnedBadges",[]);
  let badgeFilter="all",tierFilter="all";
  function renderBadges(){const grid=$("#badgeCatalog");grid.innerHTML="";badgeData.filter(b=>(badgeFilter==="all"||b.cat===badgeFilter)&&(tierFilter==="all"||(tierFilter==="premium"?b.premium:!b.premium))).forEach(b=>{
    const card=document.createElement("article");card.className="badge-card"+(b.premium?" badge-premium":"");card.dataset.badge=b.cat;
    const art=document.createElement("div");art.className="badge-art"+(b.animated?" animated":"");art.textContent=b.symbol;
    const type=document.createElement("span");type.className="badge-type";type.textContent=b.label.toUpperCase()+(b.premium?" • PREMIUM":" • ÜCRETSİZ");
    const title=document.createElement("h3");title.textContent=b.name;
    const desc=document.createElement("p");desc.textContent=b.animated?"Animasyonlu rozet tasarımı. Profilinde kimliğini öne çıkarır.":"Sabit rozet tasarımı. Profil koleksiyonuna eklenebilir.";
    const button=document.createElement("button");button.className="secondary-button";button.textContent=owned.includes(b.id)?"Profilinde göster":(b.premium?"Premium kilitli":"Rozeti seç");
    button.addEventListener("click",()=>{if(b.premium){notice("Bu rozet Premium üyelik gerektirir; ödeme/üyelik sistemi henüz bağlı değil.");return;}if(!owned.includes(b.id)){owned.push(b.id);safeWrite("kageOwnedBadges",owned);renderBadges();renderProfileBadges();notice("Rozet koleksiyonuna eklendi.");}});
    card.append(art,type,title,desc,button);grid.append(card);
  });}
  $$(".badge-filter-row [data-badge-filter]").forEach(btn=>btn.addEventListener("click",()=>{$$(".badge-filter-row [data-badge-filter]").forEach(x=>x.classList.toggle("active",x===btn));badgeFilter=btn.dataset.badgeFilter;renderBadges();}));
  $$("[data-tier]").forEach(btn=>btn.addEventListener("click",()=>{$$("[data-tier]").forEach(x=>x.classList.toggle("active",x===btn));tierFilter=btn.dataset.tier;renderBadges();}));
  function renderProfileBadges(){const box=$("#profileBadges");box.innerHTML="";const selected=badgeData.filter(b=>owned.includes(b.id));$("#profileBadgeCount").textContent=selected.length;if(!selected.length){box.textContent="Henüz rozet seçilmedi.";return;}selected.forEach(b=>{const el=document.createElement("div");el.className="profile-badge";const s=document.createElement("span");s.className="badge-symbol";s.textContent=b.symbol;const name=document.createElement("b");name.textContent=b.name;el.append(s,name);box.append(el);});}
  renderBadges();renderProfileBadges();

  // Profile customisation saved locally.
  const profile=safeRead("kageProfileV2",{name:"Kage Kullanıcısı",bio:"Kendi hikâyeni burada anlat.",frame:"red",cover:"night",coverUrl:""});
  $("#profileName").value=profile.name;$("#profileBio").value=profile.bio;
  function applyProfile(){ $("#profileNameDisplay").textContent=profile.name;$("#profileBioDisplay").textContent=profile.bio;$("#avatarFrame").className="avatar-frame frame-"+profile.frame;$("#profileCover").className="profile-cover cover-"+profile.cover;if(profile.coverUrl)$("#profileCover").style.backgroundImage=`url("${profile.coverUrl.replace(/["\\]/g,"")}"),linear-gradient(120deg,#10090b,#311018)`; }
  applyProfile();
  $("#saveProfile").addEventListener("click",()=>{profile.name=$("#profileName").value.trim()||"Kage Kullanıcısı";profile.bio=$("#profileBio").value.trim();safeWrite("kageProfileV2",profile);applyProfile();notice("Profil bilgilerin bu cihaza kaydedildi.");});
  $$("[data-frame]").forEach(btn=>btn.addEventListener("click",()=>{if(["gold","neon"].includes(btn.dataset.frame)){notice("Bu çerçeve Premium üyelik gerektirir.");return;}profile.frame=btn.dataset.frame;safeWrite("kageProfileV2",profile);applyProfile();$$("[data-frame]").forEach(x=>x.classList.toggle("selected",x===btn));}));
  $$("[data-cover]").forEach(btn=>btn.addEventListener("click",()=>{if(["dragon","moon"].includes(btn.dataset.cover)){notice("Bu kapak teması Premium üyelik gerektirir.");return;}profile.cover=btn.dataset.cover;profile.coverUrl="";safeWrite("kageProfileV2",profile);applyProfile();$$("[data-cover]").forEach(x=>x.classList.toggle("selected",x===btn));}));
  $("#applyCoverUrl").addEventListener("click",()=>{const value=$("#coverUrl").value.trim();try{const u=new URL(value);if(!["http:","https:"].includes(u.protocol))throw 0;profile.coverUrl=u.href;safeWrite("kageProfileV2",profile);applyProfile();notice("Kapak görseli uygulandı.");}catch{notice("Geçerli bir https:// görsel bağlantısı gir.");}});

  // Ten language options. Translation of individual Global messages is handled through Google Translate.
  const languageSelect=$("#languageSelect"),languageButton=$("#languageButton");
  const languages=["tr","en","ja","ko","zh","bg","it","ru","de","es"];
  const saved=localStorage.getItem("kageLanguage")||"tr";
  languageSelect.value=languages.includes(saved)?saved:"tr";languageButton.textContent=languageSelect.value.toUpperCase();
  languageSelect.addEventListener("change",()=>{localStorage.setItem("kageLanguage",languageSelect.value);languageButton.textContent=languageSelect.value.toUpperCase();notice("Dil tercihin kaydedildi. Global mesajları 🌐 Çevir düğmesiyle çevirebilirsin.");});
  languageButton.addEventListener("click",()=>{showPage("settings");languageSelect.focus();});
  const reduce=$("#reduceMotion");reduce.checked=localStorage.getItem("kageReduceMotion")==="true";document.body.classList.toggle("reduce-motion",reduce.checked);
  reduce.addEventListener("change",()=>{localStorage.setItem("kageReduceMotion",String(reduce.checked));document.body.classList.toggle("reduce-motion",reduce.checked);});
  // Existing page interactions and honest API notices.
  $("#flightSearch").addEventListener("click",()=>{const a=$("#flightFrom").value.trim(),b=$("#flightTo").value.trim(),d=$("#flightDate").value;if(!a||!b||!d){notice("Kalkış, varış ve tarih bilgilerini gir.");return;}$("#flightStatus").textContent="Arama bilgileri hazır. Canlı uçuş fiyatları için sağlayıcı API bağlantısı gerekiyor.";notice("Form kontrol edildi; canlı sonuç servisi henüz bağlı değil.");});
  $("#aiSend").addEventListener("click",()=>{const v=$("#aiPrompt").value.trim();notice(v?"AI yanıtı için sunucu ve model API bağlantısı gerekiyor.":"Önce bir istek yaz.");});
  $("#globalSearch").addEventListener("keydown",e=>{if(e.key!=="Enter")return;const q=e.target.value.trim().toLocaleLowerCase("tr");const map=[["global","global sohbet topluluk"],["games","oyun oyunlar"],["shops","mağaza ürün"],["projects","proje"],["ai","yapay zeka"],["badges","rozet"],["profile","profil"],["settings","ayar dil"],["premium","premium"],["points","puan"],["travel","ulaşım uçak"],["markets","borsa"],["analytics","analiz"]];const m=map.find(x=>x[1].includes(q)||q.includes(x[1].split(" ")[0]));if(m)showPage(m[0]);else notice("Eşleşen bölüm bulunamadı.");});
  $("#shopSearch")?.addEventListener("input",()=>notice("Mağaza araması, ürün kataloğu bağlandığında sonuç gösterecek."));
  const initial=location.hash.slice(1);if(initial&&$("#page-"+initial))showPage(initial);
})();
