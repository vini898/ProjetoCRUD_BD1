const API = 'http://localhost:5000/api';

async function get(url) {
  const r = await fetch(API + url);
  return r.json();
}

// Envia FormData (com possível arquivo) ou JSON
async function post(url, body) {
  if (body instanceof FormData) {
    const r = await fetch(API + url, { method: 'POST', body });
    return r.json();
  }
  const r = await fetch(API + url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  return r.json();
}

async function put(url, body) {
  if (body instanceof FormData) {
    const r = await fetch(API + url, { method: 'PUT', body });
    return r.json();
  }
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

// ── Toast ────────────────────────────────────────────────────
function toast(msg, type='') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Modal ────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.querySelectorAll(`#${id} input, #${id} select, #${id} textarea`)
    .forEach(el => { if(el.type==='checkbox') el.checked=false; else el.value=''; });
  // Limpa preview de imagem
  const preview = document.querySelector(`#${id} .img-preview`);
  if (preview) { preview.src=''; preview.style.display='none'; }
  const hidLabel = document.querySelector(`#${id} .img-label-text`);
  if (hidLabel) hidLabel.textContent = 'Escolher imagem...';
  const hid = document.querySelector(`#${id} [name="id"]`);
  if(hid) hid.value = '';
}

// ── Navegação ─────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelector(`.side-btn[data-page="${name}"]`)?.classList.add('active');
  if(name === 'dashboard') loadDashboard();
  if(name === 'relatorio') loadRelatorio();
}

function fmt(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function confirmar(msg) { return confirm(msg); }

// ── Preview de imagem nos formulários ─────────────────────────
function setupImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    const label = input.closest('.img-upload-wrap')?.querySelector('.img-label-text');
    if (file && preview) {
      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.style.display = 'block';
      if (label) label.textContent = file.name;
    }
  });
}

// ── Modal de visualização (card) ──────────────────────────────
function abrirCardVisualizacao(html) {
  document.getElementById('card-view-body').innerHTML = html;
  document.getElementById('modal-card-view').classList.add('open');
}
function fecharCardVisualizacao() {
  document.getElementById('modal-card-view').classList.remove('open');
}
