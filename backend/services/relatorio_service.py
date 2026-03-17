from datetime import date
from models.cliente import Cliente
from models.produto import Produto
from models.carro import Carro
from models.vendedor import Vendedor

class RelatorioService:

    def __init__(self):
        self.data_geracao = date.today().isoformat()

    def relatorio_clientes(self):
        clientes = Cliente.query.all()
        total = len(clientes)
        com_desconto = sum(1 for c in clientes if c.tem_desconto())
        cidades = {}
        for c in clientes:
            if c.cidade:
                cidades[c.cidade] = cidades.get(c.cidade, 0) + 1
        cidade_top = max(cidades, key=cidades.get) if cidades else '—'
        return {
            'tipo': 'clientes', 'data': self.data_geracao,
            'total_cadastrados': total,
            'com_desconto': com_desconto,
            'sem_desconto': total - com_desconto,
            'cidades': cidades,
            'cidade_com_mais_clientes': cidade_top,
            'lista': [c.to_dict() for c in clientes],
        }

    def relatorio_produtos(self):
        produtos = Produto.query.all()
        total = len(produtos)
        valor_total = sum(p.get_valor_total() for p in produtos)
        sem_estoque   = sum(1 for p in produtos if not p.tem_estoque())
        estoque_baixo = sum(1 for p in produtos if p.estoque_baixo() and p.tem_estoque())
        de_mari = sum(1 for p in produtos if p.fabricado_mari)
        categorias = {}
        for p in produtos:
            categorias[p.categoria] = categorias.get(p.categoria, 0) + 1
        # Produto com menor estoque (que ainda tem)
        com_estoque = [p for p in produtos if p.tem_estoque()]
        produto_critico = min(com_estoque, key=lambda p: p.qtd_estoque).nome if com_estoque else '—'
        return {
            'tipo': 'produtos', 'data': self.data_geracao,
            'total_cadastrados': total,
            'valor_total_estoque': round(valor_total, 2),
            'sem_estoque': sem_estoque,
            'estoque_baixo': estoque_baixo,
            'fabricados_mari': de_mari,
            'por_categoria': categorias,
            'produto_estoque_critico': produto_critico,
            'lista': [p.to_dict() for p in produtos],
        }

    def relatorio_carros(self):
        carros = Carro.query.all()
        total = len(carros)
        disponiveis = sum(1 for c in carros if c.status == 'disponivel')
        vendidos    = sum(1 for c in carros if c.status == 'vendido')
        reservados  = sum(1 for c in carros if c.status == 'reservado')
        valor_estoque = sum(c.preco for c in carros if c.status == 'disponivel')
        marcas = {}
        for c in carros:
            marcas[c.marca] = marcas.get(c.marca, 0) + 1
        # Carro mais caro disponível
        disp = [c for c in carros if c.status == 'disponivel']
        carro_top = max(disp, key=lambda c: c.preco) if disp else None
        return {
            'tipo': 'carros', 'data': self.data_geracao,
            'total_cadastrados': total,
            'disponiveis': disponiveis, 'vendidos': vendidos, 'reservados': reservados,
            'valor_estoque_disponivel': round(valor_estoque, 2),
            'por_marca': marcas,
            'carro_mais_caro': f"{carro_top.marca} {carro_top.modelo} ({carro_top.ano})" if carro_top else '—',
            'lista': [c.to_dict() for c in carros],
        }

    def relatorio_vendedores(self):
        vendedores = Vendedor.query.all()
        total = len(vendedores)
        por_cargo = {}
        for v in vendedores:
            por_cargo[v.cargo] = por_cargo.get(v.cargo, 0) + 1
        return {
            'tipo': 'vendedores', 'data': self.data_geracao,
            'total_cadastrados': total,
            'por_cargo': por_cargo,
            'lista': [v.to_dict() for v in vendedores],
        }

    def resumo_geral(self):
        from models.venda import Venda, ItemVenda
        vendas = Venda.query.filter(Venda.status_pagamento != 'cancelado').all()
        receita = round(sum(v.get_total() for v in vendas), 2)

        # Vendas do mês atual
        mes_atual = date.today().replace(day=1)
        vendas_mes = [v for v in vendas if v.data_venda >= mes_atual]
        receita_mes = round(sum(v.get_total() for v in vendas_mes), 2)

        # Produto mais vendido
        from models.produto import Produto
        from database import db
        from sqlalchemy import func
        top_prod = (
            db.session.query(Produto.nome, func.sum(ItemVenda.quantidade).label('total'))
            .join(ItemVenda, ItemVenda.produto_id == Produto.id)
            .join(Venda, Venda.id == ItemVenda.venda_id)
            .filter(Venda.status_pagamento != 'cancelado')
            .group_by(Produto.id)
            .order_by(func.sum(ItemVenda.quantidade).desc())
            .first()
        )

        # Melhor vendedor do mês
        from models.vendedor import Vendedor
        top_vend = (
            db.session.query(Vendedor.nome, func.count(Venda.id).label('total'))
            .join(Venda, Venda.vendedor_id == Vendedor.id)
            .filter(Venda.status_pagamento != 'cancelado', Venda.data_venda >= mes_atual)
            .group_by(Vendedor.id)
            .order_by(func.count(Venda.id).desc())
            .first()
        )

        # Vendas pendentes
        pendentes = Venda.query.filter_by(status_pagamento='pendente').count()

        return {
            'data': self.data_geracao,
            'clientes':  Cliente.query.count(),
            'produtos':  Produto.query.count(),
            'carros':    Carro.query.count(),
            'vendedores': Vendedor.query.count(),
            'carros_disponiveis': Carro.query.filter_by(status='disponivel').count(),
            'produtos_sem_estoque': sum(1 for p in Produto.query.all() if not p.tem_estoque()),
            'total_vendas': len(vendas),
            'receita_total': receita,
            'vendas_mes': len(vendas_mes),
            'receita_mes': receita_mes,
            'produto_top': top_prod[0] if top_prod else '—',
            'vendedor_top_mes': top_vend[0] if top_vend else '—',
            'vendas_pendentes': pendentes,
        }
