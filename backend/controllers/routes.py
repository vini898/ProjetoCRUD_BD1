import os, time
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from sqlalchemy.exc import IntegrityError
from crud_manager import CRUDManager
from models.cliente import Cliente
from models.produto import Produto
from models.carro import Carro
from models.vendedor import Vendedor
from services.relatorio_service import RelatorioService
from database import db

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(f):
    return '.' in f.filename and f.filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def salvar_imagem(file):
    if file and allowed_file(file):
        base, ext = os.path.splitext(secure_filename(file.filename))
        fname = f"{base}_{int(time.time())}{ext}"
        file.save(os.path.join(UPLOAD_FOLDER, fname))
        return f'/api/uploads/{fname}'
    return None

def parse_bool(v): return str(v).lower() in ('true','1','on')

def form_or_json():
    if request.content_type and 'multipart' in request.content_type:
        return dict(request.form)
    return request.json or {}

# ── Blueprints ──────────────────────────────────────────────────────────────
clientes_bp   = Blueprint('clientes',   __name__, url_prefix='/api/clientes')
produtos_bp   = Blueprint('produtos',   __name__, url_prefix='/api/produtos')
carros_bp     = Blueprint('carros',     __name__, url_prefix='/api/carros')
vendedores_bp = Blueprint('vendedores', __name__, url_prefix='/api/vendedores')
relatorio_bp  = Blueprint('relatorio',  __name__, url_prefix='/api/relatorio')
uploads_bp    = Blueprint('uploads',    __name__, url_prefix='/api/uploads')

mgr_cli = CRUDManager(Cliente)
mgr_pro = CRUDManager(Produto)
mgr_car = CRUDManager(Carro)
mgr_ven = CRUDManager(Vendedor)

def ok(data, code=200):  return jsonify({'ok': True,  'data': data}), code
def err(msg, code=400):  return jsonify({'ok': False, 'error': msg}), code

@uploads_bp.get('/<filename>')
def servir_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ══════════════════════════════════════════════════════════════ CLIENTES
@clientes_bp.get('/')
def listar_clientes():
    q   = request.args.get('nome')
    cpf = request.args.get('cpf')
    if cpf:
        itens = Cliente.query.filter(Cliente.cpf.ilike(f'%{cpf}%')).all()
    elif q:
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
    img = salvar_imagem(request.files.get('imagem'))
    d = form_or_json()
    dados = {k: d.get(k) for k in ['nome','cpf','telefone','email','cidade',
             'torce_flamengo','assiste_one_piece','de_sousa'] if k in d}
    for b in ['torce_flamengo','assiste_one_piece','de_sousa']:
        if b in dados: dados[b] = parse_bool(dados[b])
    if img: dados['imagem'] = img
    # Validar CPF antes de inserir
    tmp = Cliente(**dados)
    if not tmp.validar_cpf():
        return err('CPF inválido. Verifique os dígitos informados.')
    try:
        return ok(mgr_cli.inserir(**dados).to_dict(), 201)
    except IntegrityError:
        db.session.rollback()
        return err('CPF já cadastrado no sistema.')
    except Exception as e:
        return err(str(e))

@clientes_bp.put('/<int:id>')
def alterar_cliente(id):
    img = salvar_imagem(request.files.get('imagem'))
    d = form_or_json()
    for b in ['torce_flamengo','assiste_one_piece','de_sousa']:
        if b in d: d[b] = parse_bool(d[b])
    if img: d['imagem'] = img
    # Valida CPF se foi enviado
    if 'cpf' in d:
        tmp = Cliente(cpf=d['cpf'])
        if not tmp.validar_cpf():
            return err('CPF inválido. Verifique os dígitos informados.')
    try:
        c = mgr_cli.alterar(id, **d)
        return ok(c.to_dict()) if c else err('Cliente não encontrado', 404)
    except IntegrityError:
        db.session.rollback()
        return err('CPF já cadastrado no sistema.')

@clientes_bp.delete('/<int:id>')
def remover_cliente(id):
    return ok('Removido') if mgr_cli.remover(id) else err('Cliente não encontrado', 404)

