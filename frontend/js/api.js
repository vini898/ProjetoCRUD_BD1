const API = 'http://localhost:5000/api';

// ── HTTP helpers com tratamento de erro ──────────────────────
async function get(url) {
  try {
    const r = await fetch(API + url);
    return await r.json();
  } catch (e) {
    toast('Servidor indisponível. Verifique se o Flask está rodando.', 'error');
    return { ok: false, error: e.message };
  }
}
async function post(url, body) {
  try {
    const opts = body instanceof FormData
      ? { method: 'POST', body }
      : { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) };
    return await (await fetch(API + url, opts)).json();
  } catch (e) {
    toast('Erro de conexão com o servidor.', 'error');
    return { ok: false, error: e.message };
  }
}
async function put(url, body) {
  try {
    const opts = body instanceof FormData
      ? { method: 'PUT', body }
      : { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) };
    return await (await fetch(API + url, opts)).json();
  } catch (e) {
    toast('Erro de conexão com o servidor.', 'error');
    return { ok: false, error: e.message };
  }
}
async function patch(url, body) {
  try {
    const r = await fetch(API + url, {
      method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    return await r.json();
  } catch (e) {
    toast('Erro de conexão com o servidor.', 'error');
    return { ok: false, error: e.message };
  }
}
async function del(url) {
  try {
    return await (await fetch(API + url, { method: 'DELETE' })).json();
  } catch (e) {
    toast('Erro de conexão com o servidor.', 'error');
    return { ok: false, error: e.message };
  }
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

// ── Modal genérico ───────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.querySelectorAll(`#${id} input, #${id} select, #${id} textarea`)
    .forEach(el => { if(el.type==='checkbox') el.checked=false; else el.value=''; });
  const preview = document.querySelector(`#${id} .img-preview`);
  if (preview) { preview.src=''; preview.style.display='none'; }
  const hidLabel = document.querySelector(`#${id} .img-label-text`);
  if (hidLabel) hidLabel.textContent = 'Escolher imagem...';
  const hid = document.querySelector(`#${id} [name="id"], #${id} [id$="-id"]`);
  if(hid) hid.value = '';
}

// ── Modal de confirmação customizado ────────────────────────
let _confirmResolve = null;
function confirmar(msg) {
  return new Promise(resolve => {
    _confirmResolve = resolve;
    document.getElementById('confirm-msg').textContent = msg;
    document.getElementById('modal-confirm').classList.add('open');
  });
}
function _confirmOk()    { document.getElementById('modal-confirm').classList.remove('open'); if(_confirmResolve) _confirmResolve(true);  }
function _confirmCancel(){ document.getElementById('modal-confirm').classList.remove('open'); if(_confirmResolve) _confirmResolve(false); }

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

// ── Preview de imagem ─────────────────────────────────────────
function setupImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    const label = input.closest('.img-upload-wrap')?.querySelector('.img-label-text');
    if (file && preview) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = 'block';
      if (label) label.textContent = file.name;
    }
  });
}

// ── Card de visualização ──────────────────────────────────────
function abrirCardVisualizacao(html) {
  document.getElementById('card-view-body').innerHTML = html;
  document.getElementById('modal-card-view').classList.add('open');
}
function fecharCardVisualizacao() {
  document.getElementById('modal-card-view').classList.remove('open');
}
