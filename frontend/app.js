const API_URL = "http://localhost:3000/api";
let currentConferenceId = null; // NOU: Salvăm ID-ul conferinței curente

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
    // 1. Oprim imediat orice acțiune default (refresh)
    if (event) {
        event.preventDefault();
        event.stopPropagation(); 
    }

    const email = document.getElementById('login-email').value;
    const parola = document.getElementById('login-pass').value;

    try {
        const response = await fetch(`${API_URL}/utilizatori`);
        const utilizatori = await response.json();
        
        const userFound = utilizatori.find(u => u.email === email && u.parola === parola);

        if (userFound) {
            localStorage.setItem('loggedUser', JSON.stringify(userFound));
            
            // 2. Setăm starea inițială în istoric chiar înainte de a schimba pagina
            // Astfel, "Back" va avea unde să se întoarcă
            history.replaceState({ view: 'dashboard' }, "", "#dashboard");
            
            completeLogin(userFound);
        } else {
            alert("Email sau parolă incorectă!");
        }
    } catch (err) {
        console.error("Eroare rețea:", err);
        alert("Eroare de conexiune la server.");
    }
}
// Creăm o funcție separată pentru pașii de după login ca să nu repetăm codul
function completeLogin(user) {
    window.currentUser = user; 
    
    document.getElementById('user-display-name').textContent = user.numeUtilizator;
    document.getElementById('user-display-role').textContent = user.rol;
    
    // Vizibilitate buton creare (Organizator)
    const btnCreate = document.getElementById('btn-show-create-conf');
    if (btnCreate) {
        if (user.rol.toUpperCase() === 'ORGANIZATOR') {
            btnCreate.classList.remove('hidden');
        } else {
            btnCreate.classList.add('hidden');
        }
    }

    showPage('main-section'); // Trece de la Login la Aplicație
    
    // Folosim o logică simplă pentru prima afișare
    const views = document.querySelectorAll('.content-view');
    views.forEach(v => v.classList.add('hidden'));
    document.getElementById('view-dashboard').classList.remove('hidden');
    
    loadConferences();
}
// 3. Funcție pentru Afișare Conferințe (GET /api/conferinte)
async function loadConferences() {
    const listElement = document.getElementById('conference-list');
    listElement.innerHTML = "<p>Se încarcă conferințele...</p>";

    try {
        const response = await fetch(`${API_URL}/conferinte`);
        const conferinte = await response.json();

        listElement.innerHTML = ""; 

        conferinte.forEach(conf => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // --- MODIFICARE AICI ---
            card.style.cursor = 'pointer'; // Arată utilizatorului că poate da click
            card.onclick = () => openConferenceDetails(conf.id); 
            // -----------------------

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
// Funcție pentru a schimba între Dashboard și Formularul de Creare
// Adaugă , skipHistory = false aici:
function showView(viewId, skipHistory = false) {
    const views = document.querySelectorAll('.content-view');
    views.forEach(view => view.classList.add('hidden'));

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // Gestionăm istoricul doar dacă nu am cerut skip
    if (!skipHistory && window.currentUser) {
        const currentState = history.state;
        if (!currentState || currentState.view !== viewId) {
            if (viewId === 'view-dashboard') {
                history.pushState({ view: 'dashboard' }, "", "#dashboard");
            } else if (viewId === 'view-create-conf') {
                history.pushState({ view: 'create-conf' }, "", "#create");
                loadReviewersForSelection();
            }
        }
    }
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

    // ... (codul tău existent pentru data)

    // COLECTĂM ID-URILE SELECTATE
    const selectedCheckboxes = document.querySelectorAll('input[name="reviewer-checkbox"]:checked');
    const reviewerIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));

    const payload = {
        titluConf: document.getElementById('conf-title').value,
        descriere: document.getElementById('conf-desc').value,
        data: document.getElementById('conf-date').value,
        ora: document.getElementById('conf-time').value,
        status: "PLANIFICATA",
        organizatorId: window.currentUser.id,
        reviewerIds: reviewerIds // NOU: Trimitem și lista de ID-uri
    };

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
            loadConferences();
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

    const fileInput = document.getElementById('article-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', async function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                
                // Validare minimă
                if (!currentConferenceId) {
                    alert("Eroare: Nu s-a putut identifica conferința curentă.");
                    return;
                }

                const formData = new FormData();
                formData.append('fisier', file); // Pentru fișierul PDF
                formData.append('titluArticol', file.name); // <--- Verifică să NU fie 'numeArticol'
                formData.append('autorId', window.currentUser.id); // <--- Verifică să NU fie 'idAutor'
                formData.append('conferintaId', currentConferenceId); // <--- Verifică să NU fie 'idConferinta'
                formData.append('rezumat', 'Rezumat implicit');

            
                // Feedback vizual
                const fileNameDisplay = document.getElementById('file-selected-name');
                if (fileNameDisplay) fileNameDisplay.innerText = "Se încarcă: " + file.name + "...";

                try {
                    const response = await fetch(`${API_URL}/articole`, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        alert("Articolul a fost încărcat cu succes!");
                        fileInput.value = ""; // Resetăm input-ul
                        if (fileNameDisplay) fileNameDisplay.innerText = "";
                        
                        // REÎNCĂRCĂM detaliile pentru a vedea noul articol în listă
                        await openConferenceDetails(currentConferenceId, true);
                    } else {
                        const errData = await response.json();
                        alert("Eroare la upload: " + (errData.message || "Server error"));
                    }
                } catch (error) {
                    console.error("Eroare rețea la upload:", error);
                    alert("Eroare de conexiune la server.");
                }
            }
        });
    }

    // Pentru a functiona butonul de back
    window.addEventListener('popstate', function(event) {
    if (!window.currentUser) return; // Nu facem nimic dacă nu suntem logați

    if (event.state) {
        const state = event.state;
        if (state.view === 'conference-details') {
            openConferenceDetails(state.id, true); // Parametrul true oprește bucla de istoric
        } else if (state.view === 'dashboard') {
            showView('view-dashboard', true);
        } else if (state.view === 'create-conf') {
            showView('view-create-conf', true);
        }
    } else {
        showView('view-dashboard', true);
    }
});
}

