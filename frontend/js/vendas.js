// ═══════════════════════════ VENDAS ═══════════════════════════

// Itens sendo montados para a nova venda
let novaVendaItens = [];
let _clientesCache = [];
let _vendedoresCache = [];
let _produtosCache = [];
let _carrosCache = [];

// ── Carregar listas de apoio ──────────────────────────────────
async function _carregarCaches() {
  const [rc, rv, rp, rca] = await Promise.all([
    get('/clientes/'), get('/vendedores/'),
    get('/produtos/'), get('/carros/?status=disponivel'),
  ]);
  _clientesCache  = rc.ok  ? rc.data  : [];
  _vendedoresCache= rv.ok  ? rv.data  : [];
  _produtosCache  = rp.ok  ? rp.data.filter(p => p.tem_estoque) : [];
  _carrosCache    = rca.ok ? rca.data : [];
}

function _popularSelect(id, lista, labelFn) {
  const sel = document.getElementById(id);
  sel.innerHTML = '<option value="">Selecione...</option>';
  lista.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = labelFn(item);
    sel.appendChild(opt);
  });
}

// ── Abrir modal de nova venda ─────────────────────────────────
async function abrirNovaVenda() {
  novaVendaItens = [];
  renderizarItens();
  document.getElementById('venda-obs').value = '';
  document.getElementById('venda-forma').value = 'dinheiro';
  document.getElementById('venda-cliente').value = '';
  document.getElementById('venda-vendedor').value = '';
  await _carregarCaches();
  _popularSelect('venda-cliente',  _clientesCache,   c => `${c.nome} ${c.tem_desconto ? '★ 10%' : ''}`);
  _popularSelect('venda-vendedor', _vendedoresCache, v => `${v.nome} — ${v.cargo}`);
  _popularSelect('item-produto-sel', _produtosCache, p => `${p.nome} (${p.qtd_estoque} un.) — ${fmt(p.preco)}`);
  _popularSelect('item-carro-sel',   _carrosCache,   c => `${c.marca} ${c.modelo} ${c.ano} — ${fmt(c.preco)}`);
  atualizarResumoVenda();
  openModal('modal-nova-venda');
}

// ── Troca entre adicionar produto/carro ──────────────────────
function trocarTipoItem(tipo) {
  document.getElementById('item-tipo-produto').classList.toggle('active', tipo === 'produto');
  document.getElementById('item-tipo-carro').classList.toggle('active', tipo === 'carro');
  document.getElementById('row-item-produto').style.display = tipo === 'produto' ? 'flex' : 'none';
  document.getElementById('row-item-carro').style.display   = tipo === 'carro'   ? 'flex' : 'none';
  document.getElementById('row-item-qtd').style.display     = tipo === 'produto' ? 'flex' : 'none';
  document.getElementById('item-tipo-atual').value = tipo;
}

// ── Adicionar item à lista ────────────────────────────────────
function adicionarItem() {
  const tipo = document.getElementById('item-tipo-atual').value;

  if (tipo === 'produto') {
    const selId = parseInt(document.getElementById('item-produto-sel').value);
    const qtd   = parseInt(document.getElementById('item-qtd').value) || 1;
    if (!selId) { toast('Selecione um produto.', 'error'); return; }
    const prod = _produtosCache.find(p => p.id === selId);
    if (!prod) return;
    if (qtd < 1) { toast('Quantidade mínima é 1.', 'error'); return; }
    // Soma se já existe na lista
    const existente = novaVendaItens.find(i => i.tipo === 'produto' && i.id === selId);
    if (existente) {
      const novaQtd = existente.quantidade + qtd;
      if (novaQtd > prod.qtd_estoque) {
        toast(`Estoque insuficiente. Máximo: ${prod.qtd_estoque} un.`, 'error'); return;
      }
      existente.quantidade = novaQtd;
    } else {
      if (qtd > prod.qtd_estoque) {
        toast(`Estoque insuficiente. Máximo: ${prod.qtd_estoque} un.`, 'error'); return;
      }
      novaVendaItens.push({ tipo: 'produto', id: selId, nome: prod.nome, preco: prod.preco, quantidade: qtd, estoque_max: prod.qtd_estoque });
    }

  } else {
    const selId = parseInt(document.getElementById('item-carro-sel').value);
    if (!selId) { toast('Selecione um veículo.', 'error'); return; }
    if (novaVendaItens.find(i => i.tipo === 'carro' && i.id === selId)) {
      toast('Este veículo já foi adicionado.', 'error'); return;
    }
    const carro = _carrosCache.find(c => c.id === selId);
    if (!carro) return;
    novaVendaItens.push({ tipo: 'carro', id: selId, nome: `${carro.marca} ${carro.modelo} ${carro.ano}`, preco: carro.preco, quantidade: 1 });
  }

  renderizarItens();
  atualizarResumoVenda();
}

