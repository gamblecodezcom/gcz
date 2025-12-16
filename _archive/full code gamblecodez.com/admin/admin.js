const ADMIN_PASSWORD = 'GambleCodez2024!';
let isAdmin = false;
let RAFFLES = []; // Store in-memory or connect to backend

// Admin authentication
function showAdminLogin() {
    const password = prompt('Enter admin password:');
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        localStorage.setItem('admin_session', 'true');
        alert('✅ Admin access granted!');
        loadAdminPanel();
    } else if (password) {
        alert('❌ Incorrect password');
    }
}

// Check existing session
function checkAdminSession() {
    if (localStorage.getItem('admin_session') === 'true') {
        isAdmin = true;
        loadAdminPanel();
    }
}

// Logout admin
function logoutAdmin() {
    isAdmin = false;
    localStorage.removeItem('admin_session');
    window.location.reload();
}

// Load complete admin panel
function loadAdminPanel() {
    document.body.innerHTML = `
        <main class="admin-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h1 style="font-family: 'Bebas Neue', sans-serif; font-size: 48px;">🔐 Admin Dashboard</h1>
                <button class="btn-secondary" onclick="logoutAdmin()">Logout</button>
            </div>
            
            <!-- RAFFLE MANAGEMENT -->
            <div class="admin-section" style="margin-bottom: 40px;">
                <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 32px; margin-bottom: 20px;">🎟️ Raffle Management</h2>
                <button class="cta-btn" onclick="showCreateRaffleForm()" style="margin-bottom: 20px;">+ Create New Raffle</button>
                <div id="createRaffleForm" style="display:none; margin-bottom: 30px;">
                    <form onsubmit="createRaffle(event)" class="card">
                        <h3 style="margin-bottom: 20px;">New Raffle</h3>
                        <div class="form-group">
                            <label class="form-label">Title *</label>
                            <input type="text" name="title" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Prize *</label>
                            <input type="text" name="prize" class="form-control" placeholder="e.g. $500 Cash" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Number of Winners *</label>
                            <input type="number" name="winners" class="form-control" min="1" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description *</label>
                            <textarea name="description" class="form-control" rows="3" required></textarea>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" class="cta-btn">Create Raffle</button>
                            <button type="button" class="btn-secondary" onclick="hideCreateRaffleForm()">Cancel</button>
                        </div>
                    </form>
                </div>
                <div id="adminRaffleList"></div>
            </div>
            
            <!-- SITE MANAGEMENT -->
            <div class="admin-section" style="margin-bottom: 40px;">
                <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 32px; margin-bottom: 20px;">🎰 Site Management</h2>
                <button class="cta-btn" onclick="showAddSiteForm()" style="margin-bottom: 20px;">+ Add New Site</button>
                <div id="addSiteForm" style="display:none; margin-bottom: 30px;">
                    <form onsubmit="addSite(event)" class="card">
                        <h3 style="margin-bottom: 20px;">Add Site</h3>
                        <div class="form-group">
                            <label class="form-label">Name *</label>
                            <input type="text" name="name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Affiliate URL *</label>
                            <input type="url" name="affiliate_url" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Priority *</label>
                            <input type="number" name="priority" class="form-control" min="0" max="100" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category (comma-separated) *</label>
                            <input type="text" name="category" class="form-control" placeholder="US,SWEEPS,TOP_PICK" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Bonus Code</label>
                            <input type="text" name="bonus_code" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description *</label>
                            <textarea name="bonus_description" class="form-control" rows="3" required></textarea>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" class="cta-btn">Add Site</button>
                            <button type="button" class="btn-secondary" onclick="hideAddSiteForm()">Cancel</button>
                        </div>
                    </form>
                </div>
                <div id="adminSiteList"></div>
            </div>
            
            <!-- NEWSLETTER SUBSCRIBERS -->
            <div class="admin-section">
                <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 32px; margin-bottom: 20px;">📧 Newsletter Subscribers</h2>
                <div id="subscriberList"></div>
            </div>
        </main>
    `;
    renderAdminRaffles();
    renderAdminSites();
    renderSubscribers();
}

// Forms show/hide functions
function showCreateRaffleForm() { document.getElementById('createRaffleForm').style.display = 'block'; }
function hideCreateRaffleForm() { document.getElementById('createRaffleForm').style.display = 'none'; }
function showAddSiteForm() { document.getElementById('addSiteForm').style.display = 'block'; }
function hideAddSiteForm() { document.getElementById('addSiteForm').style.display = 'none'; }