// Funcție pentru încărcarea reviewerilor în listă (Frontend)
async function loadReviewersForSelection() {
    const listElement = document.getElementById('reviewer-selection-list');
    if (!listElement) return;

    listElement.innerHTML = "<p>Se încarcă lista...</p>";

    try {
        const response = await fetch(`${API_URL}/utilizatori`);
        const utilizatori = await response.json();
        
        // Filtrare pentru a afișa doar cei cu rolul REVIEWER
        const revieweri = utilizatori.filter(u => u.rol === 'REVIEWER');
        
        listElement.innerHTML = ""; 

        if (revieweri.length === 0) {
            listElement.innerHTML = "<p>Nu există revieweri înregistrați.</p>";
            return;
        }

        revieweri.forEach(rev => {
            const item = document.createElement('label');
            item.className = "reviewer-item"; // Poți adăuga stil în CSS
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.gap = "10px";
            item.style.marginBottom = "8px";
            
            item.innerHTML = `
                <input type="checkbox" name="reviewer-checkbox" value="${rev.id}">
                <span>${rev.numeUtilizator}</span>
            `;
            listElement.appendChild(item);
        });
    } catch (err) {
        console.error("Eroare la încărcarea reviewerilor:", err);
        listElement.innerHTML = "<p>Eroare la încărcarea datelor.</p>";
    }
}

