from database import db

class Produto(db.Model):
    __tablename__ = 'produtos'

    id              = db.Column(db.Integer, primary_key=True)
    nome            = db.Column(db.String(100), nullable=False)
    categoria       = db.Column(db.String(60), nullable=False)
    preco           = db.Column(db.Float, nullable=False)
    qtd_estoque     = db.Column(db.Integer, nullable=False, default=0)
    fabricado_mari  = db.Column(db.Boolean, default=False)
    descricao       = db.Column(db.String(255))
    imagem          = db.Column(db.String(255))

    CATEGORIAS = [
        'Som e Multimídia', 'Rodas e Pneus', 'Suspensão',
        'Alarme e Segurança', 'Estética e Pintura', 'Iluminação',
        'Motor e Performance', 'Acessórios Internos', 'Outros'
    ]

    def get_valor_total(self):
        return self.preco * self.qtd_estoque

    def tem_estoque(self):
        return self.qtd_estoque > 0

    def estoque_baixo(self):
        return self.qtd_estoque < 5

    def atualizar_estoque(self, quantidade):
        self.qtd_estoque += quantidade
        if self.qtd_estoque < 0:
            self.qtd_estoque = 0

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'categoria': self.categoria,
            'preco': self.preco,
            'qtd_estoque': self.qtd_estoque,
            'fabricado_mari': self.fabricado_mari,
            'descricao': self.descricao,
            'valor_total_estoque': self.get_valor_total(),
            'tem_estoque': self.tem_estoque(),
            'estoque_baixo': self.estoque_baixo(),
            'imagem': self.imagem,
        }

    def __repr__(self):
        return f'<Produto {self.nome}>'
