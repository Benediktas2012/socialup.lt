let currentUser = null;
let role = null;

const activities = JSON.parse(localStorage.getItem("activities")) || [];

// LOGIN

document.getElementById("login-user").onclick = () => {
  const email = document.getElementById("user-email").value;
  if (!email) return alert("Įveskite el. paštą");
  currentUser = email;
  role = "user";
  start();
};

document.getElementById("login-org").onclick = () => {
  const code = document.getElementById("org-code").value;
  if (!code.startsWith("ORG")) return alert("Neteisingas kodas");
  role = "org";
  start();
};

// START APP

function start() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("activities-section").style.display = "block";
  document.getElementById("org-panel").style.display = role === "org" ? "block" : "none";
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

// REGISTER

function register(activity) {
  if (activity.registrations.length >= activity.limit) {
    alert("Dalyvių limitas pasiektas");
    return;
  }

  const day = prompt("Kurią dieną dalyvausite? (YYYY-MM-DD)");
  if (!day) return;

  const time = prompt("Kelintą valandą? (HH:MM)");
  if (!time) return;

  activity.registrations.push({
    email: currentUser,
    day,
    time
  });

  save();
  renderActivities();
}

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
      btn.onclick = () => register(activity);
      div.appendChild(btn);
    }

    if (role === "org") {
      const listTitle = document.createElement("h4");
      listTitle.textContent = "Prisiregistravę dalyviai:";
      div.appendChild(listTitle);

      const ul = document.createElement("ul");
      activity.registrations.forEach(r => {
        const li = document.createElement("li");
        li.textContent = `${r.email} – ${r.day} ${r.time}`;
        ul.appendChild(li);
      });

      if (activity.registrations.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Kol kas niekas neužsiregistravo";
        div.appendChild(empty);
      } else {
        div.appendChild(ul);
      }
    }

    container.appendChild(div);
  });
}

function save() {
  localStorage.setItem("activities", JSON.stringify(activities));
}
