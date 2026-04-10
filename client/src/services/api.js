const API_BASE = import.meta.env.VITE_API_BASE || '';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...authHeaders(headers),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    credentials: 'include',
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, headers) => request(path, { method: 'POST', body, headers }),
  put: (path, body, headers) => request(path, { method: 'PUT', body, headers }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export async function uploadResource(formData, onProgress) {
  const token = getToken();
  const url = `${API_BASE}/resources/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(xhr.responseText || '{}');
      } catch {
        payload = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
      } else {
        const err = new Error(payload?.message || `Upload failed (${xhr.status})`);
        err.status = xhr.status;
        err.data = payload;
        reject(err);
      }
    };
    xhr.onerror = () => {
      const err = new Error('Network error during upload');
      err.status = xhr.status;
      reject(err);
    };

    xhr.send(formData);
  });
}

export function setSession({ token, user }) {
  if (token) localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export async function validateStudentSession() {
  return api.get('/student-dashboard');
}

export async function validateTeacherSession() {
  return api.get('/teacher-dashboard');
}

export async function updateStudentProfile(profile) {
  return api.put('/student-profile', profile);
}

export async function deleteStudentAccount() {
  return api.delete('/student-account');
}

export async function getBookmarks() {
  return api.get('/bookmarks');
}

export async function addBookmark(resourceId) {
  return api.post('/bookmarks', { resourceId });
}

export async function removeBookmark(bookmarkId) {
  return api.delete(`/bookmarks/${bookmarkId}`);
}

export async function getTrendingResources(sortBy = 'downloads') {
  return api.get(`/resources/trending?sortBy=${encodeURIComponent(sortBy)}`);
}

export async function searchResources(query) {
  return api.get(`/resources/search?q=${encodeURIComponent(query)}`);
}

export async function getNotifications() {
  return api.get('/notifications');
}

export async function markNotificationRead(id) {
  return api.put(`/notifications/read/${id}`, {});
}

export async function trackDownload(resourceId) {
  return api.post(`/resources/${resourceId}/download`, {});
}
