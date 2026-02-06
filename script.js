// SECTION: Storage helpers
const STORAGE_KEY = "activitiesData";
const USERS_KEY = "usersData";
const CURRENT_USER_KEY = "currentUser";

// Load activities array from localStorage
function loadActivities() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    return [];
  }
}

// Save activities array to localStorage
function saveActivities(activities) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

// Users helpers
function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

// Generate simple unique id for activities
function generateId() {
  return "act_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

// SECTION: Date / Time helpers
// Validate date range (YYYY-MM-DD)
function isDateRangeValid(from, to) {
  if (!from || !to) return false;
  return new Date(from) <= new Date(to);
}

// Validate time range (HH:MM, 24h)
function isTimeRangeValid(from, to) {
  if (!from || !to) return false;
  return from < to; // string comparison works for 24h format
}

// Check if a date is within [from, to]
function isDateWithinRange(date, from, to) {
  const d = new Date(date);
  return d >= new Date(from) && d <= new Date(to);
}

// Check if time is within [from, to]
function isTimeWithinRange(time, from, to) {
  return time >= from && time <= to;
}

// SECTION: Global state
let activitiesState = loadActivities();
let usersState = loadUsers();
let currentUser = loadCurrentUser();
let currentRegistrationActivityId = null;
let currentRegistrationActivity = null;

// SECTION: DOM references
// Auth
const registerForm = document.getElementById("register-form");
const registerErrorEl = document.getElementById("register-error");
const loginForm = document.getElementById("login-form");
const loginErrorEl = document.getElementById("login-error");
const currentUserLabel = document.getElementById("current-user-label");
const logoutBtn = document.getElementById("logout-btn");

// Organization form
const activityForm = document.getElementById("activity-form");
const activityErrorEl = document.getElementById("activity-error");
const orgActivitiesList = document.getElementById("org-activities-list");

// Filter
const filterOrgInput = document.getElementById("filter-org-code");
const applyFilterBtn = document.getElementById("apply-filter");

// User view
const userActivitiesList = document.getElementById("user-activities-list");

// Modal elements
const modal = document.getElementById("registration-modal");
const modalActivityTitle = document.getElementById("modal-activity-title");
const registrationForm = document.getElementById("registration-form");
const registrationErrorEl = document.getElementById("registration-error");
const regEmailInput = document.getElementById("reg-email");
const regDateInput = document.getElementById("reg-date");
const regTimeInput = document.getElementById("reg-time");

// Template
const activityTemplate = document.getElementById("activity-template");

// SECTION: Rendering
function renderAll() {
  updateAuthUI();
  renderActivitiesForOrg();
  renderActivitiesForUser();
}

// Create a DOM card from template
function createActivityCard(activity, forOrgView) {
  const node = activityTemplate.content.firstElementChild.cloneNode(true);

  const titleEl = node.querySelector(".activity-title");
  const orgEl = node.querySelector(".activity-org");
  const descEl = node.querySelector(".activity-description");
  const locEl = node.querySelector(".activity-location");
  const datesEl = node.querySelector(".activity-dates");
  const timesEl = node.querySelector(".activity-times");
  const capEl = node.querySelector(".activity-capacity");
  const freeSlotsEl = node.querySelector(".activity-free-slots");
  const regBtn = node.querySelector(".btn-register");
  const registrationsDetails = node.querySelector(".activity-registrations");
  const tbody = node.querySelector("tbody");

  titleEl.textContent = activity.title;
  orgEl.textContent = "Organizacijos kodas: " + activity.organizationCode;
  descEl.textContent = activity.description;
  locEl.textContent = "Vieta: " + activity.location;
  datesEl.textContent =
    "Veikla galioja: " + activity.dateFrom + " – " + activity.dateTo;
  timesEl.textContent =
    "Veikla vyksta: " + activity.timeFrom + " – " + activity.timeTo;

  const used = activity.registrations.length;
  const free = Math.max(0, Number(activity.maxParticipants) - used);
  capEl.textContent =
    "Maksimalus dalyvių skaičius: " +
    activity.maxParticipants +
    " (užimta: " +
    used +
    ", laisvų: " +
    free +
    ")";

  freeSlotsEl.textContent = "Laisvų vietų: " + free;

  // Fill registrations table for organization view
  tbody.innerHTML = "";
  activity.registrations.forEach((reg) => {
    const tr = document.createElement("tr");
    const tdEmail = document.createElement("td");
    const tdDate = document.createElement("td");
    const tdTime = document.createElement("td");

    tdEmail.textContent = reg.email;
    tdDate.textContent = reg.selectedDate;
    tdTime.textContent = reg.selectedTime;

    tr.appendChild(tdEmail);
    tr.appendChild(tdDate);
    tr.appendChild(tdTime);
    tbody.appendChild(tr);
  });

  // If full, disable button
  if (free <= 0) {
    regBtn.disabled = true;
    regBtn.textContent = "Vietų nebeliko";
  }

  // Hide registrations section for user view
  if (!forOrgView) {
    registrationsDetails.style.display = "none";
  }

  // Attach registration handler
  regBtn.addEventListener("click", () => openRegistrationModal(activity.id));

  return node;
}

// Render organization activities
function renderActivitiesForOrg() {
  orgActivitiesList.innerHTML = "";
  const filterCode = filterOrgInput.value.trim();
  let list = activitiesState;
  if (filterCode) {
    list = list.filter((a) => a.organizationCode === filterCode);
  }

  if (list.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Veiklų nėra.";
    orgActivitiesList.appendChild(p);
    return;
  }

  list.forEach((activity) => {
    const card = createActivityCard(activity, true);
    orgActivitiesList.appendChild(card);
  });
}

// Render user activities
function renderActivitiesForUser() {
  userActivitiesList.innerHTML = "";

  if (activitiesState.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Šiuo metu veiklų nėra.";
    userActivitiesList.appendChild(p);
    return;
  }

  activitiesState.forEach((activity) => {
    const card = createActivityCard(activity, false);
    userActivitiesList.appendChild(card);
  });
}

// SECTION: Activity creation handler
activityForm.addEventListener("submit", (e) => {
  if (!currentUser || currentUser.role !== "organization") {
    activityErrorEl.textContent = "Tik prisijungusios organizacijos gali kurti veiklas.";
    e.preventDefault();
    return;
  }

  e.preventDefault();
  activityErrorEl.textContent = "";

  const organizationCode = document.getElementById("org-code").value.trim();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const location = document.getElementById("location").value.trim();
  const dateFrom = document.getElementById("date-from").value;
  const dateTo = document.getElementById("date-to").value;
  const timeFrom = document.getElementById("time-from").value;
  const timeTo = document.getElementById("time-to").value;
  const maxParticipantsRaw = document.getElementById("max-participants").value;

  // All required fields check
  if (
    !organizationCode ||
    !title ||
    !description ||
    !location ||
    !dateFrom ||
    !dateTo ||
    !timeFrom ||
    !timeTo ||
    !maxParticipantsRaw
  ) {
    activityErrorEl.textContent = "Prašome užpildyti visus privalomus laukus.";
    return;
  }

  const maxParticipants = Number(maxParticipantsRaw);
  if (!Number.isInteger(maxParticipants) || maxParticipants <= 0) {
    activityErrorEl.textContent =
      "Maksimalus dalyvių skaičius turi būti teigiamas sveikas skaičius.";
    return;
  }

  if (!isDateRangeValid(dateFrom, dateTo)) {
    activityErrorEl.textContent =
      "Data „nuo“ negali būti vėlesnė už datą „iki“.";
    return;
  }

  if (!isTimeRangeValid(timeFrom, timeTo)) {
    activityErrorEl.textContent =
      "Laikas „nuo“ turi būti ankstesnis už laiką „iki“.";
    return;
  }

  const newActivity = {
    id: generateId(),
    organizationCode,
    title,
    description,
    location,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    maxParticipants,
    registrations: [],
  };

  activitiesState.push(newActivity);
  saveActivities(activitiesState);

  // Reset form after successful creation
  activityForm.reset();

  // Immediately update UI
  renderAll();
});

// Filter handler
applyFilterBtn.addEventListener("click", () => {
  renderActivitiesForOrg();
});

// SECTION: Modal logic
function openRegistrationModal(activityId) {
  registrationErrorEl.textContent = "";
  registrationForm.reset();

  const activity = activitiesState.find((a) => a.id === activityId);
  if (!activity) return;

  currentRegistrationActivityId = activityId;
  currentRegistrationActivity = activity;

  modalActivityTitle.textContent = "Registracija į veiklą: " + activity.title;

  // Limit selectable date/time in modal to activity range
  regDateInput.min = activity.dateFrom;
  regDateInput.max = activity.dateTo;
  regTimeInput.min = activity.timeFrom;
  regTimeInput.max = activity.timeTo;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeRegistrationModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  currentRegistrationActivityId = null;
  currentRegistrationActivity = null;
}

// Close modal on backdrop or close button
document.querySelectorAll("[data-close-modal]").forEach((el) => {
  el.addEventListener("click", closeRegistrationModal);
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) {
    closeRegistrationModal();
  }
});

