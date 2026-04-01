// ═══════════════════════════ CLIENTES ═══════════════════════════
let clientesOrdem = 'padrao';

function ordenarClientes(lista) {
  return [...lista].sort((a, b) => {
    if (clientesOrdem === 'az')       return a.nome.localeCompare(b.nome);
    if (clientesOrdem === 'za')       return b.nome.localeCompare(a.nome);
    if (clientesOrdem === 'cidade')   return (a.cidade||'').localeCompare(b.cidade||'');
    if (clientesOrdem === 'desconto') return (b.tem_desconto ? 1 : 0) - (a.tem_desconto ? 1 : 0);
    return a.id - b.id;
  });
}

async function carregarClientes(busca='') {
  const isCpf = /\d/.test(busca);
  const url = busca
    ? (isCpf ? `/clientes/?cpf=${encodeURIComponent(busca)}` : `/clientes/?nome=${encodeURIComponent(busca)}`)
    : '/clientes/';
  const res = await get(url);
  const tbody = document.getElementById('tb-clientes');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="empty-icon">👤</div><p>Nenhum cliente encontrado.</p></div></td></tr>`;
    return;
  }
  const lista = ordenarClientes(res.data);
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${c.id}</span></td>
      <td>${c.nome}</td>
      <td style="font-family:var(--font-mono);font-size:0.82rem">${c.cpf}</td>
      <td>${c.telefone || '—'}</td>
      <td>${c.cidade || '—'}</td>
      <td>${c.tem_desconto ? '<span class="badge badge-green">✓ 10%</span>' : '<span class="badge badge-gray">Sem desconto</span>'}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-sm btn-visualizar" onclick="visualizarCliente(${c.id})">👁 Ver</button>
          <button class="btn btn-sm" style="color:var(--gold);border:1px solid var(--gold);background:transparent" onclick="verPedidosCliente(${c.id})">🧾 Pedidos</button>
          <button class="btn btn-edit btn-sm" onclick="editarCliente(${c.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="removerCliente(${c.id},'${c.nome.replace(/'/g,"\\'")}')">Remover</button>
        </div>
      </td>
    </tr>`).join('');
}

async function visualizarCliente(id) {
  const res = await get(`/clientes/${id}`);
  if (!res.ok) { toast('Erro ao carregar cliente.','error'); return; }
  const c = res.data;
  const imgHtml = c.imagem
    ? `<img src="${c.imagem}" class="card-avatar-round">`
    : `<div class="card-avatar-round card-avatar-placeholder">👤</div>`;
  const descontos = [
    c.torce_flamengo    ? '🔴 Flamengo'    : null,
    c.assiste_one_piece ? '🏴‍☠️ One Piece' : null,
    c.de_sousa          ? '📍 De Sousa'    : null,
  ].filter(Boolean);
  abrirCardVisualizacao(`
    <div class="view-card">
      <div class="view-card-img-area">${imgHtml}</div>
      <div class="view-card-content">
        <div class="view-card-name">${c.nome}</div>
        <div class="view-card-id">Cliente #${c.id}</div>
        <div class="view-card-rows">
          <div class="view-row"><span class="view-label">CPF</span><span class="view-val mono">${c.cpf}</span></div>
          <div class="view-row"><span class="view-label">Telefone</span><span class="view-val">${c.telefone || '—'}</span></div>
          <div class="view-row"><span class="view-label">Email</span><span class="view-val">${c.email || '—'}</span></div>
          <div class="view-row"><span class="view-label">Cidade</span><span class="view-val">${c.cidade || '—'}</span></div>
          <div class="view-row"><span class="view-label">Desconto</span><span class="view-val">
            ${c.tem_desconto ? `<span class="badge badge-green">✓ 10% — ${descontos.join(', ')}</span>` : '<span class="badge badge-gray">Sem desconto</span>'}
          </span></div>
        </div>
      </div>
    </div>`);
}