# ══════════════════════════════════════════════════════════════ PRODUTOS
@produtos_bp.get('/')
def listar_produtos():
    q      = request.args.get('nome')
    cat    = request.args.get('categoria')
    mari   = request.args.get('fabricado_mari')
    baixo  = request.args.get('estoque_baixo')
    preco_min = request.args.get('preco_min', type=float)
    preco_max = request.args.get('preco_max', type=float)
    itens = mgr_pro.listar_todos()
    if q:         itens = [p for p in itens if q.lower() in p.nome.lower()]
    if cat:       itens = [p for p in itens if p.categoria == cat]
    if mari == 'true':  itens = [p for p in itens if p.fabricado_mari]
    if baixo == 'true': itens = [p for p in itens if p.estoque_baixo()]
    if preco_min is not None: itens = [p for p in itens if p.preco >= preco_min]
    if preco_max is not None: itens = [p for p in itens if p.preco <= preco_max]
    return ok([p.to_dict() for p in itens])

@produtos_bp.get('/<int:id>')
def exibir_produto(id):
    p = mgr_pro.exibir_um(id)
    return ok(p.to_dict()) if p else err('Produto não encontrado', 404)

@produtos_bp.post('/')
def inserir_produto():
    img = salvar_imagem(request.files.get('imagem'))
    d = form_or_json()
    dados = {k: d.get(k) for k in ['nome','categoria','preco','qtd_estoque','fabricado_mari','descricao'] if k in d}
    if 'fabricado_mari' in dados: dados['fabricado_mari'] = parse_bool(dados['fabricado_mari'])
    if 'preco' in dados:       dados['preco']       = float(dados['preco'])
    if 'qtd_estoque' in dados: dados['qtd_estoque'] = int(dados['qtd_estoque'])
    if img: dados['imagem'] = img
    try:    return ok(mgr_pro.inserir(**dados).to_dict(), 201)
    except Exception as e: return err(str(e))

@produtos_bp.put('/<int:id>')
def alterar_produto(id):
    img = salvar_imagem(request.files.get('imagem'))
    d = form_or_json()
    if 'fabricado_mari' in d: d['fabricado_mari'] = parse_bool(d['fabricado_mari'])
    if 'preco' in d:       d['preco']       = float(d['preco'])
    if 'qtd_estoque' in d: d['qtd_estoque'] = int(d['qtd_estoque'])
    if img: d['imagem'] = img
    p = mgr_pro.alterar(id, **d)
    return ok(p.to_dict()) if p else err('Produto não encontrado', 404)

@produtos_bp.delete('/<int:id>')
def remover_produto(id):
    return ok('Removido') if mgr_pro.remover(id) else err('Produto não encontrado', 404)

# ══════════════════════════════════════════════════════════════ CARROS
@carros_bp.get('/')
def listar_carros():
    status = request.args.get('status')
    q      = request.args.get('nome')
    itens  = mgr_car.listar_todos()
    if q:      itens = [c for c in itens if q.lower() in (c.marca+' '+c.modelo).lower()]
    if status: itens = [c for c in itens if c.status == status]
    return ok([c.to_dict() for c in itens])

@carros_bp.get('/<int:id>')
def exibir_carro(id):
    c = mgr_car.exibir_um(id)
    return ok(c.to_dict()) if c else err('Carro não encontrado', 404)

@carros_bp.post('/')
def inserir_carro():
    img = salvar_imagem(request.files.get('imagem'))
    d = form_or_json()
    dados = {k: d.get(k) for k in ['marca','modelo','ano','cor','preco','quilometragem','status','descricao'] if k in d}
    if 'ano' in dados:           dados['ano']           = int(dados['ano'])
    if 'preco' in dados:         dados['preco']         = float(dados['preco'])
    if 'quilometragem' in dados: dados['quilometragem'] = float(dados['quilometragem'])
    if img: dados['imagem'] = img
    try:    return ok(mgr_car.inserir(**dados).to_dict(), 201)
    except Exception as e: return err(str(e))

