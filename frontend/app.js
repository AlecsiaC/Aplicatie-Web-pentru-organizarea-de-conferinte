const API_URL = "http://localhost:3000/api";

// 1. Funcție pentru Înregistrare (POST /api/utilizatori)
async function registerUser(event) {
    event.preventDefault();

    const nume = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const parola = document.getElementById('reg-pass').value;
    const rol = document.getElementById('reg-role').value;

    try {
        const response = await fetch(`${API_URL}/utilizatori`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                },
            body: JSON.stringify({
                numeUtilizator: nume,
                email: email,
                parola: parola,
                rol: rol
            })
        });

        if (response.ok) {
            alert("Cont creat cu succes! Te poți loga.");
            toggleAuthForm('login');
        } else {
            const error = await response.json();
            alert("Eroare la înregistrare: " + error.message);
        }
    } catch (err) {
        console.error("Eroare rețea:", err);
    }
}
// 2. Funcție pentru Login (Simulată, deoarece nu avem încă rută de login cu JWT)
// Momentan verificăm doar dacă utilizatorul există prin GET /api/utilizatori
async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const parola = document.getElementById('login-pass').value;

    try {
        const response = await fetch(`${API_URL}/utilizatori`);
        const utilizatori = await response.json();
        // Căutăm utilizatorul în listă (Simplificare pentru testare)
        const userFound = utilizatori.find(u => u.email === email && u.parola === parola);

        if (userFound) {
            localStorage.setItem('loggedUser', JSON.stringify(userFound));
            console.log("Logat ca:", userFound.numeUtilizator);
            
            // Apelăm funcția unică de procesare a login-ului
            completeLogin(userFound);
        } else {
            alert("Email sau parolă incorectă!");
        }
    } catch (err) {
        console.error("Eroare rețea:", err);
    }
}
// Creăm o funcție separată pentru pașii de după login ca să nu repetăm codul
function completeLogin(user) {
    // 1. Setăm utilizatorul global
    window.currentUser = user; 
    
    // 2. Populăm datele în UI
    document.getElementById('user-display-name').textContent = user.numeUtilizator;
    document.getElementById('user-display-role').textContent = user.rol;
    
    // 3. Gestionăm vizibilitatea butonului de creare conferință
    const btnCreate = document.getElementById('btn-show-create-conf');
    if (btnCreate) {
        if (user.rol === 'ORGANIZATOR') {
            btnCreate.classList.remove('hidden');
        } else {
            btnCreate.classList.add('hidden'); // FOARTE IMPORTANT: Ascundem dacă nu e organizator
        }
    }

    // 4. Navigarea SPA
    showPage('main-section');
    showView('view-dashboard');
    loadConferences();
}
// 3. Funcție pentru Afișare Conferințe (GET /api/conferinte)
async function loadConferences() {
    const listElement = document.getElementById('conference-list');
    listElement.innerHTML = "<p>Se încarcă conferințele...</p>";

    try {
        const response = await fetch(`${API_URL}/conferinte`);
        const conferinte = await response.json();

        listElement.innerHTML = ""; // Golim mesajul de încărcare

        conferinte.forEach(conf => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${conf.titluConf}</h3>
                <p>${conf.descriere}</p>
                <div class="card-footer">
                    <span>📅 ${conf.data} | 🕒 ${conf.ora}</span>
                    <span class="status-tag">${conf.status}</span>
                </div>
            `;
            listElement.appendChild(card);
        });
    } catch (err) {
        listElement.innerHTML = "<p>Eroare la încărcarea datelor.</p>";
    }
}
// Funcție pentru a schimba între Login și Signup (în cadrul secțiunii de auth)
function toggleAuthForm(type) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');

    if (type === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
    }
}
// Funcție principală pentru navigare
function showPage(pageId) {
    // Ascundem toate paginile/secțiunile principale
    document.querySelectorAll('.page').forEach(section => {
        section.classList.add('hidden');
    });

    // Afișăm doar pagina cerută
    document.getElementById(pageId).classList.remove('hidden');
}

function logout() {
    // Ștergem datele din browser
    localStorage.removeItem('loggedUser');
    window.currentUser = null;

    showPage('auth-section');
}
// 1. Funcție pentru a schimba între Dashboard și Formularul de Creare
function showView(viewId) {
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');
}
function setMinDateForConference() {
    const dateInput = document.getElementById('conf-date');
    if (dateInput) {
        // Obținem data curentă în format ISO (ex: 2023-10-27T10:00...)
        const today = new Date();
        
        // Formatăm data pentru a extrage doar YYYY-MM-DD
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Lunile încep de la 0
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedToday = yyyy + '-' + mm + '-' + dd;
        
        // Setăm atributul min al input-ului
        dateInput.setAttribute('min', formattedToday);
    }
}
// 3. Funcție pentru trimiterea conferinței noi la Backend (POST /api/conferinte)
async function handleCreateConference(event) {
    event.preventDefault();

    const selectedDate = new Date(document.getElementById('conf-date').value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetăm ora pentru a compara doar datele

    if (selectedDate < today) {
        alert("Nu poți planifica o conferință în trecut!");
        return;
    }

    const payload = {
        titluConf: document.getElementById('conf-title').value,
        descriere: document.getElementById('conf-desc').value,
        data: document.getElementById('conf-date').value,
        ora: document.getElementById('conf-time').value, // Luăm valoarea din HTML,
        status: "PLANIFICATA",
        organizatorId: window.currentUser.id // Folosim ID-ul celui logat
    };
    console.log("Trimitem payload-ul:", payload);
    try {
        const response = await fetch(`${API_URL}/conferinte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Conferință creată cu succes!");
            document.getElementById('form-create-conference').reset();
            showView('view-dashboard');
            loadConferences(); // Reîncărcăm lista să apară cea nouă
        }
    } catch (err) { console.error("Eroare la creare:", err); }
}

function application(){
    console.log("Aplicația a fost inițializată!");
    setMinDateForConference();

    // Atașăm evenimentele la formulare
    const savedUser = localStorage.getItem('loggedUser');

    if (savedUser) {
        const user = JSON.parse(savedUser); // Transformăm textul înapoi în obiect
        console.log("Sesiune restaurată pentru:", user.numeUtilizator);
        completeLogin(user);
    }

    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const confForm = document.getElementById('form-create-conference');
    

    if (signupForm) {
        signupForm.addEventListener('submit', registerUser);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }
    if (confForm){
        confForm.addEventListener('submit', handleCreateConference);
    }  
}

document.addEventListener('DOMContentLoaded', application);