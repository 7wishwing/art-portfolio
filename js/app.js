(function () {
  const worksView = document.getElementById("works-view");
  const aboutView = document.getElementById("about-view");
  const cvView = document.getElementById("cv-view");
  const detailView = document.getElementById("detail-view");
  const worksGrid = document.getElementById("works-grid");
  const categoryNav = document.getElementById("category-nav");
  const navLinks = document.querySelectorAll(".nav a, .logo");
  let videoNavDirection = null;
  let videoBusy = false;
  let videoTimer = 0;
  let currentVideoId = null;

  const CV_SECTIONS = [
    { key: "education", title: "Education" },
    { key: "awards", title: "Awards & Honors" },
    { key: "exhibitions", title: "Selected Exhibitions" },
    { key: "projects", title: "Projects & Programs" },
    { key: "experience", title: "Professional Experience" },
  ];

  function textValue(value) {
    if (value == null) return "";
    return String(value).trim();
  }

  function categoriesWithWorks() {
    return CATEGORIES.filter((category) => WORKS.some((work) => work.category === category.id));
  }

  function findCategory(id) {
    return CATEGORIES.find((category) => category.id === id) || null;
  }

  function worksInCategory(categoryId) {
    return WORKS.filter((work) => work.category === categoryId).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  }

  function defaultCategoryId() {
    const first = categoriesWithWorks()[0];
    return first ? first.id : null;
  }

  function setPageTitle(extra) {
    document.title = extra ? extra + " — " + ARTIST.siteTitle : ARTIST.siteTitle;
  }

  function showView(name, options) {
    const views = { works: worksView, about: aboutView, cv: cvView, detail: detailView };
    Object.entries(views).forEach(([key, el]) => {
      const active = key === name;
      el.hidden = !active;
      el.classList.toggle("is-active", active);
    });

    document.querySelectorAll(".nav a").forEach((link) => {
      const view = link.getAttribute("data-view");
      const current = view === name || (name === "detail" && view === "works");
      link.classList.toggle("is-current", current);
    });

    if (name !== "works") document.body.classList.remove("is-drawing-page");
    if (name !== "works") pausePageVideo();
    if (!(options && options.keepScroll)) window.scrollTo(0, 0);
  }

  function isVideoPage() {
    return !worksView.hidden && !!worksGrid.querySelector(".video-page");
  }

  function resetVideoFrame() {
    const frame = document.getElementById("video-frame");
    if (!frame) return;
    frame.classList.remove("is-leave-next", "is-leave-prev", "is-enter-next", "is-enter-prev");
  }

  function stopVideoTransition() {
    if (videoTimer) {
      window.clearTimeout(videoTimer);
      videoTimer = 0;
    }
    videoBusy = false;
    resetVideoFrame();
  }

  function pausePageVideo() {
    stopVideoTransition();
    const video = document.getElementById("page-video");
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  function loadVideoWork(work) {
    const video = document.getElementById("page-video");
    if (!video || !work) return;
    currentVideoId = work.id;
    video.pause();
    try {
      video.currentTime = 0;
    } catch (err) {}
    video.autoplay = true;
    video.playsInline = true;
    video.muted = false;
    video.poster = imageSrc(work.image);
    video.src = imageSrc(work.video);
    video.setAttribute("aria-label", workLabel(work));
    video.setAttribute("preload", "auto");
    function tryPlay() {
      if (currentVideoId !== work.id) return;
      const play = video.play();
      if (play && play.catch) {
        play.catch(function () {
          if (currentVideoId !== work.id) return;
          video.muted = true;
          video.play().catch(function () {});
        });
      }
    }
    if (video.readyState >= 2) tryPlay();
    else video.addEventListener("canplay", tryPlay, { once: true });
  }

  function updateVideoMeta(work) {
    currentVideoId = work.id;
    const titleEl = document.getElementById("video-title");
    const yearEl = document.getElementById("video-year");
    const meta = document.querySelector(".video-meta");
    const title = textValue(work.title);
    const year = textValue(work.year);
    if (titleEl) titleEl.textContent = title;
    if (yearEl) yearEl.textContent = year;
    if (titleEl) titleEl.hidden = !title;
    if (yearEl) yearEl.hidden = !year;
    if (meta) meta.hidden = !(title || year);
    const category = findCategory("video");
    setPageTitle(title || (category ? category.label : ARTIST.siteTitle));
  }

  function runVideoTransition(work, direction) {
    const video = document.getElementById("page-video");
    const frame = document.getElementById("video-frame");
    if (!video || !frame) {
      loadVideoWork(work);
      updateVideoMeta(work);
      return;
    }
    video.pause();
    if (prefersReducedMotion()) {
      loadVideoWork(work);
      updateVideoMeta(work);
      return;
    }
    videoBusy = true;
    const leaveClass = direction === "next" ? "is-leave-next" : "is-leave-prev";
    const enterClass = direction === "next" ? "is-enter-next" : "is-enter-prev";
    frame.classList.add(leaveClass);
    videoTimer = window.setTimeout(function () {
      if (!isVideoPage()) {
        videoBusy = false;
        videoTimer = 0;
        return;
      }
      loadVideoWork(work);
      updateVideoMeta(work);
      frame.classList.remove(leaveClass);
      frame.classList.add(enterClass);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          frame.classList.remove(enterClass);
          videoBusy = false;
          videoTimer = 0;
        });
      });
    }, 320);
  }

  function getCurrentVideoWork() {
    const list = worksInCategory("video");
    return list.find(function (item) { return item.id === currentVideoId; }) || list[0] || null;
  }

  function goVideoNeighbor(offset) {
    if (!isVideoPage() || videoBusy) return;
    const work = getCurrentVideoWork();
    if (!work) return;
    const target = neighbor(work, offset);
    if (!target || target.id === work.id) return;
    videoNavDirection = offset > 0 ? "next" : "prev";
    location.hash = "works/video/" + encodeURIComponent(target.id);
  }

  function buildVideoPage() {
    const page = document.createElement("article");
    page.className = "video-page";

    const stage = document.createElement("div");
    stage.className = "video-stage";
    stage.id = "video-stage";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "video-arrow is-prev";
    prev.id = "video-prev";
    prev.setAttribute("aria-label", "이전 영상");
    prev.innerHTML = '<span aria-hidden="true">‹</span>';

    const frame = document.createElement("div");
    frame.className = "video-frame";
    frame.id = "video-frame";
    const video = document.createElement("video");
    video.id = "page-video";
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("preload", "auto");
    frame.appendChild(video);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "video-arrow is-next";
    next.id = "video-next";
    next.setAttribute("aria-label", "다음 영상");
    next.innerHTML = '<span aria-hidden="true">›</span>';

    stage.append(prev, frame, next);

    const meta = document.createElement("div");
    meta.className = "video-meta";
    const title = document.createElement("span");
    title.id = "video-title";
    title.className = "work-title";
    const year = document.createElement("span");
    year.id = "video-year";
    year.className = "work-year";
    meta.append(title, year);

    page.append(stage, meta);
    worksGrid.appendChild(page);
  }

  function renderVideoPage(workId) {
    const list = worksInCategory("video");
    const work = list.find(function (item) { return item.id === workId; }) || list[0];
    if (!work) return;

    document.body.classList.remove("is-drawing-page");
    unbindFloatMouse();
    worksGrid.style.height = "";

    const direction = videoNavDirection;
    videoNavDirection = null;
    const already = worksGrid.querySelector(".video-page");

    if (already && direction) {
      runVideoTransition(work, direction);
      return;
    }

    stopVideoTransition();
    worksGrid.className = "works-grid is-video";
    worksGrid.innerHTML = "";
    renderCategoryNav("video");
    buildVideoPage();
    loadVideoWork(work);
    updateVideoMeta(work);
  }

  function renderGame(categoryId) {
    worksGrid.className = "works-grid is-game";
    worksGrid.style.height = "";
    unbindFloatMouse();
    worksGrid.innerHTML = "";
    renderCategoryNav(categoryId);

    worksInCategory(categoryId).forEach(function (work) {
      const link = document.createElement("a");
      link.className = "game-card";
      link.href = textValue(work.url) || "#works/game";
      if (work.url) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      link.setAttribute("aria-label", (workLabel(work) || "Game") + " 열기");

      const figure = document.createElement("figure");
      const thumb = document.createElement("div");
      thumb.className = "thumb";
      const img = document.createElement("img");
      img.src = imageSrc(work.image);
      img.alt = workLabel(work);
      const play = document.createElement("span");
      play.className = "game-play";
      play.textContent = "Play";
      play.setAttribute("aria-hidden", "true");
      thumb.append(img, play);
      figure.appendChild(thumb);

      const title = textValue(work.title);
      const year = textValue(work.year);
      const note = textValue(work.description);
      if (title || year || note) {
        const caption = document.createElement("figcaption");
        caption.className = "game-meta";
        if (title) {
          const titleEl = document.createElement("span");
          titleEl.className = "work-title";
          titleEl.textContent = title;
          caption.appendChild(titleEl);
        }
        if (note) {
          const noteEl = document.createElement("span");
          noteEl.className = "game-note";
          noteEl.textContent = note;
          caption.appendChild(noteEl);
        }
        if (year) {
          const yearEl = document.createElement("span");
          yearEl.className = "work-year";
          yearEl.textContent = year;
          caption.appendChild(yearEl);
        }
        figure.appendChild(caption);
      }

      link.appendChild(figure);
      worksGrid.appendChild(link);
    });
  }

  function renderArtist() {
    document.querySelector(".logo").textContent = ARTIST.name;
    document.getElementById("about-name").textContent = ARTIST.name;
    document.getElementById("about-location").textContent = ARTIST.location;
    const bio = document.getElementById("about-bio");
    bio.textContent = ARTIST.bio || "";
    bio.hidden = !textValue(ARTIST.bio);
    document.getElementById("cv-name").textContent = ARTIST.nameKo
      ? ARTIST.name + "  " + ARTIST.nameKo
      : ARTIST.name;
    document.getElementById("footer-copy").textContent =
      "© " + new Date().getFullYear() + " " + ARTIST.name;

    const statement = document.getElementById("about-statement");
    statement.innerHTML = "";
    ARTIST.statement.forEach((line, index) => {
      const p = document.createElement("p");
      p.textContent = line;
      if (index === 0) p.className = "about-lead";
      statement.appendChild(p);
    });

    const email = document.getElementById("about-email");
    const contact = ARTIST.email || "";
    const isWeb = contact.indexOf("http://") === 0 || contact.indexOf("https://") === 0;
    email.href = isWeb ? contact : "mailto:" + contact;
    email.textContent = isWeb ? "Brunch" : contact;
    if (isWeb) {
      email.target = "_blank";
      email.rel = "noopener noreferrer";
    } else {
      email.removeAttribute("target");
      email.removeAttribute("rel");
    }

    const instagram = document.getElementById("about-instagram");
    if (ARTIST.instagram) {
      instagram.href = ARTIST.instagram;
      instagram.hidden = false;
    } else {
      instagram.hidden = true;
    }

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", ARTIST.name + " — 시각예술 포트폴리오");
  }

  function renderCvItem(entry) {
    const item = document.createElement("li");
    item.className = "cv-item";
    if (!entry.year) item.classList.add("is-noyear");

    if (entry.year) {
      const year = document.createElement("span");
      year.className = "cv-year";
      year.textContent = entry.year;
      item.appendChild(year);
    }

    const body = document.createElement("div");
    body.className = "cv-body";

    const title = document.createElement("p");
    title.className = "cv-title";
    title.textContent = entry.title;
    if (entry.note) {
      const note = document.createElement("span");
      note.className = "cv-note";
      note.textContent = "(" + entry.note + ")";
      title.append(" ", note);
    }

    body.appendChild(title);
    if (entry.place) {
      const place = document.createElement("p");
      place.className = "cv-place";
      place.textContent = entry.place;
      body.appendChild(place);
    }
    (entry.lines || []).forEach((line) => {
      const detail = document.createElement("p");
      detail.className = "cv-detail";
      detail.textContent = line;
      body.appendChild(detail);
    });

    item.appendChild(body);
    return item;
  }

  function renderCv() {
    const root = document.getElementById("cv-sections");
    root.innerHTML = "";

    CV_SECTIONS.forEach((section) => {
      const entries = CV[section.key] || [];
      const wrap = document.createElement("section");
      wrap.className = "cv-section";

      const heading = document.createElement("h2");
      heading.textContent = section.title;
      wrap.appendChild(heading);

      const list = document.createElement("ul");
      list.className = "cv-list";
      if (!entries.length) {
        const empty = document.createElement("li");
        empty.className = "cv-item cv-empty";
        empty.textContent = "항목을 js/data.js의 CV에서 추가할 수 있습니다.";
        list.appendChild(empty);
      } else {
        entries.forEach((entry) => list.appendChild(renderCvItem(entry)));
      }

      wrap.appendChild(list);
      root.appendChild(wrap);
    });
  }

  function renderCategoryNav(activeId) {
    categoryNav.innerHTML = "";
    const cats = categoriesWithWorks();
    cats.forEach((category) => {
      const link = document.createElement("a");
      link.href = "#works/" + encodeURIComponent(category.id);
      link.textContent = category.label;
      if (category.id === activeId) link.classList.add("is-current");
      categoryNav.appendChild(link);
    });
    categoryNav.hidden = cats.length === 0;
  }

  function workLabel(work) {
    if (work.type === "view") return "Exhibition view";
    const title = textValue(work.title);
    if (title) return title;
    if (work.category === "drawing") return "Drawing";
    const category = findCategory(work.category);
    const n = String(work.order || "").padStart(2, "0");
    return category ? category.label + " " + n : "Work";
  }

  function workImages(work) {
    if (work.images && work.images.length) return work.images;
    return work.image ? [work.image] : [];
  }

  function imageSrc(path) {
    return encodeURI(path);
  }

  function renderWorkMeta(work) {
    const dl = document.createElement("dl");
    dl.className = "sculpture-meta";
    [
      ["작품명", work.title],
      ["연도", work.year],
      ["재료", work.medium],
      ["크기", work.size],
    ].forEach(function (field) {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = field[0];
      const dd = document.createElement("dd");
      const text = textValue(field[1]);
      dd.textContent = text;
      if (!text) dd.classList.add("is-placeholder");
      row.append(dt, dd);
      dl.appendChild(row);
    });
    return dl;
  }

  function renderSculpture(categoryId) {
    unbindFloatMouse();
    worksGrid.className = "works-grid is-sculpture";
    worksGrid.style.height = "";
    worksGrid.innerHTML = "";
    renderCategoryNav(categoryId);

    worksInCategory(categoryId).forEach(function (work) {
      const piece = document.createElement("article");
      piece.className = "sculpture-work";
      const photos = workImages(work);
      const images = document.createElement("div");
      images.className = "sculpture-images is-1";

      const link = document.createElement("a");
      link.href = "#work/" + encodeURIComponent(work.id);
      const thumb = document.createElement("div");
      thumb.className = "thumb";
      const img = document.createElement("img");
      img.src = imageSrc(photos[0]);
      img.alt = workLabel(work);
      thumb.appendChild(img);
      if (photos[1]) {
        thumb.classList.add("has-hover");
        const hover = document.createElement("img");
        hover.className = "thumb-hover";
        hover.src = imageSrc(photos[1]);
        hover.alt = "";
        hover.setAttribute("aria-hidden", "true");
        thumb.appendChild(hover);
      }
      link.appendChild(thumb);
      images.appendChild(link);

      piece.appendChild(images);
      piece.appendChild(renderWorkMeta(work));
      worksGrid.appendChild(piece);
    });
  }

  const FLOAT_FACTORS = [1.38, 0.9, 1.14, 1.0, 1.42, 0.86, 1.22, 0.96, 1.08, 1.32, 0.88, 1.04, 1.26, 0.94, 1.16, 0.84, 1.1];
  const FLOAT_HOVER_BOOST = {
    "drawing-01": 1.45,
    "drawing-02": 1.35,
    "drawing-05": 1.2,
    "drawing-07": 1.45,
    "drawing-10": 1.1,
    "drawing-11": 1.1,
    "drawing-12": 1.1,
    "drawing-13": 1.1,
    "drawing-16": 1.12,
    "drawing-17": 1.35,
  };
  const FLOAT_HOVER_MAX = {
    "drawing-16": 1.52,
  };
  let floatLayoutFrame = 0;
  let floatResizeObs = null;
  let floatMouse = { x: 0, y: 0, inside: false };
  let floatMouseRaf = 0;
  let floatMouseCtrl = null;

  function prefersFineHover() {
    return window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function onFloatMouseMove(event) {
    const rect = worksGrid.getBoundingClientRect();
    floatMouse.x = event.clientX - rect.left;
    floatMouse.y = event.clientY - rect.top;
    floatMouse.inside = true;
    if (!floatMouseRaf) floatMouseRaf = requestAnimationFrame(tickFloatMouse);
  }

  function onFloatMouseLeave() {
    floatMouse.inside = false;
    if (!floatMouseRaf) floatMouseRaf = requestAnimationFrame(tickFloatMouse);
  }

  function tickFloatMouse() {
    floatMouseRaf = 0;
    if (!worksGrid.classList.contains("is-float")) return;
    const items = worksGrid.querySelectorAll(".float-orb");
    if (!items.length) return;
    const W = worksGrid.clientWidth;
    const H = worksGrid.clientHeight;
    const radius = Math.min(W, H) * 0.34;
    let moving = false;

    Array.prototype.forEach.call(items, function (el) {
      const react = el.querySelector(".float-react");
      if (!react) return;
      let gx = 0;
      let gy = 0;
      if (floatMouse.inside) {
        const left = parseFloat(el.style.left) || 0;
        const top = parseFloat(el.style.top) || 0;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const cx = left + w / 2;
        const cy = top + h / 2;
        const dx = cx - floatMouse.x;
        const dy = cy - floatMouse.y;
        const dist = Math.hypot(dx, dy) || 1;
        const falloff = Math.max(0, 1 - dist / radius);
        const force = falloff * falloff * (el.matches(":hover") ? 10 : 38);
        gx = (dx / dist) * force + (floatMouse.x / W - 0.5) * -10;
        gy = (dy / dist) * force + (floatMouse.y / H - 0.5) * -8;
        const nx = left + gx;
        const ny = top + gy;
        if (nx < 8) gx += 8 - nx;
        if (ny < 8) gy += 8 - ny;
        if (nx + w > W - 8) gx -= nx + w - (W - 8);
        if (ny + h > H - 8) gy -= ny + h - (H - 8);
      }
      const curX = parseFloat(react.dataset.mx || "0");
      const curY = parseFloat(react.dataset.my || "0");
      const nextX = curX + (gx - curX) * 0.14;
      const nextY = curY + (gy - curY) * 0.14;
      if (Math.abs(nextX) > 0.15 || Math.abs(nextY) > 0.15 || Math.abs(gx) > 0.15 || Math.abs(gy) > 0.15) {
        moving = true;
      }
      react.dataset.mx = String(nextX);
      react.dataset.my = String(nextY);
      react.style.transform = "translate3d(" + nextX.toFixed(2) + "px, " + nextY.toFixed(2) + "px, 0)";
    });

    if (moving || floatMouse.inside) {
      floatMouseRaf = requestAnimationFrame(tickFloatMouse);
    }
  }

  function bindFloatMouse() {
    if (floatMouseCtrl) floatMouseCtrl.abort();
    floatMouseCtrl = new AbortController();
    floatMouse.inside = false;
    if (!prefersFineHover() || prefersReducedMotion()) return;
    const signal = floatMouseCtrl.signal;
    worksGrid.addEventListener("mousemove", onFloatMouseMove, { signal: signal, passive: true });
    worksGrid.addEventListener("mouseleave", onFloatMouseLeave, { signal: signal });
  }

  function unbindFloatMouse() {
    if (floatMouseCtrl) floatMouseCtrl.abort();
    floatMouseCtrl = null;
    floatMouse.inside = false;
    if (floatMouseRaf) {
      cancelAnimationFrame(floatMouseRaf);
      floatMouseRaf = 0;
    }
  }

  function scheduleFloatLayout() {
    cancelAnimationFrame(floatLayoutFrame);
    floatLayoutFrame = requestAnimationFrame(layoutFloatField);
  }

  function bindFloatResize() {
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", scheduleFloatLayout);
      return;
    }
    if (floatResizeObs) floatResizeObs.disconnect();
    floatResizeObs = new ResizeObserver(scheduleFloatLayout);
    floatResizeObs.observe(worksGrid);
  }

  function layoutFloatField() {
    if (!worksGrid.classList.contains("is-float")) return;
    const items = Array.prototype.slice.call(worksGrid.querySelectorAll(".float-orb"));
    if (!items.length) return;

    const W = worksGrid.clientWidth;
    const H = worksGrid.clientHeight;
    if (W < 40 || H < 40) return;

    const gap = Math.max(18, Math.min(W, H) * 0.026);
    const pad = Math.max(20, gap);
    const golden = Math.PI * (3 - Math.sqrt(5));

    function tryPack(sizeScale) {
      const placed = [];
      const n = items.length;
      const cx = W / 2;
      const cy = H / 2;
      const maxR = Math.min(W, H) * 0.44;

      for (let i = 0; i < n; i++) {
        const el = items[i];
        const factor = parseFloat(el.style.getPropertyValue("--orb-factor")) || 1;
        const img = el.querySelector("img");
        const ratio = img && img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
        const long = Math.min(W, H) * 0.2 * factor * sizeScale;
        const width = ratio >= 1 ? long : long * ratio;
        el.style.width = width + "px";
        const height = el.offsetHeight || (ratio >= 1 ? width / ratio : long);
        const t = (i + 0.5) / n;
        const r = maxR * Math.sqrt(t) * 1.16;
        const a = i * golden + 0.55;
        let x = cx + r * Math.cos(a) - width / 2;
        let y = cy + r * Math.sin(a) - height / 2;
        x = Math.min(Math.max(pad, x), W - pad - width);
        y = Math.min(Math.max(pad, y), H - pad - height);
        placed.push({ el: el, x: x, y: y, w: width, h: height });
      }

      for (let iter = 0; iter < 48; iter++) {
        for (let i = 0; i < placed.length; i++) {
          for (let j = i + 1; j < placed.length; j++) {
            const a = placed[i];
            const b = placed[j];
            const dx = a.x + a.w / 2 - (b.x + b.w / 2);
            const dy = a.y + a.h / 2 - (b.y + b.h / 2);
            const overlapX = (a.w + b.w) / 2 + gap - Math.abs(dx);
            const overlapY = (a.h + b.h) / 2 + gap - Math.abs(dy);
            if (overlapX > 0 && overlapY > 0) {
              const push = Math.min(overlapX, overlapY) * 0.52;
              const len = Math.hypot(dx, dy) || 0.01;
              a.x += (dx / len) * push;
              a.y += (dy / len) * push;
              b.x -= (dx / len) * push;
              b.y -= (dy / len) * push;
            }
          }
          placed[i].x = Math.min(Math.max(pad, placed[i].x), W - pad - placed[i].w);
          placed[i].y = Math.min(Math.max(pad, placed[i].y), H - pad - placed[i].h);
        }
      }

      for (let i = 0; i < placed.length; i++) {
        const a = placed[i];
        if (a.x < pad - 2 || a.y < pad - 2 || a.x + a.w > W - pad + 2 || a.y + a.h > H - pad + 2) {
          return null;
        }
        for (let j = i + 1; j < placed.length; j++) {
          const b = placed[j];
          if (a.x < b.x + b.w + gap - 1 && a.x + a.w + gap - 1 > b.x && a.y < b.y + b.h + gap - 1 && a.y + a.h + gap - 1 > b.y) {
            return null;
          }
        }
      }
      return placed;
    }

    let packed = null;
    for (let scale = 1; scale >= 0.52; scale -= 0.04) {
      packed = tryPack(scale);
      if (packed) break;
    }
    if (!packed) packed = tryPack(0.48);
    if (!packed) return;
    packed.forEach(function (item) {
      item.el.style.left = item.x + "px";
      item.el.style.top = item.y + "px";
    });
    let maxLong = 0;
    packed.forEach(function (item) {
      maxLong = Math.max(maxLong, item.w, item.h);
    });
    const hoverLong = maxLong * 1.2;
    packed.forEach(function (item) {
      const long = Math.max(item.w, item.h) || 1;
      const boost = FLOAT_HOVER_BOOST[item.el.dataset.work] || 1;
      let hoverScale = (hoverLong / long) * boost;
      const maxScale = FLOAT_HOVER_MAX[item.el.dataset.work];
      if (maxScale) hoverScale = Math.min(hoverScale, maxScale);
      item.el.style.setProperty("--hover-scale", String(hoverScale));
    });
    worksGrid.classList.add("is-ready");
  }

  function renderFloat(categoryId) {
    worksGrid.className = "works-grid is-float";
    worksGrid.style.height = "";
    worksGrid.innerHTML = "";
    renderCategoryNav(categoryId);
    document.body.classList.add("is-drawing-page");

    worksInCategory(categoryId).forEach(function (work, index) {
      const link = document.createElement("a");
      link.className = "float-orb";
      link.href = "#work/" + encodeURIComponent(work.id);
      link.dataset.work = work.id;
      link.style.setProperty("--orb-factor", String(FLOAT_FACTORS[index % FLOAT_FACTORS.length]));
      link.dataset.bob = String((index % 8) + 1);
      link.style.setProperty("--bob-delay", (-index * 0.52).toFixed(2) + "s");
      link.style.setProperty("--bob-duration", (5.1 + (index % 7) * 0.38).toFixed(2) + "s");
      const react = document.createElement("span");
      react.className = "float-react";
      const bob = document.createElement("span");
      bob.className = "float-bob";
      const scale = document.createElement("span");
      scale.className = "float-scale";
      const img = document.createElement("img");
      img.src = imageSrc(work.image);
      img.alt = workLabel(work);
      img.addEventListener("load", scheduleFloatLayout);
      scale.appendChild(img);
      bob.appendChild(scale);
      react.appendChild(bob);
      link.appendChild(react);
      worksGrid.appendChild(link);
    });

    bindFloatResize();
    bindFloatMouse();
    scheduleFloatLayout();
  }

  function renderGrid(categoryId, videoWorkId) {
    const category = findCategory(categoryId);
    const layout = category && category.layout ? category.layout : "large";
    document.body.classList.toggle("is-drawing-page", layout === "float");
    if (layout !== "video") pausePageVideo();
    if (layout === "sculpture") {
      renderSculpture(categoryId);
      return;
    }
    if (layout === "float") {
      renderFloat(categoryId);
      return;
    }
    if (layout === "video") {
      renderVideoPage(videoWorkId);
      return;
    }
    if (layout === "game") {
      renderGame(categoryId);
      return;
    }

    worksGrid.className = "works-grid is-" + layout;
    worksGrid.style.height = "";
    unbindFloatMouse();
    worksGrid.innerHTML = "";
    renderCategoryNav(categoryId);

    const list = worksInCategory(categoryId);
    const featuredId = (list.find((item) => item.type !== "view") || {}).id;

    list.forEach((work) => {
      const isView = work.type === "view";
      const card = document.createElement("a");
      card.className = "work-card";
      if (layout === "large") {
        if (work.id === featuredId) card.classList.add("is-featured");
        if (isView) card.classList.add("is-view");
        if (work.wide) card.classList.add("is-wide");
        if (work.compact) card.classList.add("is-compact");
      }
      card.href = "#work/" + encodeURIComponent(work.id);

      const figure = document.createElement("figure");
      const thumb = document.createElement("div");
      thumb.className = "thumb";
      const img = document.createElement("img");
      img.src = imageSrc(work.image);
      img.alt = workLabel(work);
      thumb.appendChild(img);
      figure.appendChild(thumb);

      const title = textValue(work.title);
      const year = textValue(work.year);
      if (isView) {
        const caption = document.createElement("figcaption");
        const label = document.createElement("span");
        label.className = "work-year";
        label.textContent = "Exhibition view";
        caption.appendChild(label);
        figure.appendChild(caption);
      } else if (work.category !== "ink" && (title || year)) {
        const caption = document.createElement("figcaption");
        if (title) {
          const titleEl = document.createElement("span");
          titleEl.className = "work-title";
          titleEl.textContent = title;
          caption.appendChild(titleEl);
        }
        if (year) {
          const yearEl = document.createElement("span");
          yearEl.className = "work-year";
          yearEl.textContent = year;
          caption.appendChild(yearEl);
        }
        figure.appendChild(caption);
      }

      card.appendChild(figure);
      worksGrid.appendChild(card);
    });
  }

  function findWork(id) {
    return WORKS.find((work) => work.id === id);
  }

  function neighbor(work, offset) {
    const list = worksInCategory(work.category);
    const index = list.findIndex((item) => item.id === work.id);
    if (index < 0 || list.length === 0) return null;
    const next = (index + offset + list.length) % list.length;
    return list[next];
  }

  function setField(id, value, hideParent) {
    const el = document.getElementById(id);
    const text = textValue(value);
    el.textContent = text;
    const target = hideParent ? el.closest(hideParent) : el;
    if (target) target.hidden = !text;
    return text;
  }

  function renderDetail(id) {
    const work = findWork(id);
    if (!work) {
      location.hash = "works";
      return;
    }
    if (work.category === "video") {
      history.replaceState(null, "", "#works/video/" + encodeURIComponent(work.id));
      showWorks("video", work.id);
      return;
    }

    if (work.category === "game") {
      history.replaceState(null, "", "#works/game");
      showWorks("game");
      return;
    }

    const img = document.getElementById("detail-image");
    const figure = document.getElementById("detail-figure");
    const gallery = document.getElementById("detail-gallery");
    const photos = workImages(work);
    const isSculpture = work.category === "sculpture";
    const isDrawing = work.category === "drawing";

    if (isSculpture) {
      figure.hidden = true;
      gallery.hidden = false;
      gallery.className = "detail-gallery is-1";
      gallery.innerHTML = "";
      img.hidden = false;
      const item = document.createElement("div");
      item.className = "thumb";
      const photo = document.createElement("img");
      photo.src = imageSrc(photos[0]);
      photo.alt = workLabel(work);
      item.appendChild(photo);
      if (photos[1]) {
        item.classList.add("has-hover");
        const hover = document.createElement("img");
        hover.className = "thumb-hover";
        hover.src = imageSrc(photos[1]);
        hover.alt = "";
        hover.setAttribute("aria-hidden", "true");
        item.appendChild(hover);
      }
      gallery.appendChild(item);
    } else {
      gallery.hidden = true;
      gallery.innerHTML = "";
      figure.hidden = false;
      img.hidden = false;
      img.src = imageSrc(work.image);
      img.alt = workLabel(work);
    }

    const title = setField("detail-title", work.title);
    const year = setField("detail-year", work.year, "div");
    const medium = setField("detail-medium", work.medium, "div");
    const size = setField("detail-size", work.size, "div");
    setField("detail-description", work.description);
    const sizeLabel = document.getElementById("detail-size-label");
    if (sizeLabel) sizeLabel.textContent = "크기";
    if (isSculpture) {
      document.getElementById("detail-spec").hidden = false;
      document.querySelectorAll("#detail-spec > div").forEach(function (row) {
        row.hidden = false;
      });
    } else {
      document.getElementById("detail-spec").hidden = !(year || medium || size);
    }

    const category = findCategory(work.category);
    const detail = document.querySelector(".detail");
    detail.classList.toggle("is-ink", work.category === "ink");
    detail.classList.toggle("is-sculpture", isSculpture);
    detail.classList.toggle("is-drawing", isDrawing);
    detail.classList.remove("is-video");
    detail.classList.toggle("is-featured", work.category === "ink" && work.type !== "view" && work.order === 1);
    detail.classList.toggle("is-view", work.type === "view");
    detail.classList.toggle("is-wide", !!work.wide);
    detail.classList.toggle("is-compact", !!work.compact);
    const back = document.querySelector(".detail-back");
    back.href = "#works/" + encodeURIComponent(work.category);
    back.textContent = category ? "← " + category.label : "← Works";
    document.querySelector(".detail-nav").hidden = false;

    const prev = neighbor(work, -1);
    const next = neighbor(work, 1);
    document.getElementById("detail-prev").href = "#work/" + encodeURIComponent(prev.id);
    document.getElementById("detail-next").href = "#work/" + encodeURIComponent(next.id);

    setPageTitle(title || (category ? category.label : ARTIST.siteTitle));
    showView("detail");
  }

  function showWorks(categoryId, videoWorkId) {
    const id = categoryId || defaultCategoryId();
    if (!id) {
      worksGrid.innerHTML = "";
      categoryNav.innerHTML = "";
      setPageTitle();
      showView("works");
      return;
    }
    const staying = !worksView.hidden && !!worksGrid.querySelector(".video-page") && id === "video";
    renderGrid(id, videoWorkId);
    const category = findCategory(id);
    if (id !== "video") setPageTitle(category ? category.label : undefined);
    showView("works", { keepScroll: staying });
  }

  function route() {
    const hash = (location.hash || "#works").replace(/^#/, "");

    if (hash === "about") {
      setPageTitle("About");
      showView("about");
      return;
    }

    if (hash === "cv") {
      setPageTitle("CV");
      showView("cv");
      return;
    }

    if (hash.indexOf("work/") === 0) {
      const id = decodeURIComponent(hash.slice(5));
      const work = findWork(id);
      if (work && work.category === "video") {
        history.replaceState(null, "", "#works/video/" + encodeURIComponent(work.id));
        showWorks("video", work.id);
        return;
      }
      renderDetail(id);
      return;
    }

    if (hash.indexOf("works/") === 0) {
      const rest = decodeURIComponent(hash.slice(6));
      const slash = rest.indexOf("/");
      if (slash !== -1) {
        const cat = rest.slice(0, slash);
        const workId = rest.slice(slash + 1);
        if (cat === "video") {
          showWorks("video", workId);
          return;
        }
        showWorks(findCategory(cat) ? cat : defaultCategoryId());
        return;
      }
      showWorks(findCategory(rest) ? rest : defaultCategoryId());
      return;
    }

    showWorks(defaultCategoryId());
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      const view = link.getAttribute("data-view");
      if (!view) return;
      event.preventDefault();
      location.hash = view;
    });
  });

  document.addEventListener("keydown", function (event) {
    if (isVideoPage()) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        goVideoNeighbor(event.key === "ArrowRight" ? 1 : -1);
      }
      return;
    }
    if (detailView.hidden) return;
    const hash = location.hash.replace(/^#/, "");
    if (hash.indexOf("work/") !== 0) return;
    const work = findWork(decodeURIComponent(hash.slice(5)));
    if (!work || work.category === "video") return;

    if (event.key === "Escape") {
      location.hash = "works/" + work.category;
    } else if (event.key === "ArrowLeft") {
      location.hash = "work/" + neighbor(work, -1).id;
    } else if (event.key === "ArrowRight") {
      location.hash = "work/" + neighbor(work, 1).id;
    }
  });

  worksGrid.addEventListener("click", function (event) {
    if (event.target.closest("#video-prev")) goVideoNeighbor(-1);
    if (event.target.closest("#video-next")) goVideoNeighbor(1);
  });

  (function bindVideoSwipe() {
    let x0 = 0;
    let y0 = 0;
    let tracking = false;
    worksGrid.addEventListener("touchstart", function (event) {
      if (!isVideoPage() || event.touches.length !== 1) return;
      const stage = document.getElementById("video-stage");
      const video = document.getElementById("page-video");
      if (!stage || !video || !stage.contains(event.target)) return;
      const point = event.touches[0];
      const rect = video.getBoundingClientRect();
      if (point.clientY > rect.bottom - 56 && point.clientY <= rect.bottom + 8) {
        tracking = false;
        return;
      }
      tracking = true;
      x0 = point.clientX;
      y0 = point.clientY;
    }, { passive: true });
    worksGrid.addEventListener("touchend", function (event) {
      if (!tracking) return;
      tracking = false;
      const point = event.changedTouches[0];
      const dx = point.clientX - x0;
      const dy = point.clientY - y0;
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
      goVideoNeighbor(dx < 0 ? 1 : -1);
    }, { passive: true });
  })();

  renderArtist();
  renderCv();
  route();
  window.addEventListener("hashchange", route);
})();
