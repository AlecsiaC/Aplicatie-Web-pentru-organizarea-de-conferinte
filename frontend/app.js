// Stabilirea URL-ului de baza pentru API in functie de mediul de rulare (local sau server)

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : 'https://aplicatie-web-pentru-organizarea-de.onrender.com/api';
let currentConferenceId = null; // Salvam ID-ul conferintei curente


// Functie pentru Inregistrare (POST /api/utilizatori)
async function registerUser(event) {
    event.preventDefault(); // Opreste reincarcarea paginii

    const nume = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const parola = document.getElementById('reg-pass').value;
    const rol = document.getElementById('reg-role').value;

    // Regula validare parola: minim 8 caractere, o litera si o cifra
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!passwordRegex.test(parola)) {
        alert("Parola trebuie să aibă minim 8 caractere, o literă și o cifră!");
        return; 
    }
   
    try {
        // Trimite datele de inregistrare catre server
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
// Functie pentru Login 
async function loginUser(event) {
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
            // Salvare sesiune in browser si navigare catre dashboard
            localStorage.setItem('loggedUser', JSON.stringify(userFound));
            
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
// pasi de dupa login
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
    
    // logica pentru prima afisare
    const views = document.querySelectorAll('.content-view');
    views.forEach(v => v.classList.add('hidden'));
    document.getElementById('view-dashboard').classList.remove('hidden');
    
    loadConferences();
}
// afisare conferinte (GET /api/conferinte)
async function loadConferences() {
    const listElement = document.getElementById('conference-list');
    listElement.innerHTML = "<p>Se încarcă conferințele...</p>";

    try {
        const response = await fetch(`${API_URL}/conferinte`);
        let conferinte = await response.json();

        console.log("Toate conferintele primite:", conferinte);
        console.log("Userul curent:", window.currentUser);

        // FILTRARE PENTRU REVIEWER
        if (window.currentUser && window.currentUser.rol === 'REVIEWER') {
            conferinte = conferinte.filter(conf => {
                return conf.Revieweri && conf.Revieweri.some(rev => rev.id === window.currentUser.id);
            });
        }

        listElement.innerHTML = ""; 

        if (conferinte.length === 0) {
            listElement.innerHTML = "<p>Nu ești alocat la nicio conferință momentan.</p>";
            return;
        }

        // Generare carduri pentru fiecare conferinta
        conferinte.forEach(conf => {
            // --- LOGICA DE TIMP PENTRU DASHBOARD ---
            const acum = new Date();
            const dataLimita = new Date(`${conf.data}T${conf.ora}`);
            const esteFinalizata = acum > dataLimita;
            
            //  textul și culoarea statusului
            const statusText = esteFinalizata ? "FINALIZATA" : (conf.status || "PLANIFICATA");
            const statusBg = esteFinalizata ? "#fee2e2" : "#ecfdf5";
            const statusColor = esteFinalizata ? "#ef4444" : "#059669";

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cursor = 'pointer';
            card.onclick = () => openConferenceDetails(conf.id);

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3 style="margin: 0;">${conf.titluConf}</h3>
                    <span class="status-tag" style="background: ${statusBg}; color: ${statusColor}; padding: 2px 10px; border-radius: 15px; font-size: 0.75rem; font-weight: bold; border: 1px solid ${statusColor};">
                        ${statusText}
                    </span>
                </div>
                <p style="color: #64748b; font-size: 0.9rem; margin: 10px 0;">${conf.descriere}</p>
                <div class="card-footer" style="display: flex; gap: 15px; color: #94a3b8; font-size: 0.85rem;">
                    <span>📅 ${conf.data}</span>
                    <span>🕒 ${conf.ora}</span>
                </div>
            `;
            listElement.appendChild(card);
        });
    } catch (err) {
        console.error("Eroare la încărcare:", err);
        listElement.innerHTML = "<p>Eroare la încărcarea datelor.</p>";
    }
}
// schimbarea între Login si Signup (in cadrul sectiunii de auth)
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
// functie principala pentru navigare
function showPage(pageId) {
    // Ascundem toate paginile/sectiunile principale
    document.querySelectorAll('.page').forEach(section => {
        section.classList.add('hidden');
    });

    // Afisam doar pagina ceruta
    document.getElementById(pageId).classList.remove('hidden');
}

// Sterge sesiunea si revine la ecranul de login
function logout() {
    localStorage.removeItem('loggedUser');
    window.currentUser = null;

    showPage('auth-section');
}
// Funcție pentru a schimba între Dashboard și Formularul de Creare
function showView(viewId, skipHistory = false) {
    const views = document.querySelectorAll('.content-view');
    views.forEach(view => view.classList.add('hidden'));

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    const welcomeBanner = document.getElementById('welcome-section');
    if (welcomeBanner) {
        if (viewId === 'view-dashboard') {
            welcomeBanner.style.display = 'block';
        } else {
            welcomeBanner.style.display = 'none';
        }
    }

    // Salvare stare in history pentru butonul Back al browserului
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
// Incarca lista de revieweri disponibili pentru a fi selectati la crearea unei conferinte
async function loadReviewersForSelection() {
    const container = document.getElementById('reviewer-selection-list');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/utilizatori/revieweri`);
        const revieweri = await response.json();

        if (revieweri.length === 0) {
            container.innerHTML = "<p style='color: #64748b;'>Nu există revieweri disponibili.</p>";
            return;
        }

        // lista de checkbox-uri
        container.innerHTML = revieweri.map(rev => `
            <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #f1f5f9; border-radius: 8px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <input type="checkbox" name="reviewerIds" value="${rev.id}" style="width: 18px; height: 18px; cursor: pointer;">
                <span style="font-size: 0.95rem; color: #334155;">👤 ${rev.numeUtilizator}</span>
            </label>
        `).join('');
        
    } catch (err) {
        console.error("Eroare la încărcarea reviewerilor:", err);
        container.innerHTML = "<p style='color: #ef4444;'>Eroare la încărcarea listei de revieweri.</p>";
    }
}

// Seteaza data minima a input-ului la ziua curenta (nu poti crea conferinte in trecut)
function setMinDateForConference() {
    const dateInput = document.getElementById('conf-date');
    if (dateInput) {
        // data curenta
        const today = new Date();
        
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedToday = yyyy + '-' + mm + '-' + dd;
        
        dateInput.setAttribute('min', formattedToday);
    }
}

// trimiterea conferintei noi la Backend (POST /api/conferinte)
async function handleCreateConference(event) {
    event.preventDefault();

    const selectedCheckboxes = document.querySelectorAll('input[name="reviewerIds"]:checked');
    const reviewerIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));

    console.log("Revieweri selectați pentru trimitere:", reviewerIds);

    const payload = {
        titluConf: document.getElementById('conf-title').value,
        descriere: document.getElementById('conf-desc').value,
        data: document.getElementById('conf-date').value,
        ora: document.getElementById('conf-time').value,
        status: "PLANIFICATA",
        organizatorId: window.currentUser.id,
        reviewerIds: reviewerIds
    };

    const method = editingConferenceId ? 'PUT' : 'POST';
    const url = editingConferenceId ? `${API_URL}/conferinte/${editingConferenceId}` : `${API_URL}/conferinte`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(editingConferenceId ? "Conferință actualizată!" : "Conferință creată!");
            resetConferenceForm();
            showView('view-dashboard');
            loadConferences();
        } else {
            const err = await response.json();
            alert("Eroare: " + err.message);
        }
    } catch (err) { 
        console.error("Eroare la salvare:", err); 
    }
}

