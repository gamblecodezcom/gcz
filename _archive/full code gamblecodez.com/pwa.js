// pwa.js — Handles PWA install banner and service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('ServiceWorker registered:', reg.scope))
      .catch(err => console.warn('ServiceWorker failed', err));
  });
}

// PWA install banner logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  if (!deferredPrompt) return;
  const div = document.createElement('div');
  div.innerHTML = `
    <div style="position:fixed;bottom:16px;right:16px;padding:1em 1.7em;background:#00eaff;color:#191924;border-radius:13px;box-shadow:0 0 10px #00eaff85;z-index:9999;">
      <b>Install GambleCodez app</b><br>
      <button id="pwaInstallBtn" style="margin-top:.6em;">Install</button>
    </div>`;
  document.body.appendChild(div);
  document.getElementById('pwaInstallBtn').onclick = () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choiceResult => {
      div.remove();
      deferredPrompt = null;
    });
  };
}