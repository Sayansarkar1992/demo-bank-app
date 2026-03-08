const txnMessage = document.getElementById('txnMessage');

function formatAmount(num) {
  return `INR ${Number(num).toFixed(2)}`;
}

function clearTxnErrors() {
  setText('amountError', '');
  setText('narrationError', '');
}

function validateTxnInput() {
  clearTxnErrors();
  const amount = Number(document.getElementById('amount').value);
  const narration = document.getElementById('narration').value.trim();
  let valid = true;

  if (!Number.isFinite(amount) || amount <= 0) {
    setText('amountError', 'Enter a valid amount greater than 0.');
    valid = false;
  }

  if (narration && narration.length < 3) {
    setText('narrationError', 'Narration must be at least 3 characters.');
    valid = false;
  }

  return {
    valid,
    payload: {
      amount,
      narration: narration || 'Manual transaction from current page'
    }
  };
}

async function loadCurrent() {
  const res = await fetch('/api/accounts/current', { headers: { ...authHeaders() } });
  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }
  const data = await res.json();
  setText('accNo', data.accountNumber);
  setText('accBalance', formatAmount(data.balance));
  setText('odLimit', formatAmount(data.overdraftLimit));

  const body = document.getElementById('txBody');
  body.innerHTML = data.transactions
    .map(
      (tx) => `
      <tr data-testid="current-tx-${tx.id}">
        <td>${tx.id}</td>
        <td>${tx.date}</td>
        <td>${tx.type}</td>
        <td>${tx.amount}</td>
        <td>${tx.narration}</td>
      </tr>
    `
    )
    .join('');
}

async function postTransaction(route) {
  const { valid, payload } = validateTxnInput();
  showMessage(txnMessage, '', '');
  if (!valid) {
    showMessage(txnMessage, 'Fix validation errors before submit.', 'error');
    return;
  }

  const res = await fetch(route, {
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
      setText('amountError', data.errors.amount || '');
      setText('narrationError', data.errors.narration || '');
    }
    showMessage(txnMessage, data.message || 'Transaction failed.', 'error');
    return;
  }

  showMessage(txnMessage, `${data.message} Updated balance: ${formatAmount(data.balance)}.`, 'success');
  document.getElementById('txnForm').reset();
  await loadCurrent();
}

async function downloadPassbook() {
  const res = await fetch('/api/accounts/current/passbook', {
    headers: { ...authHeaders() }
  });

  if (!res.ok) {
    showMessage(txnMessage, 'Passbook download failed.', 'error');
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'current-passbook.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showMessage(txnMessage, 'Passbook downloaded.', 'success');
}

document.getElementById('depositBtn').addEventListener('click', async () => {
  await postTransaction('/api/accounts/current/deposit');
});

document.getElementById('withdrawBtn').addEventListener('click', async () => {
  await postTransaction('/api/accounts/current/withdraw');
});

document.getElementById('passbookBtn').addEventListener('click', downloadPassbook);

(async function init() {
  const valid = await ensureLoggedIn(true);
  if (!valid) return;
  attachLogout('logoutBtn');
  await loadCurrent();
})();
