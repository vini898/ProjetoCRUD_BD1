// ═══════════════════════════ PRODUTOS ═══════════════════════════
const CATEGORIAS = [
  'Som e Multimídia','Rodas e Pneus','Suspensão','Alarme e Segurança',
  'Estética e Pintura','Iluminação','Motor e Performance','Acessórios Internos','Outros'
];
let produtosOrdem = 'padrao';

function ordenarProdutos(lista) {
  return [...lista].sort((a, b) => {
    if (produtosOrdem === 'az')        return a.nome.localeCompare(b.nome);
    if (produtosOrdem === 'za')        return b.nome.localeCompare(a.nome);
    if (produtosOrdem === 'caro')      return b.preco - a.preco;
    if (produtosOrdem === 'barato')    return a.preco - b.preco;
    if (produtosOrdem === 'estoque_maior') return b.qtd_estoque - a.qtd_estoque;
    if (produtosOrdem === 'estoque_menor') return a.qtd_estoque - b.qtd_estoque;
    return a.id - b.id;
  });
}

async function carregarProdutos(busca='') {
  const nome     = busca || document.getElementById('busca-produto').value;
  const cat      = document.getElementById('filtro-categoria').value;
  const mari     = document.getElementById('filtro-mari').checked;
  const baixo    = document.getElementById('filtro-baixo').checked;
  const precoMin = document.getElementById('filtro-preco-min').value;
  const precoMax = document.getElementById('filtro-preco-max').value;

  let url = '/produtos/?';
  if (nome)     url += `nome=${encodeURIComponent(nome)}&`;
  if (cat)      url += `categoria=${encodeURIComponent(cat)}&`;
  if (mari)     url += `fabricado_mari=true&`;
  if (baixo)    url += `estoque_baixo=true&`;
  if (precoMin) url += `preco_min=${precoMin}&`;
  if (precoMax) url += `preco_max=${precoMax}&`;

  const res = await get(url);
  const tbody = document.getElementById('tb-produtos');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="empty-icon">🔧</div><p>Nenhum produto encontrado.</p></div></td></tr>`;
    return;
  }
  const lista = ordenarProdutos(res.data);
  tbody.innerHTML = lista.map(p => `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${p.id}</span></td>
      <td>${p.nome}</td>
      <td><span class="badge badge-blue">${p.categoria}</span></td>
      <td style="font-family:var(--font-mono)">${fmt(p.preco)}</td>
      <td><span class="${p.estoque_baixo && p.tem_estoque ? 'badge badge-gold' : p.tem_estoque ? 'badge badge-green' : 'badge badge-red'}">${p.qtd_estoque} un.</span></td>
      <td>${p.fabricado_mari ? '<span class="badge badge-gold">✓ Mari</span>' : '—'}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-sm btn-visualizar" onclick="visualizarProduto(${p.id})">👁 Ver</button>
          <button class="btn btn-edit btn-sm" onclick="editarProduto(${p.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="removerProduto(${p.id},'${p.nome.replace(/'/g,"\\'")}')">Remover</button>
        </div>
      </td>
    </tr>`).join('');
}

async function visualizarProduto(id) {
  const res = await get(`/produtos/${id}`);
  if (!res.ok) { toast('Erro ao carregar produto.','error'); return; }
  const p = res.data;
  const imgHtml = p.imagem
    ? `<img src="${p.imagem}" class="card-img-rect">`
    : `<div class="card-img-rect card-avatar-placeholder">🔧</div>`;
  const estoqueClass = p.estoque_baixo && p.tem_estoque ? 'badge-gold' : p.tem_estoque ? 'badge-green' : 'badge-red';
  abrirCardVisualizacao(`
    <div class="view-card">
      <div class="view-card-img-area">${imgHtml}</div>
      <div class="view-card-content">
        <div class="view-card-name">${p.nome}</div>
        <div class="view-card-id">Produto #${p.id}</div>
        <div class="view-card-rows">
          <div class="view-row"><span class="view-label">Categoria</span><span class="view-val"><span class="badge badge-blue">${p.categoria}</span></span></div>
          <div class="view-row"><span class="view-label">Preço</span><span class="view-val mono" style="color:var(--accent)">${fmt(p.preco)}</span></div>
          <div class="view-row"><span class="view-label">Estoque</span><span class="view-val"><span class="badge ${estoqueClass}">${p.qtd_estoque} un.</span></span></div>
          <div class="view-row"><span class="view-label">Valor total</span><span class="view-val mono">${fmt(p.valor_total_estoque)}</span></div>
          <div class="view-row"><span class="view-label">Fabricado em Mari</span><span class="view-val">${p.fabricado_mari ? '<span class="badge badge-gold">✓ Sim</span>' : 'Não'}</span></div>
          ${p.descricao ? `<div class="view-row"><span class="view-label">Descrição</span><span class="view-val">${p.descricao}</span></div>` : ''}
        </div>
      </div>
    </div>`);
}

async function salvarProduto() {
  const id = document.getElementById('pro-id').value;
  const fd = new FormData();
  fd.append('nome',           document.getElementById('pro-nome').value.trim());
  fd.append('categoria',      document.getElementById('pro-categoria').value);
  fd.append('preco',          document.getElementById('pro-preco').value);
  fd.append('qtd_estoque',    document.getElementById('pro-estoque').value || '0');
  fd.append('fabricado_mari', document.getElementById('pro-mari').checked);
  fd.append('descricao',      document.getElementById('pro-descricao').value.trim());
  if (!fd.get('nome') || !fd.get('categoria') || !fd.get('preco')) { toast('Nome, categoria e preço são obrigatórios.', 'error'); return; }
  const imgFile = document.getElementById('pro-imagem').files[0];
  if (imgFile) fd.append('imagem', imgFile);
  const res = id ? await put(`/produtos/${id}`, fd) : await post('/produtos/', fd);
  if (res.ok) { toast(id ? 'Produto atualizado!' : 'Produto cadastrado!', 'success'); closeModal('modal-produto'); carregarProdutos(); }
  else toast('Erro: ' + res.error, 'error');
}

async function editarProduto(id) {
  const res = await get(`/produtos/${id}`);
  if (!res.ok) { toast('Erro ao carregar produto.','error'); return; }
  const p = res.data;
  document.getElementById('pro-id').value        = p.id;
  document.getElementById('pro-nome').value      = p.nome;
  document.getElementById('pro-categoria').value = p.categoria;
  document.getElementById('pro-preco').value     = p.preco;
  document.getElementById('pro-estoque').value   = p.qtd_estoque;
  document.getElementById('pro-mari').checked    = p.fabricado_mari;
  document.getElementById('pro-descricao').value = p.descricao || '';
  if (p.imagem) {
    const prev = document.getElementById('pro-img-preview');
    prev.src = p.imagem; prev.style.display = 'block';
    document.querySelector('#modal-produto .img-label-text').textContent = 'Trocar imagem...';
  }
  document.getElementById('modal-produto-title').textContent = 'EDITAR PRODUTO';
  openModal('modal-produto');
}

async function removerProduto(id, nome) {
  if (!await confirmar(`Remover o produto "${nome}"?`)) return;
  const res = await del(`/produtos/${id}`);
  if (res.ok) { toast('Produto removido.','success'); carregarProdutos(); }
  else toast('Erro: ' + res.error, 'error');
}

function preencherCategorias() {
  [document.getElementById('pro-categoria'), document.getElementById('filtro-categoria')].forEach(sel => {
    if (!sel) return;
    CATEGORIAS.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat; sel.appendChild(opt);
    });
  });
}

document.getElementById('busca-produto').addEventListener('input', () => carregarProdutos());
document.getElementById('filtro-categoria').addEventListener('change', () => carregarProdutos());
document.getElementById('filtro-mari').addEventListener('change', () => carregarProdutos());
document.getElementById('filtro-baixo').addEventListener('change', () => carregarProdutos());
document.getElementById('filtro-preco-min').addEventListener('input', () => carregarProdutos());
document.getElementById('filtro-preco-max').addEventListener('input', () => carregarProdutos());
document.getElementById('ordem-produtos').addEventListener('change', e => { produtosOrdem = e.target.value; carregarProdutos(); });
preencherCategorias();
setupImagePreview('pro-imagem', 'pro-img-preview');
