const summaryGrid = document.getElementById('summaryGrid');
const delayedBtn = document.getElementById('delayedBtn');
const delayedTarget = document.getElementById('delayedTarget');
const toggleHiddenBtn = document.getElementById('toggleHiddenBtn');
const hiddenElement = document.getElementById('hiddenElement');

const notificationsBody = document.getElementById('notificationsBody');
const serviceRequestsBody = document.getElementById('serviceRequestsBody');
const srMessage = document.getElementById('srMessage');
const offerBanner = document.getElementById('offerBanner');

const offerPopup = document.getElementById('offerPopup');
const offerPopupTitle = document.getElementById('offerPopupTitle');
const offerPopupText = document.getElementById('offerPopupText');
const offerPopupCta = document.getElementById('offerPopupCta');
const offerPopupClose = document.getElementById('offerPopupClose');
let popupQueue = [];
let popupCursor = 0;

function formatAmount(num) {
  return `INR ${Number(num).toFixed(2)}`;
}

function clearServiceRequestErrors() {
  setText('srCategoryError', '');
  setText('srSubjectError', '');
  setText('srDescriptionError', '');
}

async function loadSummary() {
  const res = await fetch('/api/accounts/summary', {
    headers: {
      ...authHeaders()
    }
  });

  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }

  const data = await res.json();

  const items = [
    {
      title: 'Savings',
      subtitle: data.savings.accountNumber,
      metric: `${data.savings.currency} ${data.savings.balance}`
    },
    {
      title: 'Current',
      subtitle: data.current.accountNumber,
      metric: `${data.current.currency} ${data.current.balance}`
    },
    {
      title: 'Loan',
      subtitle: `Active: ${data.loan.count}`,
      metric: `Outstanding ${data.loan.outstandingTotal}`
    },
    {
      title: 'Credit Card',
      subtitle: `${data.creditCard.cardNumberMasked} (${data.creditCard.status})`,
      metric: `Available ${data.creditCard.availableLimit} | Due ${data.creditCard.dueAmount}`
    },
    {
      title: 'Debit Card',
      subtitle: `${data.debitCard.cardNumberMasked} (${data.debitCard.status})`,
      metric: `Linked ${data.debitCard.linkedAccount} | ATM Limit ${data.debitCard.dailyAtmLimit}`
    }
  ];

  summaryGrid.innerHTML = items
    .map(
      (item, i) => `
      <div class="card" data-testid="summary-card-${i + 1}">
        <h3>${item.title}</h3>
        <div class="muted">${item.subtitle}</div>
        <div><strong>${item.metric}</strong></div>
      </div>
    `
    )
    .join('');
}

async function loadCustomerDashboard() {
  const res = await fetch('/api/customer/dashboard', {
    headers: {
      ...authHeaders()
    }
  });
  if (!res.ok) return;

  const data = await res.json();
  setText('kycStatus', data.kycStatus || '-');
  setText('profileCompletion', `${data.profileCompletion || 0}%`);
  setText('lastLogin', `${new Date(data.lastLoginAt).toLocaleString()} (${data.lastLoginLocation})`);
  setText('unreadCount', String(data.unreadNotifications || 0));
}

function renderNotifications(items) {
  if (!items || items.length === 0) {
    notificationsBody.innerHTML = '<tr><td colspan="5" class="muted">No notifications.</td></tr>';
    return;
  }

  notificationsBody.innerHTML = items
    .map(
      (item) => `
      <tr data-testid="notification-${item.id}">
        <td>${item.id}</td>
        <td>${item.title}<br /><small>${item.message}</small></td>
        <td>${item.priority}</td>
        <td>${item.read ? 'Read' : 'Unread'}</td>
        <td>
          ${
            item.read
              ? '<span class="muted">-</span>'
              : `<button class="secondary mark-read-btn" data-id="${item.id}" data-testid="mark-read-${item.id}">Mark Read</button>`
          }
        </td>
      </tr>
    `
    )
    .join('');
}

async function loadNotifications() {
  const res = await fetch('/api/notifications', { headers: { ...authHeaders() } });
  if (!res.ok) return;

  const data = await res.json();
  renderNotifications(data.items || []);
  await loadCustomerDashboard();
}

