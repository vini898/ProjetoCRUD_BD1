# SpeedTech — Equipadora de Carros
Sistema CRUD — Banco de Dados I (2022.2)

## Tecnologias
- **Backend:** Python 3 + Flask + SQLAlchemy
- **Banco:** SQLite (arquivo `equipadora.db`, criado automaticamente)
- **Frontend:** HTML + CSS + JavaScript (vanilla)

## Como rodar

### 1. Instalar dependências
```bash
cd equipadora
pip install -r requirements.txt
```

### 2. Iniciar o servidor
```bash
cd backend
python app.py
```

### 3. Abrir no navegador
```
http://localhost:5000
```

## Estrutura
```
equipadora/
├── backend/
│   ├── app.py                  # Ponto de entrada Flask
│   ├── database.py             # Config SQLAlchemy + SQLite
│   ├── crud_manager.py         # Classe CRUDManager genérica
│   ├── models/
│   │   ├── cliente.py
│   │   ├── produto.py
│   │   ├── carro.py
│   │   └── vendedor.py
│   ├── controllers/
│   │   └── routes.py           # Todas as rotas REST
│   └── services/
│       └── relatorio_service.py
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js
│       ├── clientes.js
│       ├── produtos.js
│       ├── carros.js
│       └── vendedores.js
└── requirements.txt
```

## Endpoints da API

### Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | /api/clientes/ | Listar todos (ou ?nome=X para buscar) |
| GET    | /api/clientes/:id | Exibir um |
| POST   | /api/clientes/ | Inserir |
| PUT    | /api/clientes/:id | Alterar |
| DELETE | /api/clientes/:id | Remover |

### Produtos, Carros, Vendedores
Mesma estrutura de rotas acima.

### Relatórios
| Rota | Descrição |
|------|-----------|
| /api/relatorio/resumo | Resumo geral |
| /api/relatorio/clientes | Relatório de clientes |
| /api/relatorio/produtos | Relatório de estoque |
| /api/relatorio/carros | Relatório de veículos |
| /api/relatorio/vendedores | Relatório de vendedores |