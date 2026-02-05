const ORG_CODE = "ORG-123";

const activities = [];
const registrations = [];

function createActivityFromOrg(formData) {
  const id = String(Date.now());
  const title = formData.get("title");
  const location = formData.get("location");
  const reason = formData.get("reason");
  const hours = Number(formData.get("hours"));
  const dateFrom = formData.get("dateFrom");
  const dateTo = formData.get("dateTo");
  const timeFrom = formData.get("timeFrom");
  const timeTo = formData.get("timeTo");
  const maxSlotsRaw = formData.get("maxSlots");
  const maxSlots = maxSlotsRaw ? Number(maxSlotsRaw) : null;

  return {
    id,
    title,
    location,
    reason,
    hours,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    maxSlots,
  };
}

function getHoursForActivity(activityId) {
  const found = activities.find((a) => a.id === activityId);
  return found ? found.hours : 0;
}

function renderActivities() {
  const list = document.getElementById("activityList");
  const select = document.getElementById("activitySelect");
  if (!list || !select) return;

  list.innerHTML = "";
  select.innerHTML = '<option value="" disabled selected>Pasirink veiklą iš sąrašo</option>';

  activities.forEach((activity) => {
    const li = document.createElement("li");
    li.className = "activity-card";
    li.dataset.activityId = activity.id;

    li.innerHTML = `
      <div class="activity-main">
        <div class="activity-icon">🤝</div>
        <div class="activity-copy">
          <h3 class="activity-title">${activity.title}</h3>
          <p class="activity-org">${activity.location}</p>
          <p class="activity-desc">${activity.reason}</p>
          <p class="activity-desc">Laikotarpis: ${activity.dateFrom} – ${activity.dateTo}, ${activity.timeFrom}–${activity.timeTo}</p>
        </div>
      </div>
      <div class="activity-meta">
        <span class="chip chip-hours">${activity.hours} socialinės valandos</span>
        <button class="btn btn-outline btn-sm activity-select" type="button">Pasirinkti veiklą</button>
      </div>
    `;

    list.appendChild(li);

    const option = document.createElement("option");
    option.value = activity.id;
    option.textContent = `${activity.title} – ${activity.hours} val.`;
    select.appendChild(option);
  });
}

function updateSelectedHours() {
  const selectEl = document.getElementById("activitySelect");
  const target = document.getElementById("selectedHours");
  if (!selectEl || !target) return;

  const value = selectEl.value;
  if (!value) {
    target.textContent = "–";
    return;
  }
  const hours = getHoursForActivity(value);
  target.textContent = `${hours} val.`;
}

function renderOrgTable() {
  const tbody = document.getElementById("orgRegistrationsBody");
  const emptyState = document.getElementById("orgEmptyState");
  const badge = document.getElementById("orgCountBadge");
  const totalRegistrations = document.getElementById("orgTotalRegistrations");
  const totalHours = document.getElementById("orgTotalHours");
  const heroTotal = document.getElementById("totalHours");

  if (!tbody) return;

  tbody.innerHTML = "";

  registrations.forEach((reg) => {
    const tr = document.createElement("tr");

    const tdEmail = document.createElement("td");
    tdEmail.textContent = reg.email;

    const tdActivity = document.createElement("td");
    tdActivity.textContent = reg.activityTitle;

    const tdDay = document.createElement("td");
    tdDay.textContent = reg.day;

    const tdTime = document.createElement("td");
    tdTime.textContent = reg.time;

    const tdHours = document.createElement("td");
    tdHours.textContent = `${reg.hours} val.`;

    tr.append(tdEmail, tdActivity, tdDay, tdTime, tdHours);
    tbody.appendChild(tr);
  });

  const count = registrations.length;
  const hoursTotal = registrations.reduce((sum, reg) => sum + reg.hours, 0);

  if (emptyState) {
    emptyState.style.display = count === 0 ? "block" : "none";
  }
  if (badge) {
    badge.textContent = `${count} įrašai`;
  }
  if (totalRegistrations) {
    totalRegistrations.textContent = String(count);
  }
  if (totalHours) {
    totalHours.textContent = `${hoursTotal} val.`;
  }
  if (heroTotal) {
    heroTotal.textContent = String(hoursTotal);
  }
}

function showFormMessage(type, text) {
  const el = document.getElementById("formMessage");
  if (!el) return;

  el.textContent = text;
  el.classList.remove("is-success", "is-error");
  if (type === "success") {
    el.classList.add("is-success");
  } else if (type === "error") {
    el.classList.add("is-error");
  }
}

