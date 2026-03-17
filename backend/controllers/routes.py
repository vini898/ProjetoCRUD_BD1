from flask import Blueprint, request, jsonify
from crud_manager import CRUDManager
from models.cliente import Cliente
from models.produto import Produto
from models.carro import Carro
from models.vendedor import Vendedor
from services.relatorio_service import RelatorioService

# ── Blueprints ──────────────────────────────────────────────────────────────
clientes_bp  = Blueprint('clientes',  __name__, url_prefix='/api/clientes')
produtos_bp  = Blueprint('produtos',  __name__, url_prefix='/api/produtos')
carros_bp    = Blueprint('carros',    __name__, url_prefix='/api/carros')
vendedores_bp = Blueprint('vendedores', __name__, url_prefix='/api/vendedores')
relatorio_bp = Blueprint('relatorio', __name__, url_prefix='/api/relatorio')

mgr_cli = CRUDManager(Cliente)
mgr_pro = CRUDManager(Produto)
mgr_car = CRUDManager(Carro)
mgr_ven = CRUDManager(Vendedor)

# ── helpers ──────────────────────────────────────────────────────────────────
def ok(data, code=200):
    return jsonify({'ok': True,  'data': data}), code

def err(msg, code=400):
    return jsonify({'ok': False, 'error': msg}), code

# ══════════════════════════════════════════════════════════════
#  CLIENTES
# ══════════════════════════════════════════════════════════════
@clientes_bp.get('/')
def listar_clientes():
    q = request.args.get('nome')
    if q:
        itens = mgr_cli.pesquisar_por_nome(q)
    else:
        itens = mgr_cli.listar_todos()
    return ok([c.to_dict() for c in itens])

@clientes_bp.get('/<int:id>')
def exibir_cliente(id):
    c = mgr_cli.exibir_um(id)
    return ok(c.to_dict()) if c else err('Cliente não encontrado', 404)

@clientes_bp.post('/')
def inserir_cliente():
    d = request.json
    campos = ['nome','cpf','telefone','email','cidade',
              'torce_flamengo','assiste_one_piece','de_sousa']
    try:
        c = mgr_cli.inserir(**{k: d.get(k) for k in campos if k in d})
        return ok(c.to_dict(), 201)
    except Exception as e:
        return err(str(e))

@clientes_bp.put('/<int:id>')
def alterar_cliente(id):
    d = request.json
    c = mgr_cli.alterar(id, **d)
    return ok(c.to_dict()) if c else err('Cliente não encontrado', 404)

@clientes_bp.delete('/<int:id>')
def remover_cliente(id):
    removido = mgr_cli.remover(id)
    return ok('Removido') if removido else err('Cliente não encontrado', 404)

# ══════════════════════════════════════════════════════════════
#  PRODUTOS
# ══════════════════════════════════════════════════════════════
@produtos_bp.get('/')
def listar_produtos():
    q    = request.args.get('nome')
    cat  = request.args.get('categoria')
    mari = request.args.get('fabricado_mari')
    baixo = request.args.get('estoque_baixo')

    itens = mgr_pro.listar_todos()

    if q:
        itens = [p for p in itens if q.lower() in p.nome.lower()]
    if cat:
        itens = [p for p in itens if p.categoria == cat]
    if mari == 'true':
        itens = [p for p in itens if p.fabricado_mari]
    if baixo == 'true':
        itens = [p for p in itens if p.estoque_baixo()]

    return ok([p.to_dict() for p in itens])

@produtos_bp.get('/<int:id>')
def exibir_produto(id):
    p = mgr_pro.exibir_um(id)
    return ok(p.to_dict()) if p else err('Produto não encontrado', 404)

@produtos_bp.post('/')
def inserir_produto():
    d = request.json
    campos = ['nome','categoria','preco','qtd_estoque','fabricado_mari','descricao']
    try:
        p = mgr_pro.inserir(**{k: d.get(k) for k in campos if k in d})
        return ok(p.to_dict(), 201)
    except Exception as e:
        return err(str(e))

