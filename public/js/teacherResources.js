/* global apiGet, apiPost, getToken, clearSession */

(function () {
  const RESOURCE_TYPES = [
    'Syllabus',
    'Lab Manual',
    'Textbook',
    'Assignment',
    'PYQ',
    'Microproject',
  ];

  const el = (id) => document.getElementById(id);

  // Selected filters for main resource browser
  let selectedDepartment = '';
  let selectedYear = null;
  let selectedType = RESOURCE_TYPES[0];

  let myResourcesCache = [];

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso || '';
    }
  }

  function setAlert(alertEl, type, message) {
    alertEl.textContent = message || '';
    if (type === 'error') alertEl.className = 'alert show error';
    else if (type === 'warn') alertEl.className = 'alert show warn';
    else alertEl.className = 'alert show success';
  }

  function clearAlert(alertEl) {
    alertEl.className = 'alert';
    alertEl.textContent = '';
  }

  function groupBySubject(resources) {
    const map = {};
    for (const r of resources) {
      const subj = r.subject || 'General';
      if (!map[subj]) map[subj] = [];
      map[subj].push(r);
    }
    return map;
  }

  function renderResourceList(resources) {
    const wrapper = el('resource-browser-results');
    wrapper.innerHTML = '';

    if (!resources || resources.length === 0) {
      wrapper.innerHTML = '<p style="color: var(--muted); margin: 0.75rem 0;">No resources found.</p>';
      return;
    }

    const grouped = groupBySubject(resources);
    const subjects = Object.keys(grouped).sort();

    for (const subject of subjects) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '1rem';

      const h = document.createElement('h3');
      h.style.margin = '0 0 0.75rem';
      h.style.fontSize = '1rem';
      h.textContent = subject;
      card.appendChild(h);

      for (const r of grouped[subject]) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.gap = '0.75rem';
        row.style.padding = '0.6rem 0';
        row.style.borderTop = '1px solid rgba(45, 58, 77, 0.7)';
        row.firstChild && (row.firstChild.style.borderTop = 'none');

        const left = document.createElement('div');
        left.style.minWidth = '0';

        const title = document.createElement('div');
        title.style.fontWeight = '700';
        title.style.marginBottom = '0.2rem';
        title.textContent = r.title || '(Untitled)';

        const meta = document.createElement('div');
        meta.style.color = 'var(--muted)';
        meta.style.fontSize = '0.875rem';
        meta.innerHTML = `Uploaded by <strong style="color: var(--text);">${(r.uploadedBy && r.uploadedBy.name) ? r.uploadedBy.name : 'Unknown'}</strong> • ${fmtDate(
          r.createdAt
        )}`;

        left.appendChild(title);
        left.appendChild(meta);

        const right = document.createElement('div');
        right.style.flex = '0 0 auto';

        const a = document.createElement('a');
        a.className = 'btn btn-secondary';
        a.style.display = 'inline-block';
        a.href = `/resources/${r._id}/view`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'View';

        right.appendChild(a);

        row.appendChild(left);
        row.appendChild(right);

        card.appendChild(row);
      }

      wrapper.appendChild(card);
    }
  }

  function renderMyUploads(resources) {
    myResourcesCache = resources || [];
    const wrapper = el('my-uploads');
    wrapper.innerHTML = '';

    if (!myResourcesCache.length) {
      wrapper.innerHTML = '<p style="color: var(--muted); margin: 0.75rem 0;">No uploads yet.</p>';
      return;
    }

    for (const r of myResourcesCache) {
      const row = document.createElement('div');
      row.className = 'card';
      row.style.marginBottom = '0.85rem';
      row.style.padding = '1rem';

      const top = document.createElement('div');
      top.style.display = 'flex';
      top.style.justifyContent = 'space-between';
      top.style.gap = '0.75rem';
      top.style.flexWrap = 'wrap';

      const left = document.createElement('div');
      left.style.minWidth = '0';
      left.style.flex = '1 1 auto';

      const title = document.createElement('div');
      title.style.fontWeight = '700';
      title.textContent = r.title || '(Untitled)';

      const meta = document.createElement('div');
      meta.style.color = 'var(--muted)';
      meta.style.fontSize = '0.875rem';
      meta.textContent = `${r.department} • Year ${r.year} • ${r.type} • ${r.subject} • ${fmtDate(r.createdAt)}`;

      left.appendChild(title);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '0.5rem';
      right.style.alignItems = 'center';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-secondary';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openEditModal(r));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-secondary';
      delBtn.style.borderColor = 'rgba(239, 68, 68, 0.7)';
      delBtn.style.color = '#fca5a5';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => deleteResource(r._id));

      right.appendChild(editBtn);
      right.appendChild(delBtn);

      top.appendChild(left);
      top.appendChild(right);
      row.appendChild(top);

      wrapper.appendChild(row);
    }
  }

  async function refreshBrowser() {
    if (!selectedDepartment || !selectedYear || !selectedType) return;

    el('resource-browser-loading').style.display = 'block';
    el('resource-browser-results').innerHTML = '';

    try {
      const { ok, data } = await apiGet(
        `/resources?department=${encodeURIComponent(
          selectedDepartment
        )}&year=${encodeURIComponent(selectedYear)}&type=${encodeURIComponent(selectedType)}`
      );
      if (!ok) {
        renderResourceList([]);
        setAlert(el('browser-alert'), 'error', data.message || 'Failed to load resources');
        return;
      }
      clearAlert(el('browser-alert'));
      renderResourceList(data.resources || []);
    } catch (e) {
      setAlert(el('browser-alert'), 'error', 'Network error while loading resources');
    } finally {
      el('resource-browser-loading').style.display = 'none';
    }
  }

  async function refreshMyUploads() {
    el('my-uploads-loading').style.display = 'block';
    el('my-uploads').innerHTML = '';
    try {
      const { ok, data } = await apiGet('/resources/my');
      if (!ok) {
        setAlert(el('my-alert'), 'error', data.message || 'Failed to load your uploads');
        return;
      }
      clearAlert(el('my-alert'));
      renderMyUploads(data.resources || []);
    } finally {
      el('my-uploads-loading').style.display = 'none';
    }
  }

  // Upload with progress bar (XHR so we can show upload progress)
  function uploadResourceWithProgress(formData) {
    return new Promise((resolve, reject) => {
      const token = getToken();
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/resources/upload');
      xhr.withCredentials = true;
      xhr.setRequestHeader('Accept', 'application/json');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        el('upload-progress-wrap').style.display = 'block';
        el('upload-progress-bar').style.width = `${percent}%`;
        el('upload-progress-text').textContent = `${percent}%`;
        el('upload-progress-text').style.display = 'block';
      };

      xhr.onload = () => {
        let payload = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = {};
        }

        if (xhr.status >= 200 && xhr.status < 300) return resolve(payload);
        reject({ status: xhr.status, data: payload });
      };

      xhr.onerror = () => reject({ status: xhr.status, data: {} });

      xhr.send(formData);
    });
  }

  function setUploadProgressReset() {
    el('upload-progress-wrap').style.display = 'none';
    el('upload-progress-bar').style.width = '0%';
    el('upload-progress-text').textContent = '0%';
    el('upload-progress-text').style.display = 'none';
  }

  async function submitUpload(e) {
    e.preventDefault();

    const fileInput = el('upload-file');
    const file = fileInput.files && fileInput.files[0];
    const title = el('upload-title').value.trim();
    const description = el('upload-description').value.trim();
    const department = el('upload-department').value.trim();
    const year = el('upload-year').value;
    const subject = el('upload-subject').value.trim();
    const type = el('upload-type').value;

    clearAlert(el('upload-alert'));

    if (!file) return setAlert(el('upload-alert'), 'error', 'Please choose a PDF file.');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return setAlert(el('upload-alert'), 'error', 'Only PDF files are allowed.');
    }
    if (!title || !department || !year || !subject || !type) {
      return setAlert(el('upload-alert'), 'error', 'Please fill all required fields.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('department', department);
    formData.append('year', year);
    formData.append('subject', subject);
    formData.append('type', type);

    const btn = el('upload-submit');
    btn.disabled = true;
    btn.textContent = 'Uploading...';
    setUploadProgressReset();

    try {
      const payload = await uploadResourceWithProgress(formData);
      setAlert(el('upload-alert'), 'success', payload.message || 'Upload successful');
      // Keep selection in sync for fast refresh
      selectedDepartment = department;
      selectedYear = Number(year);
      selectedType = type;
      await Promise.all([refreshBrowser(), refreshMyUploads()]);
      el('upload-form').reset();
      el('upload-department').value = department;
      setUploadProgressReset();
    } catch (err) {
      const msg = err && err.data && err.data.message ? err.data.message : 'Upload failed';
      setAlert(el('upload-alert'), 'error', msg);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Upload Resource';
    }
  }

  // Edit modal
  function openEditModal(resource) {
    el('edit-modal-backdrop').classList.add('show');
    el('edit-modal').classList.add('show');

    el('edit-id').value = resource._id;
    el('edit-title').value = resource.title || '';
    el('edit-description').value = resource.description || '';
    el('edit-department').value = resource.department || '';
    el('edit-year').value = String(resource.year || '');
    el('edit-subject').value = resource.subject || '';
    el('edit-type').value = resource.type || RESOURCE_TYPES[0];
    clearAlert(el('edit-alert'));
  }

  function closeEditModal() {
    el('edit-modal-backdrop').classList.remove('show');
    el('edit-modal').classList.remove('show');
    clearAlert(el('edit-alert'));
  }

  async function saveEditFetch(e) {
    e.preventDefault();
    clearAlert(el('edit-alert'));

    const id = el('edit-id').value;
    const body = {
      title: el('edit-title').value.trim(),
      description: el('edit-description').value.trim(),
      department: el('edit-department').value.trim(),
      year: Number(el('edit-year').value),
      subject: el('edit-subject').value.trim(),
      type: el('edit-type').value,
    };

    if (!body.title || !body.department || !body.year || !body.subject || !body.type) {
      return setAlert(el('edit-alert'), 'error', 'Please fill all required fields.');
    }

    const token = getToken();
    const res = await fetch(`/resources/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return setAlert(el('edit-alert'), 'error', data.message || 'Update failed');
    }

    closeEditModal();
    await Promise.all([refreshBrowser(), refreshMyUploads()]);
    setAlert(el('my-alert'), 'success', 'Resource updated.');
  }

  async function deleteResource(id) {
    const ok = window.confirm('Are you sure you want to delete this resource?');
    if (!ok) return;

    const token = getToken();
    const res = await fetch(`/resources/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return setAlert(el('my-alert'), 'error', data.message || 'Delete failed');
    }

    await Promise.all([refreshBrowser(), refreshMyUploads()]);
    setAlert(el('my-alert'), 'success', 'Resource deleted.');
  }

  function buildTypeButtons() {
    const wrap = el('type-buttons');
    wrap.innerHTML = '';

    for (const t of RESOURCE_TYPES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary';
      btn.style.width = 'auto';
      btn.style.borderColor = 'var(--border)';
      btn.textContent = t;

      // Show current selection (Syllabus by default)
      if (t === selectedType) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.background = 'rgba(59, 130, 246, 0.12)';
        btn.style.color = '#fff';
      }

      btn.addEventListener('click', () => {
        selectedType = t;
        const buttons = wrap.querySelectorAll('button');
        buttons.forEach((b) => {
          b.style.borderColor = 'var(--border)';
          b.style.background = 'transparent';
          b.style.color = 'var(--text)';
        });
        btn.style.borderColor = 'var(--accent)';
        btn.style.background = 'rgba(59, 130, 246, 0.12)';
        btn.style.color = '#fff';
        refreshBrowser();
      });
      wrap.appendChild(btn);
    }
  }

  function initYearCards() {
    const wrap = el('year-cards');
    const buttons = wrap.querySelectorAll('button[data-year]');
    buttons.forEach((b) => {
      b.addEventListener('click', () => {
        selectedYear = Number(b.dataset.year);
        buttons.forEach((x) => (x.style.borderColor = 'var(--border)'));
        b.style.borderColor = 'var(--accent)';
        refreshBrowser();
      });
    });
  }

  async function init() {
    const msg = el('msg');
    const content = el('content');

    if (!getToken()) {
      msg.textContent = 'Please log in.';
      msg.className = 'alert show error';
      setTimeout(() => (window.location.href = '/auth.html'), 1200);
      return;
    }

    const { ok, data } = await apiGet('/teacher-dashboard');
    if (!ok) {
      msg.textContent = data.message || 'Access denied';
      msg.className = 'alert show error';
      return;
    }

    msg.style.display = 'none';
    content.style.display = 'block';
    el('welcome').textContent =
      'Welcome, ' + (data.user && data.user.name ? data.user.name : 'Teacher');
    el('email').textContent = data.user ? data.user.email : '';

    // Default selection
    selectedType = RESOURCE_TYPES[0];

    buildTypeButtons();
    initYearCards();

    el('year-hint').style.display = 'none';

    // Department selection
    el('department-input').addEventListener('change', (e) => {
      selectedDepartment = e.target.value.trim();
      el('upload-department').value = selectedDepartment;
      refreshBrowser();
    });

    setUploadProgressReset();

    // Logout
    el('logout').addEventListener('click', async () => {
      await apiPost('/logout', {});
      clearSession();
      window.location.href = '/auth.html';
    });

    // Upload submit
    el('upload-form').addEventListener('submit', submitUpload);

    // Edit modal hooks
    el('edit-form').addEventListener('submit', saveEditFetch);
    el('edit-close').addEventListener('click', closeEditModal);
    el('edit-modal-backdrop').addEventListener('click', (e) => {
      if (e.target === el('edit-modal-backdrop')) closeEditModal();
    });

    await Promise.all([refreshMyUploads()]);
  }

  document.addEventListener('DOMContentLoaded', init);
})();

