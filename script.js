// === CONSTANTS & HELPERS =====================================================

const STORAGE_KEYS = {
  USER: "svp_current_user",
  ACTIVITIES: "svp_activities",
};

const ROLES = {
  USER: "user",
  ORG: "org",
};

// Simple ID generator for activities
function generateId() {
  return "act_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
 Parse time "HH:MM" to minutes
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Show toast notification
let toastTimeout;
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("visible");
  toast.style.borderColor =
    type === "error"
      ? "rgba(239,68,68,0.8)"
      : type === "success"
      ? "rgba(34,197,94,0.8)"
      : "rgba(148,163,184,0.6)";

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.classList.add("hidden"), 250);
  }, 2800);
}

// === LOCAL STORAGE LAYER =====================================================

function loadCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to load user from localStorage", e);
    return null;
  }
}

function saveCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.USER);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function loadActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load activities", e);
    return [];
  }
}

function saveActivities(activities) {
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
}

// === STATE ====================================================================

let currentUser = loadCurrentUser();
let activities = loadActivities();

// === DOM REFERENCES ==========================================================

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section");
const currentUserLabel = document.getElementById("current-user-label");
const openLoginModalBtn = document.getElementById("open-login-modal");
const logoutBtn = document.getElementById("logout-btn");
const heroJoinBtn = document.getElementById("hero-join-btn");
const heroOrgBtn = document.getElementById("hero-org-btn");
const roleHint = document.getElementById("role-hint");

const orgPanel = document.getElementById("org-panel");
const userPanel = document.getElementById("user-panel");
const allActivitiesList = document.getElementById("all-activities-list");
const orgActivitiesList = document.getElementById("org-activities-list");

// Activity form
const toggleActivityFormBtn = document.getElementById("toggle-activity-form");
const activityForm = document.getElementById("activity-form");
const activityFormTitle = document.getElementById("activity-form-title");
const activityIdInput = document.getElementById("activity-id");
const activityTitleInput = documentElementById("activity-title");
const activityDescriptionInput = document.getElementById(
  "activity-description"
);
const activityLocationInput = document.getElementById("activity-location");
const activityDateFromInput = document.getElementById("activity-date-from");
const activityDateToInput = document.getElementById("activity-date-to");
const activityTimeFromInput = document.getElementById("activity-time-from");
const activityTimeToInput = document.getElementById("activity-time-to");
const activityMinAgeInput = document.getElementById("activity-min-age");
const activityMaxParticipantsInput = document.getElementById(
  "activity-max-participants"
);
const cancelActivityEditBtn = document.getElementById("cancel-activity-edit");
const activityFormGlobalError = document.getElementById(
  "activity-form-global-error"
);

// Login modal
const loginModal = document.getElementById("login-modal");
const closeLoginModalBtn = document.getElementById("close-login-modal");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabs = document.querySelectorAll(".tab");
const userLoginForm = document.getElementById("user-login-form");
const userEmailInput = document.getElementById("user-email");
const userEmailError = document.getElementById("user-email-error");
const userLoginGlobalError = document.getElementById("user-login-global-error");
const orgLoginForm = document.getElementById("org-login-form");
const orgCodeInput = document.getElementById("org-code");
const orgCodeError = document.getElementById("org-code-error");
const orgLoginGlobalError = document.getElementById("org-login-global-error");

// Registration modal
const registrationModal = document.getElementById("registration-modal");
const closeRegistrationModalBtn = document.getElementById(
  "close-registration-modal"
);
const registrationActivitySummary = document.getElementById(
  "registration-activity-summary"
);
const registrationForm = document.getElementById("registration-form");
const registrationActivityIdInput = document.getElementById(
  "registration-activity-id"
);
const registrationDateInput = document.getElementById("registration-date");
const registrationTimeInput = document.getElementById("registration-time");
const registrationDateError = document.getElementById("registration-date-error");
const registrationTimeError = document.getElementById("registration-time-error");
const registrationGlobalError = document.getElementById(
  "registration-global-error"
);

// === UI UTILITIES ============================================================

