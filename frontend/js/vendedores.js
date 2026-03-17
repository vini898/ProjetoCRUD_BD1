// ═══════════════════════════ VENDEDORES ═══════════════════════════

async function carregarVendedores(busca='') {
  const url = busca ? `/vendedores/?nome=${encodeURIComponent(busca)}` : '/vendedores/';
  const res = await get(url);
  const tbody = document.getElementById('tb-vendedores');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty">
      <div class="empty-icon">🧑‍💼</div><p>Nenhum vendedor encontrado.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = res.data.map(v => `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${v.id}</span></td>
      <td>${v.nome}</td>
      <td style="font-family:var(--font-mono);font-size:0.82rem">${v.cpf}</td>
      <td>${v.telefone || '—'}</td>
      <td><span class="badge badge-blue">${v.cargo}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn btn-edit btn-sm" onclick="editarVendedor(${v.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="removerVendedor(${v.id},'${v.nome.replace(/'/g,"\\'")}')">Remover</button>
        </div>
      </td>
    </tr>`).join('');
}

async function salvarVendedor() {
  const id = document.getElementById('ven-id').value;
  const dados = {
    nome:     document.getElementById('ven-nome').value.trim(),
    cpf:      document.getElementById('ven-cpf').value.trim(),
    telefone: document.getElementById('ven-telefone').value.trim(),
    cargo:    document.getElementById('ven-cargo').value,
  };
  if (!dados.nome || !dados.cpf) { toast('Nome e CPF são obrigatórios.','error'); return; }
  const res = id ? await put(`/vendedores/${id}`, dados) : await post('/vendedores/', dados);
  if (res.ok) {
    toast(id ? 'Vendedor atualizado!' : 'Vendedor cadastrado!', 'success');
    closeModal('modal-vendedor');
    carregarVendedores();
  } else {
    toast('Erro: ' + res.error, 'error');
  }
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
  document.getElementById('modal-vendedor-title').textContent = 'EDITAR VENDEDOR';
  openModal('modal-vendedor');
}

async function removerVendedor(id, nome) {
  if (!confirmar(`Remover o vendedor "${nome}"?`)) return;
  const res = await del(`/vendedores/${id}`);
  if (res.ok) { toast('Vendedor removido.','success'); carregarVendedores(); }
  else toast('Erro: ' + res.error, 'error');
}

document.getElementById('busca-vendedor').addEventListener('input', e => {
  carregarVendedores(e.target.value);
});

// ═══════════════════════════ DASHBOARD ═══════════════════════════

async function loadDashboard() {
  const res = await get('/relatorio/resumo');
  if (!res.ok) return;
  const d = res.data;
  document.getElementById('dash-clientes').textContent  = d.clientes;
  document.getElementById('dash-produtos').textContent  = d.produtos;
  document.getElementById('dash-carros').textContent    = d.carros;
  document.getElementById('dash-vendedores').textContent= d.vendedores;
  document.getElementById('dash-disponiveis').textContent = d.carros_disponiveis;
  document.getElementById('dash-semestoque').textContent  = d.produtos_sem_estoque;
}

// ═══════════════════════════ RELATÓRIO ═══════════════════════════

async function loadRelatorio() {
  const [rCli, rPro, rCar, rVen] = await Promise.all([
    get('/relatorio/clientes'),
    get('/relatorio/produtos'),
    get('/relatorio/carros'),
    get('/relatorio/vendedores'),
  ]);

  // Clientes
  if (rCli.ok) {
    const d = rCli.data;
    document.getElementById('rel-cli-total').textContent       = d.total_cadastrados;
    document.getElementById('rel-cli-desconto').textContent    = d.com_desconto;
    document.getElementById('rel-cli-semdesconto').textContent = d.sem_desconto;
  }

  // Produtos
  if (rPro.ok) {
    const d = rPro.data;
    document.getElementById('rel-pro-total').textContent    = d.total_cadastrados;
    document.getElementById('rel-pro-valor').textContent    = fmt(d.valor_total_estoque);
    document.getElementById('rel-pro-semest').textContent   = d.sem_estoque;
    document.getElementById('rel-pro-baixo').textContent    = d.estoque_baixo;
    document.getElementById('rel-pro-mari').textContent     = d.fabricados_mari;
    const catDiv = document.getElementById('rel-pro-cat');
    catDiv.innerHTML = Object.entries(d.por_categoria)
      .map(([k,v]) => `<div class="rel-row"><span>${k}</span><span class="rel-val">${v}</span></div>`)
      .join('') || '<span style="color:var(--gray-400)">—</span>';
  }

  // Carros
  if (rCar.ok) {
    const d = rCar.data;
    document.getElementById('rel-car-total').textContent  = d.total_cadastrados;
    document.getElementById('rel-car-disp').textContent   = d.disponiveis;
    document.getElementById('rel-car-vend').textContent   = d.vendidos;
    document.getElementById('rel-car-res').textContent    = d.reservados;
    document.getElementById('rel-car-valor').textContent  = fmt(d.valor_estoque_disponivel);
  }

  // Vendedores
  if (rVen.ok) {
    const d = rVen.data;
    document.getElementById('rel-ven-total').textContent = d.total_cadastrados;
    const carDiv = document.getElementById('rel-ven-cargo');
    carDiv.innerHTML = Object.entries(d.por_cargo)
      .map(([k,v]) => `<div class="rel-row"><span>${k}</span><span class="rel-val">${v}</span></div>`)
      .join('') || '<span style="color:var(--gray-400)">—</span>';
  }
}
