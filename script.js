const {
  clubMeta = {},
  socialLinks = [],
  newsItems = [],
  quicklinks = [],
  teams = [],
  timelineItems = [],
  boardMembers = [],
} = window.svzData || {};

const newsGrid = document.querySelector("#news-grid");
const quicklinksGrid = document.querySelector("#quicklinks");
const teamGrid = document.querySelector("#team-grid");
const timeline = document.querySelector("#timeline");
const boardGrid = document.querySelector("#board-grid");
const socialGrid = document.querySelector("#social-grid");
const officialClubLink = document.querySelector("#official-club-link");
const officialClubMeta = document.querySelector("#official-club-meta");
const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector("#primary-nav");
const searchInput = document.querySelector("#site-search");
const contactForm = document.querySelector(".contact-form");

function renderNews() {
  if (!newsGrid) {
    return;
  }

  newsGrid.innerHTML = newsItems
    .slice(0, 3)
    .map(
      (item) => `
        <article class="news-card">
          <img src="${item.image}" alt="${item.alt}" />
          <div class="news-card-body">
            <div class="meta-row">
              <span class="tag">${item.category}</span>
              <span>${item.date}</span>
            </div>
            <h3>${item.title}</h3>
            <p>${item.excerpt}</p>
            <a class="text-link" href="news.html#${item.slug}">Zum Beitrag</a>
          </div>
        </article>
      `
    )
    .join("");
}

function renderQuicklinks() {
  if (!quicklinksGrid) {
    return;
  }

  quicklinksGrid.innerHTML = quicklinks
    .map(
      (item) => `
        <article class="quicklink">
          <strong>${item.title}</strong>
          <p>${item.text}</p>
        </article>
      `
    )
    .join("");
}

function renderTeams(filter = "") {
  if (!teamGrid) {
    return;
  }

  const normalizedFilter = filter.trim().toLowerCase();
  const filteredTeams = teams.filter((team) => {
    const searchableText =
      `${team.name} ${team.group} ${team.summary} ${team.rhythm} ${team.contact}`.toLowerCase();
    return searchableText.includes(normalizedFilter);
  });

  teamGrid.innerHTML = filteredTeams
    .map(
      (team) => `
        <article class="team-card">
          <div class="team-card-body">
            <p class="card-kicker">${team.group}</p>
            <h3>${team.name}</h3>
            <p>${team.summary}</p>
            <div class="team-meta">
              <div>
                <strong>Struktur</strong>
                <p>${team.rhythm}</p>
              </div>
              <div>
                <strong>Kontakt</strong>
                <p>${team.contact}</p>
              </div>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  if (!filteredTeams.length) {
    teamGrid.innerHTML = `
      <article class="team-card">
        <div class="team-card-body">
          <p class="card-kicker">Kein Treffer</p>
          <h3>Der Filter hat aktuell keine passende Teamkarte gefunden.</h3>
          <p>Versuche Suchbegriffe wie Jugend, Herren, Breitensport oder Tradition.</p>
        </div>
      </article>
    `;
  }
}

function renderTimeline() {
  if (!timeline) {
    return;
  }

  timeline.innerHTML = timelineItems
    .map(
      (item) => `
        <article class="timeline-item">
          <p class="card-kicker">${item.year}</p>
          <h3>${item.year}</h3>
          <p>${item.text}</p>
        </article>
      `
    )
    .join("");
}

function renderBoard() {
  if (!boardGrid) {
    return;
  }

  boardGrid.innerHTML = boardMembers
    .map((member) => {
      const [name, role] = member.split(" - ");
      return `
        <article class="board-card">
          <h3>${name}</h3>
          <p>${role}</p>
        </article>
      `;
    })
    .join("");
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

function renderOfficialMeta() {
  if (officialClubLink) {
    officialClubLink.href = clubMeta.fussballDeClubUrl || "#";
  }

  if (!officialClubMeta) {
    return;
  }

  officialClubMeta.innerHTML = `
    <article class="quick-stat">
      <span class="quick-stat-label">Verein</span>
      <strong>${clubMeta.teamCount || ""}</strong>
      <p>${clubMeta.juniorCount || ""} und ${clubMeta.seniorCount || ""}</p>
    </article>
    <article class="quick-stat">
      <span class="quick-stat-label">Verband</span>
      <strong>${clubMeta.association || ""}</strong>
      <p>${clubMeta.standLabel || ""}</p>
    </article>
  `;
}

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

function bindSearch() {
  searchInput?.addEventListener("input", (event) => {
    renderTeams(event.target.value);
  });
}

function bindFormDemo() {
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = contactForm.querySelector("button");
    const originalText = button.textContent;
    button.textContent = "Demo gespeichert";
    setTimeout(() => {
      button.textContent = originalText;
    }, 1800);
  });
}

renderNews();
renderQuicklinks();
renderTeams();
renderTimeline();
renderBoard();
renderSocialLinks();
renderOfficialMeta();
bindNavigation();
bindSearch();
bindFormDemo();
