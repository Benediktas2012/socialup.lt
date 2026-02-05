// SECTION: Local Storage Keys
const STORAGE_KEYS = {
  SESSION: "flux_activities_session",
  ACTIVITIES: "flux_activities_list",
  REGISTRATIONS: "flux_activities_registrations",
};

// SECTION: State (kept in memory and synced to localStorage)
let session = null; // { role: 'user' | 'org', identifier: string }
let activities = []; // Array<Activity>
let registrations = []; // Array<Registration>

// Activity: {
//   id: string,
//   orgCode: string,
//   title: string,
//   location: string,
//   dateFrom: string (yyyy-mm-dd),
//   dateTo: string,
//   timeFrom: string (HH:mm),
//   timeTo: string,
//   minAge: number,
//   maxParticipants: number,
//   description: string,
// }
// Registration: {
//   id: string,
//   activityId: string,
//   userEmail: string,
//   date: string,
//   time: string,
//   createdAt: string,
// }

// SECTION: DOM helpers
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// SECTION: Toast Notifications
function createToastElement({ type, title, message }) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon = document.createElement("div");
  icon.className = "toast-icon";
  icon.textContent =
    type === "success" ? "✓" : type === "error" ? "!" : "i";

  const content = document.createElement("div");
  content.className = "toast-content";

  const titleEl = document.createElement("div");
  titleEl.className = "toast-title";
  titleEl.textContent = title;

  const messageEl = document.createElement("p");
  messageEl.className = "toast-message";
  messageEl.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.type = "button";
  closeBtn.textContent = "✕";

  closeBtn.addEventListener("click", () => {
    toast.remove();
  });

  content.appendChild(titleEl);
  content.appendChild(messageEl);

  toast.appendChild(icon);
  toast.appendChild(content);
  toast.appendChild(closeBtn);

  return toast;
}

function showToast(type, title, message, timeout = 4000) {
  const container = $("#toast-container");
  if (!container) return;

  const toast = createToastElement({ type, title, message });
  container.appendChild(toast);

  if (timeout) {
    setTimeout(() => {
      toast.remove();
    }, timeout);
  }
}

// SECTION: Storage helpers
function loadFromStorage() {
  try {
    const sessionRaw = localStorage.getItem(STORAGE_KEYS.SESSION);
    const activitiesRaw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    const regsRaw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);

    session = sessionRaw ? JSON.parse(sessionRaw) : null;
    activities = activitiesRaw ? JSON.parse(activitiesRaw) : [];
    registrations = regsRaw ? JSON.parse(regsRaw) : [];
  } catch (e) {
    console.error("Failed to parse storage", e);
    session = null;
    activities = [];
    registrations = [];
  }
}

function persistToStorage() {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  localStorage.setItem(
    STORAGE_KEYS.REGISTRATIONS,
    JSON.stringify(registrations)
  );
}

// SECTION: Utility helpers
function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function isUser() {
  return session && session.role === "user";
}

function isOrg() {
  return session && session.role === "org";
}

function getActivityRegistrations(activityId) {
  return registrations.filter((r) => r.activityId === activityId);
}

function getActivityById(id) {
  return activities.find((a) => a.id === id) || null;
}

// Returns number of registrations for given activity
function getParticipantCount(activityId) {
  return getActivityRegistrations(activityId).length;
}

// SECTION: Session / Header UI
function renderSessionInfo() {
  const container = $("#session-info");
  if (!container) return;

  container.innerHTML = "";

  if (!session) {
    container.innerHTML =
      '<span class="session-label">Not signed in</span>';
    return;
  }

  const pill = document.createElement("span");
  pill.className = "session-pill";
  pill.textContent = session.role === "org" ? "Organization" : "User";

  const label = document.createElement("span");
  label.className = "session-label";
  label.textContent = session.role === "org" ? "Org code" : "Email";

  const value = document.createElement("span");
  value.className = "session-value";
  value.textContent = session.identifier;

  const logoutBtn = document.createElement("button");
  logoutBtn.className = "btn subtle";
  logoutBtn.type = "button";
  logoutBtn.textContent = "Sign out";

  logoutBtn.addEventListener("click", () => {
    session = null;
    persistToStorage();
    syncUiWithSession();
    showToast("info", "Signed out", "You are now signed out.");
  });

  container.appendChild(pill);
  container.appendChild(label);
  container.appendChild(value);
  container.appendChild(logoutBtn);
}

