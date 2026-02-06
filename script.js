let editId = null;

/* LOGIN */
function login(){
  const val = document.getElementById("loginInput").value.trim();
  if(!val) return alert("Įveskite gmail arba ORG kodą");

  let orgs = JSON.parse(localStorage.getItem("orgs")) || {};

  if(val.startsWith("ORG-")){
    if(!orgs[val]){
      const name = prompt("Organizacijos pavadinimas:");
      if(!name) return;
      orgs[val] = { name, activities: [] };
      localStorage.setItem("orgs", JSON.stringify(orgs));
    }
    localStorage.setItem("role","org");
    localStorage.setItem("orgCode",val);
  } else {
    if(!val.includes("@")) return alert("Įveskite galiojantį gmail");
    localStorage.setItem("role","user");
    localStorage.setItem("userEmail",val);
  }
  location.reload();
}

function logout(){
  localStorage.removeItem("role");
  localStorage.removeItem("orgCode");
  localStorage.removeItem("userEmail");
  location.reload();
}

function getOrgs(){
  return JSON.parse(localStorage.getItem("orgs")) || {};
}
function saveOrgs(orgs){
  localStorage.setItem("orgs", JSON.stringify(orgs));
}

/* SAVE / EDIT */
document.getElementById("saveBtn").onclick = () => {
  const orgCode = localStorage.getItem("orgCode");
  const orgs = getOrgs();
  const org = orgs[orgCode];

  const title = document.getElementById("title").value;
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const timeFrom = document.getElementById("timeFrom").value;
  const timeTo = document.getElementById("timeTo").value;
  const age = document.getElementById("age").value;
  const max = document.getElementById("maxParticipants").value;
  const description = document.getElementById("description").value;
  const location = document.getElementById("locationInput").value;

  if(!title || !dateFrom || !dateTo || !timeFrom || !timeTo)
    return alert("Užpildyk visus laukus");

  if(new Date(dateFrom) > new Date(dateTo))
    return alert("Data 'nuo' negali būti vėlesnė už 'iki'");

  const data = {
    id: editId || Date.now(),
    title,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    age,
    maxParticipants: Number(max) || 0,
    description,
    location,
    registered: editId
      ? org.activities.find(a=>a.id===editId).registered
      : []
  };

  if(editId){
    org.activities = org.activities.map(a=>a.id===editId?data:a);
    editId=null;
    document.getElementById("saveBtn").textContent="Išsaugoti veiklą";
  } else {
    org.activities.push(data);
  }

  saveOrgs(orgs);
  clearForm();
  render();
};

function clearForm(){
  ["title","dateFrom","dateTo","timeFrom","timeTo","age","maxParticipants","description","locationInput"]
    .forEach(id=>document.getElementById(id).value="");
}

/* EDIT / DELETE */
function editActivity(id){
  const org = getOrgs()[localStorage.getItem("orgCode")];
  const a = org.activities.find(a=>a.id===id);

  title.value=a.title;
  dateFrom.value=a.dateFrom;
  dateTo.value=a.dateTo;
  timeFrom.value=a.timeFrom;
  timeTo.value=a.timeTo;
  age.value=a.age;
  maxParticipants.value=a.maxParticipants;
  description.value=a.description;
  locationInput.value=a.location;

  editId=id;
  saveBtn.textContent="Išsaugoti pakeitimus";
}

function deleteActivity(id){
  if(!confirm("Ištrinti veiklą?")) return;
  const orgs = getOrgs();
  const org = orgs[localStorage.getItem("orgCode")];
  org.activities = org.activities.filter(a=>a.id!==id);
  saveOrgs(orgs);
  render();
}

/* REGISTER */
function register(orgCode,id){
  const email = localStorage.getItem("userEmail");
  const orgs = getOrgs();
  const a = orgs[orgCode].activities.find(a=>a.id===id);

  if(a.registered.some(r=>r.email===email))
    return alert("Jau esate užsiregistravęs");

  if(a.maxParticipants && a.registered.length>=a.maxParticipants)
    return alert("Vietų nebėra");

  const day = prompt("Kurią dieną ateisi? (YYYY-MM-DD)");
  const time = prompt("Kurią valandą? (HH:MM)");

  if(!day || isNaN(new Date(day))) return alert("Neteisinga data");
  if(!/^\d{2}:\d{2}$/.test(time)) return alert("Neteisingas laikas");

  a.registered.push({email,day,time});
  saveOrgs(orgs);
  render();
}

/* RENDER */
function render(){
  const container = document.getElementById("activitiesContainer");
  container.innerHTML="";

  const role = localStorage.getItem("role");
  document.getElementById("orgPanel").style.display = role==="org"?"block":"none";

  Object.entries(getOrgs()).forEach(([code,org])=>{
    org.activities.forEach(a=>{
      container.innerHTML+=`
      <div class="card">
        <h3>${a.title}</h3>
        <p><b>🏢 ${org.name}</b></p>
        <p>📆 ${a.dateFrom} – ${a.dateTo}</p>
        <p>⏰ ${a.timeFrom} – ${a.timeTo}</p>
        <p>${a.description}</p>
        <p>👥 ${a.registered.length}${a.maxParticipants?"/"+a.maxParticipants:""}</p>
        <p>${a.registered.map(r=>`${r.email} (${r.day} ${r.time})`).join("<br>")}</p>
        ${role==="user"?`<button onclick="register('${code}',${a.id})">Registruotis</button>`:""}
        ${role==="org" && localStorage.getItem("orgCode")===code?
        `<button class="edit-btn" onclick="editActivity(${a.id})">✏️</button>
         <button class="delete-btn" onclick="deleteActivity(${a.id})">🗑️</button>`:""}
      </div>`;
    });
  });
}

/* START */
if(localStorage.getItem("role")){
  loginSection.style.display="none";
  activitiesSection.style.display="block";
  render();
}
