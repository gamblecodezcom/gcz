// front-end JavaScript to wire functionality

// Helper function to query DOM
const $ = (selector) => document.querySelector(selector);

// Theme toggle
const bodyEl = document.body;
const themeToggle = $('#themeToggle');
const sunIcon = $('#sunIcon');
const moonIcon = $('#moonIcon');

themeToggle.addEventListener('click', () => {
  bodyEl.classList.toggle('dark');
  if (bodyEl.classList.contains('dark')) {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
});

// Scroll to raffle section
$('#scrollToRaffle').addEventListener('click', () => {
  document.getElementById('raffle').scrollIntoView({ behavior: 'smooth' });
});

// Show/hide auth forms
const registerCard = $('#registerCard');
const loginCard = $('#loginCard');
$('#showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  registerCard.classList.add('hidden');
  loginCard.classList.remove('hidden');
});
$('#showRegister').addEventListener('click', (e) => {
  e.preventDefault();
  loginCard.classList.add('hidden');
  registerCard.classList.remove('hidden');
});

// State
let token = localStorage.getItem('gcz_token') || null;
let currentUser = null;

// Update auth UI
function updateAuthUI() {
  const userWelcome = $('#userWelcome');
  const authForms = $('#authForms');
  if (token) {
    authForms.classList.add('hidden');
    userWelcome.classList.remove('hidden');
    $('#currentUsername').textContent = currentUser?.username || '';
    const last = currentUser?.last_checkin_at
      ? new Date(currentUser.last_checkin_at).toLocaleDateString()
      : 'Never';
    $('#lastCheckin').textContent = `Last check-in: ${last}`;
  } else {
    authForms.classList.remove('hidden');
    userWelcome.classList.add('hidden');
    $('#lastCheckin').textContent = '';
  }
}

// Register user
$('#registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = $('#regUsername').value.trim();
  const email = $('#regEmail').value.trim();
  const telegram_handle = $('#regTelegram').value.trim();
  const cwallet_id = $('#regCwallet').value.trim();
  const password = $('#regPassword').value;
  const confirm_password = $('#regConfirmPassword').value;
  if (password !== confirm_password) {
    alert('Passwords do not match');
    return;
  }
  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, telegram_handle, cwallet_id, password, confirm_password }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || 'Registration failed');
      return;
    }
    const data = await res.json();
    alert('Registered successfully! Please login.');
    // Switch to login form
    $('#showLogin').click();
  } catch (err) {
    console.error(err);
    alert('Registration error');
  }
});

// Login user
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = $('#loginUsername').value.trim();
  const password = $('#loginPassword').value;
  const formBody = new URLSearchParams();
  formBody.append('username', username);
  formBody.append('password', password);
  formBody.append('grant_type', 'password');
  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || 'Login failed');
      return;
    }
    const data = await res.json();
    token = data.access_token;
    localStorage.setItem('gcz_token', token);
    // Fetch user info
    await fetchCurrentUser();
    updateAuthUI();
    loadWallet();
    alert('Logged in successfully!');
  } catch (err) {
    console.error(err);
    alert('Login error');
  }
});

// Logout
$('#logoutBtn').addEventListener('click', () => {
  token = null;
  currentUser = null;
  localStorage.removeItem('gcz_token');
  updateAuthUI();
  $('#walletContainer').innerHTML = '<p>Please login to view your wallet.</p>';
});

// Daily check-in
const checkinBtn = $('#checkinBtn');
if (checkinBtn) {
  checkinBtn.addEventListener('click', async () => {
    if (!token) {
      alert('Please login to perform check-in.');
      return;
    }
    try {
      const res = await fetch('/api/users/checkin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Check-in successful');
        // update wallet and current user
        await fetchCurrentUser();
        updateAuthUI();
        loadWallet();
      } else {
        const err = await res.json();
        alert(err.detail || 'Check-in failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error performing check-in');
    }
  });
}

// Fetch current user
async function fetchCurrentUser() {
  if (!token) return;
  try {
    const res = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      currentUser = await res.json();
    } else {
      currentUser = null;
      token = null;
      localStorage.removeItem('gcz_token');
    }
  } catch (err) {
    console.error(err);
  }
}