// SECTION: Auth flow
function handleAuthTabSwitch(role) {
  const isUserTab = role === "user";
  const userForm = $("#user-login-form");
  const orgForm = $("#org-login-form");

  $("#user-tab").classList.toggle("is-active", isUserTab);
  $("#org-tab").classList.toggle("is-active", !isUserTab);

  userForm.classList.toggle("is-hidden", !isUserTab);
  orgForm.classList.toggle("is-hidden", isUserTab);
}

function validateEmail(email) {
  const re = /.+@.+\..+/;
  return re.test(String(email).toLowerCase());
}

function validateUserLoginForm(form) {
  const emailInput = form.querySelector("#user-email");
  const errorEl = document.querySelector('[data-error-for="user-email"]');
  errorEl.textContent = "";

  const email = emailInput.value.trim();
  if (!email) {
    errorEl.textContent = "Email is required.";
    return null;
  }
  if (!validateEmail(email)) {
    errorEl.textContent = "Enter a valid email address.";
    return null;
  }
  return email;
}

function validateOrgLoginForm(form) {
  const codeInput = form.querySelector("#org-code");
  const errorEl = document.querySelector('[data-error-for="org-code"]');
  errorEl.textContent = "";

  const code = codeInput.value.trim().toUpperCase();
  if (!code) {
    errorEl.textContent = "Organization code is required.";
    return null;
  }

  const pattern = /^ORG-[A-Z0-9]{3,10}$/;
  if (!pattern.test(code)) {
    errorEl.textContent = "Use a code like ORG-123 or ORG-TEAM1.";
    return null;
  }

  return code;
}

function attachAuthHandlers() {
  const userTab = $("#user-tab");
  const orgTab = $("#org-tab");
  const userForm = $("#user-login-form");
  const orgForm = $("#org-login-form");

  userTab.addEventListener("click", () => handleAuthTabSwitch("user"));
  orgTab.addEventListener("click", () => handleAuthTabSwitch("org"));

  userForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = validateUserLoginForm(userForm);
    if (!email) return;

    session = { role: "user", identifier: email };
    persistToStorage();
    syncUiWithSession();
    showToast("success", "Signed in", "You are now signed in as a user.");
  });

  orgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = validateOrgLoginForm(orgForm);
    if (!code) return;

    session = { role: "org", identifier: code };
    persistToStorage();
    syncUiWithSession();
    showToast(
      "success",
      "Welcome back",
      "Organization dashboard is ready."
    );
  });
}

// SECTION: Activity Form validation
function getFieldErrorEl(id) {
  return document.querySelector(`[data-error-for="${id}"]`);
}

function clearActivityFormErrors() {
  [
    "activity-title",
    "activity-location",
    "date-from",
    "date-to",
    "time-from",
    "time-to",
    "min-age",
    "max-participants",
    "activity-description",
  ].forEach((id) => {
    const el = getFieldErrorEl(id);
    if (el) el.textContent = "";
  });
}

function validateActivityForm() {
  clearActivityFormErrors();

  const title = $("#activity-title").value.trim();
  const location = $("#activity-location").value.trim();
  const dateFrom = $("#date-from").value;
  const dateTo = $("#date-to").value;
  const timeFrom = $("#time-from").value;
  const timeTo = $("#time-to").value;
  const minAge = parseInt($("#min-age").value, 10);
  const maxParticipants = parseInt($("#max-participants").value, 10);
  const description = $("#activity-description").value.trim();

  let isValid = true;

  if (!title) {
    getFieldErrorEl("activity-title").textContent = "Title is required.";
    isValid = false;
  }

  if (!location) {
    getFieldErrorEl("activity-location").textContent =
      "Location is required.";
    isValid = false;
  }

  if (!dateFrom) {
    getFieldErrorEl("date-from").textContent = "Start date is required.";
    isValid = false;
  }

  if (!dateTo) {
    getFieldErrorEl("date-to").textContent = "End date is required.";
    isValid = false;
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    getFieldErrorEl("date-to").textContent =
      "End date cannot be before start date.";
    isValid = false;
  }

  if (!timeFrom) {
    getFieldErrorEl("time-from").textContent = "Start time is required.";
    isValid = false;
  }

  if (!timeTo) {
    getFieldErrorEl("time-to").textContent = "End time is required.";
    isValid = false;
  }

  if (timeFrom && timeTo && timeFrom >= timeTo) {
    getFieldErrorEl("time-to").textContent =
      "End time must be after start time.";
    isValid = false;
  }

  if (Number.isNaN(minAge) || minAge < 0) {
    getFieldErrorEl("min-age").textContent =
      "Provide a valid minimum age (0+).";
    isValid = false;
  }

  if (Number.isNaN(maxParticipants) || maxParticipants <= 0) {
    getFieldErrorEl("max-participants").textContent =
      "Provide a positive max participants value.";
    isValid = false;
  }

  if (!isValid) return null;

  return {
    title,
    location,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    minAge,
    maxParticipants,
    description,
  };
}

