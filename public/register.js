const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');
const uploadForm = document.getElementById('uploadForm');
const uploadMessage = document.getElementById('uploadMessage');
const filesTbody = document.getElementById('filesTbody');
const refreshFilesBtn = document.getElementById('refreshFiles');

function clearRegErrors() {
  ['fullNameError', 'emailError', 'passwordError', 'phoneError'].forEach((id) => setText(id, ''));
}

function validateRegForm() {
  clearRegErrors();
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value.trim();

  let valid = true;

  if (fullName.length < 3) {
    setText('fullNameError', 'Full name must be at least 3 characters.');
    valid = false;
  }

  if (!/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email)) {
    setText('emailError', 'Enter a valid email.');
    valid = false;
  }

  if (password.length < 6) {
    setText('passwordError', 'Password must be at least 6 characters.');
    valid = false;
  }

  if (!/^\d{10}$/.test(phone)) {
    setText('phoneError', 'Enter a valid 10-digit phone.');
    valid = false;
  }

  return valid;
}

async function loadFiles() {
  const res = await fetch('/api/files/list');
  const data = await res.json();
  const files = data.files || [];

  if (files.length === 0) {
    filesTbody.innerHTML = '<tr><td colspan="4" class="muted">No uploaded files yet.</td></tr>';
    return;
  }

  filesTbody.innerHTML = files
    .map(
      (file) => `
      <tr data-testid="file-row-${file.filename}">
        <td>${file.filename}</td>
        <td>${file.size}</td>
        <td>${new Date(file.modifiedAt).toLocaleString()}</td>
        <td><a href="/api/files/download/${encodeURIComponent(file.filename)}" data-testid="download-${file.filename}">Download</a></td>
      </tr>
    `
    )
    .join('');
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(registerMessage, '', '');
  if (!validateRegForm()) {
    showMessage(registerMessage, 'Please fix the validation errors.', 'error');
    return;
  }

  const formData = new FormData(registerForm);
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.errors) {
      setText('fullNameError', data.errors.fullName || '');
      setText('emailError', data.errors.email || '');
      setText('passwordError', data.errors.password || '');
      setText('phoneError', data.errors.phone || '');
    }
    showMessage(registerMessage, data.message || 'Registration failed.', 'error');
    return;
  }

  showMessage(registerMessage, 'Registration successful. You can now login.', 'success');
  registerForm.reset();
  await loadFiles();
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(uploadMessage, '', '');

  const formData = new FormData(uploadForm);
  const file = formData.get('file');
  if (!file || !file.name) {
    showMessage(uploadMessage, 'Choose a file before upload.', 'error');
    return;
  }

  const res = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();

  if (!res.ok) {
    showMessage(uploadMessage, data.message || 'Upload failed.', 'error');
    return;
  }

  showMessage(uploadMessage, `Uploaded: ${data.file.originalname}`, 'success');
  uploadForm.reset();
  await loadFiles();
});

refreshFilesBtn.addEventListener('click', loadFiles);

loadFiles();
