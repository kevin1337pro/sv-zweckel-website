const { newsItems = [], socialLinks = [] } = window.svzData || {};

const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector("#primary-nav");
const featuredContainer = document.querySelector("#featured-news");
const categoryFilters = document.querySelector("#news-filters");
const archiveGrid = document.querySelector("#news-archive");
const archiveSearch = document.querySelector("#archive-search");
const archiveCount = document.querySelector("#archive-count");
const socialGrid = document.querySelector("#social-grid");

let activeCategory = "Alle";
let searchTerm = "";

function bindNavigation() {
  navToggle?.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    primaryNav?.classList.toggle("is-open");
  });

  primaryNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle?.setAttribute("aria-expanded", "false");
      primaryNav?.classList.remove("is-open");
    });
  });
}

function renderFeatured() {
  if (!featuredContainer) {
    return;
  }

  const featuredItem = newsItems.find((item) => item.featured) || newsItems[0];

  featuredContainer.innerHTML = `
    <article class="featured-news-card" id="featured-${featuredItem.slug}">
      <div class="featured-news-media">
        <img src="${featuredItem.image}" alt="${featuredItem.alt}" />
      </div>
      <div class="featured-news-copy">
        <p class="eyebrow">Top-News</p>
        <h2>${featuredItem.title}</h2>
        <div class="meta-row">
          <span class="tag">${featuredItem.category}</span>
          <span>${featuredItem.date}</span>
          <span>${featuredItem.author}</span>
        </div>
        <p>${featuredItem.body}</p>
      </div>
    </article>
  `;
}

function renderFilters() {
  if (!categoryFilters) {
    return;
  }

  const categories = ["Alle", ...new Set(newsItems.map((item) => item.category))];
  categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button
          class="filter-chip${category === activeCategory ? " is-active" : ""}"
          type="button"
          data-category="${category}"
        >
          ${category}
        </button>
      `
    )
    .join("");

  categoryFilters.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderArchive();
    });
  });
}

function getFilteredNews() {
  return newsItems.filter((item) => {
    const matchesCategory =
      activeCategory === "Alle" || item.category === activeCategory;
    const searchableText =
      `${item.title} ${item.category} ${item.team} ${item.excerpt} ${item.body} ${item.author}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

function renderArchive() {
  if (!archiveGrid) {
    return;
  }

  const filteredNews = getFilteredNews();
  archiveCount.textContent = `${filteredNews.length} Beitraege`;

  archiveGrid.innerHTML = filteredNews
    .map(
      (item) => `
        <article class="archive-card" id="${item.slug}">
          <img src="${item.image}" alt="${item.alt}" />
          <div class="archive-card-body">
            <div class="meta-row">
              <span class="tag">${item.category}</span>
              <span>${item.team}</span>
            </div>
            <h3>${item.title}</h3>
            <p class="archive-date">${item.date} | ${item.author}</p>
            <p>${item.excerpt}</p>
            <div class="archive-body">
              <p>${item.body}</p>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  if (!filteredNews.length) {
    archiveGrid.innerHTML = `
      <article class="archive-card archive-card-empty">
        <div class="archive-card-body">
          <p class="eyebrow">Kein Treffer</p>
          <h3>Zu dieser Suche gibt es aktuell keinen Beitrag.</h3>
          <p>Versuche eine andere Kategorie oder einen allgemeineren Suchbegriff.</p>
        </div>
      </article>
    `;
  }
}

function bindSearch() {
  archiveSearch?.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim();
    renderArchive();
  });
}

function renderSocialLinks() {
  if (!socialGrid) {
    return;
  }

  socialGrid.innerHTML = socialLinks
    .map(
      (link) => `
        <a class="social-card" href="${link.url}" target="_blank" rel="noreferrer">
          <p class="card-kicker">${link.name}</p>
          <h3>${link.handle}</h3>
          <p>${link.description}</p>
        </a>
      `
    )
    .join("");
}

renderFeatured();
renderFilters();
renderArchive();
renderSocialLinks();
bindNavigation();
bindSearch();
