from database import db

class Cliente(db.Model):
    __tablename__ = 'clientes'

    id        = db.Column(db.Integer, primary_key=True)
    nome      = db.Column(db.String(100), nullable=False)
    cpf       = db.Column(db.String(14), unique=True, nullable=False)
    telefone  = db.Column(db.String(20))
    email     = db.Column(db.String(100))
    cidade    = db.Column(db.String(80))

    # atributos para desconto (Parte 2)
    torce_flamengo     = db.Column(db.Boolean, default=False)
    assiste_one_piece  = db.Column(db.Boolean, default=False)
    de_sousa           = db.Column(db.Boolean, default=False)

    def tem_desconto(self):
        return self.torce_flamengo or self.assiste_one_piece or self.de_sousa

    def get_percentual_desconto(self):
        return 10.0 if self.tem_desconto() else 0.0

    def validar_cpf(self):
        cpf = ''.join(filter(str.isdigit, self.cpf))
        return len(cpf) == 11

    def get_dados(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'telefone': self.telefone,
            'email': self.email,
            'cidade': self.cidade,
            'tem_desconto': self.tem_desconto(),
            'percentual_desconto': self.get_percentual_desconto(),
        }

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'telefone': self.telefone,
            'email': self.email,
            'cidade': self.cidade,
            'torce_flamengo': self.torce_flamengo,
            'assiste_one_piece': self.assiste_one_piece,
            'de_sousa': self.de_sousa,
            'tem_desconto': self.tem_desconto(),
        }

    def __repr__(self):
        return f'<Cliente {self.nome}>'
