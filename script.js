// ====== DATA KEYS & GLOBAL STATE ======

const STORAGE_KEYS = {
  ACTIVITIES: "vrs_activities",
  REGISTRATIONS: "vrs_registrations",
  CURRENT_USER: "vrs_current_user",
};

// currentUser: { type: 'user'|'org', email? , orgCode? }
let currentUser = null;

// ====== UTILITIES: LOCAL STORAGE ======

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse localStorage for key:", key, e);
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ====== INITIAL DATA LOAD ======

let activities = loadFromStorage(STORAGE_KEYS.ACTIVITIES, []); // array of activity objects
let registrations = loadFromStorage(STORAGE_KEYS.REGISTRATIONS, []); // array of registration objects

// Activity structure:
// {
//   id: string,
//   orgCode: string,
//   title: string,
//   description: string,
//   location: string,
//   startDate: 'YYYY-MM-DD',
//   endDate: 'YYYY-MM-DD',
//   startTime: 'HH:MM',
//   endTime: 'HH:MM',
//   maxParticipants: number
// }

// Registration structure:
// {
//   id: string,
//   activityId: string,
//   userEmail: string,
//   date: 'YYYY-MM-DD',
//   time: 'HH:MM'
// }

// ====== DOM ELEMENTS ======

// Header
const currentUserInfoEl = document.getElementById("currentUserInfo");
const logoutBtn = document.getElementById("logoutBtn");

// Views
const loginView = document.getElementById("loginView");
const orgDashboard = document.getElementById("orgDashboard");
const userView = document.getElementById("userView");

// Login forms & tabs
const userTab = document.getElementById("userTab");
const orgTab = document.getElementById("orgTab");
const userLoginForm = document.getElementById("userLoginForm");
const orgLoginForm = document.getElementById("orgLoginForm");
const loginMessage = document.getElementById("loginMessage");

// Org dashboard
const activityForm = document.getElementById("activityForm");
const activityIdInput = document.getElementById("activityId");
const activityTitleInput = document.getElementById("activityTitle");
const activityDescriptionInput = document.getElementById("activityDescription");
const activityLocationInput = document.getElementById("activityLocation");
const activityStartDateInput = document.getElementById("activityStartDate");
const activityEndDateInput = document.getElementById("activityEndDate");
const activityStartTimeInput = document.getElementById("activityStartTime");
const activityEndTimeInput = document.getElementById("activityEndTime");
const activityMaxParticipantsInput = document.getElementById("activityMaxParticipants");
const orgActivitiesList = document.getElementById("orgActivitiesList");
const orgFormMessage = document.getElementById("orgFormMessage");
const orgFormTitle = document.getElementById("orgFormTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// User view
const userActivitiesList = document.getElementById("userActivitiesList");

// Modal
const registrationModal = document.getElementById("registrationModal");
const modalTitle = document.getElementById("modalTitle");
const modalActivityInfo = document.getElementById("modalActivityInfo");
const modalActivityIdInput = document.getElementById("modalActivityId");
const registrationForm = document.getElementById("registrationForm");
const registrationDateInput = document.getElementById("registrationDate");
const registrationTimeInput = document.getElementById("registrationTime");
const modalMessage = document.getElementById("modalMessage");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalCancelBtn = document.getElementById("modalCancelBtn");

// Toasts
const toastContainer = document.getElementById("toastContainer");

// ====== UI HELPERS ======

function showElement(el) {
  el.classList.remove("hidden");
}

function hideElement(el) {
  el.classList.add("hidden");
}

function setMessage(el, text, type) {
  el.textContent = text || "";
  el.classList.remove("message-success", "message-error");
  if (!text) return;
  if (type === "success") el.classList.add("message-success");
  if (type === "error") el.classList.add("message-error");
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2600);
}

function formatDateRange(start, end) {
  if (!start || !end) return "-";
  return `${start} – ${end}`;
}

function formatTimeRange(start, end) {
  if (!start || !end) return "-";
  return `${start} – ${end}`;
}

// Count registrations for an activity
function getRegistrationsForActivity(activityId) {
  return registrations.filter((r) => r.activityId === activityId);
}

// Check if user already registered for activity
function isUserRegisteredForActivity(email, activityId) {
  return registrations.some((r) => r.activityId === activityId && r.userEmail === email);
}

// ====== AUTH & VIEW HANDLING ======

function loadCurrentUserFromStorage() {
  const stored = loadFromStorage(STORAGE_KEYS.CURRENT_USER, null);
  if (stored && (stored.type === "user" || stored.type === "org")) {
    currentUser = stored;
  } else {
    currentUser = null;
  }
}

