async function loadAffiliates() {
  try {
    const res = await fetch('/affiliates/redirect?limit=12');
    const data = await res.json();
    const grid = document.getElementById('affiliates');
    grid.innerHTML = data.map(a => `
      <div class="card">
        <h3>${a.name}</h3>
        <p>${a.bonus_description || 'Exclusive bonus for GambleCodez users'}</p>
        <a href="/affiliates/redirect/${a.name}" class="btn">Play Now →</a>
      </div>
    `).join('');
  } catch(e) {
    console.error('Failed to load affiliates:', e);
  }
}
loadAffiliates();
