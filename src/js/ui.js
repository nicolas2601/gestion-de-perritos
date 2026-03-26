// =============================================
// UI HELPERS - Guardería Canina TIKNO
// =============================================

const UI = (() => {
  // ---- TOAST NOTIFICATIONS ----
  function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const icons = { success: '&#10003;', error: '&#10007;', info: '&#8505;' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${icons[type] || ''}</span> ${escapeHtml(message)}`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ---- MODAL ----
  function openModal(title, bodyHtml, footerHtml = '') {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal';
    overlay.innerHTML = `
      <div class="modal">
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
    const modal = document.getElementById('active-modal');
    if (modal) modal.remove();
  }

  // ---- STATUS BADGE ----
  function statusBadge(status, checkinId) {
    const s = CONFIG.DOG_STATUSES[status] || CONFIG.DOG_STATUSES.en_patio;
    return `<span class="status-badge"
      style="background:${s.bg};color:${s.color}"
      onclick="Dashboard.showStatusDropdown(event, '${checkinId}')">
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
    toast, openModal, closeModal,
    statusBadge, renderStatusDropdown, removeStatusDropdown,
    dogAvatar, formatTime, formatDate, timeAgo,
    escapeHtml, showLoading, confirm
  };
})();
