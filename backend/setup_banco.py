"""
Execute dentro da pasta backend/:
    python setup_banco.py

Cria:
  - VIEW vw_vendas_resumo
  - VIEW vw_relatorio_mensal_vendedor
  - VIEW vw_produtos_estoque_baixo
  - Indices de performance
  - Tabela procedures_log (simula stored procedure em SQLite)
  - Procedure sp_relatorio_mensal como trigger + tabela
"""
import sqlite3, os

db = os.path.join(os.path.dirname(__file__), 'instance', 'equipadora.db')
conn = sqlite3.connect(db)
cur  = conn.cursor()

# ── VIEWS ────────────────────────────────────────────────────
cur.executescript("""
DROP VIEW IF EXISTS vw_vendas_resumo;
CREATE VIEW vw_vendas_resumo AS
SELECT
    v.id                                        AS venda_id,
    v.data_venda,
    strftime('%Y', v.data_venda)                AS ano,
    strftime('%m', v.data_venda)                AS mes,
    c.nome                                      AS cliente_nome,
    c.cpf                                       AS cliente_cpf,
    vd.nome                                     AS vendedor_nome,
    vd.cargo                                    AS vendedor_cargo,
    v.forma_pagamento,
    v.status_pagamento,
    v.desconto_aplicado,
    COUNT(iv.id)                                AS total_itens,
    SUM(iv.quantidade * iv.preco_unit)          AS subtotal_bruto,
    SUM(iv.quantidade * iv.preco_unit)
        * (1.0 - v.desconto_aplicado / 100.0)  AS total_com_desconto
FROM vendas v
JOIN clientes  c  ON c.id  = v.cliente_id
JOIN vendedores vd ON vd.id = v.vendedor_id
JOIN itens_venda iv ON iv.venda_id = v.id
WHERE v.status_pagamento != 'cancelado'
GROUP BY v.id;
""")
print("✅ VIEW vw_vendas_resumo criada")

cur.executescript("""
DROP VIEW IF EXISTS vw_relatorio_mensal_vendedor;
CREATE VIEW vw_relatorio_mensal_vendedor AS
SELECT
    strftime('%Y', v.data_venda)           AS ano,
    strftime('%m', v.data_venda)           AS mes,
    strftime('%Y-%m', v.data_venda)        AS ano_mes,
    vd.id                                  AS vendedor_id,
    vd.nome                                AS vendedor_nome,
    vd.cargo                               AS cargo,
    COUNT(v.id)                            AS total_vendas,
    SUM(iv.quantidade * iv.preco_unit
        * (1.0 - v.desconto_aplicado/100.0)) AS receita_liquida,
    AVG(iv.quantidade * iv.preco_unit
        * (1.0 - v.desconto_aplicado/100.0)) AS ticket_medio
FROM vendas v
JOIN vendedores vd  ON vd.id = v.vendedor_id
JOIN itens_venda iv ON iv.venda_id = v.id
WHERE v.status_pagamento != 'cancelado'
GROUP BY strftime('%Y-%m', v.data_venda), vd.id;
""")
print("✅ VIEW vw_relatorio_mensal_vendedor criada")

cur.executescript("""
DROP VIEW IF EXISTS vw_produtos_estoque_baixo;
CREATE VIEW vw_produtos_estoque_baixo AS
SELECT
    id, nome, categoria, preco, qtd_estoque,
    fabricado_mari,
    CASE
        WHEN qtd_estoque = 0 THEN 'sem_estoque'
        WHEN qtd_estoque < 5 THEN 'critico'
        ELSE 'normal'
    END AS situacao_estoque
FROM produtos
WHERE qtd_estoque < 5
ORDER BY qtd_estoque ASC;
""")
print("✅ VIEW vw_produtos_estoque_baixo criada")

# ── ÍNDICES ──────────────────────────────────────────────────
indices = [
    ("idx_clientes_cpf",      "clientes(cpf)"),
    ("idx_clientes_nome",     "clientes(nome)"),
    ("idx_vendedores_cpf",    "vendedores(cpf)"),
    ("idx_vendas_cliente",    "vendas(cliente_id)"),
    ("idx_vendas_vendedor",   "vendas(vendedor_id)"),
    ("idx_vendas_data",       "vendas(data_venda)"),
    ("idx_vendas_status",     "vendas(status_pagamento)"),
    ("idx_itens_venda",       "itens_venda(venda_id)"),
    ("idx_itens_produto",     "itens_venda(produto_id)"),
    ("idx_produtos_categoria","produtos(categoria)"),
    ("idx_produtos_estoque",  "produtos(qtd_estoque)"),
]
for nome, cols in indices:
    try:
        cur.execute(f"CREATE INDEX IF NOT EXISTS {nome} ON {cols}")
        print(f"✅ Índice {nome} criado")
    except Exception as e:
        print(f"⚠️  {nome}: {e}")

# ── STORED PROCEDURE (simulada via tabela + trigger) ─────────
cur.executescript("""
CREATE TABLE IF NOT EXISTS sp_log_relatorio_mensal (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    executado_em TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    ano_mes     TEXT NOT NULL,
    gerado_por  TEXT DEFAULT 'sistema'
);

DROP TRIGGER IF EXISTS trg_registra_relatorio;
CREATE TRIGGER trg_registra_relatorio
AFTER INSERT ON sp_log_relatorio_mensal
BEGIN
    SELECT CASE
        WHEN NEW.ano_mes IS NULL
        THEN RAISE(ABORT, 'ano_mes nao pode ser nulo')
    END;
END;
""")
print("✅ Stored Procedure simulada (sp_log_relatorio_mensal + trigger) criada")

# ── RESTRIÇÕES DE INTEGRIDADE (verificar FKs) ────────────────
cur.execute("PRAGMA foreign_keys = ON")
print("✅ Integridade referencial ativada (PRAGMA foreign_keys = ON)")

conn.commit()
conn.close()

print("\n🎉 Setup completo! Reinicie o servidor Flask.")
