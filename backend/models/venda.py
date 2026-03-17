from datetime import date
from database import db

class ItemVenda(db.Model):
    __tablename__ = 'itens_venda'

    id         = db.Column(db.Integer, primary_key=True)
    venda_id   = db.Column(db.Integer, db.ForeignKey('vendas.id', ondelete='CASCADE'), nullable=False)
    # Um item é OU um produto OU um carro — nunca os dois
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=True)
    carro_id   = db.Column(db.Integer, db.ForeignKey('carros.id'),   nullable=True)
    quantidade = db.Column(db.Integer, default=1, nullable=False)
    preco_unit = db.Column(db.Float,   nullable=False)  # preço no momento da venda

    produto = db.relationship('Produto', backref='itens_venda')
    carro   = db.relationship('Carro',   backref='itens_venda')

    def get_subtotal(self):
        return round(self.preco_unit * self.quantidade, 2)

    def to_dict(self):
        return {
            'id':         self.id,
            'venda_id':   self.venda_id,
            'produto_id': self.produto_id,
            'carro_id':   self.carro_id,
            'quantidade': self.quantidade,
            'preco_unit': self.preco_unit,
            'subtotal':   self.get_subtotal(),
            'descricao':  (
                f"{self.produto.nome}" if self.produto
                else f"{self.carro.marca} {self.carro.modelo} {self.carro.ano}" if self.carro
                else '—'
            ),
        }


class Venda(db.Model):
    __tablename__ = 'vendas'

    id              = db.Column(db.Integer, primary_key=True)
    data_venda      = db.Column(db.Date, nullable=False, default=date.today)
    cliente_id      = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    vendedor_id     = db.Column(db.Integer, db.ForeignKey('vendedores.id'), nullable=False)
    forma_pagamento = db.Column(db.String(20), nullable=False)  # dinheiro|cartao|pix|boleto|berries
    status_pagamento= db.Column(db.String(20), default='pendente')  # pendente|confirmado|cancelado
    desconto_aplicado = db.Column(db.Float, default=0.0)  # percentual
    observacao      = db.Column(db.String(255))

    cliente  = db.relationship('Cliente',  backref='vendas')
    vendedor = db.relationship('Vendedor', backref='vendas')
    itens    = db.relationship('ItemVenda', backref='venda',
                               cascade='all, delete-orphan',
                               foreign_keys='ItemVenda.venda_id')

    FORMAS_PAGAMENTO = ['dinheiro', 'cartao', 'pix', 'boleto', 'berries']
    STATUS_PAGAMENTO = ['pendente', 'confirmado', 'cancelado']
    # Formas que exigem status de confirmação
    REQUER_CONFIRMACAO = ['cartao', 'boleto', 'pix', 'berries']

    def get_subtotal_bruto(self):
        return round(sum(i.get_subtotal() for i in self.itens), 2)

    def get_valor_desconto(self):
        return round(self.get_subtotal_bruto() * (self.desconto_aplicado / 100), 2)

    def get_total(self):
        return round(self.get_subtotal_bruto() - self.get_valor_desconto(), 2)

    def requer_confirmacao(self):
        return self.forma_pagamento in self.REQUER_CONFIRMACAO

    def confirmar_pagamento(self):
        self.status_pagamento = 'confirmado'

    def cancelar(self):
        self.status_pagamento = 'cancelado'

    def to_dict(self):
        return {
            'id':               self.id,
            'data_venda':       self.data_venda.isoformat() if self.data_venda else None,
            'cliente_id':       self.cliente_id,
            'cliente_nome':     self.cliente.nome if self.cliente else '—',
            'vendedor_id':      self.vendedor_id,
            'vendedor_nome':    self.vendedor.nome if self.vendedor else '—',
            'forma_pagamento':  self.forma_pagamento,
            'status_pagamento': self.status_pagamento,
            'desconto_aplicado': self.desconto_aplicado,
            'subtotal_bruto':   self.get_subtotal_bruto(),
            'valor_desconto':   self.get_valor_desconto(),
            'total':            self.get_total(),
            'observacao':       self.observacao,
            'itens':            [i.to_dict() for i in self.itens],
            'requer_confirmacao': self.requer_confirmacao(),
        }

    def __repr__(self):
        return f'<Venda #{self.id} — {self.cliente.nome if self.cliente else "?"}>'