function switchSection(sectionId) {
  sections.forEach((sec) => {
    sec.classList.toggle("active", sec.id === sectionId);
  });
  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("data-section") === sectionId
    );
  });
}

function openModal(modalEl) {
  modalEl.classList.remove("hidden");
}

function closeModal(modalEl) {
  modalEl.classList.add("hidden");
}

// Clear all error messages in a form
function clearFormErrors(formEl) {
  const errorEls = formEl.querySelectorAll(".error");
  errorEls.forEach((el) => (el.textContent = ""));
}

// === AUTHENTICATION ==========================================================

function validateGmail(email) {
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return gmailRegex.test(email.trim());
}

function validateOrgCode(code) {
  return /^ORG-[A-Z0-9]{3}$/.test(code.trim());
}

function updateAuthUI() {
  if (currentUser) {
    openLoginModalBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    const roleLabel =
      currentUser.role === ROLES.ORG ? "Organizacija" : "Savanoris";
    currentUserLabel.textContent = `${roleLabel}: ${currentUser.display}`;
    if (currentUser.role === ROLES.ORG) {
      orgPanel.classList.remove("hidden");
      userPanel.classList.add("hidden");
      roleHint.textContent =
        "Prisijungėte kaip organizacija. Galite kurti, redaguoti ir trinti savo veiklas.";
    } else {
      orgPanel.classList.add("hidden");
      userPanel.classList.remove("hidden");
      roleHint.textContent =
        "Prisijungėte kaip savanoris. Galite registruotis į jus dominančias veiklas.";
    }
  } else {
    openLoginModalBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    currentUserLabel.textContent = "";
    orgPanel.classList.add("hidden");
    userPanel.classList.add("hidden");
    roleHint.textContent =
      "Prisijunkite, kad galėtumėte kurti veiklas (organizacija) arba registruotis (savanoris).";
  }
  renderActivities();
}

function handleUserLogin(e) {
  e.preventDefault();
  clearFormErrors(userLoginForm);
  const email = userEmailInput.value.trim();

  if (!email) {
    userEmailError.textContent = "Įveskite Gmail adresą.";
    return;
  }
  if (!validateGmail(email)) {
    userEmailError.textContent = "Leidžiami tik @gmail.com adresai.";
    return;
  }

  currentUser = {
    role: ROLES.USER,
    email,
    display: email,
  };
  saveCurrentUser(currentUser);
  closeModal(loginModal);
  updateAuthUI();
  showToast("Sėkmingai prisijungėte kaip savanoris.", "success");
}

function handleOrgLogin(e) {
  e.preventDefault();
  clearFormErrors(orgLoginForm);
  const code = orgCodeInput.value.trim().toUpperCase();

  if (!code) {
    orgCodeError.textContent = "Įveskite organizacijos kodą.";
    return;
  }
  if (!validateOrgCode(code)) {
    orgCodeError.textContent = "Kodas turi būti formato ORG-XXX (raidės/skaičiai).";
    return;
  }

  currentUser = {
    role: ROLES.ORG,
    orgCode: code,
    display: code,
  };
  saveCurrentUser(currentUser);
  closeModal(loginModal);
  updateAuthUI();
  showToast("Sėkmingai prisijungėte kaip organizacija.", "success");
}

function logout() {
  currentUser = null;
  saveCurrentUser(null);
  updateAuthUI();
  showToast("Atsijungėte.", "info");
}

// === ACTIVITIES CRUD =========================================================

