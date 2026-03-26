// =============================================
// APP - Inicialización y Router
// =============================================

const App = (() => {
  let currentView = 'dashboard';
  let dashboardRefreshInterval = null;

  function init() {
    SupabaseClient.init();
    setupNavigation();
    setupClock();
    setupGreeting();
    setupMobileMenu();
    navigateTo('dashboard');
    startDashboardAutoRefresh();
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

    // Staggered card entrance animation
    requestAnimationFrame(() => {
      const activeView = document.getElementById(`view-${view}`);
      if (activeView) {
        const cards = activeView.querySelectorAll('.stat-card, .dog-card, .card');
        cards.forEach((card, index) => {
          card.style.opacity = '0';
          card.style.animation = 'none';
          // Force reflow
          void card.offsetHeight;
          card.style.animation = `cardStaggerIn 0.4s cubic-bezier(0.21,1.02,0.73,1) ${index * 0.07}s forwards`;
        });
      }
    });

    // Close mobile menu
    closeMobileMenu();
  }

  function setupClock() {
    function updateClock() {
      const now = new Date();
      const timeEl = document.getElementById('current-time');
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }

      const dateEl = document.getElementById('current-date');
      if (dateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        let formatted = now.toLocaleDateString('es-CO', options);
        // Capitalize first letter
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        dateEl.textContent = formatted;
      }
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  function setupGreeting() {
    const el = document.getElementById('greeting');
    if (!el) return;
    const hour = new Date().getHours();
    let greeting;
    if (hour >= 5 && hour < 12) {
      greeting = 'Buenos días';
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Buenas tardes';
    } else {
      greeting = 'Buenas noches';
    }
    el.textContent = greeting;
  }

  function startDashboardAutoRefresh() {
    // Clear existing interval if any
    if (dashboardRefreshInterval) {
      clearInterval(dashboardRefreshInterval);
    }
    dashboardRefreshInterval = setInterval(() => {
      if (currentView === 'dashboard') {
        // Silent refresh - no toast notification
        Dashboard.loadStats();
        Dashboard.loadActiveCheckins();
      }
    }, 30000);
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
