from database import db

class Vendedor(db.Model):
    __tablename__ = 'vendedores'

    id       = db.Column(db.Integer, primary_key=True)
    nome     = db.Column(db.String(100), nullable=False)
    cpf      = db.Column(db.String(14), unique=True, nullable=False)
    telefone = db.Column(db.String(20))
    cargo    = db.Column(db.String(60), default='Vendedor')
    imagem   = db.Column(db.String(255))

    CARGOS = ['Vendedor', 'Gerente', 'Supervisor', 'Estagiário']

    def validar_cpf(self):
        cpf = ''.join(filter(str.isdigit, self.cpf))
        return len(cpf) == 11

    def get_dados(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cargo': self.cargo,
            'telefone': self.telefone,
        }

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'telefone': self.telefone,
            'cargo': self.cargo,
            'imagem': self.imagem,
        }

    def __repr__(self):
        return f'<Vendedor {self.nome}>'
