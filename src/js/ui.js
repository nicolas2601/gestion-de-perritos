// =============================================
// UI HELPERS - Guardería Canina TIKNO
// =============================================

const UI = (() => {
  // ---- TOAST NOTIFICATIONS ----
  function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const svgIcons = {
      success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path d="M6 10l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path d="M10 9v5M10 6.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    };

    const duration = 3500;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.style.cssText = 'position:relative;overflow:hidden;display:flex;align-items:center;gap:10px;padding:12px 16px;padding-right:36px;animation:toastSlideIn 0.35s cubic-bezier(0.21,1.02,0.73,1) forwards;';
    el.innerHTML = `
      <span class="toast-icon" style="display:flex;align-items:center;flex-shrink:0;">${svgIcons[type] || svgIcons.info}</span>
      <span class="toast-message" style="flex:1;font-size:0.875rem;">${escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.classList.add('toast-exit');setTimeout(()=>this.parentElement.remove(),300)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:inherit;cursor:pointer;font-size:1.1rem;opacity:0.6;padding:4px;line-height:1;">&times;</button>
      <div class="toast-progress" style="position:absolute;bottom:0;left:0;height:3px;background:currentColor;opacity:0.3;animation:toastProgress ${duration}ms linear forwards;"></div>
    `;
    container.appendChild(el);

    // Inject toast animations if not already present
    if (!document.getElementById('toast-anim-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-anim-styles';
      style.textContent = `
        @keyframes toastSlideIn {
          from { opacity:0; transform:translateX(40px); }
          to { opacity:1; transform:translateX(0); }
        }
        @keyframes toastSlideOut {
          from { opacity:1; transform:translateX(0); max-height:80px; margin-bottom:8px; }
          to { opacity:0; transform:translateX(40px); max-height:0; margin-bottom:0; padding-top:0; padding-bottom:0; }
        }
        @keyframes toastProgress {
          from { width:100%; }
          to { width:0%; }
        }
        .toast-exit {
          animation: toastSlideOut 0.3s ease forwards !important;
        }
        @keyframes pulseDot {
          0%, 100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(0.7); }
        }
        @keyframes confettiFall {
          0% { transform:translateY(0) rotate(0deg); opacity:1; }
          100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
        }
        @keyframes modalFadeIn {
          from { opacity:0; }
          to { opacity:1; }
        }
        @keyframes modalScaleIn {
          from { opacity:0; transform:scale(0.92) translateY(20px); }
          to { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes modalFadeOut {
          from { opacity:1; }
          to { opacity:0; }
        }
        @keyframes modalScaleOut {
          from { opacity:1; transform:scale(1) translateY(0); }
          to { opacity:0; transform:scale(0.92) translateY(20px); }
        }
        @keyframes countUp {
          from { opacity:0; transform:translateY(8px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes cardStaggerIn {
          from { opacity:0; transform:translateY(20px); }
          to { opacity:1; transform:translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      el.classList.add('toast-exit');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ---- MODAL ----
  function openModal(title, bodyHtml, footerHtml = '') {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal';
    overlay.style.animation = 'modalFadeIn 0.25s ease forwards';
    overlay.innerHTML = `
      <div class="modal" style="animation:modalScaleIn 0.3s cubic-bezier(0.21,1.02,0.73,1) forwards;">
        <div class="modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button class="modal-close" onclick="UI.closeModal()">&times;</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
  }

  function closeModal() {
    const overlay = document.getElementById('active-modal');
    if (!overlay) return;
    const modalBox = overlay.querySelector('.modal');
    overlay.style.animation = 'modalFadeOut 0.2s ease forwards';
    if (modalBox) modalBox.style.animation = 'modalScaleOut 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 220);
  }

  // ---- CONFETTI ----
  function showConfetti() {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;overflow:hidden;';
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
    const shapes = ['circle', 'square', 'triangle'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.6;
      const size = 6 + Math.random() * 8;
      const duration = 1.5 + Math.random() * 2;

      let shapeStyles = `width:${size}px;height:${size}px;background:${color};`;
      if (shape === 'circle') {
        shapeStyles += 'border-radius:50%;';
      } else if (shape === 'triangle') {
        shapeStyles = `width:0;height:0;background:none;border-left:${size / 2}px solid transparent;border-right:${size / 2}px solid transparent;border-bottom:${size}px solid ${color};`;
      }

      piece.style.cssText = `position:absolute;top:-10px;left:${left}%;${shapeStyles}animation:confettiFall ${duration}s ease-in ${delay}s forwards;opacity:0;`;
      // Start visible after delay
      piece.style.animationFillMode = 'forwards';
      piece.style.opacity = '0';
      setTimeout(() => { piece.style.opacity = '1'; }, delay * 1000);
      container.appendChild(piece);
    }
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 4000);
  }

  // ---- STATUS BADGE ----
  function statusBadge(status, checkinId) {
    const s = CONFIG.DOG_STATUSES[status] || CONFIG.DOG_STATUSES.en_patio;
    return `<span class="status-badge"
      style="background:${s.bg};color:${s.color};display:inline-flex;align-items:center;gap:6px;"
      onclick="Dashboard.showStatusDropdown(event, '${checkinId}')">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};animation:pulseDot 1.5s ease-in-out infinite;flex-shrink:0;"></span>
      ${s.icon} ${s.label}
    </span>`;
  }

  // ---- STATUS DROPDOWN ----
  function renderStatusDropdown(checkinId, x, y) {
    removeStatusDropdown();
    const dropdown = document.createElement('div');
    dropdown.className = 'status-dropdown';
    dropdown.id = 'status-dropdown';
    dropdown.style.left = x + 'px';
    dropdown.style.top = y + 'px';

    Object.entries(CONFIG.DOG_STATUSES).forEach(([key, val]) => {
      dropdown.innerHTML += `
        <button class="status-option" onclick="Dashboard.changeStatus('${checkinId}', '${key}')">
          ${val.icon} ${val.label}
        </button>
      `;
    });

    document.body.appendChild(dropdown);
    setTimeout(() => {
      document.addEventListener('click', removeStatusDropdown, { once: true });
    }, 10);
  }

  function removeStatusDropdown() {
    const d = document.getElementById('status-dropdown');
    if (d) d.remove();
  }

  // ---- DOG AVATAR ----
  function dogAvatar(photoUrl, size = 40) {
    if (photoUrl) {
      return `<img src="${escapeHtml(photoUrl)}" alt="Foto" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
    }
    return `<div class="dog-avatar" style="width:${size}px;height:${size}px;">&#128054;</div>`;
  }

  // ---- FORMAT TIME ----
  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}min`;
  }

  // ---- ANIMATE COUNT ----
  function animateCount(element, from, to, duration = 600) {
    if (!element) return;
    const start = performance.now();
    const diff = to - from;
    element.style.animation = 'countUp 0.3s ease forwards';
    function step(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(from + diff * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // ---- ESCAPE HTML ----
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- LOADING ----
  function showLoading(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '<div style="text-align:center;padding:40px;"><div class="loading-spinner"></div><p style="margin-top:12px;color:var(--text-muted);font-size:0.85rem;">Cargando...</p></div>';
  }

  // ---- CONFIRM ----
  function confirm(message) {
    return new Promise((resolve) => {
      openModal('Confirmar', `
        <p style="font-size:0.9rem;color:var(--text-secondary);">${escapeHtml(message)}</p>
      `, `
        <button class="btn btn-secondary" onclick="UI.closeModal(); window._confirmResolve(false)">Cancelar</button>
        <button class="btn btn-primary" onclick="UI.closeModal(); window._confirmResolve(true)">Confirmar</button>
      `);
      window._confirmResolve = resolve;
    });
  }

  return {
    toast, openModal, closeModal, showConfetti,
    statusBadge, renderStatusDropdown, removeStatusDropdown,
    dogAvatar, formatTime, formatDate, timeAgo, animateCount,
    escapeHtml, showLoading, confirm
  };
})();
