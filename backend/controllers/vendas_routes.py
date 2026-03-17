from datetime import date
from flask import Blueprint, request, jsonify
from database import db
from models.venda import Venda, ItemVenda
from models.produto import Produto
from models.carro import Carro
from models.cliente import Cliente
from models.vendedor import Vendedor

vendas_bp = Blueprint('vendas', __name__, url_prefix='/api/vendas')

def ok(data, code=200):  return jsonify({'ok': True,  'data': data}), code
def err(msg, code=400):  return jsonify({'ok': False, 'error': msg}), code


# ── GET /api/vendas/ ──────────────────────────────────────────
@vendas_bp.get('/')
def listar_vendas():
    vendas = Venda.query.order_by(Venda.data_venda.desc(), Venda.id.desc()).all()
    return ok([v.to_dict() for v in vendas])


# ── GET /api/vendas/<id> ──────────────────────────────────────
@vendas_bp.get('/<int:id>')
def exibir_venda(id):
    v = Venda.query.get(id)
    return ok(v.to_dict()) if v else err('Venda não encontrada', 404)


# ── POST /api/vendas/ — Registrar nova venda ─────────────────
@vendas_bp.post('/')
def registrar_venda():
    d = request.json or {}

    # ── Validações básicas
    cliente_id  = d.get('cliente_id')
    vendedor_id = d.get('vendedor_id')
    forma_pg    = d.get('forma_pagamento')
    itens_raw   = d.get('itens', [])

    if not cliente_id:  return err('Cliente é obrigatório.')
    if not vendedor_id: return err('Vendedor é obrigatório.')
    if not forma_pg:    return err('Forma de pagamento é obrigatória.')
    if forma_pg not in Venda.FORMAS_PAGAMENTO:
        return err(f'Forma de pagamento inválida. Use: {", ".join(Venda.FORMAS_PAGAMENTO)}')
    if not itens_raw:   return err('A venda deve ter pelo menos um item.')

    cliente  = Cliente.query.get(cliente_id)
    vendedor = Vendedor.query.get(vendedor_id)
    if not cliente:  return err('Cliente não encontrado.')
    if not vendedor: return err('Vendedor não encontrado.')

    # ── Verifica estoque / disponibilidade antes de qualquer alteração
    itens_validados = []
    for item in itens_raw:
        tipo = item.get('tipo')  # 'produto' ou 'carro'
        qtd  = int(item.get('quantidade', 1))

        if tipo == 'produto':
            p = Produto.query.get(item.get('produto_id'))
            if not p: return err(f'Produto ID {item.get("produto_id")} não encontrado.')
            if not p.tem_estoque(): return err(f'Produto "{p.nome}" está sem estoque.')
            if p.qtd_estoque < qtd:
                return err(f'Estoque insuficiente para "{p.nome}". Disponível: {p.qtd_estoque} un.')
            itens_validados.append({'tipo': 'produto', 'obj': p, 'qtd': qtd, 'preco': p.preco})

        elif tipo == 'carro':
            c = Carro.query.get(item.get('carro_id'))
            if not c: return err(f'Carro ID {item.get("carro_id")} não encontrado.')
            if not c.esta_disponivel():
                return err(f'Veículo "{c.marca} {c.modelo}" não está disponível (status: {c.status}).')
            itens_validados.append({'tipo': 'carro', 'obj': c, 'qtd': 1, 'preco': c.preco})
        else:
            return err(f'Tipo de item inválido: "{tipo}". Use "produto" ou "carro".')

    # ── Desconto do cliente
    desconto = cliente.get_percentual_desconto() if hasattr(cliente, 'get_percentual_desconto') else 0.0

    # ── Cria a venda
    status_pg = 'pendente' if forma_pg in Venda.REQUER_CONFIRMACAO else 'confirmado'
    venda = Venda(
        data_venda       = date.today(),
        cliente_id       = cliente_id,
        vendedor_id      = vendedor_id,
        forma_pagamento  = forma_pg,
        status_pagamento = status_pg,
        desconto_aplicado= desconto,
        observacao       = d.get('observacao', ''),
    )
    db.session.add(venda)
    db.session.flush()  # gera venda.id sem commitar ainda

    # ── Cria itens + aplica efeitos colaterais
    for item in itens_validados:
        obj = item['obj']
        novo_item = ItemVenda(
            venda_id   = venda.id,
            quantidade = item['qtd'],
            preco_unit = item['preco'],
            produto_id = obj.id if item['tipo'] == 'produto' else None,
            carro_id   = obj.id if item['tipo'] == 'carro'   else None,
        )
        db.session.add(novo_item)

        if item['tipo'] == 'produto':
            obj.atualizar_estoque(-item['qtd'])   # desconta estoque
        elif item['tipo'] == 'carro':
            obj.marcar_vendido()                   # muda status → vendido

    db.session.commit()
    return ok(venda.to_dict(), 201)


# ── PATCH /api/vendas/<id>/status — Confirmar/Cancelar pagamento
@vendas_bp.patch('/<int:id>/status')
def atualizar_status(id):
    v = Venda.query.get(id)
    if not v: return err('Venda não encontrada', 404)
    novo = (request.json or {}).get('status')
    if novo not in Venda.STATUS_PAGAMENTO:
        return err(f'Status inválido. Use: {", ".join(Venda.STATUS_PAGAMENTO)}')
    v.status_pagamento = novo
    db.session.commit()
    return ok(v.to_dict())


# ── DELETE /api/vendas/<id> — Cancelar e estornar
@vendas_bp.delete('/<int:id>')
def cancelar_venda(id):
    v = Venda.query.get(id)
    if not v: return err('Venda não encontrada', 404)
    if v.status_pagamento == 'cancelado':
        return err('Venda já está cancelada.')

    # Estorna: devolve estoque dos produtos e libera carros
    for item in v.itens:
        if item.produto:
            item.produto.atualizar_estoque(item.quantidade)
        if item.carro:
            item.carro.disponibilizar()

    v.cancelar()
    db.session.commit()
    return ok('Venda cancelada e estoque restaurado.')


# ── GET /api/vendas/relatorio — Resumo de vendas
@vendas_bp.get('/relatorio')
def relatorio_vendas():
    vendas = Venda.query.all()
    ativas = [v for v in vendas if v.status_pagamento != 'cancelado']
    total_valor = sum(v.get_total() for v in ativas)

    por_forma = {}
    por_vendedor = {}
    for v in ativas:
        por_forma[v.forma_pagamento] = por_forma.get(v.forma_pagamento, 0) + 1
        nome_v = v.vendedor.nome if v.vendedor else '?'
        if nome_v not in por_vendedor:
            por_vendedor[nome_v] = {'qtd': 0, 'total': 0.0}
        por_vendedor[nome_v]['qtd']   += 1
        por_vendedor[nome_v]['total'] += v.get_total()

    # Arredonda totais por vendedor
    for k in por_vendedor:
        por_vendedor[k]['total'] = round(por_vendedor[k]['total'], 2)

    return ok({
        'total_vendas':    len(ativas),
        'total_canceladas': len(vendas) - len(ativas),
        'valor_total':     round(total_valor, 2),
        'por_forma_pagamento': por_forma,
        'por_vendedor':    por_vendedor,
    })
