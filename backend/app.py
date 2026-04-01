import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db
from controllers.routes import (
    clientes_bp, produtos_bp, carros_bp, vendedores_bp, relatorio_bp, uploads_bp
)
from controllers.vendas_routes import vendas_bp
from controllers.parte2_routes import parte2_bp

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

init_db(app)

app.register_blueprint(clientes_bp)
app.register_blueprint(produtos_bp)
app.register_blueprint(carros_bp)
app.register_blueprint(vendedores_bp)
app.register_blueprint(relatorio_bp)
app.register_blueprint(uploads_bp)
app.register_blueprint(vendas_bp)
app.register_blueprint(parte2_bp)

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

if __name__ == '__main__':
    # Ativa foreign keys no SQLite a cada conexão
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    import sqlite3

    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        if isinstance(dbapi_connection, sqlite3.Connection):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    app.run(debug=True, port=5000)
