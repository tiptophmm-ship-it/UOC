/* Catalog site: plain JavaScript, no build step, no backend.
   Shop details live in config.js. Items and prices live in products.js. */
(() => {
  "use strict";

  const S = window.SITE;
  const PRODUCTS = window.PRODUCTS || [];

  /* ---------- small helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const naira = (n) => "\u20A6" + Number(n).toLocaleString("en-NG");
  const clampQty = (n) => Math.min(999, Math.max(1, Math.floor(Number(n)) || 1));

  const CATS = Object.fromEntries(S.categories.map((c) => [c.id, c]));
  const catOf = (p) => CATS[p.cat] || { id: "", name: "Other", icon: "box" };
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  if (Object.keys(byId).length !== PRODUCTS.length) console.warn("products.js has duplicate ids");

  const view = $("#view");
  const sheet = $("#sheet");
  const overlay = $("#overlay");

  /* ---------- icons (inline, no downloads) ---------- */
  const ICONS = {
    oil: '<path d="M12 3s-6 7.5-6 11.5a6 6 0 0 0 12 0C18 10.5 12 3 12 3z"/>',
    can: '<path d="M8 3h8v4l2 3v11H6V10l2-3V3z"/><path d="M6 14h12"/>',
    filter: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9.5 7v10M12 7v10M14.5 7v10"/>',
    disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
    chain: '<rect x="2" y="9" width="10" height="6" rx="3"/><rect x="12" y="9" width="10" height="6" rx="3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    clutch: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>',
    spring: '<path d="M12 2v3l-5 2 10 3-10 3 10 3-5 2v4"/>',
    bolt: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8z"/>',
    body: '<path d="M3 12c0-4 4-7 9-7s9 3 9 7-4 7-9 7-9-3-9-7z"/><circle cx="12" cy="12" r="3"/>',
    tyre: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5" stroke-dasharray="2 2"/>',
    mirror: '<circle cx="9" cy="8.5" r="5.5"/><path d="M13 12.5 19 21"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.box}</svg>`;

  /* ---------- saved list (this phone only) ---------- */
  const STORE_KEY = "oucconcept:v1";
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch {
      return {};
    }
  };
  const saved = load();
  const state = {
    list: (Array.isArray(saved.list) ? saved.list : [])
      .filter((l) => l && byId[l.id])
      .map((l) => ({ id: l.id, qty: clampQty(l.qty) })),
    branch: S.branches.some((b) => b.id === saved.branch) ? saved.branch : "",
    type: S.customerTypes.includes(saved.type) ? saved.type : "",
    note: "",
  };
  const persist = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ list: state.list, branch: state.branch, type: state.type }));
    } catch {
      /* private mode or storage full: the list still works until the page closes */
    }
  };

  function addItem(id, qty = 1) {
    if (!byId[id]) return;
    const line = state.list.find((l) => l.id === id);
    if (line) line.qty = clampQty(line.qty + qty);
    else state.list.push({ id, qty: clampQty(qty) });
    persist();
    updateCounts();
  }
  function setQty(id, qty) {
    const line = state.list.find((l) => l.id === id);
    if (line) line.qty = clampQty(qty);
    persist();
  }
  function removeItem(id) {
    state.list = state.list.filter((l) => l.id !== id);
    persist();
    updateCounts();
  }
  function updateCounts() {
    const n = state.list.length;
    $$("[data-count]").forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  /* ---------- WhatsApp ---------- */
  const branchById = (id) => S.branches.find((b) => b.id === id);
  const numberFor = (branch) => (branch && branch.whatsapp) || S.whatsapp;
  const waLink = (number, text) =>
    "https://wa.me/" + String(number).replace(/\D/g, "") + (text ? "?text=" + encodeURIComponent(text) : "");
  const generalChat = () => waLink(S.whatsapp, `Hello ${S.name}, I would like to ask about motorcycle parts.`);

  function listMessage() {
    const branch = branchById(state.branch);
    const lines = [`Hello ${S.name}, I want to ask about these items:`, ""];
    state.list.forEach((l, i) => {
      const p = byId[l.id];
      const guide = p.priceFrom == null ? "" : `, price guide ${priceText(p)}`;
      lines.push(`${i + 1}. ${p.name}${p.partNo ? ` (${p.partNo})` : ""}, quantity ${l.qty}${guide}`);
    });
    lines.push("");
    if (branch) lines.push(`Branch: ${branch.name}`);
    if (state.type) lines.push(`I am a: ${state.type}`);
    if (state.note.trim()) lines.push(`Note: ${state.note.trim()}`);
    lines.push("", "Please tell me the price of each item and whether you have it.");
    return lines.join("\n");
  }
  const sendHref = () => waLink(numberFor(branchById(state.branch)), listMessage());

  /* ---------- product display ---------- */
  function priceText(p) {
    if (p.priceFrom == null) return "Ask for price";
    if (p.priceTo != null && p.priceTo !== p.priceFrom) return `${naira(p.priceFrom)} \u2013 ${naira(p.priceTo)}`;
    return `from ${naira(p.priceFrom)}`;
  }
  // Display version of the price: the dash stays with the second number so a narrow card never splits "\u20A61,800 \u2013" from "\u20A63,000".
  function priceHtml(p) {
    if (p.priceFrom == null) return "Ask for price";
    if (p.priceTo != null && p.priceTo !== p.priceFrom)
      return `<span class="nw">${naira(p.priceFrom)}</span> <span class="nw">\u2013 ${naira(p.priceTo)}</span>`;
    return `<span class="nw">from ${naira(p.priceFrom)}</span>`;
  }
  const stockPill = (p) =>
    p.stock === "usually" ? '<span class="pill ok">Usually in stock</span>' : '<span class="pill ask">Ask us</span>';
  const visual = (p) =>
    p.image
      ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="400" height="400">`
      : `<span class="ph">${icon(catOf(p).icon)}</span>`;
  const itemHref = (p) => `#/item/${encodeURIComponent(p.id)}`;

  function card(p) {
    const hasPrice = p.priceFrom != null;
    return `<article class="card">
      <a class="vis" href="${itemHref(p)}" tabindex="-1" aria-hidden="true">${visual(p)}${p.sample ? '<span class="tag">Sample</span>' : ""}</a>
      <div class="card-body">
        <h3><a href="${itemHref(p)}">${esc(p.name)}</a></h3>
        ${p.spec ? `<p class="spec">${esc(p.spec)}</p>` : ""}
        <p>${stockPill(p)}</p>
        <p class="price${hasPrice ? "" : " none"}"><span class="amt">${priceHtml(p)}</span>${hasPrice ? '<span class="guide">guide price</span>' : ""}</p>
        <button class="btn btn-sm btn-block" type="button" data-add="${esc(p.id)}">Add to list</button>
      </div>
    </article>`;
  }

  function filterProducts({ q, cat, fit }) {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    return PRODUCTS.filter((p) => {
      if (cat && p.cat !== cat) return false;
      if (fit && !(p.fits || []).some((f) => f === fit || f === "Universal")) return false;
      if (!tokens.length) return true;
      const hay = [p.name, p.spec, p.partNo, catOf(p).name, (p.fits || []).join(" "), (p.models || []).join(" "), p.note]
        .join(" ")
        .toLowerCase();
      return tokens.every((t) => hay.includes(t));
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  const NOTICE = "Prices are a guide only. Final price and availability are confirmed on WhatsApp.";
  const branchAddress = (b) => [b.street, b.city, b.region].filter(Boolean).join(", ");

  /* ---------- views ---------- */
  function homeView() {
    document.title = `${S.name} | ${S.tagline}, ${S.area}`;
    const counts = {};
    PRODUCTS.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));
    const popular = PRODUCTS.filter((p) => p.popular).slice(0, 8);
    const tiles = S.categories
      .filter((c) => counts[c.id])
      .map(
        (c) => `<a class="tile" href="#/catalog?cat=${encodeURIComponent(c.id)}">
          <span class="tile-icon">${icon(c.icon)}</span>
          <span class="tile-name">${esc(c.name)}</span>
          <span class="tile-count">${counts[c.id]}</span>
        </a>`
      )
      .join("");

    return `
    <section class="hero"><div class="wrap">
      <h1 class="h1">Check what we stock. Send your list on WhatsApp.</h1>
      <p class="lead">${esc(S.tagline)} in ${esc(S.area)}. See a price guide, add what you need to your list, and we confirm price and availability on WhatsApp.</p>
      <form class="search" id="homeSearch" role="search">
        <label class="sr" for="homeQ">Search parts</label>
        <input id="homeQ" type="search" placeholder="Search parts or bike model" autocomplete="off" enterkeyhint="search">
        <button class="btn btn-primary" type="submit">Search</button>
      </form>
      <div class="chips">
        ${S.bikeBrands.map((b) => `<a class="chip" href="#/catalog?fit=${encodeURIComponent(b)}">${esc(b)} parts</a>`).join("")}
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <h2>Browse by part type</h2>
      <div class="tiles">${tiles}</div>
    </div></section>

    ${
      popular.length
        ? `<section class="section"><div class="wrap">
      <h2>Popular items</h2>
      <div class="grid">${popular.map(card).join("")}</div>
      <p class="notice">${NOTICE} Prices updated ${esc(S.pricesUpdated)}.</p>
    </div></section>`
        : ""
    }

    <section class="section"><div class="wrap">
      <div class="cta">
        <div>
          <h2>Already have a list or a photo?</h2>
          <p>Mechanics and resellers can send it straight to us on WhatsApp.</p>
        </div>
        <a class="btn btn-primary" href="${esc(waLink(S.whatsapp, `Hello ${S.name}, I have a parts list to send.`))}" target="_blank" rel="noopener">Send your list</a>
      </div>
    </div></section>

    <section class="section" id="branches"><div class="wrap">
      <h2>Our branches</h2>
      <div class="branches">${S.branches.map(branchCard).join("")}</div>
    </div></section>`;
  }

  function branchCard(b) {
    const hours = b.hours.map(([d, t]) => `<div><dt>${esc(d)}</dt><dd>${esc(t)}</dd></div>`).join("");
    return `<article class="branch">
      <h3>${esc(b.name)}</h3>
      <p>${esc(branchAddress(b))}</p>
      ${b.phone ? `<p><a href="tel:${esc(b.phone.replace(/[^\d+]/g, ""))}">${esc(b.phone)}</a></p>` : ""}
      <dl class="hours">${hours}</dl>
      <div class="row">
        ${b.mapsUrl ? `<a class="btn btn-sm" href="${esc(b.mapsUrl)}" target="_blank" rel="noopener">Directions</a>` : ""}
        <a class="btn btn-sm btn-primary" href="${esc(waLink(numberFor(b), `Hello ${S.name} ${b.name}, I would like to ask about motorcycle parts.`))}" target="_blank" rel="noopener">WhatsApp this branch</a>
      </div>
    </article>`;
  }

  function catalogView(params) {
    document.title = `Catalog | ${S.name}`;
    const f = {
      q: (params.get("q") || "").slice(0, 80),
      cat: CATS[params.get("cat")] ? params.get("cat") : "",
      fit: S.bikeBrands.includes(params.get("fit")) ? params.get("fit") : "",
    };
    view.innerHTML = `<section class="wrap page">
      <h1 class="h1 h1-page">Catalog</h1>
      <p class="notice">${NOTICE} Prices updated ${esc(S.pricesUpdated)}.</p>
      <div class="filters">
        <label class="sr" for="q">Search the catalog</label>
        <input id="q" type="search" placeholder="Search parts or bike model" autocomplete="off" enterkeyhint="search" value="${esc(f.q)}">
        <label class="sr" for="fit">Bike brand</label>
        <select id="fit">
          <option value="">All bike brands</option>
          ${S.bikeBrands.map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join("")}
        </select>
      </div>
      <div class="chips scroll" id="catChips">
        <button class="chip" type="button" data-cat="" aria-pressed="false">All parts</button>
        ${S.categories.map((c) => `<button class="chip" type="button" data-cat="${esc(c.id)}" aria-pressed="false">${esc(c.name)}</button>`).join("")}
      </div>
      <p class="count-line" id="resultCount" aria-live="polite"></p>
      <div id="results"></div>
    </section>`;

    const qEl = $("#q");
    const fitEl = $("#fit");
    const chipsEl = $("#catChips");
    const resEl = $("#results");
    const countEl = $("#resultCount");
    fitEl.value = f.fit;

    const update = () => {
      const items = filterProducts(f);
      resEl.className = items.length ? "grid" : "";
      resEl.innerHTML = items.length ? items.map(card).join("") : emptyState(f);
      countEl.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
      $$("[data-cat]", chipsEl).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === f.cat)));
      const qs = new URLSearchParams();
      if (f.q) qs.set("q", f.q);
      if (f.cat) qs.set("cat", f.cat);
      if (f.fit) qs.set("fit", f.fit);
      const s = qs.toString();
      history.replaceState(null, "", "#/catalog" + (s ? "?" + s : ""));
    };

    qEl.addEventListener("input", () => {
      f.q = qEl.value.slice(0, 80);
      update();
    });
    fitEl.addEventListener("change", () => {
      f.fit = fitEl.value;
      update();
    });
    chipsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      f.cat = b.dataset.cat;
      update();
    });
    resEl.addEventListener("click", (e) => {
      if (!e.target.closest("[data-clear-filters]")) return;
      f.q = f.cat = f.fit = "";
      qEl.value = "";
      fitEl.value = "";
      update();
    });
    update();
  }

  function emptyState(f) {
    const msg = f.q
      ? `Hello ${S.name}, do you have: ${f.q}?`
      : `Hello ${S.name}, I am looking for a motorcycle part.`;
    return `<div class="empty">
      <p class="empty-title">No items match your search.</p>
      <p>We may still have it. Send us the part name or a photo and we will check.</p>
      <div class="row">
        <a class="btn btn-primary" href="${esc(waLink(S.whatsapp, msg))}" target="_blank" rel="noopener">Ask on WhatsApp</a>
        <button class="btn" type="button" data-clear-filters>Clear filters</button>
      </div>
    </div>`;
  }

  function itemView(id) {
    const p = byId[id];
    if (!p) {
      document.title = `Item not found | ${S.name}`;
      return `<section class="wrap page">
        <h1 class="h1 h1-page">Item not found</h1>
        <p class="lead">This item may have been removed from the catalog.</p>
        <a class="btn btn-primary" href="#/catalog">Back to catalog</a>
      </section>`;
    }
    document.title = `${p.name} | ${S.name}`;
    const c = catOf(p);
    const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
    const ask = waLink(
      numberFor(branchById(state.branch)),
      `Hello ${S.name}, I want to ask about: ${p.name}${p.spec ? ` (${p.spec})` : ""}. Do you have it, and what is the price?`
    );
    const fits = (p.fits || []).includes("Universal") ? "Fits most bikes. Confirm size or type." : (p.fits || []).join(", ");
    const specs = [
      ["Category", `<a href="#/catalog?cat=${encodeURIComponent(c.id)}">${esc(c.name)}</a>`],
      fits ? ["Fits", esc(fits)] : null,
      (p.models || []).length ? ["Models", esc(p.models.join(", "))] : null,
      p.partNo ? ["Part number", esc(p.partNo)] : null,
    ]
      .filter(Boolean)
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
      .join("");

    return `<section class="wrap page">
      <nav class="crumb" aria-label="Breadcrumb"><a href="#/catalog">Catalog</a> / <a href="#/catalog?cat=${encodeURIComponent(c.id)}">${esc(c.name)}</a></nav>
      <div class="detail">
        <div class="vis big">${visual(p)}${p.sample ? '<span class="tag">Sample</span>' : ""}</div>
        <div class="info">
          <h1 class="h1 h1-item">${esc(p.name)}</h1>
          ${p.spec ? `<p class="spec">${esc(p.spec)}</p>` : ""}
          <p>${stockPill(p)}</p>
          <p class="price big${p.priceFrom == null ? " none" : ""}"><span class="amt">${priceHtml(p)}</span>${p.priceFrom == null ? "" : '<span class="guide">guide price</span>'}</p>
          <p class="notice">${NOTICE} Prices updated ${esc(S.pricesUpdated)}.</p>
          ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
          <div class="buy">
            <div class="stepper">
              <button type="button" data-step="-1" data-target="#qty" aria-label="Decrease quantity">\u2212</button>
              <input id="qty" type="number" inputmode="numeric" min="1" max="999" value="1" aria-label="Quantity">
              <button type="button" data-step="1" data-target="#qty" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn btn-primary" type="button" data-add="${esc(p.id)}" data-qty-from="#qty">Add to list</button>
          </div>
          <a class="btn btn-block" href="${esc(ask)}" target="_blank" rel="noopener">Ask about this item on WhatsApp</a>
          <dl class="specs">${specs}</dl>
        </div>
      </div>
      ${related.length ? `<h2 class="related">More in ${esc(c.name)}</h2><div class="grid">${related.map(card).join("")}</div>` : ""}
    </section>`;
  }

  /* ---------- routing ---------- */
  function route() {
    closeDrawer(false);
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs = ""] = raw.split("?");
    const seg = path.split("/").filter(Boolean);

    if (seg[0] === "catalog") {
      catalogView(new URLSearchParams(qs));
    } else if (seg[0] === "item" && seg[1]) {
      let id = seg[1];
      try {
        id = decodeURIComponent(id);
      } catch {
        /* keep raw id */
      }
      view.innerHTML = itemView(id);
    } else {
      view.innerHTML = homeView();
      const form = $("#homeSearch");
      if (form) {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const q = $("#homeQ").value.trim();
          location.hash = "#/catalog" + (q ? "?q=" + encodeURIComponent(q) : "");
        });
      }
    }

    if (seg[0] === "branches") {
      const el = $("#branches");
      if (el) el.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  /* ---------- my list drawer ---------- */
  let opener = null;
  const isOpen = () => sheet.classList.contains("open");

  function itemRow(l) {
    const p = byId[l.id];
    const sub = [p.spec, p.priceFrom == null ? "" : priceText(p)].filter(Boolean).join(", ");
    return `<li class="line">
      <div class="line-main">
        <p class="line-name"><a href="${itemHref(p)}" data-close>${esc(p.name)}</a></p>
        ${sub ? `<p class="line-sub">${esc(sub)}</p>` : ""}
      </div>
      <div class="stepper sm">
        <button type="button" data-dec="${esc(p.id)}" aria-label="Decrease quantity of ${esc(p.name)}">\u2212</button>
        <input type="number" inputmode="numeric" min="1" max="999" value="${l.qty}" data-qty-input="${esc(p.id)}" aria-label="Quantity of ${esc(p.name)}">
        <button type="button" data-inc="${esc(p.id)}" aria-label="Increase quantity of ${esc(p.name)}">+</button>
      </div>
      <button class="rm" type="button" data-rm="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">Remove</button>
    </li>`;
  }

  function renderDrawer() {
    const prevScroll = $("#sheetBody") ? $("#sheetBody").scrollTop : 0;
    const empty = state.list.length === 0;
    sheet.innerHTML = `
      <div class="sheet-head">
        <h2 id="sheetTitle">My list <span class="count" data-count hidden>0</span></h2>
        <button class="btn btn-sm" type="button" id="closeList">Close</button>
      </div>
      <div class="sheet-body" id="sheetBody">
        ${
          empty
            ? `<div class="empty">
                <p class="empty-title">Your list is empty.</p>
                <p>Add items from the catalog, then send the whole list in one WhatsApp message.</p>
                <a class="btn btn-primary" href="#/catalog" data-close>Browse the catalog</a>
              </div>`
            : `<ul class="lines">${state.list.map(itemRow).join("")}</ul>
              <fieldset class="field">
                <legend>Which branch?</legend>
                <div class="chips">
                  ${S.branches.map((b) => `<button class="chip" type="button" data-branch="${esc(b.id)}" aria-pressed="${state.branch === b.id}">${esc(b.name)}</button>`).join("")}
                </div>
              </fieldset>
              <div class="field">
                <label for="type">I am a</label>
                <select id="type">
                  <option value="">Choose (optional)</option>
                  ${S.customerTypes.map((t) => `<option value="${esc(t)}"${state.type === t ? " selected" : ""}>${esc(t)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="note">Note (optional)</label>
                <textarea id="note" rows="3" maxlength="300" placeholder="Bike model, size, or anything we should know">${esc(state.note)}</textarea>
              </div>
              <p class="notice">${NOTICE}</p>`
        }
      </div>
      ${
        empty
          ? ""
          : `<div class="sheet-foot">
              <a class="btn btn-primary btn-block" id="sendList" href="${esc(sendHref())}" target="_blank" rel="noopener">Send list on WhatsApp</a>
              <button class="link" type="button" data-clear>Clear list</button>
            </div>`
      }`;
    $("#sheetBody").scrollTop = prevScroll;
    updateCounts();
  }

  function openDrawer(from) {
    opener = from || document.activeElement;
    $("#toast").classList.remove("show");
    renderDrawer();
    sheet.classList.add("open");
    overlay.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("lock");
    $("#closeList").focus();
  }
  function closeDrawer(restoreFocus = true) {
    if (!isOpen()) return;
    sheet.classList.remove("open");
    overlay.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("lock");
    if (restoreFocus && opener && opener.focus) opener.focus();
  }

  /* ---------- feedback ---------- */
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 1600);
  }
  function flash(btn) {
    if (btn.dataset.busy) return;
    const label = btn.textContent;
    btn.dataset.busy = "1";
    btn.textContent = "Added";
    setTimeout(() => {
      btn.textContent = label;
      delete btn.dataset.busy;
    }, 1200);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-add],[data-open-list],[data-close],[data-step],[data-dec],[data-inc],[data-rm],[data-branch],[data-clear]");
    if (!t) return;
    const d = t.dataset;

    if ("add" in d) {
      const qty = d.qtyFrom ? clampQty($(d.qtyFrom).value) : 1;
      addItem(d.add, qty);
      flash(t);
      toast("Added to your list");
    } else if ("openList" in d) {
      openDrawer(t);
    } else if ("close" in d) {
      closeDrawer(false);
    } else if ("step" in d) {
      const input = $(d.target);
      input.value = clampQty(Number(input.value) + Number(d.step));
    } else if ("dec" in d || "inc" in d) {
      const id = d.dec ?? d.inc;
      const line = state.list.find((l) => l.id === id);
      if (line) setQty(id, line.qty + ("dec" in d ? -1 : 1));
      renderDrawer();
    } else if ("rm" in d) {
      removeItem(d.rm);
      renderDrawer();
    } else if ("branch" in d) {
      state.branch = state.branch === d.branch ? "" : d.branch;
      persist();
      renderDrawer();
    } else if ("clear" in d) {
      if (confirm("Remove all items from your list?")) {
        state.list = [];
        persist();
        updateCounts();
        renderDrawer();
      }
    }
  });

  overlay.addEventListener("click", () => closeDrawer());
  sheet.addEventListener("click", (e) => {
    if (e.target.id === "closeList") closeDrawer();
  });
  sheet.addEventListener("change", (e) => {
    if (e.target.matches("[data-qty-input]")) {
      setQty(e.target.dataset.qtyInput, e.target.value);
      renderDrawer();
    } else if (e.target.id === "type") {
      state.type = e.target.value;
      persist();
      const a = $("#sendList");
      if (a) a.href = sendHref();
    }
  });
  sheet.addEventListener("input", (e) => {
    if (e.target.id === "note") {
      state.note = e.target.value;
      const a = $("#sendList");
      if (a) a.href = sendHref();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      closeDrawer();
      return;
    }
    if (e.key === "Tab") {
      const nodes = $$("a[href], button, input, select, textarea", sheet).filter((n) => !n.disabled && n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener("hashchange", route);

  /* ---------- start ---------- */
  function injectSchema() {
    if (!/^https?:$/.test(location.protocol)) return;
    const data = S.branches.map((b) => ({
      "@context": "https://schema.org",
      "@type": "AutoPartsStore",
      name: `${S.name}, ${b.name}`,
      description: S.tagline,
      url: location.origin + location.pathname,
      telephone: b.phone || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: b.street || undefined,
        addressLocality: b.city,
        addressRegion: b.region,
        addressCountry: "NG",
      },
    }));
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  function init() {
    $("#brand").innerHTML = `<span class="mark" aria-hidden="true"></span>${esc(S.name)}`;
    $("#waTop").href = generalChat();
    $("#waBar").href = generalChat();

    if (PRODUCTS.some((p) => p.sample)) {
      const pv = $("#preview");
      pv.textContent = "Preview version: sample items and prices";
      pv.hidden = false;
    }

    $("#foot").innerHTML = `<div class="wrap">
      <p class="foot-name">${esc(S.name)}</p>
      <p>${esc(S.tagline)} in ${esc(S.area)}.</p>
      <p class="muted">${NOTICE}</p>
      <p class="muted">\u00A9 ${new Date().getFullYear()} ${esc(S.name)}</p>
    </div>`;

    injectSchema();
    updateCounts();
    route();
  }

  init();
})();
