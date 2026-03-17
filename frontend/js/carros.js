// ═══════════════════════════ CARROS ═══════════════════════════

async function carregarCarros(busca='') {
  const url = busca ? `/carros/?nome=${encodeURIComponent(busca)}` : '/carros/';
  const res = await get(url);
  const tbody = document.getElementById('tb-carros');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty">
      <div class="empty-icon">🚗</div><p>Nenhum veículo encontrado.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = res.data.map(c => {
    const statusBadge = {
      disponivel: '<span class="badge badge-green">Disponível</span>',
      vendido:    '<span class="badge badge-red">Vendido</span>',
      reservado:  '<span class="badge badge-gold">Reservado</span>',
    }[c.status] || c.status;
    return `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${c.id}</span></td>
      <td>${c.marca}</td>
      <td>${c.modelo}</td>
      <td style="font-family:var(--font-mono)">${c.ano}</td>
      <td>${c.cor || '—'}</td>
      <td style="font-family:var(--font-mono);color:var(--accent)">${fmt(c.preco)}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-edit btn-sm" onclick="editarCarro(${c.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="removerCarro(${c.id},'${c.marca} ${c.modelo}')">Remover</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function salvarCarro() {
  const id = document.getElementById('car-id').value;
  const dados = {
    marca:         document.getElementById('car-marca').value.trim(),
    modelo:        document.getElementById('car-modelo').value.trim(),
    ano:           parseInt(document.getElementById('car-ano').value) || 0,
    cor:           document.getElementById('car-cor').value.trim(),
    preco:         parseFloat(document.getElementById('car-preco').value),
    quilometragem: parseFloat(document.getElementById('car-km').value) || 0,
    status:        document.getElementById('car-status').value,
    descricao:     document.getElementById('car-descricao').value.trim(),
  };
  if (!dados.marca || !dados.modelo || isNaN(dados.preco)) {
    toast('Marca, modelo e preço são obrigatórios.', 'error'); return;
  }
  const res = id ? await put(`/carros/${id}`, dados) : await post('/carros/', dados);
  if (res.ok) {
    toast(id ? 'Veículo atualizado!' : 'Veículo cadastrado!', 'success');
    closeModal('modal-carro');
    carregarCarros();
  } else {
    toast('Erro: ' + res.error, 'error');
  }
}

async function editarCarro(id) {
  const res = await get(`/carros/${id}`);
  if (!res.ok) { toast('Erro ao carregar veículo.','error'); return; }
  const c = res.data;
  document.getElementById('car-id').value        = c.id;
  document.getElementById('car-marca').value     = c.marca;
  document.getElementById('car-modelo').value    = c.modelo;
  document.getElementById('car-ano').value       = c.ano;
  document.getElementById('car-cor').value       = c.cor || '';
  document.getElementById('car-preco').value     = c.preco;
  document.getElementById('car-km').value        = c.quilometragem || 0;
  document.getElementById('car-status').value    = c.status;
  document.getElementById('car-descricao').value = c.descricao || '';
  document.getElementById('modal-carro-title').textContent = 'EDITAR VEÍCULO';
  openModal('modal-carro');
}

async function removerCarro(id, nome) {
  if (!confirmar(`Remover o veículo "${nome}"?`)) return;
  const res = await del(`/carros/${id}`);
  if (res.ok) { toast('Veículo removido.','success'); carregarCarros(); }
  else toast('Erro: ' + res.error, 'error');
}

document.getElementById('busca-carro').addEventListener('input', e => {
  carregarCarros(e.target.value);
});
