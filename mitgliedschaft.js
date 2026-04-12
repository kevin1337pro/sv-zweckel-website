const { membershipPortal = {} } = window.svzData || {};

const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector("#primary-nav");
const heroTitle = document.querySelector("#membership-hero-title");
const heroIntro = document.querySelector("#membership-hero-intro");
const benefitsGrid = document.querySelector("#membership-benefits");
const processList = document.querySelector("#membership-process");
const documentsGrid = document.querySelector("#membership-documents");
const optionsGrid = document.querySelector("#membership-options");

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

function renderMembershipPage() {
  heroTitle.textContent = membershipPortal.heroTitle || "Mitgliedschaft";
  heroIntro.textContent = membershipPortal.intro || "";

  benefitsGrid.innerHTML = (membershipPortal.benefits || [])
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

  processList.innerHTML = (membershipPortal.process || [])
    .map((step) => `<li class="detail-list-item">${step}</li>`)
    .join("");

  documentsGrid.innerHTML = (membershipPortal.documents || [])
    .map(
      (item) => `
        <article class="profile-card">
          <div class="profile-card-body">
            <p class="card-kicker">${item.status}</p>
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </div>
        </article>
      `
    )
    .join("");

  optionsGrid.innerHTML = (membershipPortal.options || [])
    .map(
      (item) => `
        <article class="profile-card">
          <div class="profile-card-body">
            <h3>${item.title}</h3>
            <p>${item.text}</p>
            <a class="text-link" href="${item.url}">${item.label}</a>
          </div>
        </article>
      `
    )
    .join("");
}

renderMembershipPage();
bindNavigation();
