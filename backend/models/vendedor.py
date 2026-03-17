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
        """Valida CPF com cálculo dos dígitos verificadores."""
        cpf = ''.join(filter(str.isdigit, self.cpf or ''))
        if len(cpf) != 11 or len(set(cpf)) == 1:
            return False
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        d1 = (soma * 10 % 11) % 10
        if d1 != int(cpf[9]):
            return False
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        d2 = (soma * 10 % 11) % 10
        return d2 == int(cpf[10])

    def get_dados(self):
        return {'id': self.id, 'nome': self.nome, 'cargo': self.cargo, 'telefone': self.telefone}

    def to_dict(self):
        return {
            'id': self.id, 'nome': self.nome, 'cpf': self.cpf,
            'telefone': self.telefone, 'cargo': self.cargo, 'imagem': self.imagem,
        }

    def __repr__(self):
        return f'<Vendedor {self.nome}>'
