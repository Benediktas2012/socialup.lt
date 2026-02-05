let currentUser = null;
let role = null;
let selectedActivity = null;

const activities = JSON.parse(localStorage.getItem("activities")) || [];

// LOGIN

document.getElementById("login-user").onclick = () => {
  const email = document.getElementById("user-email").value.trim();
  if (!email) return alert("Įveskite el. paštą");
  currentUser = email;
  role = "user";
  start();
};

document.getElementById("login-org").onclick = () => {
  const code = document.getElementById("org-code").value.trim();
  if (!code.startsWith("ORG")) return alert("Neteisingas organizacijos kodas");
  role = "org";
  start();
};

// START

function start() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("activities-section").style.display = "block";
  document.getElementById("org-panel").style.display =
    role === "org" ? "block" : "none";
  renderActivities();
}

// CREATE ACTIVITY

document.getElementById("create-activity").onclick = () => {
  const title = document.getElementById("activity-title").value;
  const limit = Number(document.getElementById("activity-limit").value);

  if (!title || !limit) return alert("Užpildykite visus laukus");

  activities.push({
    id: Date.now(),
    title,
    limit,
    registrations: []
  });

  save();
  renderActivities();
};

// REGISTER FLOW

function openRegisterModal(activity) {
  selectedActivity = activity;
  document.getElementById("reg-date").value = "";
  document.getElementById("reg-time").value = "";
  document.getElementById("register-modal").classList.remove("hidden");
}

document.getElementById("cancel-register").onclick = () => {
  document.getElementById("register-modal").classList.add("hidden");
  selectedActivity = null;
};

document.getElementById("confirm-register").onclick = () => {
  const date = document.getElementById("reg-date").value;
  const time = document.getElementById("reg-time").value;

  if (!date || !time) {
    alert("Pasirinkite datą ir laiką");
    return;
  }

  if (selectedActivity.registrations.length >= selectedActivity.limit) {
    alert("Dalyvių limitas pasiektas");
    return;
  }

  selectedActivity.registrations.push({
    email: currentUser,
    date,
    time
  });

  save();
  renderActivities();
  document.getElementById("register-modal").classList.add("hidden");
};

// RENDER

function renderActivities() {
  const container = document.getElementById("activities");
  container.innerHTML = "";

  activities.forEach(activity => {
    const div = document.createElement("div");
    div.className = "activity";

    div.innerHTML = `
      <div class="activity-header">
        <h3>${activity.title}</h3>
        <strong>${activity.registrations.length} / ${activity.limit}</strong>
      </div>
    `;

    if (role === "user") {
      const btn = document.createElement("button");
      btn.textContent = "Registruotis";
      btn.onclick = () => openRegisterModal(activity);
      div.appendChild(btn);
    }

    if (role === "org") {
      const ul = document.createElement("ul");

      if (activity.registrations.length === 0) {
        const p = document.createElement("p");
        p.textContent = "Kol kas nėra registracijų";
        div.appendChild(p);
      } else {
        activity.registrations.forEach(r => {
          const li = document.createElement("li");
          li.textContent = `${r.email} – ${r.date} ${r.time}`;
          ul.appendChild(li);
        });
        div.appendChild(ul);
      }
    }

    container.appendChild(div);
  });
}

// SAVE

function save() {
  localStorage.setItem("activities", JSON.stringify(activities));
}
