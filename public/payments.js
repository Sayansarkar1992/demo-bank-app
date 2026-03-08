const paymentsForm = document.getElementById('paymentsForm');
const paymentsMessage = document.getElementById('paymentsMessage');
const beneficiarySelect = document.getElementById('beneficiaryId');
const beneficiariesBody = document.getElementById('beneficiariesBody');
const paymentsHistoryBody = document.getElementById('paymentsHistoryBody');

function formatAmount(value) {
  return `INR ${Number(value).toFixed(2)}`;
}

function clearErrors() {
  setText('beneficiaryError', '');
  setText('modeError', '');
  setText('amountError', '');
  setText('noteError', '');
}

function renderBeneficiaries(items) {
  if (!items || items.length === 0) {
    beneficiariesBody.innerHTML = '<tr><td colspan="4" class="muted">No beneficiaries found.</td></tr>';
    beneficiarySelect.innerHTML = '<option value="">No beneficiary available</option>';
    return;
  }

  beneficiarySelect.innerHTML =
    '<option value="">Select</option>' +
    items
      .map(
        (item) =>
          `<option value="${item.id}">${item.name} (${item.bank} • ${item.accountLast4})</option>`
      )
      .join('');

  beneficiariesBody.innerHTML = items
    .map(
      (item) => `
      <tr data-testid="beneficiary-${item.id}">
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.bank}</td>
        <td>XXXX${item.accountLast4}</td>
      </tr>
    `
    )
    .join('');
}

function renderHistory(items) {
  if (!items || items.length === 0) {
    paymentsHistoryBody.innerHTML = '<tr><td colspan="6" class="muted">No payment history.</td></tr>';
    return;
  }

  paymentsHistoryBody.innerHTML = items
    .map(
      (item) => `
      <tr data-testid="payment-${item.id}">
        <td>${item.id}</td>
        <td>${new Date(item.date).toLocaleString()}</td>
        <td>${item.beneficiary}</td>
        <td>${item.mode}</td>
        <td>${formatAmount(item.amount)}</td>
        <td>${item.status}</td>
      </tr>
    `
    )
    .join('');
}

async function loadBeneficiaries() {
  const res = await fetch('/api/payments/beneficiaries', { headers: { ...authHeaders() } });
  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }

  const data = await res.json();
  renderBeneficiaries(data.items || []);
}

async function loadHistory() {
  const res = await fetch('/api/payments/history', { headers: { ...authHeaders() } });
  if (!res.ok) return;

  const data = await res.json();
  renderHistory(data.items || []);
}

paymentsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();
  showMessage(paymentsMessage, '', '');

  const payload = {
    beneficiaryId: beneficiarySelect.value,
    mode: document.getElementById('paymentMode').value,
    amount: Number(document.getElementById('amount').value),
    note: document.getElementById('note').value.trim()
  };

  const res = await fetch('/api/payments/transfer', {
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
      setText('beneficiaryError', data.errors.beneficiaryId || '');
      setText('modeError', data.errors.mode || '');
      setText('amountError', data.errors.amount || '');
      setText('noteError', data.errors.note || '');
    }

    showMessage(paymentsMessage, data.message || 'Payment failed.', 'error');
    return;
  }

  showMessage(paymentsMessage, `Transfer successful. Ref: ${data.payment.id}`, 'success');
  paymentsForm.reset();
  await loadHistory();
});

document.getElementById('refreshHistoryBtn').addEventListener('click', loadHistory);

(async function init() {
  const valid = await ensureLoggedIn(true);
  if (!valid) return;

  attachLogout('logoutBtn');
  await loadBeneficiaries();
  await loadHistory();
})();
