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
            cidades[c.cidade] = cidades.get(c.cidade, 0) + 1

        return {
            'tipo': 'clientes',
            'data': self.data_geracao,
            'total_cadastrados': total,
            'com_desconto': com_desconto,
            'sem_desconto': total - com_desconto,
            'cidades': cidades,
            'lista': [c.to_dict() for c in clientes],
        }

    def relatorio_produtos(self):
        produtos = Produto.query.all()
        total = len(produtos)
        valor_total = sum(p.get_valor_total() for p in produtos)
        sem_estoque = sum(1 for p in produtos if not p.tem_estoque())
        estoque_baixo = sum(1 for p in produtos if p.estoque_baixo() and p.tem_estoque())
        de_mari = sum(1 for p in produtos if p.fabricado_mari)

        categorias = {}
        for p in produtos:
            categorias[p.categoria] = categorias.get(p.categoria, 0) + 1

        return {
            'tipo': 'produtos',
            'data': self.data_geracao,
            'total_cadastrados': total,
            'valor_total_estoque': round(valor_total, 2),
            'sem_estoque': sem_estoque,
            'estoque_baixo': estoque_baixo,
            'fabricados_mari': de_mari,
            'por_categoria': categorias,
            'lista': [p.to_dict() for p in produtos],
        }

    def relatorio_carros(self):
        carros = Carro.query.all()
        total = len(carros)
        disponiveis = sum(1 for c in carros if c.status == 'disponivel')
        vendidos = sum(1 for c in carros if c.status == 'vendido')
        reservados = sum(1 for c in carros if c.status == 'reservado')
        valor_estoque = sum(c.preco for c in carros if c.status == 'disponivel')

        marcas = {}
        for c in carros:
            marcas[c.marca] = marcas.get(c.marca, 0) + 1

        return {
            'tipo': 'carros',
            'data': self.data_geracao,
            'total_cadastrados': total,
            'disponiveis': disponiveis,
            'vendidos': vendidos,
            'reservados': reservados,
            'valor_estoque_disponivel': round(valor_estoque, 2),
            'por_marca': marcas,
            'lista': [c.to_dict() for c in carros],
        }

    def relatorio_vendedores(self):
        vendedores = Vendedor.query.all()
        total = len(vendedores)
        por_cargo = {}
        for v in vendedores:
            por_cargo[v.cargo] = por_cargo.get(v.cargo, 0) + 1

        return {
            'tipo': 'vendedores',
            'data': self.data_geracao,
            'total_cadastrados': total,
            'por_cargo': por_cargo,
            'lista': [v.to_dict() for v in vendedores],
        }

    def resumo_geral(self):
        return {
            'data': self.data_geracao,
            'clientes': Cliente.query.count(),
            'produtos': Produto.query.count(),
            'carros': Carro.query.count(),
            'vendedores': Vendedor.query.count(),
            'carros_disponiveis': Carro.query.filter_by(status='disponivel').count(),
            'produtos_sem_estoque': sum(
                1 for p in Produto.query.all() if not p.tem_estoque()
            ),
        }