function removerItem(idx) {
  novaVendaItens.splice(idx, 1);
  renderizarItens();
  atualizarResumoVenda();
}

function renderizarItens() {
  const tbody = document.getElementById('tb-itens-venda');
  if (!novaVendaItens.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:1.5rem">Nenhum item adicionado ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = novaVendaItens.map((item, idx) => `
    <tr>
      <td><span class="badge ${item.tipo === 'carro' ? 'badge-green' : 'badge-blue'}">${item.tipo}</span></td>
      <td>${item.nome}</td>
      <td style="font-family:var(--font-mono)">${item.quantidade}</td>
      <td style="font-family:var(--font-mono);color:var(--accent)">${fmt(item.preco)}</td>
      <td style="font-family:var(--font-mono)">${fmt(item.preco * item.quantidade)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="removerItem(${idx})">✕</button></td>
    </tr>`).join('');
}

function atualizarResumoVenda() {
  const clienteId = parseInt(document.getElementById('venda-cliente').value);
  const cliente   = _clientesCache.find(c => c.id === clienteId);
  const desconto  = cliente?.tem_desconto ? 10 : 0;

  const subtotal = novaVendaItens.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const valorDesc = subtotal * desconto / 100;
  const total = subtotal - valorDesc;

  document.getElementById('resumo-subtotal').textContent = fmt(subtotal);
  document.getElementById('resumo-desconto').textContent = desconto > 0 ? `−${fmt(valorDesc)} (${desconto}%)` : '—';
  document.getElementById('resumo-total').textContent    = fmt(total);

  if (desconto > 0) {
    document.getElementById('resumo-desconto-row').style.color = 'var(--green)';
    document.getElementById('aviso-desconto').style.display = 'block';
  } else {
    document.getElementById('aviso-desconto').style.display = 'none';
  }
}

// ── Finalizar venda ───────────────────────────────────────────
async function finalizarVenda() {
  const clienteId  = parseInt(document.getElementById('venda-cliente').value);
  const vendedorId = parseInt(document.getElementById('venda-vendedor').value);
  const forma      = document.getElementById('venda-forma').value;
  const obs        = document.getElementById('venda-obs').value.trim();

  if (!clienteId)  { toast('Selecione um cliente.', 'error');  return; }
  if (!vendedorId) { toast('Selecione um vendedor.', 'error'); return; }
  if (!novaVendaItens.length) { toast('Adicione pelo menos um item.', 'error'); return; }

  const payload = {
    cliente_id:      clienteId,
    vendedor_id:     vendedorId,
    forma_pagamento: forma,
    observacao:      obs,
    itens: novaVendaItens.map(i => ({
      tipo:       i.tipo,
      produto_id: i.tipo === 'produto' ? i.id : undefined,
      carro_id:   i.tipo === 'carro'   ? i.id : undefined,
      quantidade: i.quantidade,
    })),
  };

  const btn = document.getElementById('btn-finalizar-venda');
  btn.disabled = true; btn.textContent = 'Processando...';

  const res = await post('/vendas/', payload);
  btn.disabled = false; btn.textContent = '✓ Finalizar Venda';

  if (res.ok) {
    toast(`Venda #${res.data.id} registrada! Total: ${fmt(res.data.total)}`, 'success');
    closeModal('modal-nova-venda');
    carregarVendas();
  } else {
    toast('Erro: ' + res.error, 'error');
  }
}

// ── Listar vendas ─────────────────────────────────────────────
async function carregarVendas(busca='') {
  const res = await get('/vendas/');
  const tbody = document.getElementById('tb-vendas');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty"><div class="empty-icon">🧾</div><p>Nenhuma venda registrada ainda.</p></div></td></tr>`;
    return;
  }
  let lista = res.data;
  if (busca) lista = lista.filter(v =>
    v.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    v.vendedor_nome.toLowerCase().includes(busca.toLowerCase())
  );

  tbody.innerHTML = lista.map(v => {
    const stBadge = {
      confirmado: '<span class="badge badge-green">Confirmado</span>',
      pendente:   '<span class="badge badge-gold">Pendente</span>',
      cancelado:  '<span class="badge badge-red">Cancelado</span>',
    }[v.status_pagamento] || v.status_pagamento;

    const pgBadge = {
      dinheiro: '💵', cartao: '💳', pix: '⚡', boleto: '📄', berries: '🫐'
    }[v.forma_pagamento] || v.forma_pagamento;

    const acoes = v.status_pagamento !== 'cancelado' ? `
      ${v.requer_confirmacao && v.status_pagamento === 'pendente'
        ? `<button class="btn btn-sm" style="color:var(--green);border:1px solid var(--green)" onclick="confirmarPagamento(${v.id})">Confirmar</button>`
        : ''}
      <button class="btn btn-sm btn-visualizar" onclick="verDetalheVenda(${v.id})">👁 Ver</button>
      <button class="btn btn-danger btn-sm" onclick="cancelarVenda(${v.id})">Cancelar</button>
    ` : `<button class="btn btn-sm btn-visualizar" onclick="verDetalheVenda(${v.id})">👁 Ver</button>`;

    return `
    <tr style="${v.status_pagamento === 'cancelado' ? 'opacity:0.5' : ''}">
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${v.id}</span></td>
      <td>${v.data_venda}</td>
      <td>${v.cliente_nome}</td>
      <td>${v.vendedor_nome}</td>
      <td>${pgBadge} ${v.forma_pagamento}</td>
      <td>${stBadge}</td>
      <td style="font-family:var(--font-mono);color:var(--accent);font-weight:500">${fmt(v.total)}</td>
      <td><div class="td-actions">${acoes}</div></td>
    </tr>`;
  }).join('');
}

