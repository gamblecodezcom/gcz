// telegram.js — Telegram Mini-App integration and fallback
function detectTelegram() {
  let isTelegram = false;
  // Telegram Mini-App sets window.TelegramWebApp
  if (window.TelegramWebApp) {
    isTelegram = true;
    document.body.classList.add('telegram-app');
    telegramPopupAd();
  } else {
    document.body.classList.remove('telegram-app');
  }
  return isTelegram;
}

// Daily pop-up ad logic (once per day per user)
function telegramPopupAd() {
  const adKey = 'telegram_daily_ad';
  const today = (new Date()).toISOString().slice(0,10);
  if(localStorage.getItem(adKey) === today) return;
  const adDiv = document.createElement('div');
  adDiv.innerHTML = `
    <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;z-index:99999;background:rgba(20,18,34,.82);">
      <div style="background:#26265a;border-radius:18px;padding:2.2em 2em;max-width:340px;text-align:center;color:#eee;box-shadow:0 6px 22px #00eaff7a;">
        <h2>Exclusive Telegram Promo</h2>
        <p style="margin-bottom:1.2em;">Runewager + OseSweeps weekly bonuses now live!</p>
        <a href="https://runewager.com/?r=GambleCodez" target="_blank" style="color:#ffd700;font-weight:bold;">Play Runewager</a> <br>
        <a href="https://osesweeps.com/" target="_blank" style="color:#00eaff;">Play OseSweeps</a>
        <br><button style="margin-top:1.4em;background:#00eaff;color:#26265a;font-weight:bold;border-radius:9px;padding:.7em 2.5em;border:none;" onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(adDiv);
  localStorage.setItem(adKey, today);
}

// Call detectTelegram() on page load
window.addEventListener('DOMContentLoaded', detectTelegram);