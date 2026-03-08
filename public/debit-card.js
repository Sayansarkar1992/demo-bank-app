const controlsForm = document.getElementById('debitControlsForm');
const controlsMessage = document.getElementById('controlsMessage');
const statusMessage = document.getElementById('statusMessage');
const txBody = document.getElementById('txBody');
const blockForm = document.getElementById('debitBlockForm');
const unblockForm = document.getElementById('debitUnblockForm');
const saveControlsBtn = controlsForm.querySelector('button[type="submit"]');
const blockBtn = blockForm.querySelector('button[type="submit"]');
const unblockBtn = unblockForm.querySelector('button[type="submit"]');

let currentCard = null;

function formatAmount(value) {
  return `INR ${Number(value).toFixed(2)}`;
}

function clearControlErrors() {
  setText('dailyAtmLimitError', '');
  setText('dailyPosLimitError', '');
}

function clearStatusErrors() {
  setText('blockReasonError', '');
  setText('unblockOtpError', '');
}

function renderTransactions(items) {
  if (!items || items.length === 0) {
    txBody.innerHTML = '<tr><td colspan="5" class="muted">No transactions found.</td></tr>';
    return;
  }

  txBody.innerHTML = items
    .map(
      (tx) => `
      <tr data-testid="debit-tx-${tx.id}">
        <td>${tx.id}</td>
        <td>${tx.date}</td>
        <td>${tx.merchant}</td>
        <td>${tx.mode}</td>
        <td>${formatAmount(tx.amount)}</td>
      </tr>
    `
    )
    .join('');
}

function applyCard(card) {
  currentCard = card;

  setText('cardNumber', card.cardNumberMasked || '-');
  setText('cardHolder', card.cardHolder || '-');
  setText('network', card.network || '-');
  setText('validThru', card.validThru || '-');
  setText('linkedAccount', card.linkedAccount || '-');
  setText('cardStatus', card.status || '-');

  document.getElementById('ctrlOnline').checked = !!card.controls.onlineTransactions;
  document.getElementById('ctrlContactless').checked = !!card.controls.contactlessPayments;
  document.getElementById('ctrlInternational').checked = !!card.controls.internationalUsage;
  document.getElementById('ctrlAtm').checked = !!card.controls.atmCashWithdrawal;
  document.getElementById('dailyAtmLimit').value = card.dailyAtmLimit;
  document.getElementById('dailyPosLimit').value = card.dailyPosLimit;

  const isBlocked = card.status === 'BLOCKED';
  saveControlsBtn.disabled = isBlocked;
  blockBtn.disabled = isBlocked;
  unblockBtn.disabled = !isBlocked;

  if (isBlocked) {
    showMessage(controlsMessage, 'Card is blocked. Unblock to change controls.', 'error');
  }

  renderTransactions(card.recentTransactions || []);
}

async function loadCard() {
  const res = await fetch('/api/cards/debit', { headers: { ...authHeaders() } });
  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }

  const card = await res.json();
  applyCard(card);
}

controlsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearControlErrors();
  showMessage(controlsMessage, '', '');

  const payload = {
    onlineTransactions: document.getElementById('ctrlOnline').checked,
    contactlessPayments: document.getElementById('ctrlContactless').checked,
    internationalUsage: document.getElementById('ctrlInternational').checked,
    atmCashWithdrawal: document.getElementById('ctrlAtm').checked,
    dailyAtmLimit: Number(document.getElementById('dailyAtmLimit').value),
    dailyPosLimit: Number(document.getElementById('dailyPosLimit').value)
  };

  const res = await fetch('/api/cards/debit/controls', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.errors) {
      setText('dailyAtmLimitError', data.errors.dailyAtmLimit || '');
      setText('dailyPosLimitError', data.errors.dailyPosLimit || '');
    }
    showMessage(controlsMessage, data.message || 'Unable to update controls.', 'error');
    return;
  }

  showMessage(controlsMessage, 'Debit card controls updated.', 'success');
  applyCard(data.card);
});

blockForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatusErrors();
  showMessage(statusMessage, '', '');

  const payload = {
    reason: document.getElementById('blockReason').value.trim()
  };

  const res = await fetch('/api/cards/debit/block', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.errors) {
      setText('blockReasonError', data.errors.reason || '');
    }
    showMessage(statusMessage, data.message || 'Unable to block card.', 'error');
    return;
  }

  showMessage(statusMessage, 'Debit card blocked successfully.', 'success');
  blockForm.reset();
  await loadCard();
});

unblockForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatusErrors();
  showMessage(statusMessage, '', '');

  const payload = {
    otp: document.getElementById('unblockOtp').value.trim()
  };

  const res = await fetch('/api/cards/debit/unblock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.errors) {
      setText('unblockOtpError', data.errors.otp || '');
    }
    showMessage(statusMessage, data.message || 'Unable to unblock card.', 'error');
    return;
  }

  showMessage(statusMessage, 'Debit card unblocked successfully.', 'success');
  unblockForm.reset();
  await loadCard();
});

document.getElementById('refreshTxBtn').addEventListener('click', loadCard);

(async function init() {
  const valid = await ensureLoggedIn(true);
  if (!valid) return;

  attachLogout('logoutBtn');
  await loadCard();
})();