function validateActivityForm() {
  let valid = true;
  clearFormErrors(activityForm);
  activityFormGlobalError.textContent = "";

  const title = activityTitleInput.value.trim();
  const desc = activityDescriptionInput.value.trim();
  const loc = activityLocationInput.value.trim();
  const dateFrom = activityDateFromInput.value;
  const dateTo = activityDateToInput.value;
  const timeFrom = activityTimeFromInput.value;
  const timeTo = activityTimeToInput.value;
  const minAge = activityMinAgeInput.value;
  const maxParticipants = activityMaxParticipantsInput.value;

  if (!title) {
    document.getElementById("activity-title-error").textContent =
      "Įveskite pavadinimą.";
    valid = false;
  }
  if (!desc) {
    document.getElementById("activity-description-error").textContent =
      "Įveskite aprašymą.";
    valid = false;
  }
  if (!loc) {
    document.getElementById("activity-location-error").textContent =
      "Įveskite Google Maps nuorodą.";
    valid = false;
  } else if (!/^https?:\/\/.+/.test(loc)) {
    document.getElementById("activity-location-error").textContent =
      "Nuoroda turi prasidėti http:// arba https://";
    valid = false;
  }

  if (!dateFrom) {
    document.getElementById("activity-date-from-error").textContent =
      "Pasirinkite pradžios datą.";
    valid = false;
  }
  if (!dateTo) {
    document.getElementById("activity-date-to-error").textContent =
      "Pasirinkite pabaigos datą.";
    valid = false;
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    document.getElementById("activity-date-to-error").textContent =
      "Pabaigos data negali būti ankstesnė už pradžios datą.";
    valid = false;
  }

  if (!timeFrom) {
    document.getElementById("activity-time-from-error").textContent =
      "Pasirinkite pradžios laiką.";
    valid = false;
  }
  if (!timeTo) {
    document.getElementById("activity-time-to-error").textContent =
      "Pasirinkite pabaigos laiką.";
    valid = false;
  }
  if (timeFrom && timeTo && timeFrom >= timeTo) {
    document.getElementById("activity-time-to-error").textContent =
      "Pabaigos laikas turi būti vėlesnis už pradžios laiką.";
    valid = false;
  }

  const minAgeNum = Number(minAge);
  if (!minAge) {
    document.getElementById("activity-min-age-error").textContent =
      "Įveskite minimalų amžių.";
    valid = false;
  } else if (Number.isNaN(minAgeNum) || minAgeNum < 12 || minAgeNum > 120) {
    document.getElementById("activity-min-age-error").textContent =
      "Įveskite realų amžių (12–120).";
    valid = false;
  }

  const maxPartNum = Number(maxParticipants);
  if (!maxParticipants) {
    document.getElementById("activity-max-participants-error").textContent =
      "Įveskite maksimalų dalyvių skaičių.";
    valid = false;
  } else if (Number.isNaN(maxPartNum) || maxPartNum < 1) {
    document.getElementById("activity-max-participants-error").textContent =
      "Dalyvių skaičius turi būti bent 1.";
    valid = false;
  }

  if (!valid) {
    activityFormGlobalError.textContent =
      "Patikrinkite formą – kai kurie laukai užpildyti neteisingai.";
  }

  return valid;
}

function resetActivityForm() {
  activityForm.reset();
  activityIdInput.value = "";
  clearFormErrors(activityForm);
  activityFormGlobalError.textContent = "";
  activityFormTitle.textContent = "Sukurti naują veiklą";
}

function handleActivitySubmit(e) {
  e.preventDefault();
  if (!currentUser || currentUser.role !== ROLES.ORG) {
    activityFormGlobalError.textContent =
      "Veiklas gali kurti tik prisijungusios organizacijos.";
    return;
  }

  if (!validateActivityForm()) return;

  const id = activityIdInput.value || generateId();
  const now = new Date().toISOString();

  const baseActivity = {
    id,
    title: activityTitleInput.value.trim(),
    description: activityDescriptionInput.value.trim(),
    location: activityLocationInput.value.trim(),
    dateFrom: activityDateFromInput.value,
    dateTo: activityDateToInput.value,
    timeFrom: activityTimeFromInput.value,
    timeTo: activityTimeToInput.value,
    minAge: Number(activityMinAgeInput.value),
    maxParticipants: Number(activityMaxParticipantsInput.value),
    orgCode: currentUser.orgCode,
    createdAt: now,
  };

  const existingIndex = activities.findIndex((a) => a.id === id);
  if (existingIndex >= 0) {
    // Preserve registrations
    const existing = activities[existingIndex];
    activities[existingIndex] = {
      ...baseActivity,
      registrations: existing.registrations || [],
      updatedAt: now,
    };
    showToast("Veikla atnaujinta.", "success");
  } else {
    activities.push({
      ...baseActivity,
      registrations: [],
    });
    showToast("Veikla sukurta.", "success");
  }

  saveActivities(activities);
  resetActivityForm();
  activityForm.classList.add("hidden");
  renderActivities();
}

