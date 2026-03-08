const loanForm = document.getElementById('loanForm');
const loanMessage = document.getElementById('loanMessage');
const prefillValid = document.getElementById('prefillValid');
const dropArea = document.getElementById('dropArea');
const dropResult = document.getElementById('dropResult');

class LoanShadowWidget extends HTMLElement {
  connectedCallback() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        .box { border: 1px solid #b9c7e5; padding: 10px; border-radius: 6px; background: #f6f9ff; }
        button { background: #0a66c2; color: #fff; border: 0; padding: 6px 10px; border-radius: 5px; cursor: pointer; }
        p { margin: 8px 0 0; font-size: 13px; }
      </style>
      <div class="box" part="container" data-testid="shadow-container">
        <button id="shadowAction" data-testid="shadow-button">Run Shadow Action</button>
        <p id="shadowStatus" data-testid="shadow-status">Waiting for action...</p>
      </div>
    `;

    const button = root.getElementById('shadowAction');
    const status = root.getElementById('shadowStatus');
    button.addEventListener('click', () => {
      status.textContent = `Shadow action executed at ${new Date().toLocaleTimeString()}`;
    });
  }
}

if (!customElements.get('loan-shadow-widget')) {
  customElements.define('loan-shadow-widget', LoanShadowWidget);
}

function clearLoanErrors() {
  setText('amountError', '');
  setText('tenureError', '');
  setText('purposeError', '');
}

function validateLoanForm() {
  clearLoanErrors();
  const amount = Number(document.getElementById('amount').value);
  const tenure = Number(document.getElementById('tenureMonths').value);
  const purpose = document.getElementById('purpose').value.trim();

  let valid = true;

  if (!Number.isFinite(amount) || amount < 10000) {
    setText('amountError', 'Amount should be at least 10000.');
    valid = false;
  }

  if (!Number.isInteger(tenure) || tenure < 6 || tenure > 360) {
    setText('tenureError', 'Tenure should be between 6 and 360 months.');
    valid = false;
  }

  if (purpose.length < 3) {
    setText('purposeError', 'Purpose is required.');
    valid = false;
  }

  return valid;
}

loanForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(loanMessage, '', '');

  if (!validateLoanForm()) {
    showMessage(loanMessage, 'Fix validation issues before submit.', 'error');
    return;
  }

  const payload = {
    loanType: document.getElementById('loanType').value,
    amount: Number(document.getElementById('amount').value),
    tenureMonths: Number(document.getElementById('tenureMonths').value),
    purpose: document.getElementById('purpose').value.trim()
  };

  const res = await fetch('/api/loans/apply', {
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
      setText('tenureError', data.errors.tenureMonths || '');
      setText('purposeError', data.errors.purpose || '');
    }
    showMessage(loanMessage, data.message || 'Loan submit failed.', 'error');
    return;
  }

  showMessage(loanMessage, `Application ${data.application.id} submitted with status ${data.application.status}.`, 'success');
  loanForm.reset();
});

prefillValid.addEventListener('click', () => {
  document.getElementById('loanType').value = 'Personal Loan';
  document.getElementById('amount').value = '250000';
  document.getElementById('tenureMonths').value = '36';
  document.getElementById('purpose').value = 'Automation testing loan form flow';
});

const dragItems = document.querySelectorAll('.drag-item');

dragItems.forEach((item) => {
  item.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', item.dataset.loan || 'Unknown Loan');
  });
});

dropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropArea.classList.add('over');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('over');
});

dropArea.addEventListener('drop', (event) => {
  event.preventDefault();
  dropArea.classList.remove('over');
  const dropped = event.dataTransfer.getData('text/plain');
  dropArea.textContent = `Selected Offer: ${dropped}`;
  showMessage(dropResult, `${dropped} dropped successfully.`, 'success');
  document.getElementById('loanType').value = dropped;
});

(async function init() {
  const valid = await ensureLoggedIn(true);
  if (!valid) return;
  attachLogout('logoutBtn');
})();
