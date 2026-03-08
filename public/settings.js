const kycMessage = document.getElementById('kycMessage');
const settingsMessage = document.getElementById('settingsMessage');

function clearKycErrors() {
  setText('kycDocumentError', '');
  setText('currentPhotoError', '');
}

async function loadKycStatus() {
  const res = await fetch('/api/kyc/status', { headers: { ...authHeaders() } });
  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }

  const data = await res.json();
  setText('kycStatus', data.kycStatus || '-');
  setText('kycProfileCompletion', `${data.profileCompletion || 0}%`);

  if (data.lastSubmission && data.lastSubmission.submittedAt) {
    setText('kycLastSubmission', new Date(data.lastSubmission.submittedAt).toLocaleString());
  } else {
    setText('kycLastSubmission', 'No submission yet');
  }
}

function applySettings(data) {
  const communication = data.communication || {};
  const security = data.security || {};
  const preferences = data.preferences || {};

  document.getElementById('emailAlerts').checked = !!communication.emailAlerts;
  document.getElementById('smsAlerts').checked = !!communication.smsAlerts;
  document.getElementById('pushAlerts').checked = !!communication.pushAlerts;
  document.getElementById('marketingOffers').checked = !!communication.marketingOffers;

  document.getElementById('twoFactorAuth').checked = !!security.twoFactorAuth;
  document.getElementById('loginAlerts').checked = !!security.loginAlerts;
  document.getElementById('transactionOtp').checked = !!security.transactionOtp;
  document.getElementById('biometricEnabled').checked = !!security.biometricEnabled;

  document.getElementById('language').value = preferences.language || 'English';
  document.getElementById('statementDelivery').value = preferences.statementDelivery || 'Email';
  document.getElementById('defaultAccount').value = preferences.defaultAccount || 'Savings';
}

async function loadSettings() {
  const res = await fetch('/api/settings', { headers: { ...authHeaders() } });
  if (!res.ok) return;

  const data = await res.json();
  applySettings(data);
}

document.getElementById('kycForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearKycErrors();
  showMessage(kycMessage, '', '');

  const documentFile = document.getElementById('kycDocument').files[0];
  const currentPhoto = document.getElementById('currentPhoto').files[0];
  let valid = true;

  if (!documentFile) {
    setText('kycDocumentError', 'KYC document upload is required.');
    valid = false;
  }

  if (!currentPhoto) {
    setText('currentPhotoError', 'Current photo upload is required.');
    valid = false;
  } else {
    const isPng = currentPhoto.type === 'image/png' || currentPhoto.name.toLowerCase().endsWith('.png');
    if (!isPng) {
      setText('currentPhotoError', 'Current photo must be a PNG file.');
      valid = false;
    }
  }

  if (!valid) {
    showMessage(kycMessage, 'KYC validation failed.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('kycDocument', documentFile);
  formData.append('currentPhoto', currentPhoto);

  const res = await fetch('/api/kyc/update', {
    method: 'POST',
    headers: {
      ...authHeaders()
    },
    body: formData
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.errors) {
      setText('kycDocumentError', data.errors.kycDocument || '');
      setText('currentPhotoError', data.errors.currentPhoto || '');
    }
    showMessage(kycMessage, data.message || 'KYC update failed.', 'error');
    return;
  }

  showMessage(kycMessage, `KYC update submitted. Ref: ${data.submission.id}`, 'success');
  document.getElementById('kycForm').reset();
  await loadKycStatus();
});

document.getElementById('settingsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(settingsMessage, '', '');

  const payload = {
    communication: {
      emailAlerts: document.getElementById('emailAlerts').checked,
      smsAlerts: document.getElementById('smsAlerts').checked,
      pushAlerts: document.getElementById('pushAlerts').checked,
      marketingOffers: document.getElementById('marketingOffers').checked
    },
    security: {
      twoFactorAuth: document.getElementById('twoFactorAuth').checked,
      loginAlerts: document.getElementById('loginAlerts').checked,
      transactionOtp: document.getElementById('transactionOtp').checked,
      biometricEnabled: document.getElementById('biometricEnabled').checked
    },
    preferences: {
      language: document.getElementById('language').value,
      statementDelivery: document.getElementById('statementDelivery').value,
      defaultAccount: document.getElementById('defaultAccount').value
    }
  };

  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    showMessage(settingsMessage, data.message || 'Failed to update settings.', 'error');
    return;
  }

  showMessage(settingsMessage, 'Settings updated successfully.', 'success');
  applySettings(data.settings || payload);
});

document.getElementById('reloadSettingsBtn').addEventListener('click', loadSettings);

(async function init() {
  const valid = await ensureLoggedIn(true);
  if (!valid) return;

  attachLogout('logoutBtn');
  await loadKycStatus();
  await loadSettings();
})();
