// SECTION: Storage & Global State

const STORAGE_KEY = "vrs_activities_with_registrations"; // one shared key

// currentUser: { type: 'user'|'org', email? , organizationCode? }
let currentUser = null;

// Activity structure (per requirement):
// {
//   id,
//   organizationCode,
//   title,
//   description,
//   location,
//   dateFrom,
//   dateTo,
//   timeFrom,
//   timeTo,
//   maxParticipants,
//   registrations: [
//     { email, selectedDate, selectedTime }
//   ]
// }

let activities = [];

// ====== Storage Helpers ======

function loadActivitiesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      activities = [];
      return;
    }
    const parsed = JSON.parse(raw);
    activities = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Nepavyko nuskaityti duomenų iš localStorage", e);
    activities = [];
  }
}

function saveActivitiesToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

const CURRENT_USER_KEY = "vrs_current_user";

function loadCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.type === "user" || parsed.type === "org")) {
      currentUser = parsed;
    }
  } catch (e) {
    console.error("Nepavyko nuskaityti naudotojo iš localStorage", e);
  }
}

function saveCurrentUser() {
  if (!currentUser) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }
}

// ====== DOM References ======

// Header
const currentUserInfoEl = document.getElementById("currentUserInfo");
const logoutBtn = document.getElementById("logoutBtn");

// Views
const loginView = document.getElementById("loginView");
const orgDashboard = document.getElementById("orgDashboard");
const userView = document.getElementById("userView");

// Login & tabs
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

// ====== UI Helpers ======

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
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function formatDateRange(from, to) {
  if (!from || !to) return "-";
  return `${from} – ${to}`;
}

function formatTimeRange(from, to) {
  if (!from || !to) return "-";
  return `${from} – ${to}`;
}

// Returns array of registrations for activity
function getRegistrations(activity) {
  return Array.isArray(activity.registrations) ? activity.registrations : [];
}

// Check if user already registered
function isUserRegistered(email, activity) {
  return getRegistrations(activity).some((r) => r.email === email);
}

// ====== Auth & View Handling ======

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
    currentUserInfoEl.textContent = `Prisijungusi organizacija: ${currentUser.organizationCode}`;
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
  saveCurrentUser();
  updateHeaderUserInfo();
  if (currentUser.type === "user") {
    showUserView();
  } else if (currentUser.type === "org") {
    showOrgDashboard();
  }
}

// ====== Login Events ======

// Tabs
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
  const organizationCode = document.getElementById("orgCode").value.trim();
  if (!organizationCode) {
    setMessage(loginMessage, "Prašome įvesti organizacijos kodą.", "error");
    return;
  }
  currentUser = { type: "org", organizationCode };
  setMessage(loginMessage, "Sėkmingai prisijungėte kaip organizacija.", "success");
  showToast("Prisijungta kaip organizacija.", "success");
  handleLoginSuccess();
});

// Logout
logoutBtn.addEventListener("click", () => {
  currentUser = null;
  saveCurrentUser();
  updateHeaderUserInfo();
  showLoginView();
  showToast("Sėkmingai atsijungėte.", "info");
});

// ====== Organization: Activity Form ======

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

