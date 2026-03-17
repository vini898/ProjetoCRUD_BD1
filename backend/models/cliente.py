from database import db

class Cliente(db.Model):
    __tablename__ = 'clientes'

    id        = db.Column(db.Integer, primary_key=True)
    nome      = db.Column(db.String(100), nullable=False)
    cpf       = db.Column(db.String(14), unique=True, nullable=False)
    telefone  = db.Column(db.String(20))
    email     = db.Column(db.String(100))
    cidade    = db.Column(db.String(80))
    imagem    = db.Column(db.String(255))

    torce_flamengo     = db.Column(db.Boolean, default=False)
    assiste_one_piece  = db.Column(db.Boolean, default=False)
    de_sousa           = db.Column(db.Boolean, default=False)

    def tem_desconto(self):
        return self.torce_flamengo or self.assiste_one_piece or self.de_sousa

    def get_percentual_desconto(self):
        return 10.0 if self.tem_desconto() else 0.0

    def validar_cpf(self):
        """Valida CPF com cálculo dos dígitos verificadores."""
        cpf = ''.join(filter(str.isdigit, self.cpf or ''))
        if len(cpf) != 11 or len(set(cpf)) == 1:
            return False
        # Primeiro dígito verificador
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        d1 = (soma * 10 % 11) % 10
        if d1 != int(cpf[9]):
            return False
        # Segundo dígito verificador
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        d2 = (soma * 10 % 11) % 10
        return d2 == int(cpf[10])

    def get_dados(self):
        return {
            'id': self.id, 'nome': self.nome, 'cpf': self.cpf,
            'telefone': self.telefone, 'email': self.email, 'cidade': self.cidade,
            'tem_desconto': self.tem_desconto(),
            'percentual_desconto': self.get_percentual_desconto(),
        }

    def to_dict(self):
        return {
            'id': self.id, 'nome': self.nome, 'cpf': self.cpf,
            'telefone': self.telefone, 'email': self.email, 'cidade': self.cidade,
            'torce_flamengo': self.torce_flamengo,
            'assiste_one_piece': self.assiste_one_piece,
            'de_sousa': self.de_sousa,
            'tem_desconto': self.tem_desconto(),
            'imagem': self.imagem,
        }

    def __repr__(self):
        return f'<Cliente {self.nome}>'
