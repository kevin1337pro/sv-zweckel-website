(() => {
  "use strict";
  const data = window.svzData || {};
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const arrow =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const formatDate = (date) =>
    new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Berlin",
    }).format(new Date(date + "T12:00:00Z"));

  function setupNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector("#primary-nav");
    const header = document.querySelector(".site-header");
    if (!toggle || !nav || !header) return;
    const mobile = window.matchMedia("(max-width: 1100px)");
    const setOpen = (open, returnFocus = false) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open ? "Menü schließen" : "Menü öffnen",
      );
      header.classList.toggle("nav-is-open", open);
      if (returnFocus) toggle.focus();
    };
    document.documentElement.classList.add("nav-ready");
    toggle.addEventListener("click", () =>
      setOpen(toggle.getAttribute("aria-expanded") !== "true"),
    );
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      )
        setOpen(false, true);
    });
    header.addEventListener("focusout", (event) => {
      if (event.relatedTarget && !header.contains(event.relatedTarget))
        setOpen(false);
    });
    mobile.addEventListener("change", () => setOpen(false));
  }

  function renderNews() {
    document.querySelectorAll("[data-news-grid]").forEach((grid) => {
      const limit = Number(grid.dataset.limit) || data.news.length;
      const items = data.news
        .filter(
          (item) => !grid.dataset.team || item.category === grid.dataset.team,
        )
        .slice(0, limit);
      grid.innerHTML = items
        .map(
          (item, index) => `
        <article class="news-card" id="${escapeHtml(item.slug)}" data-category="${escapeHtml(item.category)}"
          data-search="${escapeHtml([item.title, item.category, item.excerpt, item.body].join(" ").toLocaleLowerCase("de"))}">
          <a class="news-image-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(item.title)}: Originalmeldung öffnen">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" width="768" height="512" loading="lazy" decoding="async">
            <span class="image-caption">${escapeHtml(item.imageLabel)}</span>
            <span class="news-number" aria-hidden="true">0${index + 1}</span>
          </a>
          <div class="news-card-body">
            <div class="meta-row"><span class="tag">${escapeHtml(item.category)}</span><time datetime="${escapeHtml(item.date)}">${formatDate(item.date)}</time></div>
            <h3><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h3>
            <p>${escapeHtml(item.excerpt)}</p>
            ${grid.hasAttribute("data-full-news") ? `<p class="news-body">${escapeHtml(item.body)}</p>` : ""}
            <a class="text-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Auf svzweckel.de lesen ${arrow}</a>
          </div>
        </article>
      `,
        )
        .join("");
    });

    const archive = document.querySelector("#news-archive");
    const search = document.querySelector("#archive-search");
    const filters = document.querySelector("#news-filters");
    const count = document.querySelector("#archive-count");
    const empty = document.querySelector("#news-empty");
    if (!archive || !search || !filters || !count || !empty) return;
    let category = "Alle";
    const update = () => {
      const term = search.value.trim().toLocaleLowerCase("de");
      let visible = 0;
      archive.querySelectorAll(".news-card").forEach((card) => {
        const show =
          (category === "Alle" || card.dataset.category === category) &&
          card.dataset.search.includes(term);
        card.hidden = !show;
        if (show) visible += 1;
      });
      count.textContent = `${visible} ${visible === 1 ? "Beitrag" : "Beiträge"}`;
      empty.hidden = visible > 0;
    };
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      category = button.dataset.filter;
      filters
        .querySelectorAll("[data-filter]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      update();
    });
    search.addEventListener("input", update);
    document.querySelector("#reset-news")?.addEventListener("click", () => {
      search.value = "";
      category = "Alle";
      filters
        .querySelectorAll("[data-filter]")
        .forEach((item) =>
          item.setAttribute(
            "aria-pressed",
            String(item.dataset.filter === "Alle"),
          ),
        );
      update();
      search.focus();
    });
    update();
    if (location.hash)
      document
        .getElementById(decodeURIComponent(location.hash.slice(1)))
        ?.scrollIntoView();
  }

  function renderProducts() {
    document.querySelectorAll("[data-products]").forEach((grid) => {
      grid.innerHTML = data.products
        .map(
          (product) => `
        <article class="product-card" data-product="${escapeHtml(product.id)}">
          <div class="product-visual">
            <span class="product-label">JAKO / ${escapeHtml(product.type)}</span>
            <img src="${escapeHtml(product.front)}" alt="JAKO ${escapeHtml(product.name)}, Vorderseite" width="600" height="600" loading="lazy" decoding="async">
            <button class="product-flip" type="button" aria-label="Rückseite von ${escapeHtml(product.name)} anzeigen" aria-pressed="false">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 10a8 8 0 0 1 14-4l2 2M20 3v5h-5M20 14a8 8 0 0 1-14 4l-2-2M4 21v-5h5"/></svg>
              <span>Rückseite</span>
            </button>
          </div>
          <div class="product-body">
            <span class="small-label">${escapeHtml(product.color)}</span>
            <h3>${escapeHtml(product.name)}</h3>
            ${grid.hasAttribute("data-product-details") ? `<p>${escapeHtml(product.description)}</p>` : ""}
            <a class="text-link" href="${escapeHtml(data.club.shopUrl)}" target="_blank" rel="noopener noreferrer">Zum JAKO-Teamshop ${arrow}</a>
          </div>
        </article>
      `,
        )
        .join("");
      grid.addEventListener("click", (event) => {
        const button = event.target.closest(".product-flip");
        if (!button) return;
        const card = button.closest("[data-product]");
        const product = data.products.find(
          (item) => item.id === card.dataset.product,
        );
        const showBack = button.getAttribute("aria-pressed") !== "true";
        const img = card.querySelector("img");
        img.src = showBack ? product.back : product.front;
        img.alt = `JAKO ${product.name}, ${showBack ? "Rückseite" : "Vorderseite"}`;
        button.setAttribute("aria-pressed", String(showBack));
        button.setAttribute(
          "aria-label",
          `${showBack ? "Vorderseite" : "Rückseite"} von ${product.name} anzeigen`,
        );
        button.querySelector("span").textContent = showBack
          ? "Vorderseite"
          : "Rückseite";
      });
    });
  }

  function setupMatchbar() {
    const bar = document.querySelector(".live-matchbar");
    const toggle = document.querySelector(".live-matchbar-toggle");
    const extra = document.querySelector("#live-matchbar-extra");
    if (!bar || !toggle || !extra || !data.match) return;
    const match = data.match;
    bar.querySelector(".live-matchbar-score").innerHTML = `
      <div class="live-club"><span class="live-club-label">Heim</span><strong><span class="club-full">${escapeHtml(match.home)}</span><abbr class="club-short" title="${escapeHtml(match.home)}">${escapeHtml(match.homeShort)}</abbr></strong></div>
      <div class="live-score-block"><span class="live-status">${escapeHtml(match.status)} · ${escapeHtml(match.date.slice(0, 5))}.</span><strong>${escapeHtml(match.score)}</strong></div>
      <div class="live-club live-club-away"><span class="live-club-label">Gast</span><strong><span class="club-full">${escapeHtml(match.away)}</span><abbr class="club-short" title="${escapeHtml(match.away)}">${escapeHtml(match.awayShort)}</abbr></strong></div>
    `;
    extra.querySelector(".live-matchbar-events").innerHTML = `
      <span class="live-event-chip">Pause ${escapeHtml(match.halftime)}</span>
      <span class="matchbar-source">Ergebnis vom ${escapeHtml(match.date)}<br>Redaktionell gepflegt, kein Live-Feed</span>
    `;
    extra.querySelector("[data-match-report]").href = match.sourceUrl;
    const mobile = window.matchMedia("(max-width: 600px)");
    let mobileExpanded = false;
    const resizePadding = () => {
      document.documentElement.style.setProperty(
        "--matchbar-space",
        `${Math.ceil(bar.getBoundingClientRect().height) + 24}px`,
      );
    };
    const sync = () => {
      const expanded = !mobile.matches || mobileExpanded;
      bar.classList.toggle("is-collapsed", !expanded);
      extra.hidden = !expanded;
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute(
        "aria-label",
        expanded
          ? "Spieltagsdetails einklappen"
          : "Spieltagsdetails ausklappen",
      );
      resizePadding();
    };
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      mobileExpanded = !mobileExpanded;
      sync();
    });
    bar.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobile.matches && mobileExpanded) {
        mobileExpanded = false;
        sync();
        toggle.focus();
      }
    });
    mobile.addEventListener("change", sync);
    if ("ResizeObserver" in window)
      new ResizeObserver(resizePadding).observe(bar);
    else window.addEventListener("resize", resizePadding);
    document.body.classList.add("has-matchbar");
    bar.hidden = false;
    sync();
  }

  function setupContact() {
    const form = document.querySelector("#contact-form");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      const subject = encodeURIComponent(
        `Website-Anfrage: ${fields.get("topic")}`,
      );
      const body = encodeURIComponent(
        `Name: ${String(fields.get("name")).trim()}\nE-Mail: ${String(fields.get("email")).trim()}\n\n${String(fields.get("message")).trim()}`,
      );
      const url = `mailto:${data.club.email}?subject=${subject}&body=${body}`;
      const fallback = document.querySelector("#email-fallback");
      fallback.href = url;
      fallback.hidden = false;
      fallback.textContent = "E-Mail-Programm öffnen";
      document.querySelector("#form-status").textContent =
        "Deine E-Mail ist vorbereitet. Öffne sie über den Link unten in deinem E-Mail-Programm und versende sie dort. Bisher wurde nichts versendet.";
      fallback.focus();
    });
  }

  function setupMarquee() {
    const button = document.querySelector("[data-marquee-toggle]");
    const marquee = document.querySelector(".outline-marquee");
    if (!button || !marquee) return;
    button.hidden = false;
    button.addEventListener("click", () => {
      const paused = marquee.classList.toggle("is-paused");
      button.setAttribute("aria-pressed", String(paused));
      button.textContent = paused
        ? "Laufschrift starten"
        : "Laufschrift pausieren";
    });
  }

  const squad = document.querySelector("#squad-archive");
  if (squad)
    squad.innerHTML = data.squadArchive
      .map(
        (player) => `
    <li><span>${escapeHtml(player.position)}</span><strong>${escapeHtml(player.name)}</strong></li>
  `,
      )
      .join("");

  setupNavigation();
  renderNews();
  renderProducts();
  setupMatchbar();
  setupContact();
  setupMarquee();
})();
