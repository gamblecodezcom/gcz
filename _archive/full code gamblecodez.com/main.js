// Fetches affiliates.csv and renders cards, search, sort, filter logic.
async function loadAffiliates() {
  let response = await fetch('affiliates.csv');
  let csvText = await response.text();
  const rows = csvText.trim().split('
');
  const headers = rows[0].split(',');
  let affiliates = rows.slice(1).map(line => {
    let values = line.match(/(".*?"|[^",]+)(?=s*,|s*$)/g) || [];
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (values[i] || "").replace(/^"|"$/g,""));
    return obj;
  });
  window.affiliates = affiliates;
  renderSites();
}

const siteFlags = {US:'🇺🇸', NONUS:'🌎', SWEEPS:'🪁', CRYPTO:'₿', FAUCET:'💧', LOOTBOX:'🎁', INSTANT:'⚡', TOP_PICK:'⭐', KYC:'🆔', BLACKLIST:'🚫'};
function renderSites() {
  const list = document.getElementById('sitesContainer');
  if (!window.affiliates) return;
  let searchText = (document.getElementById('searchBar').value || '').toLowerCase();
  let cat = document.getElementById('categoryFilter').value;
  let sort = document.getElementById('sortFilter').value;
  let items = window.affiliates.filter(site => (
    (!searchText || site.name.toLowerCase().includes(searchText) || site.bonus_description.toLowerCase().includes(searchText))
    && (!cat || site.category.split(',').map(c=>c.trim()).includes(cat))
    && site.status === 'approved'
  ));
  if(sort==='priority') items.sort((a,b)=>b.priority-a.priority);
  if(sort==='name') items.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='newest') items.sort((a,b)=>new Date(b.date_added)-new Date(a.date_added));
  if(sort==='oldest') items.sort((a,b)=>new Date(a.date_added)-new Date(b.date_added));
  list.innerHTML = items.length
    ? items.map(site => siteCardHTML(site)).join('')
    : `<div class="no-sites">No sites found.</div>`;
}
function siteCardHTML(site) {
  let flags = site.category.split(',').map(f=>siteFlags[f.trim()]||'').filter(v=>!!v).map(f=>`<span class="flag">${f}</span>`).join('');
  let topPick = site.category.includes('TOP_PICK');
  let bonusBlock = (site.bonus_code && site.bonus_code.length > 2 && !["SWEEPS-US","GAMBLECODEZ"].includes(site.bonus_code)) 
    ? `<div class="bonus-block code">Bonus Code: <b>${site.bonus_code}</b></div>` : '';
  return `<div class="site-card${topPick ? ' top-pick' : ''}">
    <div class="site-header">${site.name} ${flags}</div>
    <div class="site-desc">${site.bonus_description}</div>
    ${bonusBlock}
    <a href="${site.affiliate_url}" target="_blank" class="site-link-btn">Play Now</a>
  </div>`;
}

// Event listeners to trigger render
window.addEventListener('DOMContentLoaded', loadAffiliates);
document.getElementById('searchBar').addEventListener('input', renderSites);
document.getElementById('categoryFilter').addEventListener('change', renderSites);
document.getElementById('sortFilter').addEventListener('change', renderSites);