// Reseteaza formularul de conferinta la valorile initiale
function resetConferenceForm() {
    editingConferenceId = null;
    document.getElementById('form-create-conference').reset();
    document.querySelector('#view-create-conf h2').innerText = "Creează o Conferință Nouă";
    document.querySelector('#form-create-conference button[type="submit"]').innerText = "Salvează Conferința";
}

// Functie pentru incarcarea reviewerilor in lista (Frontend)
async function openConferenceDetails(id, skipHistory = false) {
    if (!id) return;
    currentConferenceId = id; 
    
    try {
        const response = await fetch(`${API_URL}/conferinte/${id}`);
        const conf = await response.json();
        
        const acum = new Date();
        const dataLimita = new Date(`${conf.data}T${conf.ora}`);
        
        console.log("Acum:", acum);
        console.log("Limita:", dataLimita);
        
        const esteFinalizata = acum > dataLimita;

        // Populare date 
        document.getElementById('display-conf-title').innerText = conf.titluConf || "Titlu indisponibil";
        document.getElementById('display-conf-desc').innerText = conf.descriere || "Fără descriere";
        document.getElementById('display-conf-date').innerText = conf.data || "Data nesetată";
        document.getElementById('display-conf-time').innerText = conf.ora || "N/A";
        
        // Afisare revieweri si articole folosind map()
        const statusElement = document.getElementById('display-conf-status');
        if (statusElement) {
            if (esteFinalizata) {
                statusElement.innerText = "FINALIZATA";
                statusElement.style.background = "#fee2e2"; 
                statusElement.style.color = "#ef4444";
            } else {
                statusElement.innerText = conf.status || "PLANIFICATA";
                statusElement.style.background = "#ecfdf5";
                statusElement.style.color = "#059669";
            }
        }

        // Logica complexa pentru afisarea articolelor, butoanelor de feedback si evaluare
        const authorActionsDiv = document.getElementById('author-actions');
        if (authorActionsDiv) {
            const isAutor = window.currentUser && window.currentUser.rol.toUpperCase() === 'AUTOR';
            
            if (isAutor && !esteFinalizata) {
                authorActionsDiv.classList.remove('hidden');
                authorActionsDiv.style.display = 'block';
            } else {
                authorActionsDiv.classList.add('hidden');
                authorActionsDiv.style.display = 'none';
            }
        }
        
        // afisare Revieweri
        const containerRev = document.getElementById('display-conf-reviewers');
        if (containerRev) {
            const listaRevieweri = conf.Revieweri || [];
            containerRev.innerHTML = listaRevieweri.map(r => 
                `<span class="role-badge" style="background:#5193ad; margin-right:5px; padding:2px 8px; border-radius:10px;">👤 ${r.numeUtilizator}</span>`
            ).join('') || '<p style="font-size:0.8rem; color:#64748b;">Niciun reviewer alocat.</p>';
        }
        
        // afisare Articole Inscrise
        const articlesContainer = document.getElementById('articles-list-container');
        if (articlesContainer) {
            const articole = conf.Articole || [];

            if (articole.length > 0) {
                articlesContainer.innerHTML = articole.map(art => {
                    const isAssignedToMe = window.currentUser.rol === 'REVIEWER' &&
                        art.Revieweri && art.Revieweri.some(r => r.id === window.currentUser.id);

                    let reviewerActions = "";
                    if (isAssignedToMe && !esteFinalizata) {
                        reviewerActions = `
                            <div class="reviewer-controls" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start;">
                                <button onclick="submitEvaluation(${art.id}, 'ACCEPTAT')" class="cta-button small" style="background: #10b981; margin:0;">✅ Acceptă</button>
                                <button onclick="submitEvaluation(${art.id}, 'NECESITA_MODIFICARI')" class="cta-button small" style="background: #f59e0b; margin:0;">📝 Modificări</button>
                                <button onclick="submitEvaluation(${art.id}, 'RESPINS')" class="cta-button small" style="background: #ef4444; margin:0;">❌ Respinge</button>
                            </div>
                        `;
                    } else if (isAssignedToMe && esteFinalizata) {
                        reviewerActions = `<p style="color: #ef4444; font-size: 0.8rem; font-style: italic; margin-top:10px;">⌛ Sesiunea de evaluare s-a încheiat.</p>`;
                    }

                    const isAuthor = window.currentUser.id === art.autorId;
                    const isOrganizer = window.currentUser.rol === 'ORGANIZATOR';
                    const canSeeFeedback = isAuthor || isOrganizer;
                    let authorFeedback = "";
                    
                    if (canSeeFeedback && art.Revieweri) {
                        const needsChanges = isAuthor && art.status === 'NECESITA_MODIFICARI' && !esteFinalizata;
                        
                        const verdictColors = {
                            'ACCEPTAT': { bg: '#dcfce7', text: '#10b981' }, 
                            'RESPINS': { bg: '#fee2e2', text: '#ef4444' },  
                            'NECESITA_MODIFICARI': { bg: '#fef3c7', text: '#f59e0b' }, 
                            'default': { bg: '#f1f5f9', text: '#64748b' }    
                        };
                       
                        authorFeedback = `
                            <div class="feedback-container" style="margin-top: 15px; padding: 12px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <h5 style="margin: 0; color: #1e293b; font-size: 0.9rem;">📢 Feedback de la Revieweri:</h5>
                                    ${needsChanges ? `
                                        <button onclick="triggerReupload(${art.id})" class="cta-button small" style="background: #3b82f6; margin: 0; padding: 5px 10px;">
                                            🔄 Reîncărcă
                                        </button>
                                    ` : ''}
                                </div>
                                ${art.Revieweri.map(rev => {
                                    const rData = rev.review || {};
                                    const colors = verdictColors[rData.verdict] || verdictColors['default'];
                                    return `
                                        <div style="margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 5px;">
                                            <p style="margin: 0; font-size: 0.85rem;">
                                                <strong>${rev.numeUtilizator}:</strong> 
                                                <span class="status-tag" style="font-size: 0.7rem; background: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.text}; padding: 2px 8px; border-radius: 4px;">
                                                    ${rData.verdict || 'În așteptare'}
                                                </span>
                                            </p>
                                            <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #475569; font-style: italic;">
                                                "${rData.continut || 'Așteaptă evaluarea.'}"
                                            </p>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `;
                    }

                    const statusColors = { 
                        'ACCEPTAT': '#10b981', 
                        'RESPINS': '#ef4444', 
                        'NECESITA_MODIFICARI': '#f59e0b',
                        'IN_REEVALUARE': '#6366f1', 
                        'PLANIFICATA': '#64748b' 
                    };         

                    const statusTextArticol = art.status || 'PLANIFICATA';
                    const currentStatusColor = statusColors[statusTextArticol] || '#64748b';

                    return `
                        <div class="article-card" style="flex-direction: column; align-items: flex-start; padding: 20px; border-left: 6px solid ${currentStatusColor};">
                            <div style="display: flex; justify-content: space-between; width: 100%; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 10px;">
                                <div class="article-info">
                                    <h4 style="font-size: 1.1rem; margin: 0;">${art.titluArticol || "Fără titlu"}</h4>
                                    <p style="margin: 5px 0 0 0;">👤 Autor: ${art.Autor ? art.Autor.numeUtilizator : "Necunoscut"}</p>
                                </div>
                                <div style="text-align: right;">
                                    <span class="status-tag" style="background: ${currentStatusColor}22; color: ${currentStatusColor}; border: 1px solid ${currentStatusColor}; display: block; margin-bottom: 10px;">
                                        ${statusTextArticol}
                                    </span>
                                    <button onclick="downloadArticle(${art.id})" class="btn-download">Descarcă PDF</button>
                                </div>
                            </div>
                            <p style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
                                🔍 Revieweri alocați: ${art.Revieweri ? art.Revieweri.map(r => r.numeUtilizator).join(', ') : 'În curs...'}
                            </p>
                            ${reviewerActions}
                            ${authorFeedback}
                        </div>
                    `;
                }).join('');
            } else {
                articlesContainer.innerHTML = `<p style="color: #64748b; text-align: center;">Nu au fost încărcate articole.</p>`;
            }
        }
        
        gestioneazaButoaneActiuni(conf);
        showView('view-conference-details', true); 
        if (!skipHistory) history.pushState({ view: 'conference-details', id: id }, "", `#conference-${id}`);
    } catch (err) {
        console.error("Eroare:", err);
    }
}

// functie pentru a declansa selectorul de fisiere pentru un anumit articol
function triggerReupload(articolId) {
    const fileInput = document.getElementById('article-file-input');
    fileInput.setAttribute('data-update-id', articolId);
    fileInput.click();
}

// Trimite evaluarea (verdictul) unui reviewer pentru un articol
async function submitEvaluation(articolId, status) {
    const comentariu = prompt(`Introdu feedback-ul pentru verdictul ${status}:`);
    
    if (comentariu === null) return; 
    if (comentariu.trim() === "") {
        alert("Feedback-ul este obligatoriu!");
        return;
    }

    const payload = {
        articolId: articolId,
        reviewerId: window.currentUser.id,
        verdict: status,     
        continut: comentariu
    };

    try {
        const response = await fetch(`${API_URL}/reviews`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(`Verdictul [${status}] a fost salvat!`);
            await openConferenceDetails(currentConferenceId, true);
        } else {
            const error = await response.json();
            alert("Eroare: " + error.message);
        }
    } catch (err) {
        console.error("Eroare rețea:", err);
        alert("Nu s-a putut contacta serverul.");
    }
}

// Gestioneaza vizibilitatea butoanelor de stergere si editare (doar pentru organizatorul proprietar)
function gestioneazaButoaneActiuni(conf) {
    const isOwner = window.currentUser.rol.toUpperCase() === 'ORGANIZATOR' && conf.organizatorId == window.currentUser.id;

    const btnDelete = document.getElementById('btn-delete-conf');
    if (btnDelete) {
        btnDelete.classList.toggle('hidden', !isOwner);
        if (isOwner) btnDelete.onclick = () => deleteConference(conf.id);
    }

    let btnEdit = document.getElementById('btn-edit-conf');
    if (!btnEdit) {
        btnEdit = document.createElement('button');
        btnEdit.id = 'btn-edit-conf';
        btnEdit.className = 'modern-back-btn';
        btnEdit.style.marginLeft = "10px";
        btnEdit.innerHTML = "✏️ Editează Conferința";
        btnDelete.parentNode.insertBefore(btnEdit, btnDelete);
    }

    btnEdit.classList.toggle('hidden', !isOwner);
    if (isOwner) btnEdit.onclick = () => prepareEditConference(conf);
}

// destionare download ( PDF se deschide in tab nou )
function downloadArticle(id) {
    window.open(`${API_URL}/articole/download/${id}`, '_blank');
}

// Sterge o conferinta din baza de date
async function deleteConference(id) {
    const confirmare = confirm("Ești sigur că vrei să ștergi această conferință? Această acțiune este ireversibilă.");
    
    if (!confirmare) return;
    
    try {
        const response = await fetch(`${API_URL}/conferinte/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert("Conferința a fost ștearsă cu succes.");
            showView('view-dashboard'); 
            loadConferences();
        } else {
            const error = await response.json();
            alert("Eroare la ștergere: " + error.message);
        }
    } catch (err) {
        console.error("Eroare rețea la ștergere:", err);
    }
}

let editingConferenceId = null; 

// Pregateste formularul de creare pentru editarea unei conferinte existente
async function prepareEditConference(conf) {
    editingConferenceId = conf.id;

    showView('view-create-conf');
    
    document.querySelector('#view-create-conf h2').innerText = "Editează Conferința";
    document.querySelector('#form-create-conference button[type="submit"]').innerText = "Actualizează Conferința";
    
    document.getElementById('conf-title').value = conf.titluConf;
    document.getElementById('conf-desc').value = conf.descriere;
    document.getElementById('conf-date').value = conf.data;
    document.getElementById('conf-time').value = conf.ora;
    
    await loadReviewersForSelection(); 
    const assignedIds = conf.Revieweri ? conf.Revieweri.map(r => r.id) : [];
    
    setTimeout(() => {
        const checkboxes = document.querySelectorAll('input[name="reviewerIds"]');
        console.log("Căutăm să bifăm ID-urile:", assignedIds);
        
        checkboxes.forEach(cb => {
            if (assignedIds.includes(parseInt(cb.value))) {
                cb.checked = true;
            }
        });
    }, 600);
}

// Functia principala de initializare a aplicatiei
function application(){
    console.log("Aplicația a fost inițializată!");
    setMinDateForConference();

    // Restaurare sesiune daca exista in localStorage
    const savedUser = localStorage.getItem('loggedUser');

    if (savedUser) {
        const user = JSON.parse(savedUser); 
        console.log("Sesiune restaurată pentru:", user.numeUtilizator);
        completeLogin(user);
    }

    // Atasare evenimente de submit pentru formulare
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

    // Gestionare incarcare fisiere (Articole noi sau actualizari)
    const fileInput = document.getElementById('article-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', async function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                const updateId = this.getAttribute('data-update-id');
                
                const formData = new FormData();
                formData.append('fisier', file);
                formData.append('titluArticol', file.name);

                let url = `${API_URL}/articole`;
                let method = 'POST';

                if (updateId) {
                    url = `${API_URL}/articole/${updateId}`;
                    method = 'PUT';
                } else {
                    formData.append('autorId', window.currentUser.id);
                    formData.append('conferintaId', currentConferenceId);
                    formData.append('rezumat', 'Versiune inițială');
                }

                try {
                    const response = await fetch(url, {
                        method: method,
                        body: formData
                    });

                    if (response.ok) {
                        alert(updateId ? "Articol actualizat cu succes!" : "Articol încărcat cu succes!");
                        fileInput.value = ""; 
                        fileInput.removeAttribute('data-update-id'); 
                        await openConferenceDetails(currentConferenceId, true);
                    } else {
                        const errData = await response.json();
                        alert("Eroare server (400): " + (errData.message || "Date invalide"));
                    }
                } catch (error) {
                    console.error("Eroare rețea:", error);
                    alert("Nu s-a putut contacta serverul.");
                }
            }
        });
    }

// Gestionare buton "Back" browser
window.addEventListener('popstate', function(event) {
    if (!window.currentUser) return; // daca nu esti logat
    
    if (event.state) {
        const state = event.state;
        if (state.view === 'conference-details') {
            openConferenceDetails(state.id, true); 
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
// Porneste aplicatia cand documentul este incarcat
document.addEventListener('DOMContentLoaded', application);