// Load raffles
async function loadRaffles() {
  const container = $('#raffleContainer');
  container.innerHTML = '<p>Loading active raffles...</p>';
  try {
    const res = await fetch('/api/raffles');
    const raffles = await res.json();
    if (raffles.length === 0) {
      container.innerHTML = '<p>No active raffles at the moment.</p>';
      return;
    }
    container.innerHTML = '';
    raffles.forEach((raffle) => {
      const card = document.createElement('div');
      card.className = 'raffle-card';
      card.innerHTML = `
        <h3>${raffle.name}</h3>
        <p>${raffle.description}</p>
        <p><strong>Prize:</strong> ${raffle.prize}</p>
        <div class="countdown" id="countdown-${raffle.id}">--:--:--</div>
        <form id="entryForm-${raffle.id}">
          <input type="password" placeholder="Secret password" required />
          <button type="submit">Enter</button>
        </form>
        <div class="progress-bar" id="progress-${raffle.id}"></div>
      `;
      container.appendChild(card);
      // Countdown timer
      initCountdown(raffle);
      // Handle raffle entry
      const form = card.querySelector('form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!token) {
          alert('Please login to enter the raffle.');
          return;
        }
        const passwordField = form.querySelector('input');
        const secret_password = passwordField.value;
        try {
          const res = await fetch('/api/raffle_entries', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ raffle_id: raffle.id, secret_password }),
          });
          if (res.ok) {
            alert('Successfully entered the raffle!');
            passwordField.value = '';
          } else {
            const err = await res.json();
            alert(err.detail || 'Failed to enter raffle');
          }
        } catch (err) {
          console.error(err);
          alert('Error entering raffle');
        }
      });
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Failed to load raffles.</p>';
  }
}

// Initialize countdown timers and progress bars
function initCountdown(raffle) {
  const countdownEl = document.getElementById(`countdown-${raffle.id}`);
  const progressEl = document.getElementById(`progress-${raffle.id}`);
  const startTime = new Date(raffle.start_time).getTime();
  const endTime = new Date(raffle.end_time).getTime();
  function update() {
    const now = Date.now();
    const total = endTime - startTime;
    const remaining = endTime - now;
    const elapsed = now - startTime;
    // progress bar width percentage
    let percent = (elapsed / total) * 100;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    progressEl.style.width = percent + '%';
    // countdown
    if (remaining <= 0) {
      countdownEl.textContent = 'Ended';
      clearInterval(interval);
      return;
    }
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  update();
  const interval = setInterval(update, 1000);
}

// Load wallet
async function loadWallet() {
  const container = $('#walletContainer');
  if (!token) {
    container.innerHTML = '<p>Please login to view your wallet.</p>';
    return;
  }
  try {
    const res = await fetch('/api/wallet', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const wallet = await res.json();
      container.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'wallet-card';
      card.innerHTML = `
        <p class="wallet-balance">Balance: ${wallet.balance.toFixed(2)} coins</p>
        <div class="wallet-actions">
          <form id="depositForm">
            <input type="number" step="0.01" min="0" placeholder="Amount to deposit" required />
            <button type="submit">Deposit</button>
          </form>
          <form id="withdrawForm">
            <input type="number" step="0.01" min="0" placeholder="Amount to withdraw" required />
            <button type="submit">Withdraw</button>
          </form>
        </div>
      `;
      container.appendChild(card);
      // Deposit
      card.querySelector('#depositForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(e.target.querySelector('input').value);
        if (amount <= 0) return;
        await updateWallet('deposit', amount);
      });
      // Withdraw
      card.querySelector('#withdrawForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(e.target.querySelector('input').value);
        if (amount <= 0) return;
        await updateWallet('withdraw', amount);
      });
    } else {
      container.innerHTML = '<p>Failed to load wallet.</p>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error loading wallet.</p>';
  }
}

async function updateWallet(action, amount) {
  try {
    const res = await fetch(`/api/wallet/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`${action === 'deposit' ? 'Deposited' : 'Withdrawn'} successfully`);
      // Update balance
      $('#walletContainer').querySelector('.wallet-balance').textContent = `Balance: ${data.balance.toFixed(2)} coins`;
    } else {
      alert(data.detail || 'Wallet operation failed');
    }
  } catch (err) {
    console.error(err);
    alert('Error performing wallet operation');
  }
}

// Newsletter subscription
$('#newsletterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#newsletterEmail').value.trim();
  try {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      $('#newsletterMessage').textContent = 'Subscribed successfully!';
      $('#newsletterEmail').value = '';
    } else {
      const err = await res.json();
      $('#newsletterMessage').textContent = err.detail || 'Subscription failed';
    }
  } catch (err) {
    console.error(err);
    $('#newsletterMessage').textContent = 'Error subscribing to newsletter';
  }
});

// Report site
$('#reportForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const site_name = $('#reportSiteName').value.trim();
  const description = $('#reportDescription').value.trim();
  try {
    const res = await fetch('/api/site_reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ site_name, description }),
    });
    if (res.ok) {
      $('#reportMessage').textContent = 'Report submitted successfully!';
      $('#reportSiteName').value = '';
      $('#reportDescription').value = '';
    } else {
      const err = await res.json();
      $('#reportMessage').textContent = err.detail || 'Failed to submit report';
    }
  } catch (err) {
    console.error(err);
    $('#reportMessage').textContent = 'Error submitting report';
  }
});

// Update year in footer
$('#year').textContent = new Date().getFullYear();

// Initial load
(async () => {
  await fetchCurrentUser();
  updateAuthUI();
  loadRaffles();
  loadWallet();
})();