// SECTION: Registration submit handler
registrationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  registrationErrorEl.textContent = "";

  if (!currentRegistrationActivityId) {
    registrationErrorEl.textContent = "Įvyko klaida. Bandykite dar kartą.";
    return;
  }

  const email = regEmailInput.value.trim();
  const selectedDate = regDateInput.value;
  const selectedTime = regTimeInput.value;

  if (!email || !selectedDate || !selectedTime) {
    registrationErrorEl.textContent = "Prašome užpildyti visus laukus.";
    return;
  }

  const activity = activitiesState.find(
    (a) => a.id === currentRegistrationActivityId
  );
  if (!activity) {
    registrationErrorEl.textContent = "Veikla nerasta.";
    return;
  }

  const used = activity.registrations.length;
  const free = Number(activity.maxParticipants) - used;
  if (free <= 0) {
    registrationErrorEl.textContent =
      "Registracija negalima, nes veikla jau pilna.";
    return;
  }

  // Validate selected date/time within allowed range
  if (!isDateWithinRange(selectedDate, activity.dateFrom, activity.dateTo)) {
    registrationErrorEl.textContent =
      "Pasirinkta diena nepatenka į leidžiamą datų intervalą.";
    return;
  }

  if (!isTimeWithinRange(selectedTime, activity.timeFrom, activity.timeTo)) {
    registrationErrorEl.textContent =
      "Pasirinkta valanda nepatenka į leidžiamą laikų intervalą.";
    return;
  }

  // Block double registration by same email to same activity
  const alreadyRegistered = activity.registrations.some(
    (r) => r.email.toLowerCase() === email.toLowerCase()
  );
  if (alreadyRegistered) {
    registrationErrorEl.textContent =
      "Šis el. paštas jau užregistruotas į šią veiklą.";
    return;
  }

  const newRegistration = {
    email,
    selectedDate,
    selectedTime,
  };

  activity.registrations.push(newRegistration);

  // Persist and refresh UI
  saveActivities(activitiesState);
  renderAll();

  closeRegistrationModal();
});

