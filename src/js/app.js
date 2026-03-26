// =============================================
// APP - Inicialización y Router
// =============================================

const App = (() => {
  let currentView = 'dashboard';

  function init() {
    SupabaseClient.init();
    setupNavigation();
    setupClock();
    setupMobileMenu();
    navigateTo('dashboard');
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        navigateTo(item.dataset.view);
      });
    });
  }

  function navigateTo(view) {
    currentView = view;

    // Update nav
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    // Update views
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === `view-${view}`);
    });

    // Update top bar title
    const titles = {
      dashboard: { title: 'Dashboard', subtitle: 'Control diario de la guardería' },
      dogs: { title: 'Perros', subtitle: 'Perfiles y hojas de vida' }
    };
    const t = titles[view] || titles.dashboard;
    document.getElementById('page-title').textContent = t.title;
    document.getElementById('page-subtitle').textContent = t.subtitle;

    // Load view data
    if (view === 'dashboard') Dashboard.init();
    if (view === 'dogs') Dogs.init();

    // Close mobile menu
    closeMobileMenu();
  }

  function setupClock() {
    function updateClock() {
      const now = new Date();
      const el = document.getElementById('current-time');
      if (el) {
        el.textContent = now.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  function setupMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        overlay.classList.toggle('active');
      });
    }
    if (overlay) {
      overlay.addEventListener('click', closeMobileMenu);
    }
  }

  function closeMobileMenu() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  return { init, navigateTo };
})();
