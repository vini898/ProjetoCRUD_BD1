from database import db

class Carro(db.Model):
    __tablename__ = 'carros'

    id            = db.Column(db.Integer, primary_key=True)
    marca         = db.Column(db.String(60), nullable=False)
    modelo        = db.Column(db.String(80), nullable=False)
    ano           = db.Column(db.Integer, nullable=False)
    cor           = db.Column(db.String(40))
    preco         = db.Column(db.Float, nullable=False)
    quilometragem = db.Column(db.Float, default=0.0)
    status        = db.Column(db.String(20), default='disponivel')  # disponivel | vendido | reservado
    descricao     = db.Column(db.String(255))

    STATUS_OPCOES = ['disponivel', 'vendido', 'reservado']

    def get_descricao_completa(self):
        return f'{self.ano} {self.marca} {self.modelo} – {self.cor}'

    def marcar_vendido(self):
        self.status = 'vendido'

    def marcar_reservado(self):
        self.status = 'reservado'

    def disponibilizar(self):
        self.status = 'disponivel'

    def esta_disponivel(self):
        return self.status == 'disponivel'

    def to_dict(self):
        return {
            'id': self.id,
            'marca': self.marca,
            'modelo': self.modelo,
            'ano': self.ano,
            'cor': self.cor,
            'preco': self.preco,
            'quilometragem': self.quilometragem,
            'status': self.status,
            'descricao': self.descricao,
            'descricao_completa': self.get_descricao_completa(),
        }

    def __repr__(self):
        return f'<Carro {self.marca} {self.modelo} {self.ano}>'