async function markNotificationAsRead(id) {
  const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
    headers: {
      ...authHeaders()
    }
  });

  if (!res.ok) return;
  await loadNotifications();
}

function renderServiceRequests(items) {
  if (!items || items.length === 0) {
    serviceRequestsBody.innerHTML = '<tr><td colspan="5" class="muted">No service requests.</td></tr>';
    return;
  }

  serviceRequestsBody.innerHTML = items
    .map(
      (item) => `
      <tr data-testid="service-request-${item.id}">
        <td>${item.id}</td>
        <td>${item.category}</td>
        <td>${item.subject}</td>
        <td>${item.priority}</td>
        <td>${item.status}</td>
      </tr>
    `
    )
    .join('');
}

async function loadServiceRequests() {
  const res = await fetch('/api/support/requests', { headers: { ...authHeaders() } });
  if (!res.ok) return;

  const data = await res.json();
  renderServiceRequests(data.items || []);
}

function openOfferPopup(offer) {
  if (!offer) return;
  offerPopupTitle.textContent = offer.title;
  offerPopupText.textContent = `${offer.bannerText}. ${offer.description}`;
  offerPopupCta.href = offer.ctaLink || '/home.html';
  offerPopupCta.textContent = offer.ctaText || 'View Offer';
  const remaining = popupQueue.length - popupCursor;
  offerPopupClose.textContent = remaining > 0 ? `Next Offer (${remaining})` : 'Close';
  offerPopup.classList.remove('hidden');
}

function openNextOfferPopup() {
  if (popupCursor >= popupQueue.length) {
    offerPopup.classList.add('hidden');
    return;
  }

  const offer = popupQueue[popupCursor];
  popupCursor += 1;
  openOfferPopup(offer);
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

  popupQueue = offers.filter((offer) => offer.popup);
  popupCursor = 0;
  if (popupQueue.length > 0) {
    setTimeout(() => {
      openNextOfferPopup();
    }, 1000);
  }
}

async function submitServiceRequest(event) {
  event.preventDefault();
  clearServiceRequestErrors();
  showMessage(srMessage, '', '');

  const payload = {
    category: document.getElementById('srCategory').value,
    priority: document.getElementById('srPriority').value,
    subject: document.getElementById('srSubject').value.trim(),
    description: document.getElementById('srDescription').value.trim()
  };

  const res = await fetch('/api/support/requests', {
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
      setText('srCategoryError', data.errors.category || '');
      setText('srSubjectError', data.errors.subject || '');
      setText('srDescriptionError', data.errors.description || '');
    }
    showMessage(srMessage, data.message || 'Unable to submit request.', 'error');
    return;
  }

  showMessage(srMessage, `Request ${data.request.id} submitted successfully.`, 'success');
  document.getElementById('serviceRequestForm').reset();
  await loadServiceRequests();
  await loadNotifications();
}

(async function init() {
  const valid = await ensureLoggedIn(true);
  if (!valid) return;

  const user = getUser();
  setText('loggedUser', user.email || 'unknown');
  attachLogout('logoutBtn');

  await loadSummary();
  await loadCustomerDashboard();
  await loadNotifications();
  await loadServiceRequests();
  await loadOffers();
})();

delayedBtn.addEventListener('click', () => {
  showMessage(delayedTarget, '', '');
  setTimeout(() => {
    showMessage(delayedTarget, 'Delayed element loaded after 2 seconds.', 'success');
  }, 2000);
});

toggleHiddenBtn.addEventListener('click', () => {
  hiddenElement.classList.toggle('hidden');
});

document.getElementById('refreshNotificationsBtn').addEventListener('click', loadNotifications);
document.getElementById('refreshServiceRequestsBtn').addEventListener('click', loadServiceRequests);
document.getElementById('serviceRequestForm').addEventListener('submit', submitServiceRequest);

notificationsBody.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains('mark-read-btn')) return;
  const id = target.getAttribute('data-id');
  if (!id) return;
  await markNotificationAsRead(id);
});

offerPopupClose.addEventListener('click', () => {
  offerPopup.classList.add('hidden');
  if (popupCursor < popupQueue.length) {
    setTimeout(() => {
      openNextOfferPopup();
    }, 450);
  }
});
