const demoMessage = document.getElementById('demoMessage');
const loginMessage = document.getElementById('loginMessage');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginForm = document.getElementById('loginForm');
const btnDemoLogin = document.getElementById('btnDemoLogin');
const continueHome = document.getElementById('continueHome');

function clearErrors() {
  setText('emailError', '');
  setText('passwordError', '');
}

function validateForm() {
  clearErrors();
  let valid = true;

  if (!emailInput.value.trim()) {
    setText('emailError', 'Email is required.');
    valid = false;
  }

  if (!passwordInput.value.trim()) {
    setText('passwordError', 'Password is required.');
    valid = false;
  }

  return valid;
}

async function doDemoLogin(redirect) {
  const res = await fetch('/api/auth/demo-login', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    showMessage(demoMessage, data.message || 'Demo login failed.', 'error');
    return;
  }
  setSession(data.token, data.user);
  showMessage(demoMessage, 'Demo user is already signed in for this browser session.', 'success');
  continueHome.classList.remove('hidden');
  if (redirect) {
    setTimeout(() => {
      window.location.href = '/home.html';
    }, 700);
  }
}

btnDemoLogin.addEventListener('click', async () => {
  await doDemoLogin(true);
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(loginMessage, '', '');

  if (!validateForm()) {
    showMessage(loginMessage, 'Please fix validation errors.', 'error');
    return;
  }

  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    setText('emailError', data.errors && data.errors.email ? data.errors.email : '');
    setText('passwordError', data.errors && data.errors.password ? data.errors.password : '');
    showMessage(loginMessage, data.message || 'Login failed.', 'error');
    return;
  }

  setSession(data.token, data.user);
  showMessage(loginMessage, 'Login successful. Redirecting to Home...', 'success');
  setTimeout(() => {
    window.location.href = '/home.html';
  }, 500);
});

(function init() {
  emailInput.value = 'demo@bank.test';
  passwordInput.value = 'Demo@123';
  doDemoLogin(false).catch(() => {
    showMessage(demoMessage, 'Unable to auto-create demo session. Use the button above.', 'error');
  });
})();
