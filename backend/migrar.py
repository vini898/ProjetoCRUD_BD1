"""
Coloque este arquivo dentro de backend/ e rode:
    python migrar_completo.py

Adiciona todas as colunas e tabelas que faltam sem apagar dados.
"""
import sqlite3, os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'equipadora.db')
conn = sqlite3.connect(db_path)
cur  = conn.cursor()

# ── Colunas imagem nas 4 tabelas ─────────────────────────────
for tabela in ['clientes', 'produtos', 'carros', 'vendedores']:
    try:
        cur.execute(f"ALTER TABLE {tabela} ADD COLUMN imagem VARCHAR(255)")
        print(f"✅ {tabela}.imagem adicionada")
    except sqlite3.OperationalError:
        print(f"⚠️  {tabela}.imagem já existe")

# ── Tabelas de vendas ─────────────────────────────────────────
cur.executescript("""
CREATE TABLE IF NOT EXISTS vendas (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    data_venda        DATE    NOT NULL,
    cliente_id        INTEGER NOT NULL REFERENCES clientes(id),
    vendedor_id       INTEGER NOT NULL REFERENCES vendedores(id),
    forma_pagamento   VARCHAR(20) NOT NULL,
    status_pagamento  VARCHAR(20) DEFAULT 'pendente',
    desconto_aplicado REAL    DEFAULT 0.0,
    observacao        VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS itens_venda (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    venda_id   INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    carro_id   INTEGER REFERENCES carros(id),
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unit REAL    NOT NULL
);
""")
print("✅ Tabelas vendas e itens_venda OK")

conn.commit()
conn.close()
print("\n✅ Migração concluída! Reinicie o servidor Flask.")
