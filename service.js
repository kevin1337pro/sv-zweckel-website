const { servicePortal = {} } = window.svzData || {};

const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector("#primary-nav");
const heroTitle = document.querySelector("#service-hero-title");
const heroIntro = document.querySelector("#service-hero-intro");
const accessGrid = document.querySelector("#service-access");
const blocksGrid = document.querySelector("#service-blocks");
const sponsorList = document.querySelector("#service-sponsor-reasons");
const contactsGrid = document.querySelector("#service-contacts");

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

function renderServicePage() {
  heroTitle.textContent = servicePortal.heroTitle || "Fans & Service";
  heroIntro.textContent = servicePortal.intro || "";

  accessGrid.innerHTML = (servicePortal.accessCards || [])
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

  blocksGrid.innerHTML = (servicePortal.serviceBlocks || [])
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

  sponsorList.innerHTML = (servicePortal.sponsorReasons || [])
    .map((item) => `<li class="detail-list-item">${item}</li>`)
    .join("");

  contactsGrid.innerHTML = (servicePortal.contacts || [])
    .map(
      (item) => `
        <a class="contact-line" href="${item.href}" ${item.href.startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>
          <span class="quick-stat-label">${item.label}</span>
          <strong>${item.value}</strong>
        </a>
      `
    )
    .join("");
}

renderServicePage();
bindNavigation();