// SECTION: Auth logic
function updateAuthUI() {
  if (!currentUser) {
    currentUserLabel.textContent = "Neprisijungta";
    logoutBtn.style.display = "none";
  } else {
    const roleLabel =
      currentUser.role === "organization" ? "Organizacija" : "Naudotojas";
    currentUserLabel.textContent = roleLabel + ": " + currentUser.email;
    logoutBtn.style.display = "inline-flex";
  }

  // Show/hide organization activity creation form based on role
  if (currentUser && currentUser.role === "organization") {
    activityForm.closest(".card").style.display = "block";
  } else {
    activityForm.closest(".card").style.display = "none";
  }
}

// Registration (account) form
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  registerErrorEl.textContent = "";

  const role = document.getElementById("reg-role").value;
  const email = document.getElementById("reg-user-email").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!role || !email || !password) {
    registerErrorEl.textContent = "Prašome užpildyti visus laukus.";
    return;
  }

  const exists = usersState.some(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
  );
  if (exists) {
    registerErrorEl.textContent = "Toks naudotojas jau egzistuoja šiuo vaidmeniu.";
    return;
  }

  const newUser = { email, password, role };
  usersState.push(newUser);
  saveUsers(usersState);
  registerForm.reset();
});

// Login form
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginErrorEl.textContent = "";

  const role = document.getElementById("login-role").value;
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!role || !email || !password) {
    loginErrorEl.textContent = "Prašome užpildyti visus laukus.";
    return;
  }

  const user = usersState.find(
    (u) =>
      u.role === role &&
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );

  if (!user) {
    loginErrorEl.textContent = "Neteisingi prisijungimo duomenys.";
    return;
  }

  currentUser = { email: user.email, role: user.role };
  saveCurrentUser(currentUser);
  loginForm.reset();
  updateAuthUI();
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  saveCurrentUser(null);
  updateAuthUI();
});

// SECTION: Initial render
renderAll();
