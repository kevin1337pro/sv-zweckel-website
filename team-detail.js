const {
  teamDetails = {},
  socialLinks = [],
} = window.svzData || {};

const teamSlug = document.body.dataset.teamSlug;
const detail = teamDetails[teamSlug];

const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector("#primary-nav");
const heroEyebrow = document.querySelector("#team-hero-eyebrow");
const heroTitle = document.querySelector("#team-hero-title");
const heroIntro = document.querySelector("#team-hero-intro");
const heroImage = document.querySelector("#team-hero-image");
const statsGrid = document.querySelector("#team-stats");
const summaryGrid = document.querySelector("#team-summary");
const matchesList = document.querySelector("#team-matches");
const newsList = document.querySelector("#team-news");
const coachingGrid = document.querySelector("#team-coaching");
const trainingTitle = document.querySelector("#team-training-title");
const trainingNote = document.querySelector("#team-training-note");
const trainingList = document.querySelector("#team-training-list");
const squadTitle = document.querySelector("#team-squad-title");
const squadNote = document.querySelector("#team-squad-note");
const squadGrid = document.querySelector("#team-squad-grid");
const primaryCta = document.querySelector("#team-cta-primary");
const secondaryCta = document.querySelector("#team-cta-secondary");
const sourceNote = document.querySelector("#team-source-note");
const socialGrid = document.querySelector("#social-grid");

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

function renderTeamPage() {
  if (!detail) {
    return;
  }

  document.title = `${detail.name} | SV Zweckel 23 e. V.`;
  heroEyebrow.textContent = detail.label;
  heroTitle.textContent = detail.heroTitle;
  heroIntro.textContent = detail.intro;
  heroImage.src = detail.heroImage;
  heroImage.alt = detail.heroAlt;
  primaryCta.href = detail.cta.primaryUrl;
  primaryCta.textContent = detail.cta.primaryLabel;
  secondaryCta.href = detail.cta.secondaryUrl;
  secondaryCta.textContent = detail.cta.secondaryLabel;
  sourceNote.textContent = detail.sourceNote;

  statsGrid.innerHTML = detail.stats
    .map(
      (item) => `
        <article class="quick-stat">
          <span class="quick-stat-label">${item.label}</span>
          <strong>${item.value}</strong>
          <p>${item.detail}</p>
        </article>
      `
    )
    .join("");

  summaryGrid.innerHTML = detail.summaryCards
    .map(
      (item) => `
        <article class="profile-card">
          <div class="profile-card-body">
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </div>
        </article>
      `
    )
    .join("");

  matchesList.innerHTML = detail.nextMatches
    .map(
      (match) => `
        <li class="detail-list-item">${match}</li>
      `
    )
    .join("");

  newsList.innerHTML = detail.recentNews
    .map(
      (item) => `
        <article class="news-line-card">
          <p class="card-kicker">${item.date}</p>
          <h3>${item.title}</h3>
        </article>
      `
    )
    .join("");

  if (coachingGrid && detail.coaching?.length) {
    coachingGrid.innerHTML = detail.coaching
      .map(
        (item) => `
          <article class="board-card">
            <h3>${item.name}</h3>
            <p class="card-kicker">${item.role}</p>
            <p>${item.text}</p>
          </article>
        `
      )
      .join("");
  }

  if (trainingTitle && trainingNote && trainingList && detail.training) {
    trainingTitle.textContent = detail.training.title;
    trainingNote.textContent = detail.training.note;
    trainingList.innerHTML = detail.training.items
      .map((item) => `<li class="detail-list-item">${item}</li>`)
      .join("");
  }

  if (squadTitle && squadNote && squadGrid && detail.squad) {
    squadTitle.textContent = detail.squad.title;
    squadNote.textContent = detail.squad.note;
    squadGrid.innerHTML = detail.squad.players
      .map(
        (player) => `
          <article class="squad-card">
            <p class="card-kicker">${player.position}</p>
            <h3>${player.name}</h3>
          </article>
        `
      )
      .join("");
  }
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

renderTeamPage();
renderSocialLinks();
bindNavigation();
