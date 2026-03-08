const faqList = document.getElementById('faqList');
const notesBody = document.getElementById('notesBody');
const supportNoteMessage = document.getElementById('supportNoteMessage');

function clearNoteErrors() {
  setText('noteCategoryError', '');
  setText('noteSubjectError', '');
  setText('noteBodyError', '');
}

function renderFaqs(items) {
  if (!items || items.length === 0) {
    faqList.innerHTML = '<div class="muted">No FAQs available.</div>';
    return;
  }

  faqList.innerHTML = items
    .map(
      (item) => `
      <details class="card" data-testid="faq-${item.id}">
        <summary><strong>${item.question}</strong></summary>
        <p>${item.answer}</p>
      </details>
    `
    )
    .join('');
}

function renderNotes(items) {
  if (!items || items.length === 0) {
    notesBody.innerHTML = '<tr><td colspan="5" class="muted">No notes submitted yet.</td></tr>';
    return;
  }

  notesBody.innerHTML = items
    .map(
      (item) => `
      <tr data-testid="note-${item.id}">
        <td>${item.id}</td>
        <td>${item.category}</td>
        <td>${item.subject}</td>
        <td>${item.status}</td>
        <td>${new Date(item.createdAt).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');
}

async function loadFaqs() {
  const res = await fetch('/api/support/faqs', { headers: { ...authHeaders() } });
  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }

  const data = await res.json();
  renderFaqs(data.items || []);
}

async function loadNotes() {
  const res = await fetch('/api/support/notes', { headers: { ...authHeaders() } });
  if (!res.ok) return;

  const data = await res.json();
  renderNotes(data.items || []);
}

document.getElementById('supportNoteForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNoteErrors();
  showMessage(supportNoteMessage, '', '');

  const payload = {
    category: document.getElementById('noteCategory').value,
    subject: document.getElementById('noteSubject').value.trim(),
    note: document.getElementById('noteBody').value.trim()
  };

  const res = await fetch('/api/support/drop-note', {
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
      setText('noteCategoryError', data.errors.category || '');
      setText('noteSubjectError', data.errors.subject || '');
      setText('noteBodyError', data.errors.note || '');
    }
    showMessage(supportNoteMessage, data.message || 'Unable to submit note.', 'error');
    return;
  }

  showMessage(supportNoteMessage, `Support note submitted: ${data.note.id}`, 'success');
  document.getElementById('supportNoteForm').reset();
  await loadNotes();
});

document.getElementById('refreshNotesBtn').addEventListener('click', loadNotes);

(async function init() {
  const valid = await ensureLoggedIn(true);
  if (!valid) return;

  attachLogout('logoutBtn');
  await loadFaqs();
  await loadNotes();
})();
