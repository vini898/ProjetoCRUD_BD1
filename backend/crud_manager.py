from database import db

class CRUDManager:
    """Gerencia operações CRUD genéricas para qualquer model SQLAlchemy."""

    def __init__(self, model):
        self.model = model

    def inserir(self, **dados):
        obj = self.model(**dados)
        db.session.add(obj)
        db.session.commit()
        return obj

    def alterar(self, id, **dados):
        obj = self.model.query.get(id)
        if not obj:
            return None
        for chave, valor in dados.items():
            if hasattr(obj, chave):
                setattr(obj, chave, valor)
        db.session.commit()
        return obj

    def remover(self, id):
        obj = self.model.query.get(id)
        if not obj:
            return False
        db.session.delete(obj)
        db.session.commit()
        return True

    def pesquisar_por_nome(self, nome):
        return self.model.query.filter(
            self.model.nome.ilike(f'%{nome}%')
        ).all()

    def listar_todos(self):
        return self.model.query.all()

    def exibir_um(self, id):
        return self.model.query.get(id)

    def contar(self):
        return self.model.query.count()