function handleEditActivity(activityId) {
  const activity = activities.find((a) => a.id === activityId);
  if (!activity) return;
  if (!currentUser || currentUser.role !== ROLES.ORG) return;
  if (activity.orgCode !== currentUser.orgCode) {
    showToast("Galite redaguoti tik savo organizacijos veiklas.", "error");
    return;
  }

  activityIdInput.value = activity.id;
  activityTitleInput.value = activity.title;
  activityDescriptionInput.value = activity.description;
  activityLocationInput.value = activity.location;
  activityDateFromInput.value = activity.dateFrom;
  activityDateToInput.value = activity.dateTo;
  activityTimeFromInput.value = activity.timeFrom;
  activityTimeToInput.value = activity.timeTo;
  activityMinAgeInput.value = activity.minAge;
  activityMaxParticipantsInput.value = activity.maxParticipants;
  activityFormTitle.textContent = "Redaguoti veiklą";
  clearFormErrors(activityForm);
  activityFormGlobalError.textContent = "";
  activityForm.classList.remove("hidden");
}

function handleDeleteActivity(activityId) {
  const activity = activities.find((a) => a.id === activityId);
  if (!activity) return;
  if (!currentUser || currentUser.role !== ROLES.ORG) return;
  if (activity.orgCode !== currentUser.orgCode) {
    showToast("Galite trinti tik savo organizacijos veiklas.", "error");
    return;
  }

  if (!confirm("Ar tikrai norite ištrinti šią veiklą?")) return;

  activities = activities.filter((a) => a.id !== activityId);
  saveActivities(activities);
  renderActivities();
  showToast("Veikla ištrinta.", "info");
}

// === REGISTRATION LOGIC ======================================================

function openRegistrationModal(activityId) {
  if (!currentUser || currentUser.role !== ROLES.USER) {
    showToast("Prisijunkite kaip savanoris, kad galėtumėte registruotis.", "error");
    return;
  }

  const activity = activities.find((a) => a.id === activityId);
  if (!activity) return;

  // Check capacity
  const currentCount = (activity.registrations || []).length;
  if (currentCount >= activity.maxParticipants) {
    showToast("Veikla jau pilnai užpildyta.", "error");
    return;
  }

  // Check duplicate registration
  const alreadyRegistered = (activity.registrations || []).some(
    (r) => r.userEmail === currentUser.email
  );
  if (alreadyRegistered) {
    showToast("Jūs jau užsiregistravote į šią veiklą.", "error");
    return;
  }

  registrationActivityIdInput.value = activity.id;
  registrationDateInput.value = "";
  registrationTimeInput.value = "";
  registrationDateError.textContent = "";
  registrationTimeError.textContent = "";
  registrationGlobalError.textContent = "";

  registrationActivitySummary.innerHTML = `
    <div><strong>${activity.title}</strong></div>
    <div>Data: ${activity.dateFrom} – ${activity.dateTo}</div>
    <div>Laikas: ${activity.timeFrom} – ${activity.timeTo}</div>
  `;

  openModal(registrationModal);
}

