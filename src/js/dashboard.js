// =============================================
// DASHBOARD - Check-in / Check-out
// =============================================

const Dashboard = (() => {
  let activeCheckins = [];
  let currentFilter = 'todos';
  let searchQuery = '';

  async function init() {
    await loadStats();
    await loadActiveCheckins();
  }

  async function loadStats() {
    try {
      const stats = await SupabaseClient.getDashboardStats();

      // Animate each stat from 0 to its real value
      const statActive = document.getElementById('stat-active');
      const statTotalDogs = document.getElementById('stat-total-dogs');
      const statToday = document.getElementById('stat-today');
      const statCheckout = document.getElementById('stat-checkout');

      UI.animateCount(statActive, 0, stats.activeNow, 700);
      UI.animateCount(statTotalDogs, 0, stats.totalDogs, 700);
      UI.animateCount(statToday, 0, stats.todayVisits, 700);
      UI.animateCount(statCheckout, 0, stats.checkedOutToday, 700);

      // Update sidebar badge
      const badge = document.getElementById('nav-badge-active');
      if (badge) badge.textContent = stats.activeNow;
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function loadActiveCheckins() {
    UI.showLoading('checkins-table-body');
    try {
      activeCheckins = await SupabaseClient.getActiveCheckins();
      renderCheckins();
    } catch (err) {
      console.error('Error loading checkins:', err);
      UI.toast('Error al cargar check-ins', 'error');
    }
  }

  // Helper to calculate time color based on hours in daycare
  function getTimeColor(checkInTime) {
    const diffMs = Date.now() - new Date(checkInTime).getTime();
    const hours = diffMs / 3600000;
    if (hours < 2) return { color: '#16a34a', bg: '#f0fdf4', label: 'Reciente' };
    if (hours <= 6) return { color: '#d97706', bg: '#fffbeb', label: 'Moderado' };
    return { color: '#dc2626', bg: '#fef2f2', label: 'Prolongado' };
  }

  function renderCheckins() {
    const tbody = document.getElementById('checkins-table-body');
    let filtered = activeCheckins;

    if (currentFilter !== 'todos') {
      filtered = filtered.filter(c => c.status === currentFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.dogs?.name?.toLowerCase().includes(q) ||
        c.dogs?.breed?.toLowerCase().includes(q) ||
        c.dogs?.owners?.name?.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state">
            <div class="empty-icon">&#128054;</div>
            <h3>${searchQuery ? 'Sin resultados' : 'No hay perros registrados hoy'}</h3>
            <p>${searchQuery ? 'Intenta con otro nombre' : 'Haz check-in del primer peludo del día'}</p>
            ${!searchQuery ? '<button class="btn btn-primary" onclick="Dashboard.showCheckInModal()">&#43; Nuevo Check-in</button>' : ''}
          </div>
        </td></tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(c => {
      const dog = c.dogs || {};
      const owner = dog.owners || {};
      const timeInfo = getTimeColor(c.check_in_time);
      return `
        <tr>
          <td>
            <div class="dog-cell">
              ${UI.dogAvatar(dog.photo_url)}
              <div>
                <div class="dog-name">${UI.escapeHtml(dog.name)}</div>
                <div class="dog-breed">${UI.escapeHtml(dog.breed)} &middot; ${UI.escapeHtml(owner.name)}</div>
              </div>
            </div>
          </td>
          <td><span class="time-badge">&#128336; ${UI.formatTime(c.check_in_time)}</span></td>
          <td>
            <span class="time-badge" style="background:${timeInfo.bg};color:${timeInfo.color};border:1px solid ${timeInfo.color}22;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${timeInfo.color};margin-right:4px;"></span>
              ${UI.timeAgo(c.check_in_time)}
            </span>
          </td>
          <td style="position:relative;">${UI.statusBadge(c.status, c.id)}</td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm btn-danger" onclick="Dashboard.doCheckOut('${c.id}', '${UI.escapeHtml(dog.name)}')">
                Check-out
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });
    renderCheckins();
  }

  function setSearch(query) {
    searchQuery = query;
    renderCheckins();
  }

  // ---- CHECK-IN MODAL ----
  async function showCheckInModal() {
    let dogs = [];
    try {
      dogs = await SupabaseClient.getDogs();
    } catch (err) {
      UI.toast('Error cargando perros', 'error');
      return;
    }

    // Filter out dogs that are already checked in
    const checkedInDogIds = new Set(activeCheckins.map(c => c.dog_id));
    const availableDogs = dogs.filter(d => !checkedInDogIds.has(d.id));

    const body = `
      <div class="form-group">
        <label>Selecciona el perro</label>
        <select id="checkin-dog-select">
          <option value="">-- Seleccionar --</option>
          ${availableDogs.map(d => `<option value="${d.id}">${UI.escapeHtml(d.name)} (${UI.escapeHtml(d.breed)}) - Dueño: ${UI.escapeHtml(d.owners?.name || 'N/A')}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Notas (opcional)</label>
        <textarea id="checkin-notes" placeholder="Ej: Llega con medicamento para las 2pm..."></textarea>
      </div>
      ${availableDogs.length === 0 ? '<p style="color:var(--accent);font-size:0.85rem;">Todos los perros registrados ya están en la guardería. <a href="#" onclick="Dogs.showCreateModal(); UI.closeModal();" style="color:var(--primary);">Registrar nuevo perro</a></p>' : ''}
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="Dashboard.doCheckIn()">&#10003; Registrar Entrada</button>
    `;

    UI.openModal('Nuevo Check-in', body, footer);
  }

  async function doCheckIn() {
    const dogId = document.getElementById('checkin-dog-select').value;
    const notes = document.getElementById('checkin-notes').value.trim();

    if (!dogId) {
      UI.toast('Selecciona un perro', 'error');
      return;
    }

    try {
      await SupabaseClient.checkIn(dogId, notes);
      UI.closeModal();
      UI.toast('Check-in realizado');
      UI.showConfetti();
      await init();
    } catch (err) {
      console.error('Error check-in:', err);
      UI.toast('Error al hacer check-in', 'error');
    }
  }

  async function doCheckOut(checkinId, dogName) {
    const confirmed = await UI.confirm(`¿Registrar salida de ${dogName}?`);
    if (!confirmed) return;

    try {
      await SupabaseClient.checkOut(checkinId);
      UI.toast(`${dogName} ha salido. ¡Hasta pronto!`);
      await init();
    } catch (err) {
      console.error('Error check-out:', err);
      UI.toast('Error al hacer check-out', 'error');
    }
  }

  // ---- STATUS ----
  function showStatusDropdown(event, checkinId) {
    event.stopPropagation();
    const rect = event.target.getBoundingClientRect();
    UI.renderStatusDropdown(checkinId, rect.left, rect.bottom + 5);
  }

  async function changeStatus(checkinId, newStatus) {
    UI.removeStatusDropdown();
    try {
      await SupabaseClient.updateCheckinStatus(checkinId, newStatus);
      const statusLabel = CONFIG.DOG_STATUSES[newStatus]?.label || newStatus;
      UI.toast(`Estado cambiado a: ${statusLabel}`);
      await loadActiveCheckins();
    } catch (err) {
      console.error('Error changing status:', err);
      UI.toast('Error al cambiar estado', 'error');
    }
  }

  async function refresh() {
    await init();
    UI.toast('Dashboard actualizado', 'info');
  }

  return {
    init, loadStats, loadActiveCheckins, renderCheckins,
    setFilter, setSearch,
    showCheckInModal, doCheckIn, doCheckOut,
    showStatusDropdown, changeStatus, refresh
  };
})();