@produtos_bp.put('/<int:id>')
def alterar_produto(id):
    d = request.json
    p = mgr_pro.alterar(id, **d)
    return ok(p.to_dict()) if p else err('Produto não encontrado', 404)

@produtos_bp.delete('/<int:id>')
def remover_produto(id):
    return ok('Removido') if mgr_pro.remover(id) else err('Produto não encontrado', 404)

# ══════════════════════════════════════════════════════════════
#  CARROS
# ══════════════════════════════════════════════════════════════
@carros_bp.get('/')
def listar_carros():
    status = request.args.get('status')
    q      = request.args.get('nome')
    itens  = mgr_car.listar_todos()
    if q:
        itens = [c for c in itens if q.lower() in (c.marca+' '+c.modelo).lower()]
    if status:
        itens = [c for c in itens if c.status == status]
    return ok([c.to_dict() for c in itens])

@carros_bp.get('/<int:id>')
def exibir_carro(id):
    c = mgr_car.exibir_um(id)
    return ok(c.to_dict()) if c else err('Carro não encontrado', 404)

@carros_bp.post('/')
def inserir_carro():
    d = request.json
    campos = ['marca','modelo','ano','cor','preco','quilometragem','status','descricao']
    try:
        c = mgr_car.inserir(**{k: d.get(k) for k in campos if k in d})
        return ok(c.to_dict(), 201)
    except Exception as e:
        return err(str(e))

@carros_bp.put('/<int:id>')
def alterar_carro(id):
    d = request.json
    c = mgr_car.alterar(id, **d)
    return ok(c.to_dict()) if c else err('Carro não encontrado', 404)

@carros_bp.delete('/<int:id>')
def remover_carro(id):
    return ok('Removido') if mgr_car.remover(id) else err('Carro não encontrado', 404)

# ══════════════════════════════════════════════════════════════
#  VENDEDORES
# ══════════════════════════════════════════════════════════════
@vendedores_bp.get('/')
def listar_vendedores():
    q = request.args.get('nome')
    itens = mgr_ven.pesquisar_por_nome(q) if q else mgr_ven.listar_todos()
    return ok([v.to_dict() for v in itens])

@vendedores_bp.get('/<int:id>')
def exibir_vendedor(id):
    v = mgr_ven.exibir_um(id)
    return ok(v.to_dict()) if v else err('Vendedor não encontrado', 404)

@vendedores_bp.post('/')
def inserir_vendedor():
    d = request.json
    campos = ['nome','cpf','telefone','cargo']
    try:
        v = mgr_ven.inserir(**{k: d.get(k) for k in campos if k in d})
        return ok(v.to_dict(), 201)
    except Exception as e:
        return err(str(e))

@vendedores_bp.put('/<int:id>')
def alterar_vendedor(id):
    d = request.json
    v = mgr_ven.alterar(id, **d)
    return ok(v.to_dict()) if v else err('Vendedor não encontrado', 404)

@vendedores_bp.delete('/<int:id>')
def remover_vendedor(id):
    return ok('Removido') if mgr_ven.remover(id) else err('Vendedor não encontrado', 404)

# ══════════════════════════════════════════════════════════════
#  RELATÓRIOS
# ══════════════════════════════════════════════════════════════
@relatorio_bp.get('/resumo')
def resumo():
    return ok(RelatorioService().resumo_geral())

@relatorio_bp.get('/clientes')
def rel_clientes():
    return ok(RelatorioService().relatorio_clientes())

@relatorio_bp.get('/produtos')
def rel_produtos():
    return ok(RelatorioService().relatorio_produtos())

@relatorio_bp.get('/carros')
def rel_carros():
    return ok(RelatorioService().relatorio_carros())

@relatorio_bp.get('/vendedores')
def rel_vendedores():
    return ok(RelatorioService().relatorio_vendedores())
