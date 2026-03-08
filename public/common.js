function getToken() {
  return localStorage.getItem('demoBankToken') || '';
}

function setSession(token, user) {
  localStorage.setItem('demoBankToken', token);
  localStorage.setItem('demoBankUser', JSON.stringify(user || {}));
}

function clearSession() {
  localStorage.removeItem('demoBankToken');
  localStorage.removeItem('demoBankUser');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('demoBankUser') || '{}');
  } catch (e) {
    return {};
  }
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function showMessage(el, message, type) {
  if (!el) return;
  el.textContent = message || '';
  el.className = `message ${type || ''}`.trim();
  if (!message) el.className = 'message hidden';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function ensureLoggedIn(redirectToLogin = true) {
  const token = getToken();
  if (!token) {
    if (redirectToLogin) window.location.href = '/login.html';
    return false;
  }
  const res = await fetch('/api/auth/me', { headers: { ...authHeaders() } });
  if (!res.ok) {
    clearSession();
    if (redirectToLogin) window.location.href = '/login.html';
    return false;
  }
  const user = await res.json();
  setSession(token, user);
  return true;
}

function attachLogout(buttonId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    clearSession();
    window.location.href = '/login.html';
  });
}
