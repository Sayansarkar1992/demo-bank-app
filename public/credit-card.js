const paymentForm = document.getElementById('paymentForm');
const paymentMessage = document.getElementById('paymentMessage');

const applyCardForm = document.getElementById('applyCardForm');
const applyCardMessage = document.getElementById('applyCardMessage');
const upgradeCardForm = document.getElementById('upgradeCardForm');
const upgradeMessage = document.getElementById('upgradeMessage');
const statementMessage = document.getElementById('statementMessage');
const controlsMessage = document.getElementById('controlsMessage');
const cardStatusMessage = document.getElementById('cardStatusMessage');

const requestedCardTypeSelect = document.getElementById('requestedCardType');
const upgradeTargetSelect = document.getElementById('upgradeTarget');
const unbilledBody = document.getElementById('unbilledBody');
const offerBanner = document.getElementById('offerBanner');

const blockCardForm = document.getElementById('cardBlockForm');
const unblockCardForm = document.getElementById('cardUnblockForm');
const blockCardButton = blockCardForm.querySelector('button[type="submit"]');
const unblockCardButton = unblockCardForm.querySelector('button[type="submit"]');
const paySubmitButton = paymentForm.querySelector('button[type="submit"]');

const offerPopup = document.getElementById('offerPopup');
const offerPopupTitle = document.getElementById('offerPopupTitle');
const offerPopupText = document.getElementById('offerPopupText');
const offerPopupCta = document.getElementById('offerPopupCta');
const offerPopupClose = document.getElementById('offerPopupClose');

let currentCard = null;

function formatAmount(value) {
  return `INR ${Number(value).toFixed(2)}`;
}

function clearApplyErrors() {
  setText('applyTypeError', '');
  setText('applyIncomeError', '');
  setText('applyEmploymentError', '');
}

function clearUpgradeErrors() {
  setText('upgradeError', '');
}

function clearBlockErrors() {
  setText('blockReasonError', '');
}

function clearUnblockErrors() {
  setText('unblockOtpError', '');
}

function setDropdownOptions(selectEl, options, selectedValue) {
  selectEl.innerHTML = options
    .map((value) => `<option value="${value}" ${value === selectedValue ? 'selected' : ''}>${value}</option>`)
    .join('');
}

function refreshActionAvailability() {
  const isBlocked = currentCard && currentCard.status === 'BLOCKED';
  blockCardButton.disabled = !!isBlocked;
  unblockCardButton.disabled = !isBlocked;
  paySubmitButton.disabled = !!isBlocked;

  if (isBlocked) {
    showMessage(paymentMessage, 'Card is blocked. Unblock to continue bill payment.', 'error');
  }
}

function loadCardSummary(card) {
  currentCard = card;
  setText('cardNumber', card.cardNumberMasked);
  setText('cardNumberDisplay', card.cardNumberMasked);
  setText('cardHolder', card.cardHolder || '-');
  setText('cardNetwork', card.network || '-');
  setText('cardValidThru', card.validThru || '-');
  setText('cardStatus', card.status || '-');
  setText('cardVariant', card.activeCardVariant || '-');
  setText('rewardPoints', card.rewardPoints || '0');
  setText('availableLimit', formatAmount(card.availableLimit));
  setText('totalLimit', formatAmount(card.totalLimit));
  setText('dueAmount', formatAmount(card.dueAmount));
  setText('dueDate', card.dueDate || '-');
  setText('statementMonth', (card.lastStatement && card.lastStatement.statementMonth) || '-');
  setText('billingPeriod', (card.lastStatement && card.lastStatement.billingPeriod) || '-');

  const cardTypes = card.availableCardTypes && card.availableCardTypes.length > 0 ? card.availableCardTypes : ['Classic'];
  setDropdownOptions(requestedCardTypeSelect, cardTypes, card.activeCardVariant || cardTypes[0]);

  const eligible = card.eligibleUpgradeVariants || [];
  if (eligible.length > 0) {
    upgradeTargetSelect.disabled = false;
    setDropdownOptions(upgradeTargetSelect, eligible, eligible[0]);
  } else {
    upgradeTargetSelect.disabled = true;
    upgradeTargetSelect.innerHTML = '<option value="">No upgrade available</option>';
  }

  setText('unbilledTotal', formatAmount(card.unbilledTotal || 0));
  refreshActionAvailability();
}

