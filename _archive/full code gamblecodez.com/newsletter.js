// newsletter.js — Handles newsletter subscription and daily raffle check-in
const NEWSLETTER_KEY = 'newsletter_subscriber';
const CHECKIN_KEY = 'daily_checkin_date';

function showNewsletterModal() {
  if(localStorage.getItem(NEWSLETTER_KEY)) return;
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="padding:1.5em;background:#14142a;color:#eee;border-radius:16px;max-width:350px;margin:auto;box-shadow:0 6px 18px #00eaff71;">
      <h2 style="color:#00eaff;">Join GambleCodez Newsletter</h2>
      <form id="newsletterForm">
        <label>Email:<br><input type="email" name="email" required style="width:100%;margin-bottom:.7em;"></label>
        <label>Jurisdiction:<br>
          <select name="jurisdiction" required style="width:100%;margin-bottom:.7em;">
            <option value="US">US</option>
            <option value="NONUS">NON-US</option>
          </select>
        </label>
        <label>Telegram Handle:<br><input name="telegram" required style="width:100%;margin-bottom:.7em;"></label>
        <label>CWallet ID:<br><input name="cwallet" required style="width:100%;margin-bottom:.7em;"></label>
        <label><input type="checkbox" name="ageok" required> I confirm I am of legal age and eligible per local laws.</label>
        <label><input type="checkbox" name="promooptin"> Yes, I want promo emails (+5 bonus entries)</label>
        <button type="submit" style="margin-top:1em;background:#00eaff;color:#191924;border-radius:8px;padding:.7em 2em;border:none;">Subscribe</button>
      </form>
      <div style="margin-top:1em"><a href="https://cwallet.com/referral/Nwnah81L" target="_blank" style="color:#27e69a;">Need a crypto wallet? Click here</a></div>
    </div>
  `;
  Object.assign(modal.style, {
    position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
    background: 'rgba(22,22,33,0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center'
  });
  document.body.appendChild(modal);
  document.getElementById('newsletterForm').onsubmit = e => {
    e.preventDefault();
    let data = {};
    for(const el of e.target.elements)
      if(el.name) data[el.name] = el.type==='checkbox' ? el.checked : el.value;
    localStorage.setItem(NEWSLETTER_KEY, JSON.stringify(data));
    modal.remove();
    alert('✅ Subscribed! You can now enter raffles');
  };
}

// Daily Check-In logic
function dailyCheckin() {
  if(!localStorage.getItem(NEWSLETTER_KEY)) return alert("Subscribe to the newsletter first!");
  const today = (new Date()).toISOString().split('T')[0];
  if(localStorage.getItem(CHECKIN_KEY) === today)
    return alert("Already checked in today!");
  localStorage.setItem(CHECKIN_KEY, today);
  alert("✅ Daily check-in complete! +2 entries added.");
}

// Show modal on first site visit (if not already subscribed)
window.addEventListener('DOMContentLoaded', showNewsletterModal);

// To trigger daily check-in button: dailyCheckin();