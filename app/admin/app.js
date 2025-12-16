// GambleCodez Admin Portal Application

// State Management (using in-memory storage)
const state = {
  isAuthenticated: false,
  currentPage: 'dashboard',
  credentials: {
    username: 'admin',
    password: 'Dope!1988'
  },
  affiliates: [
    {
      id: 1,
      name: "Ace",
      handle: "ace-casino",
      email: "affiliate@ace.com",
      status: "active",
      region: "usa",
      tags: "casino",
      referral_code: "ACE001",
      referral_url: "https://ace.casino/r/ACE001",
      telegram_user_id: "123456789",
      created_at: "2024-01-15",
      conversions: 45,
      revenue: 2250.00
    },
    {
      id: 2,
      name: "BCH.GAMES",
      handle: "bch-games",
      email: "partner@bch.games",
      status: "active",
      region: "non-us",
      tags: "casino,faucet,no-kyc,instant",
      referral_code: "BCH002",
      referral_url: "https://bch.games/r/BCH002",
      telegram_user_id: "987654321",
      created_at: "2024-02-01",
      conversions: 78,
      revenue: 3900.00
    },
    {
      id: 3,
      name: "Stake.us",
      handle: "stake-us",
      email: "partners@stake.us",
      status: "paused",
      region: "usa",
      tags: "casino",
      referral_code: "STAKE003",
      referral_url: "https://stake.us/r/STAKE003",
      telegram_user_id: "555444333",
      created_at: "2024-01-20",
      conversions: 156,
      revenue: 7800.00
    }
  ],
  campaigns: [
    {
      id: 1,
      name: "Q4 2024 Casino Blitz",
      status: "active",
      payout_model: "cpa",
      cpa_amount: 50.00,
      revshare_percent: null,
      start_date: "2024-10-01",
      end_date: "2024-12-31",
      target_conversions: 1000,
      current_conversions: 234
    },
    {
      id: 2,
      name: "Crypto Winter Special",
      status: "active",
      payout_model: "revshare",
      cpa_amount: null,
      revshare_percent: 25.0,
      start_date: "2024-11-01",
      end_date: "2025-01-31",
      target_conversions: 500,
      current_conversions: 89
    }
  ]
};

// Initialize app
function init() {
  render();
}

// Render current view
function render() {
  const app = document.getElementById('app');

  if (!state.isAuthenticated) {
    app.innerHTML = renderLogin();
  } else {
    app.innerHTML = renderDashboard();
  }
}

// Login view
function renderLogin() {
  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #0a0a0a;">
      <div style="background: #1a1a1a; padding: 3rem; border-radius: 12px; border: 1px solid #333; max-width: 400px; width: 100%;">
        <h1 style="text-align: center; background: linear-gradient(45deg, #00eaff, #8a2be2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 2rem;">
          GambleCodez Admin
        </h1>
        <form id="loginForm" onsubmit="handleLogin(event)">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ccc;">Username</label>
            <input type="text" id="username" required style="width: 100%; padding: 1rem; background: #2a2a2a; border: 1px solid #333; border-radius: 8px; color: white;">
          </div>
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ccc;">Password</label>
            <input type="password" id="password" required style="width: 100%; padding: 1rem; background: #2a2a2a; border: 1px solid #333; border-radius: 8px; color: white;">
          </div>
          <button type="submit" style="width: 100%; padding: 1rem; background: linear-gradient(45deg, #00eaff, #8a2be2); border: none; border-radius: 8px; color: white; font-weight: 500; cursor: pointer;">
            Login
          </button>
        </form>
      </div>
    </div>
  `;
}

// Dashboard view
function renderDashboard() {
  return `
    <div style="display: flex; min-height: 100vh; background: #0a0a0a; color: white;">
      <aside style="width: 280px; background: #1a1a1a; border-right: 1px solid #333; padding: 2rem 0;">
        <div style="padding: 0 2rem 2rem; text-align: center; border-bottom: 1px solid #333;">
          <h2 style="background: linear-gradient(45deg, #00eaff, #8a2be2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            GambleCodez
          </h2>
        </div>
        <nav style="padding: 2rem 0;">
          <a href="#" onclick="navigate('dashboard')" style="display: block; padding: 1rem 2rem; color: #ccc; text-decoration: none; border-left: 3px solid transparent;">
            📊 Dashboard
          </a>
          <a href="#" onclick="navigate('affiliates')" style="display: block; padding: 1rem 2rem; color: #ccc; text-decoration: none; border-left: 3px solid transparent;">
            👥 Affiliates
          </a>
          <a href="#" onclick="navigate('campaigns')" style="display: block; padding: 1rem 2rem; color: #ccc; text-decoration: none; border-left: 3px solid transparent;">
            📢 Campaigns
          </a>
          <a href="#" onclick="logout()" style="display: block; padding: 1rem 2rem; color: #ccc; text-decoration: none; border-left: 3px solid transparent;">
            🚪 Logout
          </a>
        </nav>
      </aside>
      <main style="flex: 1; padding: 2rem;">
        <h1>Dashboard</h1>
        <p>Welcome to GambleCodez Admin Portal</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 2rem;">
          <div style="background: #1a1a1a; padding: 2rem; border-radius: 12px; border: 1px solid #333;">
            <div style="color: #888; font-size: 0.9rem; margin-bottom: 1rem;">TOTAL AFFILIATES</div>
            <div style="font-size: 2.5rem; font-weight: bold;">${state.affiliates.length}</div>
          </div>
          <div style="background: #1a1a1a; padding: 2rem; border-radius: 12px; border: 1px solid #333;">
            <div style="color: #888; font-size: 0.9rem; margin-bottom: 1rem;">ACTIVE CAMPAIGNS</div>
            <div style="font-size: 2.5rem; font-weight: bold;">${state.campaigns.filter(c => c.status === 'active').length}</div>
          </div>
          <div style="background: #1a1a1a; padding: 2rem; border-radius: 12px; border: 1px solid #333;">
            <div style="color: #888; font-size: 0.9rem; margin-bottom: 1rem;">TOTAL REVENUE</div>
            <div style="font-size: 2.5rem; font-weight: bold;">$${state.affiliates.reduce((sum, a) => sum + a.revenue, 0).toLocaleString()}</div>
          </div>
        </div>
      </main>
    </div>
  `;
}

// Handle login
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (username === state.credentials.username && password === state.credentials.password) {
    state.isAuthenticated = true;
    render();
  } else {
    alert('Invalid credentials');
  }
}

// Navigate
function navigate(page) {
  state.currentPage = page;
  render();
}

// Logout
function logout() {
  state.isAuthenticated = false;
  render();
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