function handleActivityCardClick(event) {
  const button = event.target.closest(".activity-select");
  if (!button) return;

  const card = button.closest(".activity-card");
  if (!card) return;

  const activityId = card.dataset.activityId;
  const selectEl = document.getElementById("activitySelect");

  if (selectEl && activityId) {
    selectEl.value = activityId;
    updateSelectedHours();
    selectEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function handleActivitySelectChange() {
  updateSelectedHours();
}

function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;

  const activityId = form.activity.value;
  const email = form.email.value.trim();
  const day = form.day.value;
  const time = form.time.value;

  if (!activityId || !email || !day || !time) {
    showFormMessage("error", "Prašome užpildyti visus laukus prieš patvirtinant registraciją.");
    return;
  }

  const hours = getHoursForActivity(activityId);
  const activity = activities.find((a) => a.id === activityId);
  const activityTitle = activity ? activity.title : "Pasirinkta veikla";

  const registration = {
    activityId,
    activityTitle,
    email,
    day,
    time,
    hours,
    createdAt: new Date().toISOString(),
  };

  registrations.push(registration);

  renderOrgTable();

  showFormMessage(
    "success",
    `Registracija patvirtinta! Už veiklą "${activityTitle}" gausi ${hours} socialines valandas.`
  );

  const selectedHoursEl = document.getElementById("selectedHours");
  if (selectedHoursEl) {
    selectedHoursEl.textContent = `${hours} val.`;
  }

  form.reset();
  const hoursPreviewTarget = document.getElementById("selectedHours");
  if (hoursPreviewTarget) {
    hoursPreviewTarget.textContent = "–";
  }
}

function handleOrgLogin(event) {
  event.preventDefault();
  const form = event.target;
  const codeInput = form.orgCode;
  const messageEl = document.getElementById("orgLoginMessage");
  const createPanel = document.getElementById("orgCreatePanel");
  const tablePanel = document.getElementById("orgTablePanel");
  const summaryPanel = document.getElementById("orgSummaryPanel");

  const code = codeInput.value.trim();
  if (code === ORG_CODE) {
    messageEl.textContent = "Sėkmingai prisijungėte kaip organizacija.";
    messageEl.classList.remove("is-error");
    messageEl.classList.add("is-success");
    if (createPanel) createPanel.hidden = false;
    if (tablePanel) tablePanel.hidden = false;
    if (summaryPanel) summaryPanel.hidden = false;
  } else {
    messageEl.textContent = "Neteisingas organizacijos kodas. Bandykite dar kartą.";
    messageEl.classList.remove("is-success");
    messageEl.classList.add("is-error");
    if (createPanel) createPanel.hidden = true;
    if (tablePanel) tablePanel.hidden = true;
    if (summaryPanel) summaryPanel.hidden = true;
  }
}

function handleOrgActivitySubmit(event) {
  event.preventDefault();
  const form = event.target;
  const messageEl = document.getElementById("orgActivityMessage");

  const formData = new FormData(form);
  const activity = createActivityFromOrg(formData);

  activities.push(activity);
  renderActivities();

  messageEl.textContent = "Veikla sėkmingai išsaugota ir matoma mokiniams.";
  messageEl.classList.remove("is-error");
  messageEl.classList.add("is-success");

  form.reset();
}

function buildTimeSlots() {
  const slider = document.getElementById("timeSlider");
  const timeInput = document.getElementById("time");
  if (!slider || !timeInput) return;

  slider.innerHTML = "";
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  hours.forEach((h) => {
    const label = `${String(h).padStart(2, "0")}:00`;
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "su-time-slot";
    slot.textContent = label;
    slot.addEventListener("click", () => {
      timeInput.value = label;
      document.querySelectorAll(".su-time-slot").forEach((el) => el.classList.remove("is-active"));
      slot.classList.add("is-active");
    });
    slider.appendChild(slot);
  });
}

function initSocialUp() {
  const activityList = document.getElementById("activityList");
  const activitySelect = document.getElementById("activitySelect");
  const form = document.getElementById("registrationForm");
  const orgLoginForm = document.getElementById("orgLoginForm");
  const orgActivityForm = document.getElementById("orgActivityForm");

  if (activityList) {
    activityList.addEventListener("click", handleActivityCardClick);
  }
  if (activitySelect) {
    activitySelect.addEventListener("change", handleActivitySelectChange);
  }
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }
  if (orgLoginForm) {
    orgLoginForm.addEventListener("submit", handleOrgLogin);
  }
  if (orgActivityForm) {
    orgActivityForm.addEventListener("submit", handleOrgActivitySubmit);
  }

  buildTimeSlots();
  updateSelectedHours();
  renderOrgTable();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSocialUp);
} else {
  initSocialUp();
}
