// ═══════════════════════════ CARROS ═══════════════════════════

// ── Toggle entre grade e tabela ───────────────────────────────
let carrosViewMode = 'grade'; // 'grade' | 'tabela'

function toggleCarrosView(mode) {
  carrosViewMode = mode;
  document.getElementById('btn-view-grade').classList.toggle('active', mode === 'grade');
  document.getElementById('btn-view-tabela').classList.toggle('active', mode === 'tabela');
  document.getElementById('carros-grade').style.display  = mode === 'grade'  ? 'grid' : 'none';
  document.getElementById('carros-tabela').style.display = mode === 'tabela' ? 'block' : 'none';
}

async function carregarCarros(busca='') {
  const url = busca ? `/carros/?nome=${encodeURIComponent(busca)}` : '/carros/';
  const res = await get(url);
  const carros = (res.ok && res.data.length) ? res.data : [];

  // ── Grade de cards ────────────────────────────────────────
  const grade = document.getElementById('carros-grade');
  if (!carros.length) {
    grade.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-icon">🚗</div><p>Nenhum veículo encontrado.</p></div>`;
  } else {
    grade.innerHTML = carros.map(c => {
      const statusBadge = {
        disponivel: '<span class="badge badge-green">Disponível</span>',
        vendido:    '<span class="badge badge-red">Vendido</span>',
        reservado:  '<span class="badge badge-gold">Reservado</span>',
      }[c.status] || c.status;
      const imgHtml = c.imagem
        ? `<div class="car-card-img" style="background-image:url('${c.imagem}')"></div>`
        : `<div class="car-card-img car-card-img--empty"><span>🚗</span></div>`;
      return `
      <div class="car-card">
        ${imgHtml}
        <div class="car-card-body">
          <div class="car-card-title">${c.marca} ${c.modelo}</div>
          <div class="car-card-sub">${c.ano} · ${c.cor || '—'}</div>
          <div class="car-card-price">${fmt(c.preco)}</div>
          <div style="margin:6px 0">${statusBadge}</div>
          <div class="td-actions" style="margin-top:8px">
            <button class="btn btn-edit btn-sm" onclick="editarCarro(${c.id})">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="removerCarro(${c.id},'${c.marca} ${c.modelo}')">Remover</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // ── Tabela ────────────────────────────────────────────────
  const tbody = document.getElementById('tb-carros');
  if (!carros.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty">
      <div class="empty-icon">🚗</div><p>Nenhum veículo encontrado.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = carros.map(c => {
    const statusBadge = {
      disponivel: '<span class="badge badge-green">Disponível</span>',
      vendido:    '<span class="badge badge-red">Vendido</span>',
      reservado:  '<span class="badge badge-gold">Reservado</span>',
    }[c.status] || c.status;
    const thumb = c.imagem
      ? `<img src="${c.imagem}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;display:block">`
      : `<div style="width:36px;height:36px;background:var(--gray-700);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:1rem">🚗</div>`;
    return `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray-400)">#${c.id}</span></td>
      <td>${thumb}</td>
      <td>${c.marca}</td>
      <td>${c.modelo}</td>
      <td style="font-family:var(--font-mono)">${c.ano}</td>
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
  const fd = new FormData();
  const campos = {
    marca:         document.getElementById('car-marca').value.trim(),
    modelo:        document.getElementById('car-modelo').value.trim(),
    ano:           document.getElementById('car-ano').value,
    cor:           document.getElementById('car-cor').value.trim(),
    preco:         document.getElementById('car-preco').value,
    quilometragem: document.getElementById('car-km').value || '0',
    status:        document.getElementById('car-status').value,
    descricao:     document.getElementById('car-descricao').value.trim(),
  };
  if (!campos.marca || !campos.modelo || !campos.preco) {
    toast('Marca, modelo e preço são obrigatórios.', 'error'); return;
  }
  Object.entries(campos).forEach(([k,v]) => fd.append(k, v));
  const imgFile = document.getElementById('car-imagem').files[0];
  if (imgFile) fd.append('imagem', imgFile);

  const res = id ? await put(`/carros/${id}`, fd) : await post('/carros/', fd);
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
  if (c.imagem) {
    const prev = document.getElementById('car-img-preview');
    prev.src = c.imagem; prev.style.display = 'block';
    document.querySelector('#modal-carro .img-label-text').textContent = 'Trocar imagem...';
  }
  document.getElementById('modal-carro-title').textContent = 'EDITAR VEÍCULO';
  openModal('modal-carro');
}

async function removerCarro(id, nome) {
  if (!confirmar(`Remover o veículo "${nome}"?`)) return;
  const res = await del(`/carros/${id}`);
  if (res.ok) { toast('Veículo removido.','success'); carregarCarros(); }
  else toast('Erro: ' + res.error, 'error');
}

document.getElementById('busca-carro').addEventListener('input', e => carregarCarros(e.target.value));
setupImagePreview('car-imagem', 'car-img-preview');