async function confirmarPagamento(id) {
  const res = await patch(`/vendas/${id}/status`, { status: 'confirmado' });
  if (res.ok) { toast('Pagamento confirmado!', 'success'); carregarVendas(); }
  else toast('Erro: ' + res.error, 'error');
}

async function cancelarVenda(id) {
  if (!await confirmar('Cancelar esta venda? O estoque será restaurado.')) return;
  const res = await del(`/vendas/${id}`);
  if (res.ok) { toast('Venda cancelada e estoque restaurado.', 'success'); carregarVendas(); }
  else toast('Erro: ' + res.error, 'error');
}

async function verDetalheVenda(id) {
  const res = await get(`/vendas/${id}`);
  if (!res.ok) { toast('Erro ao carregar venda.','error'); return; }
  const v = res.data;
  const stColor = { confirmado: 'var(--green)', pendente: 'var(--gold)', cancelado: 'var(--red)' }[v.status_pagamento] || 'var(--gray-400)';
  const pgIcon = { dinheiro: '💵', cartao: '💳', pix: '⚡', boleto: '📄', berries: '🫐' }[v.forma_pagamento] || '';

  const itensHtml = v.itens.map(i => `
    <div class="view-row">
      <span class="view-label"><span class="badge ${i.carro_id ? 'badge-green' : 'badge-blue'}">${i.carro_id ? 'carro' : 'produto'}</span> ${i.descricao}</span>
      <span class="view-val mono">${i.quantidade}× ${fmt(i.preco_unit)} = ${fmt(i.subtotal)}</span>
    </div>`).join('');

  abrirCardVisualizacao(`
    <div class="view-card">
      <div class="view-card-content" style="width:100%">
        <div class="view-card-name">Venda #${v.id}</div>
        <div class="view-card-id" style="margin-bottom:1rem">${v.data_venda}</div>
        <div class="view-card-rows">
          <div class="view-row"><span class="view-label">Cliente</span><span class="view-val">${v.cliente_nome}</span></div>
          <div class="view-row"><span class="view-label">Vendedor</span><span class="view-val">${v.vendedor_nome}</span></div>
          <div class="view-row"><span class="view-label">Pagamento</span><span class="view-val">${pgIcon} ${v.forma_pagamento}</span></div>
          <div class="view-row"><span class="view-label">Status</span><span class="view-val" style="color:${stColor};font-weight:500">${v.status_pagamento}</span></div>
        </div>
        <div style="margin:1rem 0 0.5rem;font-family:var(--font-mono);font-size:0.72rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--gray-400)">Itens</div>
        <div class="view-card-rows">${itensHtml}</div>
        <div style="border-top:1px solid var(--gray-600);margin-top:0.75rem;padding-top:0.75rem">
          <div class="view-row"><span class="view-label">Subtotal</span><span class="view-val mono">${fmt(v.subtotal_bruto)}</span></div>
          ${v.desconto_aplicado > 0 ? `<div class="view-row"><span class="view-label">Desconto (${v.desconto_aplicado}%)</span><span class="view-val mono" style="color:var(--green)">−${fmt(v.valor_desconto)}</span></div>` : ''}
          <div class="view-row"><span class="view-label" style="font-weight:500;color:var(--white)">Total</span><span class="view-val mono" style="color:var(--accent);font-size:1.1rem;font-weight:500">${fmt(v.total)}</span></div>
        </div>
        ${v.observacao ? `<div class="view-row" style="margin-top:0.5rem"><span class="view-label">Obs.</span><span class="view-val">${v.observacao}</span></div>` : ''}
      </div>
    </div>`);
}

document.getElementById('busca-venda').addEventListener('input', e => carregarVendas(e.target.value));
document.getElementById('venda-cliente').addEventListener('change', atualizarResumoVenda);
