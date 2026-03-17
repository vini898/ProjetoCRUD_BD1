// ═══════════════════════════ VENDEDORES ═══════════════════════════
let vendedoresOrdem = 'padrao';

function ordenarVendedores(lista) {
  return [...lista].sort((a, b) => {
    if (vendedoresOrdem === 'az')    return a.nome.localeCompare(b.nome);
    if (vendedoresOrdem === 'za')    return b.nome.localeCompare(a.nome);
    if (vendedoresOrdem === 'cargo') return a.cargo.localeCompare(b.cargo);
    return a.id - b.id;
  });
}

async function carregarVendedores(busca='') {
  const isCpf = /\d/.test(busca);
  const url = busca
    ? (isCpf ? `/vendedores/?cpf=${encodeURIComponent(busca)}` : `/vendedores/?nome=${encodeURIComponent(busca)}`)
    : '/vendedores/';
  const res = await get(url);
  const tbody = document.getElementById('tb-vendedores');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="empty-icon">🧑‍💼</div><p>Nenhum vendedor encontrado.</p></div></td></tr>`;
    return;
  }
  const lista = ordenarVendedores(res.data);
  tbody.innerHTML = lista.map(v => `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${v.id}</span></td>
      <td>${v.nome}</td>
      <td style="font-family:var(--font-mono);font-size:0.82rem">${v.cpf}</td>
      <td>${v.telefone || '—'}</td>
      <td><span class="badge badge-blue">${v.cargo}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn btn-sm btn-visualizar" onclick="visualizarVendedor(${v.id})">👁 Ver</button>
          <button class="btn btn-edit btn-sm" onclick="editarVendedor(${v.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="removerVendedor(${v.id},'${v.nome.replace(/'/g,"\\'")}')">Remover</button>
        </div>
      </td>
    </tr>`).join('');
}

async function visualizarVendedor(id) {
  const res = await get(`/vendedores/${id}`);
  if (!res.ok) { toast('Erro ao carregar vendedor.','error'); return; }
  const v = res.data;
  const imgHtml = v.imagem
    ? `<img src="${v.imagem}" class="card-avatar-round">`
    : `<div class="card-avatar-round card-avatar-placeholder">🧑‍💼</div>`;
  abrirCardVisualizacao(`
    <div class="view-card">
      <div class="view-card-img-area">${imgHtml}</div>
      <div class="view-card-content">
        <div class="view-card-name">${v.nome}</div>
        <div class="view-card-id">Vendedor #${v.id}</div>
        <div class="view-card-rows">
          <div class="view-row"><span class="view-label">CPF</span><span class="view-val mono">${v.cpf}</span></div>
          <div class="view-row"><span class="view-label">Telefone</span><span class="view-val">${v.telefone || '—'}</span></div>
          <div class="view-row"><span class="view-label">Cargo</span><span class="view-val"><span class="badge badge-blue">${v.cargo}</span></span></div>
        </div>
      </div>
    </div>`);
}

async function salvarVendedor() {
  const id = document.getElementById('ven-id').value;
  const fd = new FormData();
  fd.append('nome',     document.getElementById('ven-nome').value.trim());
  fd.append('cpf',      document.getElementById('ven-cpf').value.trim());
  fd.append('telefone', document.getElementById('ven-telefone').value.trim());
  fd.append('cargo',    document.getElementById('ven-cargo').value);
  if (!fd.get('nome') || !fd.get('cpf')) { toast('Nome e CPF são obrigatórios.','error'); return; }
  const imgFile = document.getElementById('ven-imagem').files[0];
  if (imgFile) fd.append('imagem', imgFile);
  const res = id ? await put(`/vendedores/${id}`, fd) : await post('/vendedores/', fd);
  if (res.ok) { toast(id ? 'Vendedor atualizado!' : 'Vendedor cadastrado!', 'success'); closeModal('modal-vendedor'); carregarVendedores(); }
  else toast('Erro: ' + res.error, 'error');
}

async function editarVendedor(id) {
  const res = await get(`/vendedores/${id}`);
  if (!res.ok) { toast('Erro ao carregar vendedor.','error'); return; }
  const v = res.data;
  document.getElementById('ven-id').value       = v.id;
  document.getElementById('ven-nome').value     = v.nome;
  document.getElementById('ven-cpf').value      = v.cpf;
  document.getElementById('ven-telefone').value = v.telefone || '';
  document.getElementById('ven-cargo').value    = v.cargo;
  if (v.imagem) {
    const prev = document.getElementById('ven-img-preview');
    prev.src = v.imagem; prev.style.display = 'block';
    document.querySelector('#modal-vendedor .img-label-text').textContent = 'Trocar imagem...';
  }
  document.getElementById('modal-vendedor-title').textContent = 'EDITAR VENDEDOR';
  openModal('modal-vendedor');
}

async function removerVendedor(id, nome) {
  if (!await confirmar(`Remover o vendedor "${nome}"?`)) return;
  const res = await del(`/vendedores/${id}`);
  if (res.ok) { toast('Vendedor removido.','success'); carregarVendedores(); }
  else toast('Erro: ' + res.error, 'error');
}

document.getElementById('busca-vendedor').addEventListener('input', e => carregarVendedores(e.target.value));
document.getElementById('ordem-vendedores').addEventListener('change', e => { vendedoresOrdem = e.target.value; carregarVendedores(document.getElementById('busca-vendedor').value); });
setupImagePreview('ven-imagem', 'ven-img-preview');

// ═══════════════════════════ DASHBOARD ═══════════════════════════
async function loadDashboard() {
  const res = await get('/relatorio/resumo');
  if (!res.ok) return;
  const d = res.data;

  // Cards de contagem
  document.getElementById('dash-clientes').textContent   = d.clientes;
  document.getElementById('dash-produtos').textContent   = d.produtos;
  document.getElementById('dash-carros').textContent     = d.carros;
  document.getElementById('dash-vendedores').textContent = d.vendedores;
  document.getElementById('dash-disponiveis').textContent  = d.carros_disponiveis;
  document.getElementById('dash-semestoque').textContent   = d.produtos_sem_estoque;

  // Cards de vendas
  document.getElementById('dash-total-vendas').textContent  = d.total_vendas ?? '—';
  document.getElementById('dash-receita-total').textContent = d.receita_total != null ? fmt(d.receita_total) : '—';
  document.getElementById('dash-vendas-mes').textContent    = d.vendas_mes ?? '—';
  document.getElementById('dash-receita-mes').textContent   = d.receita_mes  != null ? fmt(d.receita_mes)  : '—';
  document.getElementById('dash-produto-top').textContent   = d.produto_top  ?? '—';
  document.getElementById('dash-vendedor-top').textContent  = d.vendedor_top_mes ?? '—';
  document.getElementById('dash-pendentes').textContent     = d.vendas_pendentes ?? '0';
}

// ═══════════════════════════ RELATÓRIO ═══════════════════════════
async function loadRelatorio() {
  const [rCli, rPro, rCar, rVen] = await Promise.all([
    get('/relatorio/clientes'), get('/relatorio/produtos'),
    get('/relatorio/carros'),   get('/relatorio/vendedores'),
  ]);
  if (rCli.ok) {
    const d = rCli.data;
    document.getElementById('rel-cli-total').textContent       = d.total_cadastrados;
    document.getElementById('rel-cli-desconto').textContent    = d.com_desconto;
    document.getElementById('rel-cli-semdesconto').textContent = d.sem_desconto;
    document.getElementById('rel-cli-cidade-top').textContent  = d.cidade_com_mais_clientes || '—';
  }
  if (rPro.ok) {
    const d = rPro.data;
    document.getElementById('rel-pro-total').textContent   = d.total_cadastrados;
    document.getElementById('rel-pro-valor').textContent   = fmt(d.valor_total_estoque);
    document.getElementById('rel-pro-semest').textContent  = d.sem_estoque;
    document.getElementById('rel-pro-baixo').textContent   = d.estoque_baixo;
    document.getElementById('rel-pro-mari').textContent    = d.fabricados_mari;
    document.getElementById('rel-pro-critico').textContent = d.produto_estoque_critico || '—';
    const catDiv = document.getElementById('rel-pro-cat');
    catDiv.innerHTML = Object.entries(d.por_categoria)
      .map(([k,v]) => `<div class="rel-row"><span>${k}</span><span class="rel-val">${v}</span></div>`)
      .join('') || '<span style="color:var(--gray-400)">—</span>';
  }
  if (rCar.ok) {
    const d = rCar.data;
    document.getElementById('rel-car-total').textContent = d.total_cadastrados;
    document.getElementById('rel-car-disp').textContent  = d.disponiveis;
    document.getElementById('rel-car-vend').textContent  = d.vendidos;
    document.getElementById('rel-car-res').textContent   = d.reservados;
    document.getElementById('rel-car-valor').textContent = fmt(d.valor_estoque_disponivel);
    document.getElementById('rel-car-top').textContent   = d.carro_mais_caro || '—';
  }
  if (rVen.ok) {
    const d = rVen.data;
    document.getElementById('rel-ven-total').textContent = d.total_cadastrados;
    const carDiv = document.getElementById('rel-ven-cargo');
    carDiv.innerHTML = Object.entries(d.por_cargo)
      .map(([k,v]) => `<div class="rel-row"><span>${k}</span><span class="rel-val">${v}</span></div>`)
      .join('') || '<span style="color:var(--gray-400)">—</span>';
  }
}