function resetActivityForm() {
  $("#activity-form").reset();
  $("#activity-id").value = "";
  $("#activity-save-btn").textContent = "Create activity";
  clearActivityFormErrors();
}

function populateActivityForm(activity) {
  $("#activity-id").value = activity.id;
  $("#activity-title").value = activity.title;
  $("#activity-location").value = activity.location;
  $("#date-from").value = activity.dateFrom;
  $("#date-to").value = activity.dateTo;
  $("#time-from").value = activity.timeFrom;
  $("#time-to").value = activity.timeTo;
  $("#min-age").value = activity.minAge;
  $("#max-participants").value = activity.maxParticipants;
  $("#activity-description").value = activity.description || "";
  $("#activity-save-btn").textContent = "Update activity";
}

function attachActivityFormHandlers() {
  const form = $("#activity-form");
  const resetBtn = $("#activity-reset-btn");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isOrg()) {
      showToast(
        "error",
        "Org only",
        "You must be signed in as an organization to manage activities."
      );
      return;
    }

    const payload = validateActivityForm();
    if (!payload) return;

    const existingId = $("#activity-id").value;
    if (existingId) {
      // Update existing
      const idx = activities.findIndex((a) => a.id === existingId);
      if (idx === -1) {
        showToast("error", "Not found", "Could not find this activity.");
        return;
      }
      activities[idx] = {
        ...activities[idx],
        ...payload,
      };
      showToast("success", "Activity updated", "Changes have been saved.");
    } else {
      // Create new
      const newActivity = {
        id: generateId("act"),
        orgCode: session.identifier,
        ...payload,
      };
      activities.unshift(newActivity);
      showToast(
        "success",
        "Activity created",
        "Your activity is now visible to users."
      );
    }

    persistToStorage();
    renderActivities();
    updateActivityMeta();
    resetActivityForm();
  });

  resetBtn.addEventListener("click", () => {
    resetActivityForm();
  });
}

// SECTION: Activities rendering
function formatDateRange(dateFrom, dateTo) {
  if (dateFrom === dateTo) return dateFrom;
  return `${dateFrom} → ${dateTo}`;
}

function formatTimeRange(timeFrom, timeTo) {
  return `${timeFrom} – ${timeTo}`;
}