function saveCurrentUserToStorage() {
  if (currentUser) {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, currentUser);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

function updateHeaderUserInfo() {
  if (!currentUser) {
    currentUserInfoEl.textContent = "";
    hideElement(logoutBtn);
    return;
  }
  showElement(logoutBtn);
  if (currentUser.type === "user") {
    currentUserInfoEl.textContent = `Prisijungęs naudotojas: ${currentUser.email}`;
  } else {
    currentUserInfoEl.textContent = `Prisijungusi organizacija: ${currentUser.orgCode}`;
  }
}

function showLoginView() {
  showElement(loginView);
  hideElement(orgDashboard);
  hideElement(userView);
}

function showOrgDashboard() {
  hideElement(loginView);
  hideElement(userView);
  showElement(orgDashboard);
  renderOrgActivities();
}

function showUserView() {
  hideElement(loginView);
  hideElement(orgDashboard);
  showElement(userView);
  renderUserActivities();
}

function handleLoginSuccess() {
  saveCurrentUserToStorage();
  updateHeaderUserInfo();

  if (currentUser.type === "user") {
    showUserView();
  } else if (currentUser.type === "org") {
    showOrgDashboard();
  }
}

// ====== LOGIN HANDLERS ======

// Switch tabs
userTab.addEventListener("click", () => {
  userTab.classList.add("active");
  orgTab.classList.remove("active");
  userLoginForm.classList.add("active");
  orgLoginForm.classList.remove("active");
  setMessage(loginMessage, "");
});

orgTab.addEventListener("click", () => {
  orgTab.classList.add("active");
  userTab.classList.remove("active");
  orgLoginForm.classList.add("active");
  userLoginForm.classList.remove("active");
  setMessage(loginMessage, "");
});

// User login
userLoginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("userEmail").value.trim();

  if (!email) {
    setMessage(loginMessage, "Prašome įvesti el. pašto adresą.", "error");
    return;
  }

  currentUser = { type: "user", email };
  setMessage(loginMessage, "Sėkmingai prisijungėte kaip naudotojas.", "success");
  showToast("Prisijungta kaip naudotojas.", "success");
  handleLoginSuccess();
});

// Organization login
orgLoginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const orgCode = document.getElementById("orgCode").value.trim();

  if (!orgCode) {
    setMessage(loginMessage, "Prašome įvesti organizacijos kodą.", "error");
    return;
  }

  currentUser = { type: "org", orgCode };
  setMessage(loginMessage, "Sėkmingai prisijungėte kaip organizacija.", "success");
  showToast("Prisijungta kaip organizacija.", "success");
  handleLoginSuccess();
});

// Logout
logoutBtn.addEventListener("click", () => {
  currentUser = null;
  saveCurrentUserToStorage();
  updateHeaderUserInfo();
  showLoginView();
  showToast("Sėkmingai atsijungėte.", "info");
});

// ====== ORGANIZATION: ACTIVITY FORM HANDLING ======

function resetActivityForm() {
  activityIdInput.value = "";
  activityTitleInput.value = "";
  activityDescriptionInput.value = "";
  activityLocationInput.value = "";
  activityStartDateInput.value = "";
  activityEndDateInput.value = "";
  activityStartTimeInput.value = "";
  activityEndTimeInput.value = "";
  activityMaxParticipantsInput.value = "";
  orgFormTitle.textContent = "Sukurti naują veiklą";
  hideElement(cancelEditBtn);
  setMessage(orgFormMessage, "");
}

function validateActivityForm() {
  const title = activityTitleInput.value.trim();
  const description = activityDescriptionInput.value.trim();
  const location = activityLocationInput.value.trim();
  const startDate = activityStartDateInput.value;
  const endDate = activityEndDateInput.value;
  const startTime = activityStartTimeInput.value;
  const endTime = activityEndTimeInput.value;
  const maxParticipants = parseInt(activityMaxParticipantsInput.value, 10);

  if (!title || !description || !location || !startDate || !endDate || !startTime || !endTime) {
    return { valid: false, message: "Prašome užpildyti visus privalomus laukus." };
  }

  if (endDate < startDate) {
    return { valid: false, message: "Pabaigos data negali būti ankstesnė už pradžios datą." };
  }

  if (endTime <= startTime) {
    return { valid: false, message: "Pabaigos laikas turi būti vėlesnis už pradžios laiką." };
  }

  if (isNaN(maxParticipants) || maxParticipants <= 0) {
    return {
      valid: false,
      message: "Maksimalus dalyvių skaičius turi būti teigiamas skaičius.",
    };
  }

  return { valid: true };
}

activityForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.type !== "org") return;

  const validation = validateActivityForm();
  if (!validation.valid) {
    setMessage(orgFormMessage, validation.message, "error");
    return;
  }

  const id = activityIdInput.value || `act_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const isEdit = Boolean(activityIdInput.value);

  const activityData = {
    id,
    orgCode: currentUser.orgCode,
    title: activityTitleInput.value.trim(),
    description: activityDescriptionInput.value.trim(),
    location: activityLocationInput.value.trim(),
    startDate: activityStartDateInput.value,
    endDate: activityEndDateInput.value,
    startTime: activityStartTimeInput.value,
    endTime: activityEndTimeInput.value,
    maxParticipants: parseInt(activityMaxParticipantsInput.value, 10),
  };

  if (isEdit) {
    const index = activities.findIndex((a) => a.id === id && a.orgCode === currentUser.orgCode);
    if (index !== -1) {
      activities[index] = activityData;
    }
  } else {
    activities.push(activityData);
  }

  saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
  setMessage(
    orgFormMessage,
    isEdit ? "Veikla sėkmingai atnaujinta." : "Veikla sėkmingai sukurta.",
    "success"
  );
  showToast(
    isEdit ? "Veikla atnaujinta." : "Nauja veikla sukurta.",
    "success"
  );
  resetActivityForm();
  renderOrgActivities();
});

cancelEditBtn.addEventListener("click", () => {
  resetActivityForm();
});

// ====== ORGANIZATION: RENDER ACTIVITIES ======

function renderOrgActivities() {
  if (!currentUser || currentUser.type !== "org") return;

  const orgActivities = activities.filter((a) => a.orgCode === currentUser.orgCode);

  if (!orgActivities.length) {
    orgActivitiesList.classList.add("empty-state");
    orgActivitiesList.textContent = "Šiuo metu dar nesukūrėte jokių veiklų.";
    return;
  }

  orgActivitiesList.classList.remove("empty-state");
  orgActivitiesList.innerHTML = "";

  orgActivities.forEach((activity) => {
    const card = document.createElement("div");
    card.className = "activity-card";

    const regs = getRegistrationsForActivity(activity.id);

    const header = document.createElement("div");
    header.className = "activity-header";

    const titleEl = document.createElement("h3");
    titleEl.className = "activity-title";
    titleEl.textContent = activity.title;

    const statusBadge = document.createElement("span");
    statusBadge.className = "badge";
    const isFull = regs.length >= activity.maxParticipants;
    if (isFull) {
      statusBadge.classList.add("badge-danger");
      statusBadge.textContent = "Pilna";
    } else {
      statusBadge.classList.add("badge-success");
      statusBadge.textContent = "Vietų yra";
    }

    header.appendChild(titleEl);
    header.appendChild(statusBadge);

    const descriptionEl = document.createElement("div");
    descriptionEl.className = "activity-description";
    descriptionEl.textContent = activity.description;

    const meta = document.createElement("div");
    meta.className = "activity-meta";
    meta.innerHTML = `
      <span class="badge">
        Vieta: <strong>${activity.location}</strong>
      </span>
      <span class="badge">
        Datos: <strong>${formatDateRange(activity.startDate, activity.endDate)}</strong>
      </span>
      <span class="badge">
        Laikas: <strong>${formatTimeRange(activity.startTime, activity.endTime)}</strong>
      </span>
    `;

    const footer = document.createElement("div");
    footer.className = "activity-footer";

    const participantsInfo = document.createElement("div");
    participantsInfo.className = "activity-participants";
    participantsInfo.innerHTML = `
      Užsiregistravę: <strong>${regs.length}</strong> / <strong>${activity.maxParticipants}</strong>
    `;

    const actions = document.createElement("div");
    actions.className = "activity-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary btn-sm";
    editBtn.textContent = "Redaguoti";
    editBtn.addEventListener("click", () => {
      startEditActivity(activity);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.textContent = "Ištrinti";
    deleteBtn.addEventListener("click", () => {
      deleteActivity(activity.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    footer.appendChild(participantsInfo);
    footer.appendChild(actions);

    card.appendChild(header);
    card.appendChild(descriptionEl);
    card.appendChild(meta);

    // Registrations list
    const regsList = document.createElement("div");
    regsList.className = "registrations-list";

    const regsTitle = document.createElement("div");
    regsTitle.className = "registrations-title";
    regsTitle.textContent = "Užsiregistravę dalyviai:";

    regsList.appendChild(regsTitle);

    if (!regs.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Šiuo metu nėra užsiregistravusių dalyvių.";
      regsList.appendChild(empty);
    } else {
      regs.forEach((reg) => {
        const item = document.createElement("div");
        item.className = "registration-item";
        const left = document.createElement("span");
        left.textContent = reg.userEmail;
        const right = document.createElement("span");
        right.textContent = `${reg.date} ${reg.time}`;
        item.appendChild(left);
        item.appendChild(right);
        regsList.appendChild(item);
      });
    }

    card.appendChild(regsList);
    card.appendChild(footer);
    orgActivitiesList.appendChild(card);
  });
}

function startEditActivity(activity) {
  activityIdInput.value = activity.id;
  activityTitleInput.value = activity.title;
  activityDescriptionInput.value = activity.description;
  activityLocationInput.value = activity.location;
  activityStartDateInput.value = activity.startDate;
  activityEndDateInput.value = activity.endDate;
  activityStartTimeInput.value = activity.startTime;
  activityEndTimeInput.value = activity.endTime;
  activityMaxParticipantsInput.value = activity.maxParticipants;
  orgFormTitle.textContent = "Redaguoti veiklą";
  showElement(cancelEditBtn);
  setMessage(orgFormMessage, "");
}

function deleteActivity(activityId) {
  if (!confirm("Ar tikrai norite ištrinti šią veiklą?")) return;

  // Remove registrations for this activity
  registrations = registrations.filter((r) => r.activityId !== activityId);
  saveToStorage(STORAGE_KEYS.REGISTRATIONS, registrations);

  // Remove activity
  activities = activities.filter((a) => a.id !== activityId);
  saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);

  showToast("Veikla sėkmingai ištrinta.", "info");
  renderOrgActivities();
  renderUserActivities();
}

// ====== USER: RENDER ACTIVITIES ======

function renderUserActivities() {
  if (!activities.length) {
    userActivitiesList.classList.add("empty-state");
    userActivitiesList.textContent = "Šiuo metu nėra prieinamų veiklų.";
    return;
  }

  userActivitiesList.classList.remove("empty-state");
  userActivitiesList.innerHTML = "";

  activities.forEach((activity) => {
    const card = document.createElement("div");
    card.className = "activity-card";

    const regs = getRegistrationsForActivity(activity.id);
    const isFull = regs.length >= activity.maxParticipants;
    const alreadyRegistered =
      currentUser && currentUser.type === "user"
        ? isUserRegisteredForActivity(currentUser.email, activity.id)
        : false;

    const header = document.createElement("div");
    header.className = "activity-header";

    const titleEl = document.createElement("h3");
    titleEl.className = "activity-title";
    titleEl.textContent = activity.title;

    const statusBadge = document.createElement("span");
    statusBadge.className = "badge";
    if (isFull) {
      statusBadge.classList.add("badge-danger");
      statusBadge.textContent = "Pilna";
    } else if (alreadyRegistered) {
      statusBadge.classList.add("badge-primary");
      statusBadge.textContent = "Jūs užsiregistravote";
    } else {
      statusBadge.classList.add("badge-success");
      statusBadge.textContent = "Vietų yra";
    }

    header.appendChild(titleEl);
    header.appendChild(statusBadge);

    const descriptionEl = document.createElement("div");
    descriptionEl.className = "activity-description";
    descriptionEl.textContent = activity.description;

    const meta = document.createElement("div");
    meta.className = "activity-meta";
    meta.innerHTML = `
      <span class="badge">
        Vieta: <strong>${activity.location}</strong>
      </span>
      <span class="badge">
        Datos: <strong>${formatDateRange(activity.startDate, activity.endDate)}</strong>
      </span>
      <span class="badge">
        Laikas: <strong>${formatTimeRange(activity.startTime, activity.endTime)}</strong>
      </span>
    `;

    const footer = document.createElement("div");
    footer.className = "activity-footer";

    const participantsInfo = document.createElement("div");
    participantsInfo.className = "activity-participants";
    participantsInfo.innerHTML = `
      Užsiregistravę: <strong>${regs.length}</strong> / <strong>${activity.maxParticipants}</strong>
    `;

    const actions = document.createElement("div");
    actions.className = "activity-actions";

    const registerBtn = document.createElement("button");
    registerBtn.className = "btn btn-primary btn-sm";
    registerBtn.textContent = "Registruotis";

    if (isFull) {
      registerBtn.disabled = true;
      registerBtn.textContent = "Veikla pilna";
      registerBtn.style.opacity = "0.7";
    } else if (alreadyRegistered) {
      registerBtn.disabled = true;
      registerBtn.textContent = "Jau užsiregistravote";
      registerBtn.style.opacity = "0.7";
    } else {
      registerBtn.addEventListener("click", () => openRegistrationModal(activity));
    }

    actions.appendChild(registerBtn);

    footer.appendChild(participantsInfo);
    footer.appendChild(actions);

    card.appendChild(header);
    card.appendChild(descriptionEl);
    card.appendChild(meta);
    card.appendChild(footer);

    userActivitiesList.appendChild(card);
  });
}

// ====== REGISTRATION MODAL & LOGIC ======

function openRegistrationModal(activity) {
  if (!currentUser || currentUser.type !== "user") {
    showToast("Registruotis gali tik prisijungę naudotojai.", "error");
    return;
  }

  modalTitle.textContent = "Registracija į veiklą";
  modalActivityInfo.textContent = `${activity.title} • ${activity.location} • Datos: ${formatDateRange(
    activity.startDate,
    activity.endDate
  )} • Laikas: ${formatTimeRange(activity.startTime, activity.endTime)}`;
  modalActivityIdInput.value = activity.id;
  registrationDateInput.value = "";
  registrationTimeInput.value = "";
  setMessage(modalMessage, "");

  // Set min/max for date and time according to activity
  registrationDateInput.min = activity.startDate;
  registrationDateInput.max = activity.endDate;
  registrationTimeInput.min = activity.startTime;
  registrationTimeInput.max = activity.endTime;

  showElement(registrationModal);
}

function closeRegistrationModal() {
  hideElement(registrationModal);
}

modalCloseBtn.addEventListener("click", closeRegistrationModal);
modalCancelBtn.addEventListener("click", closeRegistrationModal);

registrationModal.addEventListener("click", (e) => {
  if (e.target === registrationModal || e.target.classList.contains("modal-backdrop")) {
    closeRegistrationModal();
  }
});

registrationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.type !== "user") return;

  const activityId = modalActivityIdInput.value;
  const date = registrationDateInput.value;
  const time = registrationTimeInput.value;

  const activity = activities.find((a) => a.id === activityId);
  if (!activity) {
    setMessage(modalMessage, "Veikla nerasta.", "error");
    return;
  }

  if (!date || !time) {
    setMessage(modalMessage, "Prašome nurodyti datą ir laiką.", "error");
    return;
  }

  // Validate date and time within allowed range
  if (date < activity.startDate || date > activity.endDate) {
    setMessage(
      modalMessage,
      "Pasirinkta data nepatenka į leidžiamą veiklos datų intervalą.",
      "error"
    );
    return;
  }

  if (time < activity.startTime || time > activity.endTime) {
    setMessage(
      modalMessage,
      "Pasirinktas laikas nepatenka į leidžiamą veiklos valandų intervalą.",
      "error"
    );
    return;
  }

  const regs = getRegistrationsForActivity(activityId);
  if (regs.length >= activity.maxParticipants) {
    setMessage(modalMessage, "Ši veikla jau pilna.", "error");
    renderUserActivities();
    return;
  }

  if (isUserRegisteredForActivity(currentUser.email, activityId)) {
    setMessage(modalMessage, "Jūs jau esate užsiregistravę į šią veiklą.", "error");
    renderUserActivities();
    return;
  }

  const registration = {
    id: `reg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    activityId,
    userEmail: currentUser.email,
    date,
    time,
  };

  registrations.push(registration);
  saveToStorage(STORAGE_KEYS.REGISTRATIONS, registrations);

  setMessage(modalMessage, "Registracija sėkmingai patvirtinta.", "success");
  showToast("Sėkmingai užsiregistravote į veiklą.", "success");

  // Update lists
  renderUserActivities();
  if (currentUser && currentUser.type === "org") {
    renderOrgActivities();
  } else {
    // also update org dashboard in case org is logged later
    renderOrgActivities();
  }

  setTimeout(() => {
    closeRegistrationModal();
  }, 800);
});

// ====== INITIALIZATION ======

function init() {
  loadCurrentUserFromStorage();
  updateHeaderUserInfo();

  if (currentUser && currentUser.type === "user") {
    showUserView();
  } else if (currentUser && currentUser.type === "org") {
    showOrgDashboard();
  } else {
    showLoginView();
  }
}

// Run init on load
document.addEventListener("DOMContentLoaded", init);
