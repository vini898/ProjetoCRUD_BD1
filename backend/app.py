import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db
from controllers.routes import (
    clientes_bp, produtos_bp, carros_bp, vendedores_bp, relatorio_bp
)

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

init_db(app)

app.register_blueprint(clientes_bp)
app.register_blueprint(produtos_bp)
app.register_blueprint(carros_bp)
app.register_blueprint(vendedores_bp)
app.register_blueprint(relatorio_bp)

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