@carros_bp.put('/<int:id>')
def alterar_carro(id):
    img = salvar_imagem(request.files.get('imagem'))
    d = form_or_json()
    if 'ano' in d:           d['ano']           = int(d['ano'])
    if 'preco' in d:         d['preco']         = float(d['preco'])
    if 'quilometragem' in d: d['quilometragem'] = float(d['quilometragem'])
    if img: d['imagem'] = img
    c = mgr_car.alterar(id, **d)
    return ok(c.to_dict()) if c else err('Carro não encontrado', 404)

@carros_bp.patch('/<int:id>/status')
def mudar_status_carro(id):
    """Muda status direto: disponivel | reservado | vendido"""
    novo_status = (request.json or {}).get('status')
    if novo_status not in Carro.STATUS_OPCOES:
        return err(f'Status inválido. Use: {", ".join(Carro.STATUS_OPCOES)}')
    c = mgr_car.exibir_um(id)
    if not c: return err('Carro não encontrado', 404)
    if novo_status == 'vendido':    c.marcar_vendido()
    elif novo_status == 'reservado': c.marcar_reservado()
    else:                            c.disponibilizar()
    db.session.commit()
    return ok(c.to_dict())

@carros_bp.delete('/<int:id>')
def remover_carro(id):
    return ok('Removido') if mgr_car.remover(id) else err('Carro não encontrado', 404)

# ══════════════════════════════════════════════════════════════ VENDEDORES
@vendedores_bp.get('/')
def listar_vendedores():
    q   = request.args.get('nome')
    cpf = request.args.get('cpf')
    if cpf:
        itens = Vendedor.query.filter(Vendedor.cpf.ilike(f'%{cpf}%')).all()
    elif q:
        itens = mgr_ven.pesquisar_por_nome(q)
    else:
        itens = mgr_ven.listar_todos()
    return ok([v.to_dict() for v in itens])

@vendedores_bp.get('/<int:id>')
def exibir_vendedor(id):
    v = mgr_ven.exibir_um(id)
    return ok(v.to_dict()) if v else err('Vendedor não encontrado', 404)

@vendedores_bp.post('/')
def inserir_vendedor():
    img = salvar_imagem(request.files.get('imagem'))
    d = form_or_json()
    dados = {k: d.get(k) for k in ['nome','cpf','telefone','cargo'] if k in d}
    if img: dados['imagem'] = img
    tmp = Vendedor(**dados)
    if not tmp.validar_cpf():
        return err('CPF inválido. Verifique os dígitos informados.')
    try:
        return ok(mgr_ven.inserir(**dados).to_dict(), 201)
    except IntegrityError:
        db.session.rollback()
        return err('CPF já cadastrado no sistema.')
    except Exception as e:
        return err(str(e))

@vendedores_bp.put('/<int:id>')
def alterar_vendedor(id):
    img = salvar_imagem(request.files.get('imagem'))
    d = form_or_json()
    if img: d['imagem'] = img
    if 'cpf' in d:
        tmp = Vendedor(cpf=d['cpf'])
        if not tmp.validar_cpf():
            return err('CPF inválido. Verifique os dígitos informados.')
    try:
        v = mgr_ven.alterar(id, **d)
        return ok(v.to_dict()) if v else err('Vendedor não encontrado', 404)
    except IntegrityError:
        db.session.rollback()
        return err('CPF já cadastrado no sistema.')

@vendedores_bp.delete('/<int:id>')
def remover_vendedor(id):
    return ok('Removido') if mgr_ven.remover(id) else err('Vendedor não encontrado', 404)

# ══════════════════════════════════════════════════════════════ RELATÓRIOS
@relatorio_bp.get('/resumo')
def resumo():        return ok(RelatorioService().resumo_geral())
@relatorio_bp.get('/clientes')
def rel_clientes():  return ok(RelatorioService().relatorio_clientes())
@relatorio_bp.get('/produtos')
def rel_produtos():  return ok(RelatorioService().relatorio_produtos())
@relatorio_bp.get('/carros')
def rel_carros():    return ok(RelatorioService().relatorio_carros())
@relatorio_bp.get('/vendedores')
def rel_vendedores():return ok(RelatorioService().relatorio_vendedores())