// Validates all mandatory fields and ranges
function validateActivityForm() {
  const title = activityTitleInput.value.trim();
  const description = activityDescriptionInput.value.trim();
  const location = activityLocationInput.value.trim();
  const dateFrom = activityStartDateInput.value;
  const dateTo = activityEndDateInput.value;
  const timeFrom = activityStartTimeInput.value;
  const timeTo = activityEndTimeInput.value;
  const maxParticipants = parseInt(activityMaxParticipantsInput.value, 10);

  if (!title || !description || !location || !dateFrom || !dateTo || !timeFrom || !timeTo) {
    return { valid: false, message: "Prašome užpildyti visus privalomus laukus." };
  }

  if (dateTo < dateFrom) {
    return { valid: false, message: "Pabaigos data negali būti ankstesnė už pradžios datą." };
  }

  if (timeTo <= timeFrom) {
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
    organizationCode: currentUser.organizationCode,
    title: activityTitleInput.value.trim(),
    description: activityDescriptionInput.value.trim(),
    location: activityLocationInput.value.trim(),
    dateFrom: activityStartDateInput.value,
    dateTo: activityEndDateInput.value,
    timeFrom: activityStartTimeInput.value,
    timeTo: activityEndTimeInput.value,
    maxParticipants: parseInt(activityMaxParticipantsInput.value, 10),
  };

  const existing = activities.find((a) => a.id === id);

  if (isEdit && existing) {
    // keep existing registrations if any
    const regs = Array.isArray(existing.registrations) ? existing.registrations : [];
    activityData.registrations = regs;
    Object.assign(existing, activityData);
  } else {
    activityData.registrations = [];
    activities.push(activityData);
  }

  saveActivitiesToStorage();
  setMessage(
    orgFormMessage,
    isEdit ? "Veikla sėkmingai atnaujinta." : "Veikla sėkmingai sukurta.",
    "success"
  );
  showToast(isEdit ? "Veikla atnaujinta." : "Nauja veikla sukurta.", "success");
  resetActivityForm();
  renderOrgActivities();
  renderUserActivities();
});

cancelEditBtn.addEventListener("click", () => {
  resetActivityForm();
});

// ====== Organization: Activities Rendering ======

function renderOrgActivities() {
  if (!currentUser || currentUser.type !== "org") return;

  const orgActivities = activities.filter(
    (a) => a.organizationCode === currentUser.organizationCode
  );

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

    const regs = getRegistrations(activity);
    const isFull = regs.length >= activity.maxParticipants;

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
        Datos: <strong>${formatDateRange(activity.dateFrom, activity.dateTo)}</strong>
      </span>
      <span class="badge">
        Laikas: <strong>${formatTimeRange(activity.timeFrom, activity.timeTo)}</strong>
      </span>
    `;

    const footer = document.createElement("div");
    footer.className = "activity-footer";

    const participantsInfo = document.createElement("div");
    participantsInfo.className = "activity-participants";
    const freeSlots = activity.maxParticipants - regs.length;
    participantsInfo.innerHTML = `
      Užsiregistravę: <strong>${regs.length}</strong> / <strong>${activity.maxParticipants}</strong>
      &nbsp;&bull;&nbsp; Laisvų vietų: <strong>${freeSlots}</strong>
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

    // Registracijos sąrašas
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
        left.textContent = reg.email;
        const right = document.createElement("span");
        right.textContent = `${reg.selectedDate} ${reg.selectedTime}`;
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
  activityStartDateInput.value = activity.dateFrom;
  activityEndDateInput.value = activity.dateTo;
  activityStartTimeInput.value = activity.timeFrom;
  activityEndTimeInput.value = activity.timeTo;
  activityMaxParticipantsInput.value = activity.maxParticipants;
  orgFormTitle.textContent = "Redaguoti veiklą";
  showElement(cancelEditBtn);
  setMessage(orgFormMessage, "");
}

function deleteActivity(activityId) {
  if (!confirm("Ar tikrai norite ištrinti šią veiklą?")) return;
  activities = activities.filter((a) => a.id !== activityId);
  saveActivitiesToStorage();
  showToast("Veikla sėkmingai ištrinta.", "info");
  renderOrgActivities();
  renderUserActivities();
}

// ====== User: Activities Rendering ======

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

    const regs = getRegistrations(activity);
    const isFull = regs.length >= activity.maxParticipants;
    const alreadyRegistered =
      currentUser && currentUser.type === "user"
        ? isUserRegistered(currentUser.email, activity)
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
        Datos: <strong>${formatDateRange(activity.dateFrom, activity.dateTo)}</strong>
      </span>
      <span class="badge">
        Laikas: <strong>${formatTimeRange(activity.timeFrom, activity.timeTo)}</strong>
      </span>
    `;

    const footer = document.createElement("div");
    footer.className = "activity-footer";

    const participantsInfo = document.createElement("div");
    participantsInfo.className = "activity-participants";
    const freeSlots = activity.maxParticipants - regs.length;
    participantsInfo.innerHTML = `
      Užsiregistravę: <strong>${regs.length}</strong> / <strong>${activity.maxParticipants}</strong>
      &nbsp;&bull;&nbsp; Laisvų vietų: <strong>${freeSlots}</strong>
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

