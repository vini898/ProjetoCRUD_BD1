// ═══════════════════════════ CLIENTES ═══════════════════════════

async function carregarClientes(busca='') {
  const url = busca ? `/clientes/?nome=${encodeURIComponent(busca)}` : '/clientes/';
  const res = await get(url);
  const tbody = document.getElementById('tb-clientes');
  if (!res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty">
      <div class="empty-icon">👤</div><p>Nenhum cliente encontrado.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = res.data.map(c => `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${c.id}</span></td>
      <td>${c.nome}</td>
      <td style="font-family:var(--font-mono);font-size:0.82rem">${c.cpf}</td>
      <td>${c.telefone || '—'}</td>
      <td>${c.cidade || '—'}</td>
      <td>${c.tem_desconto ? '<span class="badge badge-green">✓ Desconto</span>' : '<span class="badge badge-gray">Sem desconto</span>'}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-edit btn-sm" onclick="editarCliente(${c.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="removerCliente(${c.id},'${c.nome}')">Remover</button>
        </div>
      </td>
    </tr>`).join('');
}

async function salvarCliente() {
  const id = document.getElementById('cli-id').value;
  const dados = {
    nome:     document.getElementById('cli-nome').value.trim(),
    cpf:      document.getElementById('cli-cpf').value.trim(),
    telefone: document.getElementById('cli-telefone').value.trim(),
    email:    document.getElementById('cli-email').value.trim(),
    cidade:   document.getElementById('cli-cidade').value.trim(),
    torce_flamengo:    document.getElementById('cli-flamengo').checked,
    assiste_one_piece: document.getElementById('cli-onepiece').checked,
    de_sousa:          document.getElementById('cli-sousa').checked,
  };
  if (!dados.nome || !dados.cpf) { toast('Nome e CPF são obrigatórios.','error'); return; }

  const res = id ? await put(`/clientes/${id}`, dados) : await post('/clientes/', dados);
  if (res.ok) {
    toast(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success');
    closeModal('modal-cliente');
    carregarClientes();
  } else {
    toast('Erro: ' + res.error, 'error');
  }
}

async function editarCliente(id) {
  const res = await get(`/clientes/${id}`);
  if (!res.ok) { toast('Erro ao carregar cliente.','error'); return; }
  const c = res.data;
  document.getElementById('cli-id').value       = c.id;
  document.getElementById('cli-nome').value     = c.nome;
  document.getElementById('cli-cpf').value      = c.cpf;
  document.getElementById('cli-telefone').value = c.telefone || '';
  document.getElementById('cli-email').value    = c.email || '';
  document.getElementById('cli-cidade').value   = c.cidade || '';
  document.getElementById('cli-flamengo').checked  = c.torce_flamengo;
  document.getElementById('cli-onepiece').checked  = c.assiste_one_piece;
  document.getElementById('cli-sousa').checked     = c.de_sousa;
  document.getElementById('modal-cliente-title').textContent = 'EDITAR CLIENTE';
  openModal('modal-cliente');
}

async function removerCliente(id, nome) {
  if (!confirmar(`Remover o cliente "${nome}"?`)) return;
  const res = await del(`/clientes/${id}`);
  if (res.ok) { toast('Cliente removido.','success'); carregarClientes(); }
  else toast('Erro: ' + res.error, 'error');
}

document.getElementById('busca-cliente').addEventListener('input', e => {
  carregarClientes(e.target.value);
});
