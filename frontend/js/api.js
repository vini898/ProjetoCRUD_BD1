const API = 'http://localhost:5000/api';

// ── HTTP helpers ────────────────────────────────────────────
async function get(url) {
  const r = await fetch(API + url);
  return r.json();
}
async function post(url, body) {
  const r = await fetch(API + url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  return r.json();
}
async function put(url, body) {
  const r = await fetch(API + url, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  return r.json();
}
async function del(url) {
  const r = await fetch(API + url, { method: 'DELETE' });
  return r.json();
}

// ── Toast ───────────────────────────────────────────────────
function toast(msg, type='') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Modal ───────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.querySelectorAll(`#${id} input, #${id} select, #${id} textarea`)
    .forEach(el => { if(el.type==='checkbox') el.checked=false; else el.value=''; });
  const hid = document.querySelector(`#${id} [name="id"]`);
  if(hid) hid.value = '';
}

// ── Navegação ────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelector(`.side-btn[data-page="${name}"]`)?.classList.add('active');
  if(name === 'dashboard') loadDashboard();
  if(name === 'relatorio') loadRelatorio();
}

// ── Formatar moeda ────────────────────────────────────────────
function fmt(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// ── Confirmar exclusão ────────────────────────────────────────
function confirmar(msg) {
  return confirm(msg);
}
