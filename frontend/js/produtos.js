// ═══════════════════════════ PRODUTOS ═══════════════════════════

const CATEGORIAS = [
  'Som e Multimídia','Rodas e Pneus','Suspensão','Alarme e Segurança',
  'Estética e Pintura','Iluminação','Motor e Performance','Acessórios Internos','Outros'
];

async function carregarProdutos(busca='') {
  const url = busca ? `/produtos/?nome=${encodeURIComponent(busca)}` : '/produtos/';
  const res = await get(url);
  const tbody = document.getElementById('tb-produtos');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty">
      <div class="empty-icon">🔧</div><p>Nenhum produto encontrado.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = res.data.map(p => `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${p.id}</span></td>
      <td>${p.nome}</td>
      <td><span class="badge badge-blue">${p.categoria}</span></td>
      <td style="font-family:var(--font-mono)">${fmt(p.preco)}</td>
      <td>
        <span class="${p.estoque_baixo && p.tem_estoque ? 'badge badge-gold' : p.tem_estoque ? 'badge badge-green' : 'badge badge-red'}">
          ${p.qtd_estoque} un.
        </span>
      </td>
      <td>${p.fabricado_mari ? '<span class="badge badge-gold">✓ Mari</span>' : '—'}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-edit btn-sm" onclick="editarProduto(${p.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="removerProduto(${p.id},'${p.nome.replace(/'/g,"\\'")}')">Remover</button>
        </div>
      </td>
    </tr>`).join('');
}

async function salvarProduto() {
  const id = document.getElementById('pro-id').value;
  const dados = {
    nome:           document.getElementById('pro-nome').value.trim(),
    categoria:      document.getElementById('pro-categoria').value,
    preco:          parseFloat(document.getElementById('pro-preco').value),
    qtd_estoque:    parseInt(document.getElementById('pro-estoque').value) || 0,
    fabricado_mari: document.getElementById('pro-mari').checked,
    descricao:      document.getElementById('pro-descricao').value.trim(),
  };
  if (!dados.nome || !dados.categoria || isNaN(dados.preco)) {
    toast('Nome, categoria e preço são obrigatórios.', 'error'); return;
  }
  const res = id ? await put(`/produtos/${id}`, dados) : await post('/produtos/', dados);
  if (res.ok) {
    toast(id ? 'Produto atualizado!' : 'Produto cadastrado!', 'success');
    closeModal('modal-produto');
    carregarProdutos();
  } else {
    toast('Erro: ' + res.error, 'error');
  }
}

async function editarProduto(id) {
  const res = await get(`/produtos/${id}`);
  if (!res.ok) { toast('Erro ao carregar produto.','error'); return; }
  const p = res.data;
  document.getElementById('pro-id').value          = p.id;
  document.getElementById('pro-nome').value        = p.nome;
  document.getElementById('pro-categoria').value   = p.categoria;
  document.getElementById('pro-preco').value       = p.preco;
  document.getElementById('pro-estoque').value     = p.qtd_estoque;
  document.getElementById('pro-mari').checked      = p.fabricado_mari;
  document.getElementById('pro-descricao').value   = p.descricao || '';
  document.getElementById('modal-produto-title').textContent = 'EDITAR PRODUTO';
  openModal('modal-produto');
}

async function removerProduto(id, nome) {
  if (!confirmar(`Remover o produto "${nome}"?`)) return;
  const res = await del(`/produtos/${id}`);
  if (res.ok) { toast('Produto removido.','success'); carregarProdutos(); }
  else toast('Erro: ' + res.error, 'error');
}

// Preenche select de categorias
function preencherCategorias() {
  const sel = document.getElementById('pro-categoria');
  CATEGORIAS.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    sel.appendChild(opt);
  });
}

document.getElementById('busca-produto').addEventListener('input', e => {
  carregarProdutos(e.target.value);
});

preencherCategorias();
