let currentUser = null;
let currentRole = null;
let selectedActivity = null;

const activities = JSON.parse(localStorage.getItem("activities")) || [];

/* ---------- AUTH ---------- */

document.getElementById("user-login-form").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("user-email").value.trim();
  if (!email) {
    showToast("error", "Klaida", "Įveskite el. paštą");
    return;
  }
  currentUser = { email };
  currentRole = "user";
  initApp();
});

document.getElementById("org-login-form").addEventListener("submit", e => {
  e.preventDefault();
  const code = document.getElementById("org-code").value.trim();
  if (!code.startsWith("ORG")) {
    showToast("error", "Klaida", "Neteisingas organizacijos kodas");
    return;
  }
  currentRole = "org";
  initApp();
});

/* ---------- INIT ---------- */

function initApp() {
  document.getElementById("auth-section").classList.add("is-hidden");
  document.getElementById("dashboard").classList.remove("is-hidden");
  renderActivities();
}

/* ---------- REGISTER MODAL ---------- */

function openRegisterModal(activity) {
  selectedActivity = activity;
  document.getElementById("reg-date").value = "";
  document.getElementById("reg-time").value = "";
  document.getElementById("register-modal").classList.remove("is-hidden");
}

document.getElementById("cancel-register").onclick = () => {
  document.getElementById("register-modal").classList.add("is-hidden");
  selectedActivity = null;
};

document.getElementById("confirm-register").onclick = () => {
  const date = document.getElementById("reg-date").value;
  const time = document.getElementById("reg-time").value;

  if (!date || !time) {
    showToast("error", "Klaida", "Pasirinkite datą ir laiką");
    return;
  }

  if (selectedActivity.registrations.length >= selectedActivity.maxParticipants) {
    showToast("error", "Pilna", "Vietų nebėra");
    return;
  }

  selectedActivity.registrations.push({
    email: currentUser.email,
    date,
    time
  });

  saveActivities();
  renderActivities();

  document.getElementById("register-modal").classList.add("is-hidden");

  showToast("success", "Registracija sėkminga", "Jūs užsiregistravote į veiklą");
};

/* ---------- RENDER ---------- */

function renderActivities() {
  const list = document.getElementById("activity-list");
  list.innerHTML = "";

  activities.forEach(activity => {
    const card = document.createElement("div");
    card.className = "activity-card";

    card.innerHTML = `
      <h3>${activity.title}</h3>
      <p>${activity.registrations.length} / ${activity.maxParticipants}</p>
    `;

    if (currentRole === "user") {
      const btn = document.createElement("button");
      btn.className = "btn primary";
      btn.textContent = "Registruotis";
      btn.onclick = () => openRegisterModal(activity);
      card.appendChild(btn);
    }

    if (currentRole === "org") {
      activity.registrations.forEach(r => {
        const p = document.createElement("p");
        p.textContent = `${r.email} – ${r.date} ${r.time}`;
        card.appendChild(p);
      });
    }

    list.appendChild(card);
  });
}

/* ---------- STORAGE ---------- */

function saveActivities() {
  localStorage.setItem("activities", JSON.stringify(activities));
}
