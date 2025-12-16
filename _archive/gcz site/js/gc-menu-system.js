document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("gc-menu-toggle");
  const panel = document.getElementById("gc-menu-panel");

  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      panel.classList.toggle("active");
    });

    document.addEventListener("click", e => {
      if (!panel.contains(e.target) && e.target !== toggleBtn) {
        panel.classList.remove("active");
      }
    });

    // Close menu when clicking nav links
    document.querySelectorAll("#gc-menu-panel a[href^='#']").forEach(link => {
      link.addEventListener("click", () => {
        panel.classList.remove("active");
      });
    });
  }
});