async function openConferenceDetails(id, skipHistory = false) {
    if (!id) return;
    currentConferenceId = id; 
    
    try {
        const response = await fetch(`${API_URL}/conferinte/${id}`);
        const conf = await response.json();
        
        console.log("Date primite de la server:", conf); // Verifică mereu asta în F12!

        // 1. Populare date (asigură-te că numele corespund cu DB-ul tău)
        // Folosim titluConf pentru că așa e definit în modelul tău din backend
        document.getElementById('display-conf-title').innerText = conf.titluConf || "Titlu indisponibil";
        document.getElementById('display-conf-desc').innerText = conf.descriere || "Fără descriere";
        document.getElementById('display-conf-date').innerText = conf.data || "Data nesetată";
        document.getElementById('display-conf-time').innerText = conf.ora || "N/A";

        // 2. Afișare Revieweri (Folosim alias-ul 'Revieweri' din Backend)
        const containerRev = document.getElementById('display-conf-reviewers');
        if (containerRev) {
            const listaRevieweri = conf.Revieweri || [];
            containerRev.innerHTML = listaRevieweri.map(r => 
                `<span class="role-badge" style="background:#e0f2fe; margin-right:5px; padding:2px 8px; border-radius:10px;">👤 ${r.numeUtilizator}</span>`
            ).join('') || '<p style="font-size:0.8rem; color:#64748b;">Niciun reviewer alocat.</p>';
        }

        // 3. Afișare Articole Înscrise
        const articlesContainer = document.getElementById('articles-list-container');
        if (articlesContainer) {
            const articole = conf.Articole || []; 
            
            if (articole.length > 0) {
                articlesContainer.innerHTML = articole.map(art => `
                    <div class="article-card">
                        <div class="article-info">
                            <h4>${art.titluArticol || "Fără titlu"}</h4>
                            <p>
                                <span>👤 ${art.Autor ? art.Autor.numeUtilizator : "Autor Necunoscut"}</span> | 
                                <span>📅 ${new Date(art.createdAt).toLocaleDateString()}</span>
                            </p>
                        </div>
                        
                        <button onclick="downloadArticle(${art.id})" class="btn-download">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0L16.5 12M12 16.5V3" />
                            </svg>
                            Descarcă
                        </button>
                    </div>
                `).join('');
            } else {
                articlesContainer.innerHTML = `<p style="color: #64748b; font-style: italic; padding: 20px; text-align: center;">Nu au fost încărcate articole pentru această conferință.</p>`;
            }
        }

        gestioneazaButoaneActiuni(conf);
        showView('view-conference-details', true); 

        if (!skipHistory) {
            history.pushState({ view: 'conference-details', id: id }, "", `#conference-${id}`);
        }
    } catch (err) {
        console.error("Eroare la încărcarea detaliilor:", err);
        alert("Nu s-au putut încărca detaliile conferinței.");
    }
}

// Funcție ajutătoare pentru a curăța codul principal
function gestioneazaButoaneActiuni(conf) {
    const authorActions = document.getElementById('author-actions');
    if (authorActions && window.currentUser) {
        const isAutor = window.currentUser.rol.toUpperCase() === 'AUTOR';
        authorActions.classList.toggle('hidden', !isAutor);
    }

    const btnDelete = document.getElementById('btn-delete-conf');
    if (btnDelete && window.currentUser) {
        const isOwner = window.currentUser.rol.toUpperCase() === 'ORGANIZATOR' && conf.organizatorId == window.currentUser.id;
        btnDelete.classList.toggle('hidden', !isOwner);
        if (isOwner) btnDelete.onclick = () => deleteConference(conf.id);
    }
}

// Adaugă și această funcție mică pentru a gestiona descărcarea (va deschide PDF-ul în tab nou)
function downloadArticle(id) {
    window.open(`${API_URL}/articole/download/${id}`, '_blank');
}

async function deleteConference(id) {
    const confirmare = confirm("Ești sigur că vrei să ștergi această conferință? Această acțiune este ireversibilă.");
    
    if (!confirmare) return;

    try {
        const response = await fetch(`${API_URL}/conferinte/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Conferința a fost ștearsă cu succes.");
            showView('view-dashboard'); // Ne întoarcem la listă
            loadConferences(); // Reîncărcăm lista de conferințe
        } else {
            const error = await response.json();
            alert("Eroare la ștergere: " + error.message);
        }
    } catch (err) {
        console.error("Eroare rețea la ștergere:", err);
    }
}


document.addEventListener('DOMContentLoaded', application);