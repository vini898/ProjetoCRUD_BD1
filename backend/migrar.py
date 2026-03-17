"""
Execute este script UMA VEZ dentro da pasta backend/:
    python migrar_banco.py

Ele adiciona a coluna 'imagem' nas 4 tabelas sem apagar dados.
"""
import sqlite3, os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'equipadora.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

tabelas = ['clientes', 'produtos', 'carros', 'vendedores']
for tabela in tabelas:
    try:
        cur.execute(f"ALTER TABLE {tabela} ADD COLUMN imagem VARCHAR(255)")
        print(f"✅ Coluna 'imagem' adicionada em '{tabela}'")
    except sqlite3.OperationalError as e:
        print(f"⚠️  {tabela}: {e}")

conn.commit()
conn.close()
print("\nPronto! Reinicie o servidor Flask.")