function handleRegistrationSubmit(e) {
  e.preventDefault();
  if (!currentUser || currentUser.role !== ROLES.USER) {
    registrationGlobalError.textContent =
      "Registruotis gali tik prisijungę savanoriai.";
    return;
  }

  clearFormErrors(registrationForm);
  registrationGlobalError.textContent = "";

  const activityId = registrationActivityIdInput.value;
  const date = registrationDateInput.value;
  const time = registrationTimeInput.value;

  const activity = activities.find((a) => a.id === activityId);
  if (!activity) {
    registrationGlobalError.textContent = "Veikla nerasta.";
    return;
  }

  let valid = true;

  if (!date) {
    registrationDateError.textContent = "Pasirinkite atvykimo datą.";
    valid = false;
  } else if (date < activity.dateFrom || date > activity.dateTo) {
    registrationDateError.textContent =
      "Data turi būti tarp veiklos pradžios ir pabaigos.";
    valid = false;
  }

  if (!time) {
    registrationTimeError.textContent = "Pasirinkite atvykimo laiką.";
    valid = false;
  } else if (
    timeToMinutes(time) < timeToMinutes(activity.timeFrom) ||
    timeToMinutes(time) > timeToMinutes(activity.timeTo)
  ) {
    registrationTimeError.textContent =
      "Laikas turi būti veiklos laiko intervale.";
    valid = false;
  }

  // Check duplicate registration
  const regs = activity.registrations || [];
  const alreadyRegistered = regs.some(
    (r) => r.userEmail === currentUser.email
  );
  if (alreadyRegistered) {
    registrationGlobalError.textContent =
      "Jūs jau esate užsiregistravę į šią veiklą.";
    valid = false;
  }

  // Check capacity
  if (regs.length >= activity.maxParticipants) {
    registrationGlobalError.textContent = "Veikla jau pilnai užpildyta.";
    valid = false;
  }

  if (!valid) {
    return;
  }

  const newRegistration = {
    userEmail: currentUser.email,
    date,
    time,
    registeredAt: new Date().toISOString(),
  };

  activity.registrations = [...regs, newRegistration];
  saveActivities(activities);
  closeModal(registrationModal);
  renderActivities();
  showToast("Registracija sėkminga.", "success");
}

// === RENDERING ===============================================================

function renderActivities() {
  // Render all activities
  if (!activities.length) {
    allActivitiesList.classList.add("empty-state");
    allActivitiesList.innerHTML = "<p>Dar nėra sukurtų veiklų.</p>";
  } else {
    allActivitiesList.classList.remove("empty-state");
    allActivitiesList.innerHTML = activities
      .map((activity) => renderActivityCard(activity, "all"))
      .join("");
  }

  // Render org activities
  if (currentUser && currentUser.role === ROLES.ORG) {
    const orgActs = activities.filter(
      (a) => a.orgCode === currentUser.orgCode
    );
    if (!orgActs.length) {
      orgActivitiesList.classList.add("empty-state");
      orgActivitiesList.innerHTML = "<p>Kol kas neturite sukurtų veiklų.</p>";
    } else {
      orgActivitiesList.classList.remove("empty-state");
      orgActivitiesList.innerHTML = orgActs
        .map((activity) => renderActivityCard(activity, "org"))
        .join("");
    }
  } else {
    orgActivitiesList.innerHTML = "";
  }

  attachActivityCardHandlers();
}

