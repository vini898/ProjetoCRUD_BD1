"""
Rotas da Parte 2:
  GET /api/parte2/clientes/<id>/pedidos      - historico de pedidos do cliente
  GET /api/parte2/relatorio/mensal           - relatorio mensal por vendedor
  GET /api/parte2/relatorio/mensal/<ano_mes> - mes especifico (ex: 2026-03)
  GET /api/parte2/views/vendas_resumo        - dados da VIEW vw_vendas_resumo
  GET /api/parte2/views/estoque_baixo        - dados da VIEW vw_produtos_estoque_baixo
  POST /api/parte2/procedures/relatorio      - executa stored procedure (log)
"""
from flask import Blueprint, request, jsonify
from database import db
from models.cliente import Cliente
from models.venda import Venda, ItemVenda
from models.vendedor import Vendedor
from sqlalchemy import text

parte2_bp = Blueprint('parte2', __name__, url_prefix='/api/parte2')

def ok(data, code=200):  return jsonify({'ok': True,  'data': data}), code
def err(msg, code=400):  return jsonify({'ok': False, 'error': msg}), code


# ── 1. HISTÓRICO DE PEDIDOS DO CLIENTE ───────────────────────
@parte2_bp.get('/clientes/<int:id>/pedidos')
def pedidos_cliente(id):
    """Retorna todos os pedidos realizados por um cliente."""
    cliente = Cliente.query.get(id)
    if not cliente:
        return err('Cliente não encontrado', 404)

    vendas = Venda.query.filter_by(cliente_id=id)\
                        .order_by(Venda.data_venda.desc()).all()
    pedidos = []
    for v in vendas:
        pedidos.append({
            'venda_id':        v.id,
            'data_venda':      v.data_venda.isoformat(),
            'forma_pagamento': v.forma_pagamento,
            'status_pagamento':v.status_pagamento,
            'desconto_aplicado': v.desconto_aplicado,
            'subtotal_bruto':  v.get_subtotal_bruto(),
            'valor_desconto':  v.get_valor_desconto(),
            'total':           v.get_total(),
            'vendedor_nome':   v.vendedor.nome if v.vendedor else '—',
            'itens': [i.to_dict() for i in v.itens],
        })

    return ok({
        'cliente': cliente.to_dict(),
        'total_pedidos': len(pedidos),
        'valor_total_gasto': round(sum(p['total'] for p in pedidos
                                       if p['status_pagamento'] != 'cancelado'), 2),
        'pedidos': pedidos,
    })


# ── 2. RELATÓRIO MENSAL POR VENDEDOR (VIEW) ──────────────────
@parte2_bp.get('/relatorio/mensal')
def relatorio_mensal():
    """Relatório mensal usando a VIEW vw_relatorio_mensal_vendedor."""
    ano_mes = request.args.get('ano_mes')  # ex: 2026-03
    try:
        if ano_mes:
            rows = db.session.execute(
                text("SELECT * FROM vw_relatorio_mensal_vendedor WHERE ano_mes = :am ORDER BY receita_liquida DESC"),
                {'am': ano_mes}
            ).fetchall()
        else:
            rows = db.session.execute(
                text("SELECT * FROM vw_relatorio_mensal_vendedor ORDER BY ano_mes DESC, receita_liquida DESC")
            ).fetchall()

        cols = ['ano', 'mes', 'ano_mes', 'vendedor_id', 'vendedor_nome',
                'cargo', 'total_vendas', 'receita_liquida', 'ticket_medio']

        resultado = [dict(zip(cols, r)) for r in rows]

        # Agrupa por mês para facilitar o frontend
        meses = {}
        for r in resultado:
            am = r['ano_mes']
            if am not in meses:
                meses[am] = {'ano_mes': am, 'vendedores': [], 'total_mes': 0}
            meses[am]['vendedores'].append({
                'vendedor_id':   r['vendedor_id'],
                'vendedor_nome': r['vendedor_nome'],
                'cargo':         r['cargo'],
                'total_vendas':  r['total_vendas'],
                'receita_liquida': round(r['receita_liquida'] or 0, 2),
                'ticket_medio':  round(r['ticket_medio'] or 0, 2),
            })
            meses[am]['total_mes'] += r['receita_liquida'] or 0

        for am in meses:
            meses[am]['total_mes'] = round(meses[am]['total_mes'], 2)

        return ok({
            'filtro_mes': ano_mes or 'todos',
            'meses': list(meses.values()),
        })
    except Exception as e:
        return err(f'Erro ao consultar relatório: {str(e)}')


# ── 3. VIEW VENDAS RESUMO ─────────────────────────────────────
@parte2_bp.get('/views/vendas_resumo')
def view_vendas_resumo():
    """Retorna dados da VIEW vw_vendas_resumo."""
    try:
        rows = db.session.execute(
            text("SELECT * FROM vw_vendas_resumo ORDER BY data_venda DESC LIMIT 100")
        ).fetchall()
        cols = ['venda_id','data_venda','ano','mes','cliente_nome','cliente_cpf',
                'vendedor_nome','vendedor_cargo','forma_pagamento','status_pagamento',
                'desconto_aplicado','total_itens','subtotal_bruto','total_com_desconto']
        return ok([dict(zip(cols, r)) for r in rows])
    except Exception as e:
        return err(f'Erro na view: {str(e)}')


# ── 4. VIEW ESTOQUE BAIXO ─────────────────────────────────────
@parte2_bp.get('/views/estoque_baixo')
def view_estoque_baixo():
    """Retorna produtos com estoque critico via VIEW."""
    try:
        rows = db.session.execute(
            text("SELECT * FROM vw_produtos_estoque_baixo")
        ).fetchall()
        cols = ['id','nome','categoria','preco','qtd_estoque','fabricado_mari','situacao_estoque']
        return ok([dict(zip(cols, r)) for r in rows])
    except Exception as e:
        return err(f'Erro na view: {str(e)}')


# ── 5. STORED PROCEDURE (log) ─────────────────────────────────
@parte2_bp.post('/procedures/relatorio')
def executar_procedure():
    """
    Simula execução de stored procedure:
    Registra log de geração de relatório mensal e retorna os dados.
    """
    d = request.json or {}
    ano_mes = d.get('ano_mes')
    if not ano_mes:
        from datetime import date
        ano_mes = date.today().strftime('%Y-%m')

    try:
        # Registra na tabela de log (trigger valida o dado)
        db.session.execute(
            text("INSERT INTO sp_log_relatorio_mensal (ano_mes, gerado_por) VALUES (:am, :gp)"),
            {'am': ano_mes, 'gp': d.get('gerado_por', 'sistema')}
        )
        db.session.commit()

        # Executa a consulta do relatório
        rows = db.session.execute(
            text("SELECT * FROM vw_relatorio_mensal_vendedor WHERE ano_mes = :am ORDER BY receita_liquida DESC"),
            {'am': ano_mes}
        ).fetchall()

        cols = ['ano','mes','ano_mes','vendedor_id','vendedor_nome',
                'cargo','total_vendas','receita_liquida','ticket_medio']
        dados = [dict(zip(cols, r)) for r in rows]
        for d2 in dados:
            d2['receita_liquida'] = round(d2['receita_liquida'] or 0, 2)
            d2['ticket_medio']    = round(d2['ticket_medio'] or 0, 2)

        return ok({
            'procedimento': 'sp_relatorio_mensal',
            'ano_mes': ano_mes,
            'executado': True,
            'registros': len(dados),
            'dados': dados,
        })
    except Exception as e:
        db.session.rollback()
        return err(f'Erro na procedure: {str(e)}')
