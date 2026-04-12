const {
  clubMeta = {},
  socialLinks = [],
  teamProfiles = [],
} = window.svzData || {};

const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector("#primary-nav");
const clubSummary = document.querySelector("#club-summary");
const teamProfileGrid = document.querySelector("#team-profile-grid");
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

function renderClubSummary() {
  if (!clubSummary) {
    return;
  }

  clubSummary.innerHTML = `
    <p class="club-summary-line"><strong>${clubMeta.teamCount}</strong> insgesamt</p>
    <p class="club-summary-line">${clubMeta.juniorCount}</p>
    <p class="club-summary-line">${clubMeta.seniorCount}</p>
    <p class="club-summary-line">${clubMeta.colors}</p>
    <p class="club-summary-line">${clubMeta.address}</p>
    <a
      class="button button-primary"
      href="${clubMeta.fussballDeClubUrl}"
      target="_blank"
      rel="noreferrer"
    >
      Offiziellen Vereinseintrag oeffnen
    </a>
    <p class="form-note">${clubMeta.standLabel}</p>
  `;
}

function renderTeamProfiles() {
  if (!teamProfileGrid) {
    return;
  }

  teamProfileGrid.innerHTML = teamProfiles
    .map(
      (team) => `
        <article class="profile-card">
          <div class="profile-card-body">
            <div class="meta-row">
              <span class="tag">${team.group}</span>
              <span>${team.level}</span>
            </div>
            <h3>${team.name}</h3>
            <p class="profile-competition">${team.competition}</p>
            <div class="profile-stats">
              <div class="quick-stat">
                <span class="quick-stat-label">Tabelle</span>
                <strong>${team.position}</strong>
                <p>${team.points}</p>
              </div>
              <div class="quick-stat">
                <span class="quick-stat-label">Torbilanz</span>
                <strong>${team.goalDiff}</strong>
                <p>${team.nextMatch}</p>
              </div>
            </div>
            <p>${team.note}</p>
            <p class="profile-pitch">${team.pitch}</p>
            ${
              team.detailUrl
                ? `<a class="button button-ghost" href="${team.detailUrl}">Teamseite ansehen</a>`
                : ""
            }
            <a
              class="text-link"
              href="${team.fussballUrl}"
              target="_blank"
              rel="noreferrer"
            >
              Offizielles Teamprofil auf FUSSBALL.DE
            </a>
          </div>
        </article>
      `
    )
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

renderClubSummary();
renderTeamProfiles();
renderSocialLinks();
bindNavigation();
