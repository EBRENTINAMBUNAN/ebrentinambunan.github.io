const state = { typingPhrases: [], projects: [], projectFilter: "all" };
const pageCache = new Map(); // { page: { html, title, page } }
const pageTitles = {
  home: "Ebren Tinambunan",
  projects: "Proyek · Ebren Tinambunan",
  about: "Tentang · Ebren Tinambunan",
  contact: "Kontak · Ebren Tinambunan",
};
const pageOrder = ["home", "projects", "about", "contact"];
let currentPage = null;
let isNavigating = false;

async function loadJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Gagal memuat ${path}`, err);
    return {};
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.textContent = value;
}

function renderMetrics(metrics) {
  const wrap = document.getElementById("metrics");
  if (!wrap || !metrics) return;
  wrap.innerHTML = "";
  metrics.forEach((m) => {
    const div = document.createElement("div");
    div.className = "metric";
    div.innerHTML = `
      <span class="metric-number">${m.value || "-"}</span>
      <span class="metric-label">${m.label || ""}</span>
    `;
    wrap.appendChild(div);
  });
}

function renderCertificates(list) {
  const wrap = document.getElementById("certificates");
  if (!wrap || !list) return;
  wrap.innerHTML = "";
  list.forEach((c) => {
    const card = document.createElement("div");
    card.className = "certificate-card";
    card.innerHTML = `
      <img src="${c.image}" alt="${c.title}" class="certificate-img" />
      <div class="certificate-meta">
        <p class="title">${c.title}</p>
        <p class="desc">${c.description || c.desc || ""}</p>
      </div>
    `;
    wrap.appendChild(card);
  });
  initCertModal(); // re-bind
}

function renderStrengths(list) {
  const wrap = document.getElementById("strengths");
  if (!wrap || !list) return;
  wrap.innerHTML = "";
  list.forEach((s) => {
    const card = document.createElement("div");
    card.className = "service-card";
    const bullets = (s.bullets || [])
      .map((b) => `<li>${b}</li>`)
      .join("");
    card.innerHTML = `
      <div class="service-icon">${s.icon || "•"}</div>
      <h4>${s.title}</h4>
      <p>${s.description || s.desc || ""}</p>
      <ul>${bullets}</ul>
    `;
    wrap.appendChild(card);
  });
}

function renderProjects(list) {
  const wrap = document.getElementById("projects-grid");
  if (!wrap || !list) return;
  wrap.innerHTML = "";
  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card project-card";
    const docLink = p.code || p.demo || "";
    const status = (p.tag || "").trim().toLowerCase();
    const chipClass =
      status === "public" ? "chip-public" : status === "private" ? "chip-private" : "";
    const showDoc = status === "public" && docLink;
    card.innerHTML = `
      <div class="card-thumb">
        <img src="${p.image}" alt="${p.title}" />
      </div>
      <div class="card-body">
        <div class="card-head">
          <h4>${p.title}</h4>
          <span class="card-chip ${chipClass}">${p.tag || ""}</span>
        </div>
        <p class="muted">${p.summary || ""}</p>
        ${
          showDoc
            ? `<div class="card-actions">
                 <a href="${docLink}" target="_blank" rel="noopener" class="btn btn-primary">Lihat Dokumentasi</a>
               </div>`
            : ""
        }
      </div>
    `;
    wrap.appendChild(card);
  });
}

function renderStats(list) {
  const wrap = document.getElementById("project-stats");
  if (!wrap || !list) return;
  wrap.innerHTML = "";
  list.forEach((s) => {
    const card = document.createElement("button");
    card.type = "button";
    const filterClass = s.filter ? `filter-${s.filter}` : "";
    card.className = `stat-card ${filterClass}`;
    if (s.filter) card.dataset.filter = s.filter;
    card.innerHTML = `
      <div class="stat-top">
        <span class="stat-dot ${filterClass}"></span>
        <p class="stat-label">${s.label}</p>
      </div>
      <p class="stat-value">${s.value}</p>
      <p class="stat-desc">${s.desc || ""}</p>
    `;
    wrap.appendChild(card);
  });
}

function bindProjectFilters() {
  const cards = document.querySelectorAll(".stat-card[data-filter]");
  if (!cards.length) return;
  const setActive = (filter) => {
    cards.forEach((c) => c.classList.toggle("active", c.dataset.filter === filter));
  };
  const applyFilter = (filter) => {
    state.projectFilter = filter;
    setActive(filter);
    let filtered = state.projects;
    if (filter === "public") {
      filtered = state.projects.filter(
        (p) => (p.tag || "").trim().toLowerCase() === "public"
      );
    } else if (filter === "private") {
      filtered = state.projects.filter(
        (p) => (p.tag || "").trim().toLowerCase() === "private"
      );
    }
    renderProjects(filtered);
  };
  cards.forEach((card) => {
    card.addEventListener("click", () => applyFilter(card.dataset.filter || "all"));
  });
  applyFilter(state.projectFilter || "all");
}

function renderTestimonial(t) {
  if (!t) return;
  setText("testimonial-quote", t.quote);
  setText("testimonial-name", t.name);
}

function renderTimeline(list) {
  const wrap = document.getElementById("timeline");
  if (!wrap || !list) return;
  wrap.innerHTML = "";
  list.forEach((item) => {
    const row = document.createElement("div");
    row.className = "timeline-item";
    row.innerHTML = `
      <span class="timeline-dot"></span>
      <div>
        <p class="timeline-title">${item.year} · ${item.title}</p>
        <p class="muted">${item.desc}</p>
      </div>
    `;
    wrap.appendChild(row);
  });
}

function renderValues(list) {
  const wrap = document.getElementById("values-grid");
  if (!wrap || !list) return;
  wrap.innerHTML = "";
  list.forEach((v) => {
    const card = document.createElement("div");
    card.className = "value-card";
    card.innerHTML = `<h4>${v.title}</h4><p class="muted">${v.desc}</p>`;
    wrap.appendChild(card);
  });
}

function renderInfoCards(list) {
  const wrap = document.getElementById("info-grid");
  if (!wrap || !list) return;
  wrap.innerHTML = "";
  list.forEach((i) => {
    const card = document.createElement("div");
    card.className = "info-card";
    card.innerHTML = `
      <p class="stat-label">${i.label}</p>
      <p class="stat-value">${i.value}</p>
      <p class="muted">${i.desc}</p>
    `;
    wrap.appendChild(card);
  });
}

function renderStacks(list) {
  const wrap = document.getElementById("stack-grid");
  if (!wrap || !list) return;
  wrap.innerHTML = "";
  const groups = list.reduce((acc, item) => {
    const key = (item.category || "lainnya").toLowerCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  const titleMap = {
    "bahasa pemrograman": "Bahasa Pemrograman",
    framework: "Framework / Library",
    tools: "Tools & DevOps",
  };
  Object.entries(groups).forEach(([cat, items]) => {
    const card = document.createElement("div");
    card.className = "tool-card stack-card";
    const rows = items
      .map(
        (i, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${i.name}</td>
            <td class="level">${i.level}</td>
          </tr>
        `
      )
      .join("");
    card.innerHTML = `
      <div class="stack-card-head">
        <h4>${titleMap[cat] || cat}</h4>
        <span class="pill">${items.length} item</span>
      </div>
      <table class="stack-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
    wrap.appendChild(card);
  });
}

function renderCTA(prefix, data) {
  if (!data) return;
  setText(`${prefix}-eyebrow`, data.eyebrow);
  setText(`${prefix}-heading`, data.heading);
  setText(`${prefix}-primary`, data.primaryText);
  setText(`${prefix}-secondary`, data.secondaryText);
}

function hydrateHome(data) {
  const profile = data.profile || {};
  const typingList =
    (data.typing || profile.typing || []).map((t) => (typeof t === "string" ? t : t.title)).filter(Boolean);
  setText("badge-availability", profile.availability || "");
  setText("badge-role", profile.roleTag || "");
  setText("hero-name", profile.name);
  setText("lead-text", profile.description || profile.lead || "");
  setText("mini-card", profile.title || profile.miniCard || "");
  renderMetrics(data.metrics || profile.metrics);
  renderCertificates(data.certificates);
  renderStrengths(data.strengths);
  renderCTA("brand", data.ctaBrand);
  startTyping(typingList);
}

function hydrateProjects(data) {
  const baseProjects = data.projects || [];
  const derived =
    (!baseProjects || baseProjects.length === 0) && data.project
      ? data.project.flatMap((cat) =>
          (cat.items || []).map((item) => ({
            title: item.name,
            tag: (cat.status || "").charAt(0).toUpperCase() + (cat.status || "").slice(1),
            summary: item.description || item.note || "",
            role: "",
            impact: "",
            image: "assets/img/project.png",
            demo: "",
            code: item.doc || item.docs || "",
          }))
        )
      : baseProjects;

  // Normalize flat project structure (name/status/description/docs) to card format
  const projects = derived.map((p) => ({
    title: p.title || p.name || "-",
    tag:
      p.tag ||
      (p.status
        ? `${p.status}`.charAt(0).toUpperCase() + `${p.status}`.slice(1)
        : ""),
    summary: p.summary || p.description || "",
    role: p.role || "",
    impact: p.impact || "",
    image: p.image || "assets/img/project.png",
    demo: p.demo || "",
    code: p.code || p.docs || "",
  }));
  state.projects = projects;
  state.projectFilter = "all";
  setText("projects-intro", data.intro || "Berikut beberapa proyek yang pernah saya bangun.");
  const totalPublic = projects.filter(
    (p) => (p.tag || "").trim().toLowerCase() === "public"
  ).length;
  const totalPrivate = projects.filter(
    (p) => (p.tag || "").trim().toLowerCase() === "private"
  ).length;
  const totalAll = projects.length;
  const stats = [
    { label: "Total Project", value: totalAll, desc: "Semua proyek", filter: "all" },
    { label: "Public Project", value: totalPublic, desc: "Dokumentasi tersedia", filter: "public" },
    { label: "Private Project", value: totalPrivate, desc: "Dokumentasi tertutup", filter: "private" },
  ];
  renderStats(stats);
  bindProjectFilters();
}

function hydrateAbout(data) {
  setText("about-intro", data.intro);
  renderStacks(data.techStacks);
  renderTimeline(data.timeline);
  renderValues(data.values);
}

function hydrateContact(data) {
  renderInfoCards(data.infoCards);
  renderCTA("contact", data.contactCTA);
}

/* ---------------------------
          TYPING EFFECT
----------------------------- */
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let delay = 500;
let typingElement;
let cursor;
let typingTimer = null;
let blinkTimer = null;

function type() {
  if (!typingElement || !cursor || !state.typingPhrases.length) return;
  const currentPhrase = state.typingPhrases[phraseIndex] || "";
  const currentText = currentPhrase.substring(0, charIndex);
  typingElement.textContent = currentText;

  if (!isDeleting) {
    if (charIndex < currentPhrase.length) {
      charIndex++;
    } else {
      isDeleting = true;
      delay = 1200;
    }
  } else if (charIndex > 0) {
    charIndex--;
  } else {
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % state.typingPhrases.length;
    delay = 300;
  }

  typingTimer = setTimeout(type, isDeleting ? 50 : delay);
}

function blinkCursor() {
  if (!cursor) return;
  cursor.style.opacity = cursor.style.opacity === "0" ? "1" : "0";
}

function resetTyping() {
  if (typingTimer) clearTimeout(typingTimer);
  if (blinkTimer) clearInterval(blinkTimer);
  typingTimer = null;
  blinkTimer = null;
  phraseIndex = 0;
  charIndex = 0;
  isDeleting = false;
}

function startTyping(phrases) {
  if (phrases && phrases.length) state.typingPhrases = phrases;
  resetTyping();
  typingElement = document.getElementById("typing-text");
  cursor = document.getElementById("cursor");
  if (typingElement && cursor && state.typingPhrases.length) {
    type();
    blinkTimer = setInterval(blinkCursor, 500);
  }
}

/* ============================
      MUSIC PLAYER BUTTON
============================= */
function initMusic() {
  const music = document.getElementById("bg-music");
  const musicBtn = document.getElementById("music-btn");
  let isPlaying = false;
  if (!(music && musicBtn)) return;
  if (musicBtn.dataset.bound === "true") return;
  musicBtn.dataset.bound = "true";
  if (music && musicBtn) {
    musicBtn.addEventListener("click", () => {
      if (!isPlaying) {
        music.play();
        isPlaying = true;
        musicBtn.textContent = "⏸️ Hentikan Musik";
      } else {
        music.pause();
        isPlaying = false;
        musicBtn.textContent = "🎵 Putar Musik";
      }
    });
  }
}

/* ===========================
   VIDEO MODAL HANDLER
=========================== */
function initVideoModal() {
  const modal = document.getElementById("videoModal");
  const modalVideo = document.getElementById("modal-video");
  const closeBtn = document.querySelector(".modal .close");
  if (!(modal && modalVideo && closeBtn)) return;

  document.querySelectorAll(".demo-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const videoURL = btn.dataset.video;
      if (!videoURL) return;
      modalVideo.src = videoURL;
      modal.style.display = "block";
    });
  });

  closeBtn.onclick = () => {
    modal.style.display = "none";
    modalVideo.src = "";
  };
  window.onclick = (e) => {
    if (e.target == modal) {
      modal.style.display = "none";
      modalVideo.src = "";
    }
  };
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") {
      modal.style.display = "none";
      modalVideo.src = "";
    }
  });
}

/* ===========================
   MODAL GAMBAR SERTIFIKAT
=========================== */
function initCertModal() {
  const certModal = document.getElementById("certificateModal");
  const certImg = document.getElementById("modal-cert-img");
  const certCloseBtn = document.querySelector(".close-cert");
  if (!(certModal && certImg && certCloseBtn)) return;

  document.querySelectorAll(".certificate-img").forEach((img) => {
    img.addEventListener("click", () => {
      certImg.src = img.src;
      certModal.style.display = "block";
    });
  });

  certCloseBtn.onclick = () => {
    certModal.style.display = "none";
    certImg.src = "";
  };
  window.addEventListener("click", (e) => {
    if (e.target === certModal) {
      certModal.style.display = "none";
      certImg.src = "";
    }
  });
}

/* ---------------------------
   NAV ACTIVE STATE (MPA)
----------------------------- */
function setNavActive() {
  const currentPage = document.body.dataset.page;
  const navLinks = document.querySelectorAll("nav.bottom-nav a[data-page]");
  if (currentPage && navLinks.length) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.page === currentPage);
    });
  }
}

function getPageFromHref(href) {
  if (!href) return null;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    const file = (url.pathname.split("/").pop() || "").toLowerCase();
    if (file.startsWith("projects")) return "projects";
    if (file.startsWith("about")) return "about";
    if (file.startsWith("contact")) return "contact";
    if (file === "" || file === "index.html") return "home";
  } catch (e) {
    return null;
  }
  return null;
}

function toggleLoader(active) {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  if (active) loader.classList.add("active"); else loader.classList.remove("active");
}

function ensureSharedElements() {
  if (!document.getElementById("videoModal")) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div id="videoModal" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <div class="video-wrapper">
            <iframe id="modal-video" width="100%" height="315" src="" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  if (!document.getElementById("certificateModal")) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div id="certificateModal" class="modal">
        <div class="modal-content">
          <span class="close-cert">&times;</span>
          <img
            id="modal-cert-img"
            src=""
            alt="Preview Sertifikat"
            style="width: 100%; height: auto; border-radius: 12px"
          />
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  if (!document.getElementById("bg-music")) {
    const audio = document.createElement("audio");
    audio.id = "bg-music";
    audio.loop = true;
    audio.innerHTML = `<source src="assets/mp3/home.mp3" type="audio/mpeg" />`;
    document.body.appendChild(audio);
  }

  if (!document.getElementById("page-loader")) {
    const loader = document.createElement("div");
    loader.id = "page-loader";
    loader.innerHTML = `
      <div class="loader-inner">
        <div class="loader-ring"></div>
        <p>Memuat...</p>
      </div>
    `;
    document.body.appendChild(loader);
  }
}

function getTemplateHTML(page) {
  const tpl = page === "home" ? null : document.getElementById(`tpl-${page}`);
  if (tpl) return tpl.innerHTML;
  if (pageCache.has("home")) return pageCache.get("home").html;
  return null;
}

async function hydrateForPage(page) {
  resetTyping();
  if (page === "home") {
    const data = await loadJson("assets/data/index.json");
    state.typingPhrases = data.profile?.typing || [];
    hydrateHome(data);
    initMusic();
    return;
  }

  if (page === "projects") {
    const data = await loadJson("assets/data/projects.json");
    hydrateProjects(data);
    return;
  }

  if (page === "about") {
    const data = await loadJson("assets/data/about.json");
    hydrateAbout(data);
    return;
  }

  if (page === "contact") {
    const data = await loadJson("assets/data/contact.json");
    hydrateContact(data);
  }
}

async function applyPage(page, { push = true } = {}) {
  const main = document.querySelector("main");
  let html = "";
  if (page === "home") {
    html = pageCache.get("home")?.html || (main ? main.innerHTML : "");
  } else {
    html = getTemplateHTML(page);
  }

  if (!html) return;
  if (main) {
    main.dataset.state = "out";
    await new Promise((r) => setTimeout(r, 140));
    main.innerHTML = html;
    main.dataset.state = "in";
  }

  document.body.dataset.page = page;
  document.title = pageTitles[page] || pageTitles.home;
  setNavActive();
  await hydrateForPage(page);

  if (push) {
    history.pushState({ page }, document.title, window.location.pathname);
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function navigateTo(page, options = {}) {
  const target = page || "home";
  if (target === currentPage && !options.force) return;
  if (isNavigating) return;
  isNavigating = true;
  toggleLoader(true);
  try {
    await applyPage(target, { push: options.push !== false });
    currentPage = target;
  } catch (err) {
    console.error(err);
  } finally {
    toggleLoader(false);
    isNavigating = false;
  }
}

function handleLinkClick(e) {
  const anchor = e.target.closest("a");
  if (!anchor) return;
  if (anchor.target === "_blank") return;
  const page = anchor.dataset.page || getPageFromHref(anchor.getAttribute("href"));
  if (!page) return;
  e.preventDefault();
  navigateTo(page);
}

function onPopState(e) {
  const page = e.state?.page || "home";
  navigateTo(page, { push: false, force: true });
}

function nextPage(current, direction) {
  const idx = pageOrder.indexOf(current);
  if (idx === -1) return current;
  const nextIdx = (idx + direction + pageOrder.length) % pageOrder.length;
  return pageOrder[nextIdx];
}

function bindSwipeNavigation() {
  const main = document.querySelector("main");
  if (!main) return;
  let startX = 0;
  let startY = 0;
  let tracking = false;

  main.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  });

  main.addEventListener("touchmove", (e) => {
    if (!tracking) return;
    if (Math.abs(e.touches[0].clientY - startY) > 80) {
      tracking = false; // vertical scroll, cancel swipe
    }
  });

  main.addEventListener("touchend", (e) => {
    if (!tracking) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    tracking = false;
    const threshold = 60;
    if (Math.abs(dx) < threshold) return;
    const direction = dx < 0 ? 1 : -1; // swipe left -> next
    const target = nextPage(currentPage || "home", direction);
    navigateTo(target);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  ensureSharedElements();
  const main = document.querySelector("main");
  pageCache.set("home", {
    html: main ? main.innerHTML : "",
    title: document.title,
    page: "home",
  });
  const initialStatePage = history.state?.page;
  currentPage =
    initialStatePage && ["home", "projects", "about", "contact"].includes(initialStatePage)
      ? initialStatePage
      : "home";
  if (!history.state || !history.state.page) {
    history.replaceState({ page: currentPage }, document.title, window.location.pathname);
  }
  setNavActive();
  await hydrateForPage(currentPage);
  if (main) main.dataset.state = "in";
  document.addEventListener("click", handleLinkClick);
  window.addEventListener("popstate", onPopState);
  bindSwipeNavigation();
  if (currentPage !== "home") {
    navigateTo(currentPage, { push: false, force: true });
  }
});
