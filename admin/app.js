document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main');
  const navItems = document.querySelectorAll('#sidebar nav li');

  navItems.forEach(li => {
    li.onclick = () => {
      const section = li.getAttribute('data-section');
      loadSection(section);
    };
  });

  async function loadSection(section) {
    main.innerHTML = `<h2>${section}</h2><p>Loading...</p>`;
    const res = await fetch(`/api/${section.replace(/-/g, '')}`);
    const data = await res.json();

    main.innerHTML = `<h2>${section}</h2><pre>${JSON.stringify(data.data || data, null, 2)}</pre>`;
  }

  loadSection('affiliates');
});