function renderActivityCard(activity, context) {
  const regs = activity.registrations || [];
  const used = regs.length;
  const remaining = Math.max(activity.maxParticipants - used, 0);
  const isFull = remaining === 0;

  const capacityText = isFull
    ? "Pilna"
    : `${used}/${activity.maxParticipants} dalyvių`;

  const orgLabel =
    context === "org" ? "" : `<span class="activity-card-badge">${activity.orgCode}</span>`;

  // For organization context, show registrations list
  let registrationsHtml = "";
  if (context === "org") {
    if (!regs.length) {
      registrationsHtml =
        '<small class="muted">Dar nėra užsiregistravusių dalyvių.</small>';
    } else {
      registrationsHtml =
        "<small class='muted'>Dalyviai:</small><ul style='margin:0.15rem 0 0.2rem 1.1rem;padding:0;font-size:0.8rem;'>" +
        regs
          .map(
            (r) =>
              `<li>${r.userEmail} – ${r.date} ${r.time}</li>`
          )
          .join("") +
        "</ul>";
    }
  }

  const registerBtn =
    currentUser && currentUser.role === ROLES.USER
      ? `<button class="btn btn-primary btn-sm register-btn" data-id="${activity.id}" ${
          isFull ? "disabled" : ""
        }>${isFull ? "Pilna" : "Registruotis"}</button>`
      : "";

  const orgActions =
    currentUser &&
    currentUser.role === ROLES.ORG &&
    currentUser.orgCode === activity.orgCode
      ? `
        <button class="btn btn-secondary btn-sm edit-activity-btn" data-id="${activity.id}">Redaguoti</button>
        <button class="btn btn-danger btn-sm delete-activity-btn" data-id="${activity.id}">Trinti</button>
      `
      : "";

  const actionsHtml =
    context === "org"
      ? `<div class="activity-actions">${orgActions}</div>`
      : `<div class="activity-actions">${registerBtn}</div>`;

  return `
    <article class="card activity-card">
      <div class="activity-card-header">
        <h3 class="activity-card-title">${activity.title}</h3>
        ${orgLabel}
      </div>
      <div class="activity-card-body">
        <p>${activity.description}</p>
        <div class="activity-meta">
          <div class="activity-meta-row">
            <span class="activity-meta-label">Data:</span>
            <span class="activity-meta-value">${activity.dateFrom} – ${
    activity.dateTo
  }</span>
          </div>
          <div class="activity-meta-row">
            <span class="activity-meta-label">Laikas:</span>
            <span class="activity-meta-value">${activity.timeFrom} – ${
    activity.timeTo
  }</span>
          </div>
          <div class="activity-meta-row">
            <span class="activity-meta-label">Vieta:</span>
            <a href="${activity.location}" target="_blank" class="activity-meta-value" rel="noopener noreferrer">
              Google Maps
            </a>
          </div>
          <div class="activity-meta-row">
            <span class="activity-meta-label">Amžius nuo:</span>
            <span class="activity-meta-value">${activity.minAge}+</span>
          </div>
          <div class="activity-meta-row">
            <span class="activity-meta-label">Dalyviai:</span>
            <span class="activity-meta-value">${capacityText}</span>
          </div>
        </div>
        ${registrationsHtml}
        <div class="activity-footer">
          <small>${
            context === "org"
              ? "Valdote šią veiklą."
              : "Prisijunkite, kad galėtumėte registruotis."
          }</small>
          ${actionsHtml}
        </div>
      </div>
    </article>
  `;
}

function attachActivityCardHandlers() {
  // Register buttons
  document.querySelectorAll(".register-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openRegistrationModal(id);
    });
  });

  // Edit buttons
  document.querySelectorAll(".edit-activity-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      handleEditActivity(id);
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-activity-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      handleDeleteActivity(id);
    });
  });
}

// === EVENT LISTENERS =========================================================

// Navigation
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const sectionId = link.getAttribute("data-section");
    switchSection(sectionId);
  });
});

// Hero buttons
heroJoinBtn.addEventListener("click", () => {
  openModal(loginModal);
  // Switch to user tab
  setActiveTab("user-login-tab");
});

heroOrgBtn.addEventListener("click", () => {
  openModal(loginModal);
  // Switch to org tab
  setActiveTab("org-login-tab");
});

// Login modal
openLoginModalBtn.addEventListener("click", () => openModal(loginModal));
closeLoginModalBtn.addEventListener("click", () => closeModal(loginModal));
loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal || e.target.classList.contains("modal-backdrop")) {
    closeModal(loginModal);
  }
});

// Tabs
function setActiveTab(tabId) {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.id === tabId);
  });
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabId = btn.getAttribute("data-tab");
    setActiveTab(tabId);
  });
});

// Login forms
userLoginForm.addEventListener("submit", handleUserLogin);
orgLoginForm.addEventListener("submit", handleOrgLogin);

// Logout
logoutBtn.addEventListener("click", logout);

// Activity form
toggleActivityFormBtn.addEventListener("click", () => {
  if (activityForm.classList.contains("hidden")) {
    resetActivityForm();
    activityForm.classList.remove("hidden");
  } else {
    activityForm.classList.add("hidden");
  }
});

cancelActivityEditBtn.addEventListener("click", () => {
  resetActivityForm();
  activityForm.classList.add("hidden");
});

activityForm.addEventListener("submit", handleActivitySubmit);

// Registration modal
closeRegistrationModalBtn.addEventListener("click", () =>
  closeModal(registrationModal)
);
registrationModal.addEventListener("click", (e) => {
  if (
    e.target === registrationModal ||
    e.target.classList.contains("modal-backdrop")
  ) {
    closeModal(registrationModal);
  }
});
registrationForm.addEventListener("submit", handleRegistrationSubmit);

// === INIT ====================================================================

updateAuthUI();
switchSection("home-section");