// ====== Registration Modal ======

function openRegistrationModal(activity) {
  if (!currentUser || currentUser.type !== "user") {
    showToast("Registruotis gali tik prisijungę naudotojai.", "error");
    return;
  }

  modalTitle.textContent = "Registracija į veiklą";
  modalActivityInfo.textContent = `${activity.title} • ${activity.location} • Datos: ${formatDateRange(
    activity.dateFrom,
    activity.dateTo
  )} • Laikas: ${formatTimeRange(activity.timeFrom, activity.timeTo)}`;
  modalActivityIdInput.value = activity.id;
  registrationDateInput.value = "";
  registrationTimeInput.value = "";
  setMessage(modalMessage, "");

  // Restrict date/time according to activity
  registrationDateInput.min = activity.dateFrom;
  registrationDateInput.max = activity.dateTo;
  registrationTimeInput.min = activity.timeFrom;
  registrationTimeInput.max = activity.timeTo;

  showElement(registrationModal);
}

function closeRegistrationModal() {
  hideElement(registrationModal);
}

modalCloseBtn.addEventListener("click", closeRegistrationModal);
modalCancelBtn.addEventListener("click", closeRegistrationModal);

// Close on backdrop click
registrationModal.addEventListener("click", (e) => {
  if (e.target === registrationModal || e.target.classList.contains("modal-backdrop")) {
    closeRegistrationModal();
  }
});

// Registration submit
registrationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser || currentUser.type !== "user") return;

  const activityId = modalActivityIdInput.value;
  const selectedDate = registrationDateInput.value;
  const selectedTime = registrationTimeInput.value;

  const activity = activities.find((a) => a.id === activityId);
  if (!activity) {
    setMessage(modalMessage, "Veikla nerasta.", "error");
    return;
  }

  if (!selectedDate || !selectedTime) {
    setMessage(modalMessage, "Prašome nurodyti datą ir laiką.", "error");
    return;
  }

  if (selectedDate < activity.dateFrom || selectedDate > activity.dateTo) {
    setMessage(
      modalMessage,
      "Pasirinkta data nepatenka į leidžiamą veiklos datų intervalą.",
      "error"
    );
    return;
  }

  if (selectedTime < activity.timeFrom || selectedTime > activity.timeTo) {
    setMessage(
      modalMessage,
      "Pasirinktas laikas nepatenka į leidžiamą veiklos valandų intervalą.",
      "error"
    );
    return;
  }

  const regs = getRegistrations(activity);

  if (regs.length >= activity.maxParticipants) {
    setMessage(modalMessage, "Ši veikla jau pilna.", "error");
    renderUserActivities();
    return;
  }

  if (isUserRegistered(currentUser.email, activity)) {
    setMessage(modalMessage, "Jūs jau esate užsiregistravę į šią veiklą.", "error");
    renderUserActivities();
    return;
  }

  const newReg = {
    email: currentUser.email,
    selectedDate,
    selectedTime,
  };

  if (!Array.isArray(activity.registrations)) {
    activity.registrations = [];
  }
  activity.registrations.push(newReg);

  saveActivitiesToStorage();

  setMessage(modalMessage, "Registracija sėkmingai patvirtinta.", "success");
  showToast("Sėkmingai užsiregistravote į veiklą.", "success");

  renderUserActivities();
  renderOrgActivities();

  setTimeout(() => {
    closeRegistrationModal();
  }, 800);
});

// ====== Initialization ======

function init() {
  loadActivitiesFromStorage();
  loadCurrentUser();
  updateHeaderUserInfo();

  if (currentUser && currentUser.type === "user") {
    showUserView();
  } else if (currentUser && currentUser.type === "org") {
    showOrgDashboard();
  } else {
    showLoginView();
  }

  // Initial render of activities for anonymous or user
  if (!currentUser || currentUser.type === "user") {
    renderUserActivities();
  }
}

document.addEventListener("DOMContentLoaded", init);
