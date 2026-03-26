// =============================================
// DOGS - Perfiles Caninos (Hoja de Vida)
// =============================================

const Dogs = (() => {
  let allDogs = [];

  async function init() {
    await loadDogs();
  }

  async function loadDogs() {
    UI.showLoading('dogs-grid');
    try {
      allDogs = await SupabaseClient.getDogs();
      renderDogs();
    } catch (err) {
      console.error('Error loading dogs:', err);
      UI.toast('Error al cargar perros', 'error');
    }
  }

  function renderDogs(query = '') {
    const container = document.getElementById('dogs-grid');
    let filtered = allDogs;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.breed.toLowerCase().includes(q) ||
        d.owners?.name?.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">&#128062;</div>
          <h3>${query ? 'Sin resultados' : 'No hay perros registrados'}</h3>
          <p>${query ? 'Intenta con otro nombre' : 'Registra al primer peludo'}</p>
          ${!query ? '<button class="btn btn-primary" onclick="Dogs.showCreateModal()">&#43; Registrar Perro</button>' : ''}
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(dog => {
      const owner = dog.owners || {};
      const ageText = dog.age_years ? `${dog.age_years}a` : '';
      const ageMonths = dog.age_months ? `${dog.age_months}m` : '';
      const age = [ageText, ageMonths].filter(Boolean).join(' ') || 'N/A';

      return `
        <div class="dog-card" onclick="Dogs.showDetail('${dog.id}')">
          <div class="dog-card-header">
            <div class="dog-card-avatar">
              ${dog.photo_url ? `<img src="${UI.escapeHtml(dog.photo_url)}" alt="${UI.escapeHtml(dog.name)}">` : '&#128054;'}
            </div>
            <div class="dog-card-info">
              <h3>${UI.escapeHtml(dog.name)}</h3>
              <p>${UI.escapeHtml(dog.breed)} &middot; ${age}</p>
            </div>
          </div>
          <div class="dog-card-meta">
            <span class="meta-tag">&#128100; ${UI.escapeHtml(owner.name || 'N/A')}</span>
            ${dog.weight_kg ? `<span class="meta-tag">&#9878; ${dog.weight_kg}kg</span>` : ''}
            ${dog.vaccination_up_to_date ? '<span class="meta-tag" style="color:#16a34a;">&#10003; Vacunas</span>' : '<span class="meta-tag" style="color:#dc2626;">&#10007; Vacunas</span>'}
            ${dog.is_neutered ? '<span class="meta-tag">Esterilizado</span>' : ''}
          </div>
          <div class="dog-card-footer">
            <span class="visit-count" id="visits-${dog.id}">Cargando visitas...</span>
            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); Dogs.showEditModal('${dog.id}')">Editar</button>
          </div>
        </div>
      `;
    }).join('');

    // Load visit counts async
    filtered.forEach(async (dog) => {
      try {
        const count = await SupabaseClient.getDogVisitCount(dog.id);
        const el = document.getElementById(`visits-${dog.id}`);
        if (el) el.textContent = `${count} visita${count !== 1 ? 's' : ''}`;
      } catch (_) {}
    });
  }

  // ---- CREATE / EDIT MODAL ----
  function showCreateModal() {
    renderDogForm(null);
  }

  async function showEditModal(dogId) {
    try {
      const dog = await SupabaseClient.getDog(dogId);
      renderDogForm(dog);
    } catch (err) {
      UI.toast('Error al cargar datos del perro', 'error');
    }
  }

  async function renderDogForm(dog) {
    const isEdit = !!dog;
    let owners = [];
    try {
      owners = await SupabaseClient.getOwners();
    } catch (_) {}

    const body = `
      <div class="photo-upload">
        <div class="photo-preview" id="photo-preview">
          ${dog?.photo_url ? `<img src="${UI.escapeHtml(dog.photo_url)}">` : '&#128054;'}
        </div>
        <div>
          <label class="photo-upload-btn" for="photo-input">&#128247; ${isEdit ? 'Cambiar' : 'Subir'} Foto</label>
          <input type="file" id="photo-input" accept="image/*" style="display:none" onchange="Dogs.previewPhoto(this)">
          <p style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">JPG, PNG. Max 5MB</p>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Nombre del perro *</label>
          <input type="text" id="dog-name" value="${UI.escapeHtml(dog?.name || '')}" placeholder="Ej: Luna" required>
        </div>
        <div class="form-group">
          <label>Raza *</label>
          <input type="text" id="dog-breed" value="${UI.escapeHtml(dog?.breed || '')}" placeholder="Ej: Golden Retriever">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Edad (a\u00f1os)</label>
          <input type="number" id="dog-age-years" value="${dog?.age_years || 0}" min="0" max="25">
        </div>
        <div class="form-group">
          <label>Edad (meses)</label>
          <input type="number" id="dog-age-months" value="${dog?.age_months || 0}" min="0" max="11">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Peso (kg)</label>
          <input type="number" id="dog-weight" value="${dog?.weight_kg || ''}" min="0" step="0.1" placeholder="Ej: 12.5">
        </div>
        <div class="form-group">
          <label>Due\u00f1o *</label>
          <select id="dog-owner">
            <option value="">-- Seleccionar --</option>
            <option value="__new__">+ Registrar nuevo due\u00f1o</option>
            ${owners.map(o => `<option value="${o.id}" ${dog?.owner_id === o.id ? 'selected' : ''}>${UI.escapeHtml(o.name)} - ${UI.escapeHtml(o.phone)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="new-owner-fields" style="display:none;">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre del due\u00f1o *</label>
            <input type="text" id="owner-name" placeholder="Nombre completo">
          </div>
          <div class="form-group">
            <label>Tel\u00e9fono *</label>
            <input type="tel" id="owner-phone" placeholder="300 123 4567">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Contacto de emergencia</label>
            <input type="text" id="owner-emergency" placeholder="Nombre del contacto">
          </div>
          <div class="form-group">
            <label>Tel. emergencia</label>
            <input type="tel" id="owner-emergency-phone" placeholder="300 765 4321">
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Notas de comportamiento</label>
        <textarea id="dog-behavior" placeholder="Ej: Es t\u00edmido con perros grandes, le gusta jugar con pelotas...">${UI.escapeHtml(dog?.behavior_notes || '')}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Restricciones m\u00e9dicas</label>
          <textarea id="dog-medical" placeholder="Ej: Al\u00e9rgico a ciertos medicamentos...">${UI.escapeHtml(dog?.medical_restrictions || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Restricciones alimentarias</label>
          <textarea id="dog-dietary" placeholder="Ej: Solo come alimento hipoalerg\u00e9nico...">${UI.escapeHtml(dog?.dietary_restrictions || '')}</textarea>
        </div>
      </div>

      <div style="display:flex;gap:20px;margin-top:4px;">
        <label class="form-check">
          <input type="checkbox" id="dog-neutered" ${dog?.is_neutered ? 'checked' : ''}>
          <span>Esterilizado/a</span>
        </label>
        <label class="form-check">
          <input type="checkbox" id="dog-vaccinated" ${dog?.vaccination_up_to_date ? 'checked' : ''}>
          <span>Vacunas al d\u00eda</span>
        </label>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="Dogs.saveDog('${dog?.id || ''}')">${isEdit ? 'Guardar Cambios' : '&#43; Registrar Perro'}</button>
    `;

    UI.openModal(isEdit ? `Editar: ${dog.name}` : 'Registrar Nuevo Perro', body, footer);

    // Toggle new owner fields
    document.getElementById('dog-owner').addEventListener('change', (e) => {
      document.getElementById('new-owner-fields').style.display = e.target.value === '__new__' ? 'block' : 'none';
    });
  }

  function previewPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      UI.toast('La imagen no puede superar 5MB', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('photo-preview').innerHTML = `<img src="${e.target.result}">`;
    };
    reader.readAsDataURL(file);
  }

  async function saveDog(dogId) {
    const name = document.getElementById('dog-name').value.trim();
    const breed = document.getElementById('dog-breed').value.trim();
    let ownerId = document.getElementById('dog-owner').value;
    const photoFile = document.getElementById('photo-input').files[0];

    if (!name) { UI.toast('El nombre es obligatorio', 'error'); return; }
    if (!breed) { UI.toast('La raza es obligatoria', 'error'); return; }
    if (!ownerId && ownerId !== '__new__') { UI.toast('Selecciona un due\u00f1o', 'error'); return; }

    try {
      // Create new owner if needed
      if (ownerId === '__new__') {
        const ownerName = document.getElementById('owner-name').value.trim();
        const ownerPhone = document.getElementById('owner-phone').value.trim();
        if (!ownerName || !ownerPhone) {
          UI.toast('Nombre y tel\u00e9fono del due\u00f1o son obligatorios', 'error');
          return;
        }
        const newOwner = await SupabaseClient.createOwner({
          name: ownerName,
          phone: ownerPhone,
          emergency_contact: document.getElementById('owner-emergency').value.trim() || null,
          emergency_phone: document.getElementById('owner-emergency-phone').value.trim() || null
        });
        ownerId = newOwner.id;
      }

      const dogData = {
        name,
        breed,
        owner_id: ownerId,
        age_years: parseInt(document.getElementById('dog-age-years').value) || 0,
        age_months: parseInt(document.getElementById('dog-age-months').value) || 0,
        weight_kg: parseFloat(document.getElementById('dog-weight').value) || null,
        behavior_notes: document.getElementById('dog-behavior').value.trim() || null,
        medical_restrictions: document.getElementById('dog-medical').value.trim() || null,
        dietary_restrictions: document.getElementById('dog-dietary').value.trim() || null,
        is_neutered: document.getElementById('dog-neutered').checked,
        vaccination_up_to_date: document.getElementById('dog-vaccinated').checked
      };

      // Upload photo
      if (photoFile) {
        const tempId = dogId || 'new_' + Date.now();
        dogData.photo_url = await SupabaseClient.uploadPhoto(photoFile, tempId);
      }

      if (dogId) {
        await SupabaseClient.updateDog(dogId, dogData);
        UI.toast(`${name} actualizado`);
      } else {
        await SupabaseClient.createDog(dogData);
        UI.toast(`${name} registrado`);
      }

      UI.closeModal();
      await loadDogs();
      Dashboard.loadStats();
    } catch (err) {
      console.error('Error saving dog:', err);
      UI.toast('Error al guardar: ' + (err.message || 'Error desconocido'), 'error');
    }
  }

  // ---- DOG DETAIL ----
  async function showDetail(dogId) {
    try {
      const [dog, history] = await Promise.all([
        SupabaseClient.getDog(dogId),
        SupabaseClient.getDogHistory(dogId)
      ]);
      const owner = dog.owners || {};
      const ageText = dog.age_years ? `${dog.age_years} a\u00f1o${dog.age_years > 1 ? 's' : ''}` : '';
      const ageMonths = dog.age_months ? `${dog.age_months} mes${dog.age_months > 1 ? 'es' : ''}` : '';
      const age = [ageText, ageMonths].filter(Boolean).join(', ') || 'No registrada';

      const body = `
        <div class="dog-detail-header">
          <div class="dog-detail-photo">
            ${dog.photo_url ? `<img src="${UI.escapeHtml(dog.photo_url)}" alt="${UI.escapeHtml(dog.name)}">` : '&#128054;'}
          </div>
          <div>
            <h2 style="font-size:1.5rem;font-weight:800;">${UI.escapeHtml(dog.name)}</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;">${UI.escapeHtml(dog.breed)} &middot; ${age}</p>
            <div style="margin-top:8px;display:flex;gap:6px;">
              ${dog.vaccination_up_to_date ? '<span class="meta-tag" style="color:#16a34a;">&#10003; Vacunas al d\u00eda</span>' : '<span class="meta-tag" style="color:#dc2626;">&#10007; Vacunas pendientes</span>'}
              ${dog.is_neutered ? '<span class="meta-tag">Esterilizado</span>' : ''}
              ${dog.weight_kg ? `<span class="meta-tag">${dog.weight_kg} kg</span>` : ''}
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>&#128100; Informaci\u00f3n del Due\u00f1o</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Nombre</label>
              <span>${UI.escapeHtml(owner.name || 'N/A')}</span>
            </div>
            <div class="detail-item">
              <label>Tel\u00e9fono</label>
              <span>${UI.escapeHtml(owner.phone || 'N/A')}</span>
            </div>
            <div class="detail-item">
              <label>Contacto Emergencia</label>
              <span>${UI.escapeHtml(owner.emergency_contact || 'No registrado')}</span>
            </div>
            <div class="detail-item">
              <label>Tel. Emergencia</label>
              <span>${UI.escapeHtml(owner.emergency_phone || 'No registrado')}</span>
            </div>
          </div>
        </div>

        ${dog.behavior_notes || dog.medical_restrictions || dog.dietary_restrictions ? `
        <div class="detail-section">
          <h4>&#128203; Notas Importantes</h4>
          ${dog.behavior_notes ? `<div class="detail-item" style="margin-bottom:10px;"><label>Comportamiento</label><span>${UI.escapeHtml(dog.behavior_notes)}</span></div>` : ''}
          ${dog.medical_restrictions ? `<div class="detail-item" style="margin-bottom:10px;"><label>Restricciones M\u00e9dicas</label><span style="color:#dc2626;">${UI.escapeHtml(dog.medical_restrictions)}</span></div>` : ''}
          ${dog.dietary_restrictions ? `<div class="detail-item"><label>Restricciones Alimentarias</label><span style="color:#f59e0b;">${UI.escapeHtml(dog.dietary_restrictions)}</span></div>` : ''}
        </div>` : ''}

        <div class="detail-section">
          <h4>&#128197; Historial de Visitas (${history.length})</h4>
          <div class="history-list">
            ${history.length > 0 ? `
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr>
                    <th style="padding:8px;text-align:left;font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Fecha</th>
                    <th style="padding:8px;text-align:left;font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Entrada</th>
                    <th style="padding:8px;text-align:left;font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Salida</th>
                    <th style="padding:8px;text-align:left;font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Duraci\u00f3n</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.map(h => {
                    const duration = h.check_out_time
                      ? UI.timeAgo(h.check_in_time).replace(UI.timeAgo(h.check_in_time), (() => {
                          const diff = new Date(h.check_out_time) - new Date(h.check_in_time);
                          const hrs = Math.floor(diff / 3600000);
                          const mins = Math.floor((diff % 3600000) / 60000);
                          return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                        })())
                      : '<span style="color:var(--primary);">En curso</span>';
                    return `
                      <tr style="border-top:1px solid var(--border-light);">
                        <td style="padding:8px;font-size:0.8rem;">${UI.formatDate(h.check_in_time)}</td>
                        <td style="padding:8px;font-size:0.8rem;">${UI.formatTime(h.check_in_time)}</td>
                        <td style="padding:8px;font-size:0.8rem;">${h.check_out_time ? UI.formatTime(h.check_out_time) : '--'}</td>
                        <td style="padding:8px;font-size:0.8rem;">${duration}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:0.85rem;">Sin visitas registradas</p>'}
          </div>
        </div>
      `;

      const footer = `
        <button class="btn btn-secondary" onclick="UI.closeModal()">Cerrar</button>
        <button class="btn btn-primary" onclick="UI.closeModal(); Dogs.showEditModal('${dog.id}')">Editar Perfil</button>
      `;

      UI.openModal(`Perfil: ${dog.name}`, body, footer);
    } catch (err) {
      console.error('Error loading detail:', err);
      UI.toast('Error al cargar el perfil', 'error');
    }
  }

  function searchDogs(query) {
    renderDogs(query);
  }

  return {
    init, loadDogs, renderDogs, searchDogs,
    showCreateModal, showEditModal, saveDog,
    showDetail, previewPhoto
  };
})();
