(() => {
  "use strict";

  const FALLBACK_IMAGE =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <rect width="800" height="800" fill="#e9f0f6"/>
        <circle cx="400" cy="300" r="135" fill="#b9c8d6"/>
        <path d="M180 720c18-154 103-240 220-240s202 86 220 240" fill="#b9c8d6"/>
        <text x="400" y="765" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#4a6074">
          ESHA Hub Member
        </text>
      </svg>
    `);

  const linkLabels = {
    orcid: "ORCID",
    googleScholar: "Google Scholar",
    zenodo: "Zenodo",
    academia: "Academia.edu",
    researchGate: "ResearchGate",
    linkedIn: "LinkedIn",
    github: "GitHub"
  };

  document.addEventListener("DOMContentLoaded", () => {
    initialiseNavigation();
    setCurrentYear();

    const page = document.body.dataset.page;

    if (page === "executive-members") {
      renderMembersListing();
    }

    if (page === "member-profile") {
      renderMemberProfile();
    }
  });

  function initialiseNavigation() {
    const menuToggle = document.querySelector(".mobile-menu-toggle");
    const navigation = document.querySelector(".main-navigation");
    const dropdown = document.querySelector(".nav-dropdown");
    const dropdownToggle = document.querySelector(".dropdown-toggle");

    if (menuToggle && navigation) {
      menuToggle.addEventListener("click", () => {
        const willOpen = !navigation.classList.contains("is-open");
        navigation.classList.toggle("is-open", willOpen);
        menuToggle.setAttribute("aria-expanded", String(willOpen));
        menuToggle.setAttribute(
          "aria-label",
          willOpen ? "Close navigation menu" : "Open navigation menu"
        );
      });
    }

    if (dropdown && dropdownToggle) {
      dropdownToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !dropdown.classList.contains("is-open");
        closeAllDropdowns();
        dropdown.classList.toggle("is-open", willOpen);
        dropdownToggle.setAttribute("aria-expanded", String(willOpen));
      });

      dropdown.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          dropdown.classList.remove("is-open");
          dropdownToggle.setAttribute("aria-expanded", "false");
          dropdownToggle.focus();
        }
      });
    }

    document.addEventListener("click", (event) => {
      if (dropdown && !dropdown.contains(event.target)) {
        dropdown.classList.remove("is-open");
        dropdownToggle?.setAttribute("aria-expanded", "false");
      }

      if (
        navigation &&
        menuToggle &&
        navigation.classList.contains("is-open") &&
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        navigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900 && navigation && menuToggle) {
        navigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
      }
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".nav-dropdown.is-open").forEach((item) => {
      item.classList.remove("is-open");
      item
        .querySelector(".dropdown-toggle")
        ?.setAttribute("aria-expanded", "false");
    });
  }

  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = new Date().getFullYear();
    });
  }

  function renderMembersListing() {
    const grid = document.getElementById("members-grid");
    if (!grid) return;

    const executiveMembers = Array.isArray(window.members)
      ? window.members.filter((member) => member.category === "executive-members")
      : typeof members !== "undefined"
        ? members.filter((member) => member.category === "executive-members")
        : [];

    if (!executiveMembers.length) {
      grid.innerHTML = `
        <div class="status-card">
          Executive member information is currently unavailable.
        </div>
      `;
      return;
    }

    grid.innerHTML = executiveMembers
      .map(
        (member) => `
          <article class="member-card">
            <div class="member-card__image-wrap">
              <img
                class="member-card__image"
                src="${escapeAttribute(member.image)}"
                alt="Photograph of ${escapeAttribute(member.name)}"
                width="640"
                height="700"
                loading="lazy"
                decoding="async"
                data-fallback-image
              >
              <span class="member-card__badge">Executive Member</span>
            </div>

            <div class="member-card__body">
              <div>
                <h3>${escapeHTML(member.name)}</h3>
                <p class="member-card__designation">${escapeHTML(member.designation)}</p>
                ${
                  hasText(member.shortResponsibility)
                    ? `<p class="member-card__responsibility">${escapeHTML(member.shortResponsibility)}</p>`
                    : ""
                }
              </div>

              <a
                class="button button--primary button--full"
                href="member-profile.html?member=${encodeURIComponent(member.slug)}"
                aria-label="View profile of ${escapeAttribute(member.name)}"
              >
                View Profile
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        `
      )
      .join("");

    attachImageFallbacks(grid);
  }

  function renderMemberProfile() {
    const root = document.getElementById("profile-root");
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("member");

    const data = typeof members !== "undefined" && Array.isArray(members) ? members : [];
    const member = data.find((item) => item.slug === slug);

    if (!member) {
      root.innerHTML = renderNotFound();
      return;
    }

    updateProfileMetadata(member);
    root.innerHTML = renderProfile(member);
    attachImageFallbacks(root);
    initialiseCitationButtons();
  }

  function renderProfile(member) {
    const biography = hasText(member.biography)
      ? member.biography
      : "Verified biographical information will be added after approval.";

    const contactButton = hasText(member.officialContact)
      ? `
        <a
          class="button button--primary button--full"
          href="mailto:${escapeAttribute(member.officialContact)}?subject=${encodeURIComponent(
            `Contact request for ${member.name} through ESHA Hub`
          )}"
        >
          Contact through ESHA Hub
        </a>
      `
      : "";

    const links = renderProfessionalLinks(member.links);

    return `
      <section class="profile-hero">
        <div class="container">
          <nav class="breadcrumb breadcrumb--light" aria-label="Breadcrumb">
            <ol>
              <li><a href="/index.html">Home</a></li>
              <li><span>Members</span></li>
              <li><a href="executive-members.html">Executive Members</a></li>
              <li aria-current="page"><span>${escapeHTML(member.name)}</span></li>
            </ol>
          </nav>

          <div class="profile-hero__copy">
            <p class="eyebrow eyebrow--light">Members · Executive Members</p>
            <h1>${escapeHTML(member.name)}</h1>
            <p>${escapeHTML(member.designation)}</p>
          </div>
        </div>
      </section>

      <section class="profile-page">
        <div class="container profile-layout">
          <aside class="profile-sidebar" aria-label="${escapeAttribute(member.name)} profile summary">
            <div class="profile-identity-card">
              <div class="profile-identity-card__image-wrap">
                <img
                  class="profile-identity-card__image"
                  src="${escapeAttribute(member.image)}"
                  alt="Photograph of ${escapeAttribute(member.name)}"
                  width="720"
                  height="820"
                  decoding="async"
                  fetchpriority="high"
                  data-fallback-image
                >
              </div>

              <div class="profile-identity-card__content">
                <p class="eyebrow">Executive Leadership</p>
                <h2>${escapeHTML(member.name)}</h2>
                <p class="profile-designation">${escapeHTML(member.designation)}</p>
                <p class="profile-organisation">ESHA Hub</p>

                ${
                  hasText(member.shortResponsibility)
                    ? `<p class="profile-short-responsibility">${escapeHTML(member.shortResponsibility)}</p>`
                    : ""
                }

                <div class="profile-actions">
                  ${contactButton}
                  <a class="button button--secondary button--full" href="executive-members.html">
                    Back to Executive Members
                  </a>
                </div>
              </div>
            </div>

            ${
              links
                ? `
                  <div class="sidebar-panel">
                    <h3>Professional and Research Links</h3>
                    ${links}
                  </div>
                `
                : ""
            }
          </aside>

          <div class="profile-content">
            <section class="profile-section">
              <div class="profile-section__heading">
                <span class="section-number">01</span>
                <div>
                  <p class="eyebrow">Profile Overview</p>
                  <h2>About ${escapeHTML(member.name)}</h2>
                </div>
              </div>

              <div class="overview-grid">
                <dl class="profile-facts">
                  <div>
                    <dt>Full Name</dt>
                    <dd>${escapeHTML(member.name)}</dd>
                  </div>
                  <div>
                    <dt>Designation</dt>
                    <dd>${escapeHTML(member.designation)}</dd>
                  </div>
                  <div>
                    <dt>Organisation</dt>
                    <dd>ESHA Hub</dd>
                  </div>
                </dl>

                <div class="profile-biography">
                  <h3>Short Biography</h3>
                  <p>${escapeHTML(biography)}</p>
                </div>
              </div>
            </section>

            ${
              hasText(member.roleAtEshaHub)
                ? renderRoleSection(member.roleAtEshaHub)
                : ""
            }

            ${
              hasItems(member.areasOfWork)
                ? renderAreasSection(member.areasOfWork)
                : ""
            }

            ${
              hasItems(member.projects)
                ? renderProjectsSection(member.projects)
                : ""
            }

            ${
              hasItems(member.publications)
                ? renderPublicationsSection(member.publications)
                : ""
            }

            ${
              hasItems(member.achievements)
                ? renderAchievementsSection(member.achievements)
                : ""
            }

            ${
              hasItems(member.latestContributions)
                ? renderLatestContributionsSection(member.latestContributions)
                : ""
            }
          </div>
        </div>
      </section>
    `;
  }

  function renderRoleSection(roleText) {
    return `
      <section class="profile-section">
        <div class="profile-section__heading">
          <span class="section-number">02</span>
          <div>
            <p class="eyebrow">Institutional Responsibility</p>
            <h2>Role at ESHA Hub</h2>
          </div>
        </div>
        <div class="text-panel">
          <p>${escapeHTML(roleText)}</p>
        </div>
      </section>
    `;
  }

  function renderAreasSection(areas) {
    return `
      <section class="profile-section">
        <div class="profile-section__heading">
          <span class="section-number">03</span>
          <div>
            <p class="eyebrow">Focus Areas</p>
            <h2>Areas of Work and Contribution</h2>
          </div>
        </div>
        <ul class="tag-list" aria-label="Areas of work and contribution">
          ${areas.map((area) => `<li>${escapeHTML(area)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderProjectsSection(projects) {
    return `
      <section class="profile-section">
        <div class="profile-section__heading">
          <span class="section-number">04</span>
          <div>
            <p class="eyebrow">Institutional Work</p>
            <h2>Projects and Initiatives</h2>
          </div>
        </div>

        <div class="content-card-grid">
          ${projects
            .map(
              (project) => `
                <article class="content-card">
                  <div class="content-card__topline">
                    ${hasText(project.status) ? `<span class="status-pill">${escapeHTML(project.status)}</span>` : ""}
                    ${hasText(project.role) ? `<span class="meta-text">${escapeHTML(project.role)}</span>` : ""}
                  </div>
                  <h3>${escapeHTML(project.title || "Project")}</h3>
                  ${hasText(project.description) ? `<p>${escapeHTML(project.description)}</p>` : ""}
                  ${
                    hasText(project.url)
                      ? `<a class="text-link" href="${escapeAttribute(project.url)}" target="_blank" rel="noopener noreferrer">View Project <span aria-hidden="true">↗</span></a>`
                      : ""
                  }
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderPublicationsSection(publications) {
    return `
      <section class="profile-section">
        <div class="profile-section__heading">
          <span class="section-number">05</span>
          <div>
            <p class="eyebrow">Knowledge Outputs</p>
            <h2>Research and Publications</h2>
          </div>
        </div>

        <div class="publication-list">
          ${publications.map(renderPublicationCard).join("")}
        </div>
      </section>
    `;
  }

  function renderPublicationCard(publication) {
    const metadata = [
      publication.type,
      publication.year,
      publication.version,
      publication.reviewStatus
    ].filter(hasText);

    const actions = [
      hasText(publication.paperUrl)
        ? `<a class="button button--small button--primary" href="${escapeAttribute(publication.paperUrl)}" target="_blank" rel="noopener noreferrer">View Paper</a>`
        : "",
      hasText(publication.pdfUrl)
        ? `<a class="button button--small button--secondary" href="${escapeAttribute(publication.pdfUrl)}" target="_blank" rel="noopener noreferrer" download>Download PDF</a>`
        : "",
      hasText(publication.citation)
        ? `<button class="button button--small button--ghost citation-button" type="button" data-citation="${escapeAttribute(publication.citation)}">Copy Citation</button>`
        : ""
    ]
      .filter(Boolean)
      .join("");

    return `
      <article class="publication-card">
        ${metadata.length ? `<div class="publication-card__meta">${metadata.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>` : ""}
        <h3>${escapeHTML(publication.title || "Publication")}</h3>
        ${hasText(publication.authors) ? `<p class="publication-authors">${escapeHTML(publication.authors)}</p>` : ""}
        ${hasText(publication.abstract) ? `<p>${escapeHTML(publication.abstract)}</p>` : ""}

        <dl class="publication-details">
          ${hasText(publication.doi) ? `<div><dt>DOI</dt><dd>${escapeHTML(publication.doi)}</dd></div>` : ""}
          ${
            hasText(publication.repositoryUrl)
              ? `<div><dt>Repository</dt><dd><a href="${escapeAttribute(publication.repositoryUrl)}" target="_blank" rel="noopener noreferrer">Open repository <span aria-hidden="true">↗</span></a></dd></div>`
              : ""
          }
        </dl>

        ${actions ? `<div class="publication-actions">${actions}</div>` : ""}
      </article>
    `;
  }

  function renderAchievementsSection(achievements) {
    return `
      <section class="profile-section">
        <div class="profile-section__heading">
          <span class="section-number">06</span>
          <div>
            <p class="eyebrow">Progress</p>
            <h2>Achievements and Milestones</h2>
          </div>
        </div>

        <ol class="timeline">
          ${achievements
            .map(
              (achievement) => `
                <li class="timeline__item">
                  ${hasText(achievement.year) ? `<span class="timeline__year">${escapeHTML(achievement.year)}</span>` : ""}
                  <div>
                    <h3>${escapeHTML(achievement.title || "Milestone")}</h3>
                    ${hasText(achievement.description) ? `<p>${escapeHTML(achievement.description)}</p>` : ""}
                  </div>
                </li>
              `
            )
            .join("")}
        </ol>
      </section>
    `;
  }

  function renderLatestContributionsSection(contributions) {
    return `
      <section class="profile-section">
        <div class="profile-section__heading">
          <span class="section-number">07</span>
          <div>
            <p class="eyebrow">Recent Activity</p>
            <h2>Latest Contributions</h2>
          </div>
        </div>

        <div class="content-card-grid">
          ${contributions
            .map(
              (item) => `
                <article class="content-card">
                  ${hasText(item.type) ? `<span class="status-pill">${escapeHTML(item.type)}</span>` : ""}
                  <h3>${escapeHTML(item.title || "Contribution")}</h3>
                  ${hasText(item.description) ? `<p>${escapeHTML(item.description)}</p>` : ""}
                  ${
                    hasText(item.url)
                      ? `<a class="text-link" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener noreferrer">View Details <span aria-hidden="true">↗</span></a>`
                      : ""
                  }
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderProfessionalLinks(links) {
    if (!links || typeof links !== "object") return "";

    const availableLinks = Object.entries(links).filter(
      ([key, url]) => linkLabels[key] && hasText(url)
    );

    if (!availableLinks.length) return "";

    return `
      <ul class="professional-links">
        ${availableLinks
          .map(
            ([key, url]) => `
              <li>
                <a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">
                  <span>${escapeHTML(linkLabels[key])}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  function renderNotFound() {
    document.title = "Member Profile Not Found | ESHA Hub";

    return `
      <section class="not-found-section">
        <div class="container">
          <div class="not-found-card">
            <span class="not-found-card__icon" aria-hidden="true">!</span>
            <p class="eyebrow">Members</p>
            <h1>Member profile not found.</h1>
            <p>
              The profile link may be incomplete, or the requested Executive Member may not be available.
            </p>
            <a class="button button--primary" href="executive-members.html">
              Back to Executive Members
            </a>
          </div>
        </div>
      </section>
    `;
  }

  function updateProfileMetadata(member) {
    document.title = `${member.name} – ${member.designation} | ESHA Hub`;

    const description = hasText(member.biography)
      ? member.biography.slice(0, 155)
      : `View the official profile of ${member.name}, ${member.designation} at ESHA Hub.`;

    const meta = document.getElementById("meta-description");
    if (meta) {
      meta.setAttribute("content", description);
    }
  }

  function initialiseCitationButtons() {
    document.querySelectorAll(".citation-button").forEach((button) => {
      button.addEventListener("click", async () => {
        const citation = button.dataset.citation || "";
        if (!citation) return;

        const originalText = button.textContent;

        try {
          await navigator.clipboard.writeText(citation);
          button.textContent = "Citation Copied";
        } catch {
          const temporaryTextArea = document.createElement("textarea");
          temporaryTextArea.value = citation;
          temporaryTextArea.setAttribute("readonly", "");
          temporaryTextArea.style.position = "fixed";
          temporaryTextArea.style.opacity = "0";
          document.body.appendChild(temporaryTextArea);
          temporaryTextArea.select();
          document.execCommand("copy");
          temporaryTextArea.remove();
          button.textContent = "Citation Copied";
        }

        window.setTimeout(() => {
          button.textContent = originalText;
        }, 1800);
      });
    });
  }

  function attachImageFallbacks(scope = document) {
    scope.querySelectorAll("[data-fallback-image]").forEach((image) => {
      image.addEventListener(
        "error",
        () => {
          image.src = FALLBACK_IMAGE;
          image.removeAttribute("data-fallback-image");
        },
        { once: true }
      );
    });
  }

  function hasItems(value) {
    return Array.isArray(value) && value.length > 0;
  }

  function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHTML(value);
  }
})();