async function salvarCliente() {
  const id = document.getElementById('cli-id').value;
  const fd = new FormData();
  fd.append('nome',              document.getElementById('cli-nome').value.trim());
  fd.append('cpf',               document.getElementById('cli-cpf').value.trim());
  fd.append('telefone',          document.getElementById('cli-telefone').value.trim());
  fd.append('email',             document.getElementById('cli-email').value.trim());
  fd.append('cidade',            document.getElementById('cli-cidade').value.trim());
  fd.append('torce_flamengo',    document.getElementById('cli-flamengo').checked);
  fd.append('assiste_one_piece', document.getElementById('cli-onepiece').checked);
  fd.append('de_sousa',          document.getElementById('cli-sousa').checked);
  if (!fd.get('nome') || !fd.get('cpf')) { toast('Nome e CPF são obrigatórios.','error'); return; }
  const imgFile = document.getElementById('cli-imagem').files[0];
  if (imgFile) fd.append('imagem', imgFile);
  const res = id ? await put(`/clientes/${id}`, fd) : await post('/clientes/', fd);
  if (res.ok) { toast(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success'); closeModal('modal-cliente'); carregarClientes(); }
  else toast('Erro: ' + res.error, 'error');
}

async function editarCliente(id) {
  const res = await get(`/clientes/${id}`);
  if (!res.ok) { toast('Erro ao carregar cliente.','error'); return; }
  const c = res.data;
  document.getElementById('cli-id').value          = c.id;
  document.getElementById('cli-nome').value        = c.nome;
  document.getElementById('cli-cpf').value         = c.cpf;
  document.getElementById('cli-telefone').value    = c.telefone || '';
  document.getElementById('cli-email').value       = c.email || '';
  document.getElementById('cli-cidade').value      = c.cidade || '';
  document.getElementById('cli-flamengo').checked  = c.torce_flamengo;
  document.getElementById('cli-onepiece').checked  = c.assiste_one_piece;
  document.getElementById('cli-sousa').checked     = c.de_sousa;
  if (c.imagem) {
    const prev = document.getElementById('cli-img-preview');
    prev.src = c.imagem; prev.style.display = 'block';
    document.querySelector('#modal-cliente .img-label-text').textContent = 'Trocar imagem...';
  }
  document.getElementById('modal-cliente-title').textContent = 'EDITAR CLIENTE';
  openModal('modal-cliente');
}

async function removerCliente(id, nome) {
  if (!await confirmar(`Remover o cliente "${nome}"?`)) return;
  const res = await del(`/clientes/${id}`);
  if (res.ok) { toast('Cliente removido.','success'); carregarClientes(); }
  else toast('Erro: ' + res.error, 'error');
}

document.getElementById('busca-cliente').addEventListener('input', e => carregarClientes(e.target.value));
document.getElementById('ordem-clientes').addEventListener('change', e => { clientesOrdem = e.target.value; carregarClientes(document.getElementById('busca-cliente').value); });
setupImagePreview('cli-imagem', 'cli-img-preview');

// ── HISTÓRICO DE PEDIDOS DO CLIENTE ──────────────────────────
async function verPedidosCliente(id) {
  const res = await get(`/parte2/clientes/${id}/pedidos`);
  if (!res.ok) { toast('Erro ao carregar pedidos.', 'error'); return; }
  const d = res.data;
  const c = d.cliente;

  const statusBadge = s => ({
    confirmado: '<span class="badge badge-green">Confirmado</span>',
    pendente:   '<span class="badge badge-gold">Pendente</span>',
    cancelado:  '<span class="badge badge-red">Cancelado</span>',
  }[s] || s);

  const pgIcon = f => ({ dinheiro:'💵', cartao:'💳', pix:'⚡', boleto:'📄', berries:'🫐' }[f] || f);

  const pedidosHtml = d.pedidos.length === 0
    ? `<div class="empty"><div class="empty-icon">🧾</div><p>Nenhum pedido realizado ainda.</p></div>`
    : d.pedidos.map(p => `
      <div class="pedido-card">
        <div class="pedido-header">
          <span class="pedido-id">#${p.venda_id}</span>
          <span style="font-size:0.82rem;color:var(--gray-400)">${p.data_venda}</span>
          ${statusBadge(p.status_pagamento)}
          <span style="margin-left:auto;font-family:var(--font-mono);color:var(--accent);font-weight:500">${fmt(p.total)}</span>
        </div>
        <div class="pedido-info">
          <span>${pgIcon(p.forma_pagamento)} ${p.forma_pagamento}</span>
          <span style="color:var(--gray-400)">Vendedor: ${p.vendedor_nome}</span>
          ${p.desconto_aplicado > 0 ? `<span class="badge badge-green">✓ ${p.desconto_aplicado}% desconto</span>` : ''}
        </div>
        <div class="pedido-itens">
          ${p.itens.map(i => `
            <div class="pedido-item">
              <span class="badge ${i.carro_id ? 'badge-green' : 'badge-blue'}">${i.carro_id ? 'carro' : 'produto'}</span>
              ${i.codigo_produto ? `<span class="pedido-cod">${i.codigo_produto}</span>` : ''}
              <span>${i.descricao}</span>
              <span style="margin-left:auto;font-family:var(--font-mono);color:var(--gray-400)">${i.quantidade}× ${fmt(i.preco_unit)}</span>
              <span style="font-family:var(--font-mono)">${fmt(i.subtotal)}</span>
            </div>`).join('')}
        </div>
      </div>`).join('');

  abrirCardVisualizacao(`
    <div class="view-card" style="min-width:520px">
      <div class="view-card-content" style="width:100%">
        <div class="view-card-name">${c.nome}</div>
        <div class="view-card-id">Histórico de Pedidos · ${d.total_pedidos} pedido(s)</div>
        <div style="display:flex;gap:1rem;margin:0.75rem 0;flex-wrap:wrap">
          <div style="background:var(--gray-700);padding:8px 16px;border-radius:8px;text-align:center">
            <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--gray-400);letter-spacing:1px">TOTAL PEDIDOS</div>
            <div style="font-family:var(--font-display);font-size:1.8rem;color:var(--white)">${d.total_pedidos}</div>
          </div>
          <div style="background:var(--gray-700);padding:8px 16px;border-radius:8px;text-align:center">
            <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--gray-400);letter-spacing:1px">TOTAL GASTO</div>
            <div style="font-family:var(--font-display);font-size:1.8rem;color:var(--accent)">${fmt(d.valor_total_gasto)}</div>
          </div>
          ${c.tem_desconto ? `<div style="background:rgba(44,182,125,0.15);padding:8px 16px;border-radius:8px;text-align:center;border:1px solid var(--green)">
            <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--green);letter-spacing:1px">DESCONTO</div>
            <div style="font-family:var(--font-display);font-size:1.8rem;color:var(--green)">10%</div>
          </div>` : ''}
        </div>
        <div style="max-height:400px;overflow-y:auto;padding-right:4px">${pedidosHtml}</div>
      </div>
    </div>`);
}
