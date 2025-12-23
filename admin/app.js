// GambleCodez God-Mode Admin Panel
// High-contrast, large text, dyslexia-friendly

const API_BASE = '/api';

// State
const state = {
  isAuthenticated: false,
  currentPage: 'dashboard',
  data: {
    affiliates: [],
    ads: [],
    raffles: [],
    newsletter: [],
    contact: [],
    topPick: null,
    stats: null
  }
};

// Initialize
async function init() {
  checkAuth();
  setupEventListeners();
  if (state.isAuthenticated) {
    await loadDashboard();
  } else {
    renderLogin();
  }
}

// Check authentication
async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/session`);
    const data = await res.json();
    state.isAuthenticated = data.authenticated;
  } catch (error) {
    console.error('Auth check failed:', error);
    state.isAuthenticated = false;
  }
}

// Setup event listeners
function setupEventListeners() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-action]')) {
      const action = e.target.getAttribute('data-action');
      handleAction(action, e.target);
    }
    if (e.target.matches('[data-page]')) {
      const page = e.target.getAttribute('data-page');
      navigate(page);
    }
  });
}

// Handle actions
async function handleAction(action, element) {
  switch (action) {
    case 'login':
      await handleLogin();
      break;
    case 'logout':
      await handleLogout();
      break;
    case 'save-top-pick':
      await saveTopPick();
      break;
    case 'save-ad':
      await saveAd(element.dataset.id);
      break;
    case 'delete-ad':
      await deleteAd(element.dataset.id);
      break;
    case 'save-raffle':
      await saveRaffle(element.dataset.id);
      break;
    case 'pick-winner':
      await pickWinner(element.dataset.id);
      break;
    case 'update-contact-status':
      await updateContactStatus(element.dataset.id, element.dataset.status);
      break;
    case 'export-newsletter-csv':
      await exportNewsletterCSV();
      break;
    case 'run-ripper':
      await runRipper();
      break;
    case 'ai-review':
      await triggerAIReview(element.dataset.id);
      break;
  }
}

// Navigation
async function navigate(page) {
  state.currentPage = page;
  updateActiveNav();
  
  switch (page) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'affiliates':
      await loadAffiliates();
      break;
    case 'ads':
      await loadAds();
      break;
    case 'raffles':
      await loadRaffles();
      break;
    case 'newsletter':
      await loadNewsletter();
      break;
    case 'contact':
      await loadContact();
      break;
    case 'top-pick':
      await loadTopPick();
      break;
    case 'data-ripper':
      await loadDataRipper();
      break;
  }
}

// Update active nav
function updateActiveNav() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === state.currentPage);
  });
}

// Login
async function handleLogin() {
  const username = document.getElementById('login-username')?.value;
  const password = document.getElementById('login-password')?.value;
  
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (data.success) {
      state.isAuthenticated = true;
      await loadDashboard();
    } else {
      alert('Login failed: ' + data.message);
    }
  } catch (error) {
    alert('Login error: ' + error.message);
  }
}

// Logout
async function handleLogout() {
  try {
    await fetch(`${API_BASE}/logout`, { method: 'POST' });
    state.isAuthenticated = false;
    renderLogin();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Render functions
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
      <div class="card" style="max-width: 400px; width: 100%;">
        <h1 class="sidebar-header" style="text-align: center; margin-bottom: 2rem;">GambleCodez Admin</h1>
        <form onsubmit="event.preventDefault(); handleAction('login');">
          <div class="form-group">
            <label>Username</label>
            <input type="text" id="login-username" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;" data-action="login">Login</button>
        </form>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const stats = state.data.stats || {};
  return `
    <div class="page-header">
      <h2>Dashboard</h2>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">System Status</div>
        <div class="value">
          <span class="status-light green"></span> Online
        </div>
      </div>
      <div class="stat-card">
        <div class="label">Total Affiliates</div>
        <div class="value">${stats.total_affiliates || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">Newsletter Subscribers</div>
        <div class="value">${stats.newsletter_count || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">Active Ads</div>
        <div class="value">${stats.active_ads || 0}</div>
      </div>
    </div>
    
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header">Quick Actions</div>
        <button class="btn btn-secondary" style="width: 100%; margin-bottom: 12px;">Restart Backend</button>
        <button class="btn btn-secondary" style="width: 100%; margin-bottom: 12px;">Restart Bot</button>
        <button class="btn btn-secondary" style="width: 100%; margin-bottom: 12px;">Run Redirect Test</button>
        <button class="btn btn-secondary" style="width: 100%; margin-bottom: 12px;">Run Icon Regeneration</button>
        <button class="btn btn-secondary" style="width: 100%;">Run Data Ripper</button>
      </div>
      <div class="card">
        <div class="card-header">System Status</div>
        <div style="margin-bottom: 16px;">
          <span class="status-light green"></span> Backend: OK
        </div>
        <div style="margin-bottom: 16px;">
          <span class="status-light green"></span> Bot: OK
        </div>
        <div style="margin-bottom: 16px;">
          <span class="status-light green"></span> Database: OK
        </div>
        <div style="margin-bottom: 16px;">
          <span class="status-light green"></span> Redirects: OK
        </div>
      </div>
    </div>
  `;
}

function renderAffiliates() {
  const affiliates = state.data.affiliates || [];
  return `
    <div class="page-header">
      <h2>Affiliate Manager</h2>
      <button class="btn btn-primary" onclick="showAffiliateForm()">+ Add Affiliate</button>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Region</th>
            <th>Priority</th>
            <th>Top Pick</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${affiliates.map(aff => `
            <tr>
              <td>${aff.name}${aff.is_current_top_pick ? ' ⭐' : ''}</td>
              <td><span class="badge ${aff.status === 'active' ? 'badge-success' : 'badge-warning'}">${aff.status}</span></td>
              <td>${aff.region}</td>
              <td>${aff.priority}</td>
              <td>${aff.is_current_top_pick ? '<span class="badge badge-primary">Current Top Pick</span>' : '<span class="badge badge-secondary">-</span>'}</td>
              <td>
                <button class="btn btn-small btn-secondary" onclick="editAffiliate(${aff.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteAffiliate(${aff.id})">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAds() {
  const ads = state.data.ads || [];
  return `
    <div class="page-header">
      <h2>Ads Manager</h2>
      <button class="btn btn-primary" onclick="showAdForm()">+ Create Ad</button>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Weight</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${ads.map(ad => `
            <tr>
              <td>${ad.title}</td>
              <td>${ad.weight}</td>
              <td><span class="badge ${ad.is_active ? 'badge-success' : 'badge-warning'}">${ad.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button class="btn btn-small btn-secondary" onclick="editAd(${ad.id})">Edit</button>
                <button class="btn btn-small btn-danger" data-action="delete-ad" data-id="${ad.id}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div id="ad-form-container"></div>
  `;
}

function renderRaffles() {
  const raffles = state.data.raffles || [];
  return `
    <div class="page-header">
      <h2>Raffle Manager</h2>
      <button class="btn btn-primary" onclick="showRaffleForm()">+ Create Raffle</button>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Prize</th>
            <th>Entries</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${raffles.map(raffle => `
            <tr>
              <td>${raffle.name}</td>
              <td>${raffle.prize}</td>
              <td>${raffle.entry_count || 0}</td>
              <td><span class="badge ${raffle.is_active ? 'badge-success' : 'badge-warning'}">${raffle.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button class="btn btn-small btn-secondary" onclick="editRaffle(${raffle.id})">Edit</button>
                <button class="btn btn-small btn-primary" data-action="pick-winner" data-id="${raffle.id}">Pick Winner</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderNewsletter() {
  const newsletter = state.data.newsletter || [];
  return `
    <div class="page-header">
      <h2>Newsletter Manager</h2>
      <button class="btn btn-primary" data-action="export-newsletter-csv">Export CSV</button>
      <button class="btn btn-secondary" data-action="export-newsletter-zip">Export ZIP</button>
    </div>
    
    <div class="card">
      <div class="stat-card">
        <div class="label">Total Subscribers</div>
        <div class="value">${newsletter.length}</div>
      </div>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Cwallet ID</th>
            <th>Telegram Handle</th>
            <th>Source</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${newsletter.map(sub => `
            <tr>
              <td>${sub.email}</td>
              <td>${sub.cwallet_id || '-'}</td>
              <td>${sub.telegram_handle || '-'}</td>
              <td>${sub.source || '-'}</td>
              <td>${new Date(sub.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderContact() {
  const contact = state.data.contact || [];
  return `
    <div class="page-header">
      <h2>Contact Inbox</h2>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${contact.map(msg => `
            <tr>
              <td>${msg.name}</td>
              <td>${msg.email}</td>
              <td>${msg.subject || '-'}</td>
              <td><span class="badge badge-info">${msg.status}</span></td>
              <td>
                <button class="btn btn-small btn-secondary" onclick="viewContact(${msg.id})">View</button>
                <select class="form-control" style="display: inline-block; width: auto;" onchange="updateContactStatus(${msg.id}, this.value)">
                  <option value="new" ${msg.status === 'new' ? 'selected' : ''}>New</option>
                  <option value="in_progress" ${msg.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="resolved" ${msg.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                  <option value="spam" ${msg.status === 'spam' ? 'selected' : ''}>Spam</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderTopPick() {
  const config = state.data.topPick?.config || {};
  const affiliates = state.data.topPick?.affiliates || [];
  
  return `
    <div class="page-header">
      <h2>Top Pick Manager</h2>
    </div>
    
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header">Configuration</div>
        <form id="top-pick-form" onsubmit="event.preventDefault(); handleAction('save-top-pick');">
          <div class="form-group">
            <label>Select Top Pick Affiliate</label>
            <select id="top-pick-affiliate" class="form-control">
              <option value="">-- Select --</option>
              ${affiliates.map(aff => `
                <option value="${aff.id}" ${config.affiliate_id == aff.id ? 'selected' : ''}>${aff.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Hero Title</label>
            <input type="text" id="top-pick-hero-title" class="form-control" value="${config.hero_title || 'Top Pick'}">
          </div>
          <div class="form-group">
            <label>Hero Subtitle</label>
            <textarea id="top-pick-hero-subtitle" class="form-control">${config.hero_subtitle || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Background Color</label>
            <input type="color" id="top-pick-bg-color" class="form-control" value="${config.background_color || '#0a0a0a'}">
          </div>
          <div class="form-group">
            <label>Highlight Color</label>
            <input type="color" id="top-pick-highlight" class="form-control" value="${config.highlight_color || '#00eaff'}">
          </div>
          <button type="submit" class="btn btn-primary">Save Top Pick</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header">Live Preview</div>
        <div class="preview-box" id="top-pick-preview">
          Preview will appear here
        </div>
      </div>
    </div>
  `;
}

function renderDataRipper() {
  const jobs = state.data.ripperJobs || [];
  return `
    <div class="page-header">
      <h2>Data Ripper Manager</h2>
    </div>
    
    <div class="card">
      <div class="form-group">
        <label>Source URL to Rip</label>
        <input type="url" id="ripper-url" class="form-control" placeholder="https://example.com">
      </div>
      <button class="btn btn-primary" data-action="run-ripper">Run Ripper</button>
    </div>
    
    <div class="card">
      <div class="card-header">Ripper Jobs</div>
      <table class="table">
        <thead>
          <tr>
            <th>Source URL</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${jobs.map(job => `
            <tr>
              <td>${job.source_url}</td>
              <td><span class="badge badge-info">${job.status}</span></td>
              <td>${new Date(job.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-small btn-primary" data-action="ai-review" data-id="${job.id}">AI Review</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Main render function
function render() {
  if (!state.isAuthenticated) {
    renderLogin();
    return;
  }
  
  const sidebar = `
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>GambleCodez</h1>
        <p>God-Mode Admin</p>
      </div>
      <ul class="sidebar-nav">
        <li><a href="#" data-page="dashboard" class="${state.currentPage === 'dashboard' ? 'active' : ''}">📊 Dashboard</a></li>
        <li><a href="#" data-page="affiliates" class="${state.currentPage === 'affiliates' ? 'active' : ''}">👥 Affiliates</a></li>
        <li><a href="#" data-page="ads" class="${state.currentPage === 'ads' ? 'active' : ''}">📢 Ads</a></li>
        <li><a href="#" data-page="raffles" class="${state.currentPage === 'raffles' ? 'active' : ''}">🎲 Raffles</a></li>
        <li><a href="#" data-page="newsletter" class="${state.currentPage === 'newsletter' ? 'active' : ''}">📧 Newsletter</a></li>
        <li><a href="#" data-page="contact" class="${state.currentPage === 'contact' ? 'active' : ''}">📬 Contact</a></li>
        <li><a href="#" data-page="top-pick" class="${state.currentPage === 'top-pick' ? 'active' : ''}">⭐ Top Pick</a></li>
        <li><a href="#" data-page="data-ripper" class="${state.currentPage === 'data-ripper' ? 'active' : ''}">🤖 Data Ripper</a></li>
        <li><a href="#" data-action="logout">🚪 Logout</a></li>
      </ul>
    </div>
  `;
  
  let mainContent = '';
  switch (state.currentPage) {
    case 'dashboard':
      mainContent = renderDashboard();
      break;
    case 'affiliates':
      mainContent = renderAffiliates();
      break;
    case 'ads':
      mainContent = renderAds();
      break;
    case 'raffles':
      mainContent = renderRaffles();
      break;
    case 'newsletter':
      mainContent = renderNewsletter();
      break;
    case 'contact':
      mainContent = renderContact();
      break;
    case 'top-pick':
      mainContent = renderTopPick();
      break;
    case 'data-ripper':
      mainContent = renderDataRipper();
      break;
  }
  
  document.getElementById('app').innerHTML = `
    <div class="admin-container">
      ${sidebar}
      <div class="main-content">
        ${mainContent}
      </div>
    </div>
  `;
  
  updateActiveNav();
}

// Load functions
async function loadDashboard() {
  try {
    const [statsRes, affiliatesRes, adsRes, newsletterRes] = await Promise.all([
      fetch(`${API_BASE}/stats/dashboard`).catch(() => null),
      fetch(`${API_BASE}/affiliates`).catch(() => null),
      fetch(`${API_BASE}/ads`).catch(() => null),
      fetch(`${API_BASE}/newsletter`).catch(() => null)
    ]);
    
    state.data.stats = statsRes ? (await statsRes.json()).data?.totals : {};
    state.data.affiliates = affiliatesRes ? (await affiliatesRes.json()).data : [];
    state.data.ads = adsRes ? (await adsRes.json()).data : [];
    state.data.newsletter = newsletterRes ? (await newsletterRes.json()).data : [];
    
    render();
  } catch (error) {
    console.error('Load dashboard error:', error);
    render();
  }
}

async function loadAffiliates() {
  try {
    const res = await fetch(`${API_BASE}/affiliates`);
    const data = await res.json();
    state.data.affiliates = data.data || [];
    render();
  } catch (error) {
    console.error('Load affiliates error:', error);
  }
}

async function loadAds() {
  try {
    const res = await fetch(`${API_BASE}/ads/admin`);
    const data = await res.json();
    state.data.ads = data.data || [];
    render();
  } catch (error) {
    console.error('Load ads error:', error);
  }
}

async function loadRaffles() {
  try {
    const res = await fetch(`${API_BASE}/raffles/admin`);
    const data = await res.json();
    state.data.raffles = data.data || [];
    render();
  } catch (error) {
    console.error('Load raffles error:', error);
  }
}

async function loadNewsletter() {
  try {
    const res = await fetch(`${API_BASE}/newsletter`);
    const data = await res.json();
    state.data.newsletter = data.data || [];
    render();
  } catch (error) {
    console.error('Load newsletter error:', error);
  }
}

async function loadContact() {
  try {
    const res = await fetch(`${API_BASE}/contact`);
    const data = await res.json();
    state.data.contact = data.data || [];
    render();
  } catch (error) {
    console.error('Load contact error:', error);
  }
}

async function loadTopPick() {
  try {
    const res = await fetch(`${API_BASE}/top-pick/admin`);
    const data = await res.json();
    state.data.topPick = data.data || {};
    render();
  } catch (error) {
    console.error('Load top pick error:', error);
  }
}

async function loadDataRipper() {
  try {
    const res = await fetch(`${API_BASE}/data-ripper`);
    const data = await res.json();
    state.data.ripperJobs = data.data || [];
    render();
  } catch (error) {
    console.error('Load data ripper error:', error);
  }
}

// Save functions
async function saveTopPick() {
  const affiliateId = document.getElementById('top-pick-affiliate')?.value;
  const heroTitle = document.getElementById('top-pick-hero-title')?.value;
  const heroSubtitle = document.getElementById('top-pick-hero-subtitle')?.value;
  const bgColor = document.getElementById('top-pick-bg-color')?.value;
  const highlightColor = document.getElementById('top-pick-highlight')?.value;
  
  try {
    const res = await fetch(`${API_BASE}/top-pick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        affiliate_id: affiliateId ? parseInt(affiliateId) : null,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        background_color: bgColor,
        highlight_color: highlightColor
      })
    });
    
    const data = await res.json();
    if (data.success) {
      alert('Top Pick saved successfully!');
      await loadTopPick();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function deleteAd(id) {
  if (!confirm('Delete this ad?')) return;
  
  try {
    const res = await fetch(`${API_BASE}/ads/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await loadAds();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function updateContactStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/contact/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    const data = await res.json();
    if (data.success) {
      await loadContact();
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function exportNewsletterCSV() {
  try {
    const res = await fetch(`${API_BASE}/newsletter/export/csv`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter_subscriptions.csv';
    a.click();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function runRipper() {
  const url = document.getElementById('ripper-url')?.value;
  if (!url) {
    alert('Please enter a URL');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/data-ripper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_url: url })
    });
    
    const data = await res.json();
    if (data.success) {
      alert('Ripper job created!');
      await loadDataRipper();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function triggerAIReview(id) {
  try {
    const res = await fetch(`${API_BASE}/data-ripper/${id}/ai-review`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('AI review triggered!');
      await loadDataRipper();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Make functions globally available
window.handleAction = handleAction;
window.navigate = navigate;
window.updateContactStatus = updateContactStatus;