function renderActivities() {
  const list = $("#activity-list");
  const empty = $("#empty-state");
  const mineOnly = $("#filter-mine").checked;

  if (!list) return;

  let visible = activities.slice();

  if (mineOnly && isUser()) {
    const myEmail = session.identifier;
    const myActivityIds = new Set(
      registrations
        .filter((r) => r.userEmail === myEmail)
        .map((r) => r.activityId)
    );
    visible = visible.filter((a) => myActivityIds.has(a.id));
  }

  list.innerHTML = "";

  if (visible.length === 0) {
    empty.classList.remove("is-hidden");
    return;
  }

  empty.classList.add("is-hidden");

  visible.forEach((activity) => {
    const card = document.createElement("article");
    card.className = "activity-card";

    const header = document.createElement("div");
    header.className = "activity-header";

    const titleBlock = document.createElement("div");

    const title = document.createElement("h3");
    title.className = "activity-title";
    title.textContent = activity.title;

    const meta = document.createElement("div");
    meta.className = "activity-meta";
    meta.innerHTML = `
      <span>${activity.location}</span>
      <span>•</span>
      <span>${formatDateRange(activity.dateFrom, activity.dateTo)}</span>
      <span>•</span>
      <span>${formatTimeRange(activity.timeFrom, activity.timeTo)}</span>
    `;

    titleBlock.appendChild(title);
    titleBlock.appendChild(meta);

    const badges = document.createElement("div");

    const ageBadge = document.createElement("span");
    ageBadge.className = "badge badge-soft-primary";
    ageBadge.textContent = `${activity.minAge}+`;

    const capacityBadge = document.createElement("span");
    capacityBadge.className = "badge";
    const count = getParticipantCount(activity.id);
    capacityBadge.textContent = `${count}/${activity.maxParticipants}`;

    const remaining = activity.maxParticipants - count;
    if (remaining <= 0) {
      capacityBadge.classList.add("badge-soft-danger");
    } else if (remaining <= 3) {
      capacityBadge.classList.add("badge-soft-success");
    }

    badges.appendChild(ageBadge);
    badges.appendChild(capacityBadge);

    header.appendChild(titleBlock);
    header.appendChild(badges);

    const description = document.createElement("p");
    description.className = "activity-description";
    description.textContent =
      activity.description || "No description provided yet.";

    const footer = document.createElement("div");
    footer.className = "activity-footer";

    const stats = document.createElement("div");
    stats.className = "activity-stats";
    stats.innerHTML = `
      <span><strong>${count}</strong> registered</span>
      <span>•</span>
      <span><strong>${remaining}</strong> spots left</span>
    `;

    const actions = document.createElement("div");
    actions.className = "activity-actions";

    const remainingSpots = remaining > 0;

    if (isUser()) {
      const hasRegistered = registrations.some(
        (r) => r.activityId === activity.id && r.userEmail === session.identifier
      );

      const registerBtn = document.createElement("button");
      registerBtn.type = "button";
      registerBtn.className = "btn primary";
      registerBtn.textContent = hasRegistered
        ? "Registered"
        : remainingSpots
        ? "Register"
        : "Full";
      registerBtn.disabled = hasRegistered || !remainingSpots;

      registerBtn.addEventListener("click", () => {
        openRegistrationModal(activity.id);
      });

      actions.appendChild(registerBtn);
    }

    if (isOrg() && activity.orgCode === session.identifier) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn subtle";
      editBtn.textContent = "Edit";

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn danger";
      deleteBtn.textContent = "Delete";

      editBtn.addEventListener("click", () => {
        populateActivityForm(activity);
      });

      deleteBtn.addEventListener("click", () => {
        if (
          !confirm(
            "Delete this activity? Registrations will also be removed from this browser."
          )
        ) {
          return;
        }
        activities = activities.filter((a) => a.id !== activity.id);
        registrations = registrations.filter(
          (r) => r.activityId !== activity.id
        );
        persistToStorage();
        renderActivities();
        updateActivityMeta();
        showToast("info", "Activity removed", "The activity has been deleted.");
        if ($("#activity-id").value === activity.id) {
          resetActivityForm();
        }
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
    }

    footer.appendChild(stats);
    footer.appendChild(actions);

    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(footer);

    list.appendChild(card);
  });
}

// SECTION: Activity meta
function updateActivityMeta() {
  const countEl = $("#activity-count");
  if (countEl) countEl.textContent = String(activities.length);
}

// SECTION: Registration modal & logic
function openRegistrationModal(activityId) {
  const modalBackdrop = $("#registration-modal-backdrop");
  const activity = getActivityById(activityId);
  const dateInput = $("#registration-date");
  const timeInput = $("#registration-time");

  if (!isUser()) {
    showToast("error", "User only", "Sign in as a user to register.");
    return;
  }

  if (!activity) return;

  $("#registration-activity-id").value = activityId;
  $("#registration-activity-summary").textContent = `${
    activity.title
  } • ${formatDateRange(activity.dateFrom, activity.dateTo)} • ${formatTimeRange(
    activity.timeFrom,
    activity.timeTo
  )}`;

  dateInput.min = activity.dateFrom;
  dateInput.max = activity.dateTo;
  dateInput.value = activity.dateFrom;

  timeInput.min = activity.timeFrom;
  timeInput.max = activity.timeTo;
  timeInput.value = activity.timeFrom;

  // Clear errors
  const dateError = getFieldErrorEl("registration-date");
  const timeError = getFieldErrorEl("registration-time");
  if (dateError) dateError.textContent = "";
  if (timeError) timeError.textContent = "";

  modalBackdrop.classList.remove("is-hidden");
}

function closeRegistrationModal() {
  const modalBackdrop = $("#registration-modal-backdrop");
  modalBackdrop.classList.add("is-hidden");
}

function attachRegistrationHandlers() {
  const backdrop = $("#registration-modal-backdrop");
  const closeBtn = $("#registration-modal-close");
  const cancelBtn = $("#registration-cancel-btn");
  const form = $("#registration-form");

  closeBtn.addEventListener("click", closeRegistrationModal);
  cancelBtn.addEventListener("click", closeRegistrationModal);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closeRegistrationModal();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const dateInput = $("#registration-date");
    const timeInput = $("#registration-time");
    const dateError = getFieldErrorEl("registration-date");
    const timeError = getFieldErrorEl("registration-time");

    dateError.textContent = "";
    timeError.textContent = "";

    const date = dateInput.value;
    const time = timeInput.value;

    if (!date) {
      dateError.textContent = "Please choose a date within the activity range.";
      return;
    }
    if (!time) {
      timeError.textContent = "Please choose a time within the activity hours.";
      return;
    }

    const activityId = $("#registration-activity-id").value;
    const activity = getActivityById(activityId);

    if (!activity) {
      showToast("error", "Not found", "Could not find this activity.");
      return;
    }

    if (date < activity.dateFrom || date > activity.dateTo) {
      dateError.textContent = "Selected date is outside the activity range.";
      return;
    }

    if (time < activity.timeFrom || time > activity.timeTo) {
      timeError.textContent = "Selected time is outside the activity hours.";
      return;
    }

    const hasRegistered = registrations.some(
      (r) => r.activityId === activityId && r.userEmail === session.identifier
    );

    if (hasRegistered) {
      showToast(
        "error",
        "Already registered",
        "You are already registered for this activity."
      );
      closeRegistrationModal();
      return;
    }

    const currentCount = getParticipantCount(activityId);

    if (currentCount >= activity.maxParticipants) {
      showToast(
        "error",
        "Activity full",
        "This activity has reached its maximum capacity."
      );
      closeRegistrationModal();
      return;
    }

    const registration = {
      id: generateId("reg"),
      activityId,
      userEmail: session.identifier,
      date,
      time,
      createdAt: new Date().toISOString(),
    };

    registrations.push(registration);
    persistToStorage();
    renderActivities();

    showToast(
      "success",
      "Registered",
      "You are booked in – a calendar invite would go here in a real app."
    );
    closeRegistrationModal();
  });
}

