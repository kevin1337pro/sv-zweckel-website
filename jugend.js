const {
  youthPortal = {},
  youthTeams = [],
  socialLinks = [],
} = window.svzData || {};

const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector("#primary-nav");
const heroTitle = document.querySelector("#youth-hero-title");
const heroIntro = document.querySelector("#youth-hero-intro");
const valuesGrid = document.querySelector("#youth-values");
const teamGrid = document.querySelector("#youth-team-grid");
const contactsGrid = document.querySelector("#youth-contacts");
const stepsList = document.querySelector("#youth-steps");
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

function renderYouthPortal() {
  heroTitle.textContent = youthPortal.heroTitle || "Jugend";
  heroIntro.textContent = youthPortal.intro || "";

  valuesGrid.innerHTML = (youthPortal.values || [])
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

  teamGrid.innerHTML = youthTeams
    .map(
      (team) => `
        <article class="profile-card">
          <div class="profile-card-body">
            <p class="card-kicker">${team.stage}</p>
            <h3>${team.name}</h3>
            <p>${team.summary}</p>
            <p class="profile-pitch">${team.status}</p>
            ${
              team.profileUrl
                ? `<a class="text-link" href="${team.profileUrl}" target="_blank" rel="noreferrer">Offizielles Profil auf FUSSBALL.DE</a>`
                : ""
            }
          </div>
        </article>
      `
    )
    .join("");

  contactsGrid.innerHTML = (youthPortal.contacts || [])
    .map(
      (contact) => `
        <article class="board-card">
          <h3>${contact.name}</h3>
          <p>${contact.role}</p>
        </article>
      `
    )
    .join("");

  stepsList.innerHTML = (youthPortal.steps || [])
    .map((step) => `<li class="detail-list-item">${step}</li>`)
    .join("");
}

function renderSocialLinks() {
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

renderYouthPortal();
renderSocialLinks();
bindNavigation();