// Raffle CRUD (in-memory, for demo only; replace with backend for real use!)
function createRaffle(event) {
    event.preventDefault();
    const form = event.target;
    const raffle = {
        id: 'raffle_' + Date.now(),
        title: form.title.value,
        prize: form.prize.value,
        winners: parseInt(form.winners.value),
        description: form.description.value,
        entries: [],
        status: 'active'
    };
    RAFFLES.push(raffle);
    alert('✅ Raffle created successfully!');
    form.reset();
    hideCreateRaffleForm();
    renderAdminRaffles();
}

function renderAdminRaffles() {
    const list = document.getElementById('adminRaffleList');
    if (!list) return;
    if (RAFFLES.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted);">No raffles created yet.</p>';
        return;
    }
    list.innerHTML = RAFFLES.map(raffle => `
        <div class="card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="color: var(--primary);">${raffle.title}</h3>
                    <p style="font-size: 18px; color: var(--success); margin: 10px 0;">Prize: ${raffle.prize}</p>
                    <p style="font-size: 14px; color: var(--text-muted);">${raffle.description}</p>
                    <p style="font-size: 13px; margin-top: 10px;">Winners: ${raffle.winners} | Status: ${raffle.status}</p>
                    <p style="font-size: 13px; color: var(--warning);">Entries: ${raffle.entries ? raffle.entries.length : 0}</p>
                </div>
                <span style="font-size: 32px;">🎟️</span>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                <button class="btn-secondary" onclick="drawRaffleWinners('${raffle.id}')">🎲 Draw Winners</button>
                <button class="btn-secondary" onclick="deleteRaffle('${raffle.id}')" style="background:rgba(255,77,109,0.2);">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function drawRaffleWinners(raffleId) {
    const raffle = RAFFLES.find(r => r.id === raffleId);
    if (!raffle) return;
    if (!raffle.entries || raffle.entries.length === 0) {
        alert('❌ No entries for this raffle yet!');
        return;
    }
    const shuffled = [...raffle.entries].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, Math.min(raffle.winners, shuffled.length));
    raffle.status = 'completed';
    raffle.winnersList = winners;
    alert('🎉 Winners drawn!

' + winners.map((w, i) => `${i+1}. ${w.email}`).join('
'));
    renderAdminRaffles();
}

function deleteRaffle(raffleId) {
    if (confirm('Delete this raffle permanently?')) {
        RAFFLES = RAFFLES.filter(r => r.id !== raffleId);
        alert('✅ Raffle deleted');
        renderAdminRaffles();
    }
}

// Demo: static affiliates/newsletter arrays. In production, load from backend/db.
let affiliates = [];
function addSite(event) {
    event.preventDefault();
    const form = event.target;
    const site = {
        name: form.name.value,
        affiliate_url: form.affiliate_url.value,
        priority: parseInt(form.priority.value),
        category: form.category.value,
        status: 'approved',
        level: 3,
        date_added: new Date().toISOString().split('T')[0],
        bonus_code: form.bonus_code.value,
        bonus_description: form.bonus_description.value
    };
    affiliates.push(site);
    alert('✅ Site added successfully!');
    form.reset();
    hideAddSiteForm();
    renderAdminSites();
}

function renderAdminSites() {
    const list = document.getElementById('adminSiteList');
    if (!list) return;
    const approved = affiliates.filter(s => s.status === 'approved').slice(0, 20);
    const blacklisted = affiliates.filter(s => s.status === 'blacklisted');
    list.innerHTML = `
        <h3 style="margin: 20px 0;">Approved Sites (Showing first 20)</h3>
        ${approved.map(site => createAdminSiteCard(site)).join('')}
        <h3 style="margin: 30px 0 20px; color: var(--danger);">Blacklisted Sites</h3>
        ${blacklisted.map(site => createAdminSiteCard(site)).join('')}
    `;
}

function createAdminSiteCard(site) {
    return `
        <div class="card" style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="color: ${site.status === 'blacklisted' ? 'var(--danger)' : 'var(--primary)'};">${site.name}</h4>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 5px 0;">
                        Status: ${site.status} | Priority: ${site.priority} | Added: ${site.date_added}
                    </p>
                    <p style="font-size: 11px; color: var(--text-muted);">${site.category}</p>
                    <p style="font-size: 12px; margin-top: 8px;">${site.bonus_description}</p>
                </div>
            </div>
        </div>`;
}

function renderSubscribers() {
    const list = document.getElementById('subscriberList');
    if (!list) return;
    // Demo: newsletters array; in production, load from server/db
    let newsletters = [];
    list.innerHTML = newsletters.length === 0
        ? '<div style="color:var(--danger);margin:2em;">No newsletter subscribers yet.</div>'
        : newsletters.map(sub =>
            `<div class="card" style="margin-bottom:12px;">
                <strong>${sub.email}</strong> — ${sub.jurisdiction} — Telegram: ${sub.telegram}
            </div>`
          ).join('');
}

// Initialize admin if directly loaded
window.addEventListener('DOMContentLoaded', checkAdminSession);