// SECTION: Content subtitle based on session
function updateContentSubtitle() {
  const subtitle = $("#content-subtitle");
  if (!subtitle) return;

  if (!session) {
    subtitle.textContent = "Sign in to browse and register.";
    return;
  }

  if (isOrg()) {
    subtitle.textContent = "You are viewing activities as an organization.";
    return;
  }

  subtitle.textContent =
    "Browse open activities and register for a specific day and time.";
}

// SECTION: Dashboard visibility
function syncUiWithSession() {
  const authSection = $("#auth-section");
  const dashboard = $("#dashboard");
  const orgPanel = $("#org-panel");

  if (!session) {
    authSection.classList.remove("is-hidden");
    dashboard.classList.add("is-hidden");
  } else {
    authSection.classList.add("is-hidden");
    dashboard.classList.remove("is-hidden");
  }

  if (isOrg()) {
    orgPanel.classList.remove("is-hidden");
  } else {
    orgPanel.classList.add("is-hidden");
  }

  renderSessionInfo();
  updateContentSubtitle();
  renderActivities();
  updateActivityMeta();
}

// SECTION: Filters
function attachFilterHandlers() {
  const mineCheckbox = $("#filter-mine");
  mineCheckbox.addEventListener("change", () => {
    renderActivities();
  });
}

// SECTION: Demo seed (optional, to avoid empty feel on first load)
function seedDemoDataIfEmpty() {
  if (activities.length > 0) return;

  const demoOrg = "ORG-123";

  const today = new Date();
  const toISODate = (d) => d.toISOString().slice(0, 10);
  const plusDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  const demoActivities = [
    {
      id: generateId("act"),
      orgCode: demoOrg,
      title: "Sunrise Yoga in the Park",
      location: "Riverside Park",
      dateFrom: toISODate(plusDays(1)),
      dateTo: toISODate(plusDays(14)),
      timeFrom: "07:00",
      timeTo: "08:00",
      minAge: 16,
      maxParticipants: 20,
      description:
        "A gentle all-levels flow to start the day with breathwork and stretches.",
    },
    {
      id: generateId("act"),
      orgCode: demoOrg,
      title: "After-work Climbing Session",
      location: "Boulder Lab Downtown",
      dateFrom: toISODate(plusDays(2)),
      dateTo: toISODate(plusDays(10)),
      timeFrom: "18:30",
      timeTo: "20:30",
      minAge: 18,
      maxParticipants: 12,
      description:
        "Guided bouldering with coaches on-site. Shoes and chalk provided.",
    },
  ];

  activities = demoActivities;
  persistToStorage();
}

// SECTION: App init
function init() {
  loadFromStorage();
  seedDemoDataIfEmpty();

  attachAuthHandlers();
  attachActivityFormHandlers();
  attachRegistrationHandlers();
  attachFilterHandlers();

  syncUiWithSession();
}

window.addEventListener("DOMContentLoaded", init);