async function loadCard() {
  const res = await fetch('/api/cards/credit', { headers: { ...authHeaders() } });
  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }

  const card = await res.json();
  loadCardSummary(card);
}

async function loadUnbilledTransactions() {
  const res = await fetch('/api/cards/credit/unbilled-transactions', { headers: { ...authHeaders() } });
  if (!res.ok) {
    return;
  }

  const data = await res.json();
  const transactions = data.transactions || [];
  setText('unbilledTotal', formatAmount(data.totalAmount || 0));

  if (transactions.length === 0) {
    unbilledBody.innerHTML = '<tr><td colspan="5" class="muted">No unbilled transactions.</td></tr>';
    return;
  }

  unbilledBody.innerHTML = transactions
    .map(
      (tx) => `
      <tr data-testid="unbilled-${tx.id}">
        <td>${tx.id}</td>
        <td>${tx.date}</td>
        <td>${tx.merchant}</td>
        <td>${tx.category}</td>
        <td>${tx.amount}</td>
      </tr>
    `
    )
    .join('');
}

async function loadCardControls() {
  const res = await fetch('/api/cards/credit/controls', { headers: { ...authHeaders() } });
  if (!res.ok) return;

  const controls = await res.json();
  document.getElementById('ctrlOnline').checked = !!controls.onlineTransactions;
  document.getElementById('ctrlContactless').checked = !!controls.contactlessPayments;
  document.getElementById('ctrlInternational').checked = !!controls.internationalUsage;
  document.getElementById('ctrlAtm').checked = !!controls.atmCashWithdrawal;
}

function openOfferPopup(offer) {
  if (!offer) return;
  offerPopupTitle.textContent = offer.title;
  offerPopupText.textContent = `${offer.bannerText}. ${offer.description}`;
  offerPopupCta.href = offer.ctaLink || '/home.html';
  offerPopupCta.textContent = offer.ctaText || 'View Offer';
  offerPopup.classList.remove('hidden');
}

async function loadOffers() {
  const res = await fetch('/api/offers/active', { headers: { ...authHeaders() } });
  if (!res.ok) return;

  const data = await res.json();
  const offers = data.offers || [];

  if (offers.length === 0) {
    offerBanner.innerHTML = '<div class="card muted">No active offers currently.</div>';
    return;
  }

  offerBanner.innerHTML = offers
    .slice(0, 3)
    .map(
      (offer) => `
      <div class="card" data-testid="offer-${offer.id}">
        <h3>${offer.title}</h3>
        <div class="muted">${offer.bannerText}</div>
        <p>${offer.description}</p>
        <a class="button secondary" href="${offer.ctaLink}" target="_blank" rel="noreferrer">${offer.ctaText}</a>
      </div>
    `
    )
    .join('');

  const popupOffer = offers.find((offer) => offer.popup);
  if (popupOffer) {
    setTimeout(() => {
      openOfferPopup(popupOffer);
    }, 1200);
  }
}

applyCardForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearApplyErrors();
  showMessage(applyCardMessage, '', '');

  const payload = {
    requestedCardType: requestedCardTypeSelect.value,
    monthlyIncome: Number(document.getElementById('monthlyIncome').value),
    employmentType: document.getElementById('employmentType').value
  };

  const res = await fetch('/api/cards/credit/apply', {
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
      setText('applyTypeError', data.errors.requestedCardType || '');
      setText('applyIncomeError', data.errors.monthlyIncome || '');
      setText('applyEmploymentError', data.errors.employmentType || '');
    }
    showMessage(applyCardMessage, data.message || 'Credit card application failed.', 'error');
    return;
  }

  showMessage(applyCardMessage, `Application ${data.application.id} submitted successfully.`, 'success');
  applyCardForm.reset();
  await loadCard();
});

upgradeCardForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearUpgradeErrors();
  showMessage(upgradeMessage, '', '');

  const payload = { targetVariant: upgradeTargetSelect.value };
  const res = await fetch('/api/cards/credit/upgrade', {
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
      setText('upgradeError', data.errors.targetVariant || '');
    }
    showMessage(upgradeMessage, data.message || 'Upgrade failed.', 'error');
    return;
  }

  showMessage(upgradeMessage, `Upgrade successful: ${data.upgrade.fromVariant} to ${data.upgrade.toVariant}.`, 'success');
  await loadCard();
});

document.getElementById('downloadStatementBtn').addEventListener('click', async () => {
  showMessage(statementMessage, '', '');
  const res = await fetch('/api/cards/credit/statement/latest', {
    headers: { ...authHeaders() }
  });

  if (!res.ok) {
    showMessage(statementMessage, 'Statement download failed.', 'error');
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'credit-card-last-statement.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showMessage(statementMessage, 'Last statement downloaded.', 'success');
});

document.getElementById('refreshUnbilledBtn').addEventListener('click', loadUnbilledTransactions);

document.getElementById('cardControlsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(controlsMessage, '', '');

  const payload = {
    onlineTransactions: document.getElementById('ctrlOnline').checked,
    contactlessPayments: document.getElementById('ctrlContactless').checked,
    internationalUsage: document.getElementById('ctrlInternational').checked,
    atmCashWithdrawal: document.getElementById('ctrlAtm').checked
  };

  const res = await fetch('/api/cards/credit/controls', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    showMessage(controlsMessage, data.message || 'Unable to save controls.', 'error');
    return;
  }

  showMessage(controlsMessage, 'Card controls updated successfully.', 'success');
});

blockCardForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearBlockErrors();
  showMessage(cardStatusMessage, '', '');

  const payload = {
    reason: document.getElementById('blockReason').value.trim()
  };

  const res = await fetch('/api/cards/credit/block', {
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
    showMessage(cardStatusMessage, data.message || 'Unable to block card.', 'error');
    return;
  }

  showMessage(cardStatusMessage, 'Card blocked successfully.', 'success');
  blockCardForm.reset();
  await loadCard();
});

unblockCardForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearUnblockErrors();
  showMessage(cardStatusMessage, '', '');

  const payload = {
    otp: document.getElementById('unblockOtp').value.trim()
  };

  const res = await fetch('/api/cards/credit/unblock', {
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
    showMessage(cardStatusMessage, data.message || 'Unable to unblock card.', 'error');
    return;
  }

  showMessage(cardStatusMessage, 'Card unblocked successfully.', 'success');
  unblockCardForm.reset();
  await loadCard();
});

paymentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById('payAmount').value);
  setText('payAmountError', '');

  if (!Number.isFinite(amount) || amount <= 0) {
    setText('payAmountError', 'Enter a positive amount.');
    showMessage(paymentMessage, 'Payment validation failed.', 'error');
    return;
  }

  const mode = document.getElementById('paymentMode').value;
  const sourceAccount = document.getElementById('paymentSource').value;

  const res = await fetch('/api/cards/credit/pay-bill', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ amount, source: `${sourceAccount} via ${mode}` })
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.errors) {
      setText('payAmountError', data.errors.amount || '');
    }
    showMessage(paymentMessage, data.message || 'Payment failed.', 'error');
    return;
  }

  showMessage(paymentMessage, `Payment successful. Remaining due: ${formatAmount(data.dueAmount)}.`, 'success');
  paymentForm.reset();
  await loadCard();
});

offerPopupClose.addEventListener('click', () => {
  offerPopup.classList.add('hidden');
});

(async function init() {
  const valid = await ensureLoggedIn(true);
  if (!valid) return;
  attachLogout('logoutBtn');
  await loadCard();
  await loadUnbilledTransactions();
  await loadCardControls();
  await loadOffers();
})();
