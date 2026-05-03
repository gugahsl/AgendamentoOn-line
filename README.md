# AgendaSys — Documentação do Front-end

## Estrutura de arquivos

```
backend
└──
frontend
└── agendasys/
    ├── index.html                  # Ponto de entrada: estrutura HTML + referências
    │
    ├── css/
    │   ├── variables.css           # Design tokens, CSS variables, reset global
    │   ├── layout.css              # Sidebar, topbar, main, grid helpers
    │   ├── components.css          # Botões, badges, cards, tabelas, formulários, modais
    │   └── calendar.css            # Estilos do calendário mensal
    │
    └── js/
        ├── api.js                  # Camada de serviço — comunicação com back-end Java
        ├── ui.js                   # Utilitários: navegação, modais, toasts, formatação
        ├── calendar.js             # Módulo do calendário (renderização + interação)
        ├── agendamentos.js         # CRUD de agendamentos
        ├── clientes.js             # CRUD de clientes
        ├── espacos-bloqueios.js    # CRUD de espaços e bloqueios
        └── app.js                  # Entry point: inicializa todos os módulos
```

---

## Como integrar com o back-end Java (Spring Boot)

### 1. Configurar a URL base

Em `js/api.js`, altere a constante `BASE_URL`:

```js
const BASE_URL = 'http://localhost:8080/api'; // Ajuste para seu servidor
```

### 2. Endpoints esperados

| Recurso         | Método | Endpoint                               | Descrição                         |
|-----------------|--------|----------------------------------------|-----------------------------------|
| **Dashboard**   | GET    | `/api/dashboard/resumo`                | Estatísticas gerais               |
| **Agendamentos**| GET    | `/api/agendamentos`                    | Listar (suporta filtros via query)|
|                 | GET    | `/api/agendamentos/{id}`               | Buscar por ID                     |
|                 | POST   | `/api/agendamentos`                    | Criar                             |
|                 | PUT    | `/api/agendamentos`                    | Atualizar                         |
|                 | DELETE | `/api/agendamentos/{id}`               | Remover                           |
| **Clientes**    | GET    | `/api/clientes`                        | Listar                            |
|                 | GET    | `/api/clientes/{id}`                   | Buscar por ID                     |
|                 | POST   | `/api/clientes`                        | Criar                             |
|                 | PUT    | `/api/clientes`                        | Atualizar                         |
|                 | DELETE | `/api/clientes/{id}`                   | Remover                           |
| **Espaços**     | GET    | `/api/espacos`                         | Listar                            |
|                 | GET    | `/api/espacos/{id}`                    | Buscar por ID                     |
|                 | POST   | `/api/espacos`                         | Criar                             |
|                 | PUT    | `/api/espacos`                         | Atualizar                         |
| **Bloqueios**   | GET    | `/api/bloqueios`                       | Listar                            |
|                 | POST   | `/api/bloqueios`                       | Criar                             |
|                 | DELETE | `/api/bloqueios/{id}`                  | Remover                           |
| **Auth**        | POST   | `/api/usuarios/login`                  | Login (JWT)                       |
|                 | POST   | `/api/usuarios/cadastrar`              | Cadastro                          |
|                 | GET    | `/api/usuarios`                        | Listar                            |
|                 | GET    | `/api/usuarios/{id}`                   | Buscar por Id                     |
|                 | PUT    | `/api/usuarios`                        | Atualizar                         |

### 3. Formato esperado das respostas

#### Agendamento
```json
{
  "id": 1,
  "titulo": "Consulta inicial",
  "status": "CONFIRMADO",
  "clienteId": 1,
  "clienteNome": "João Silva",
  "espacoId": 1,
  "espacoNome": "Sala 01",
  "dataInicio": "2025-06-15T09:00:00",
  "dataFim": "2025-06-15T10:00:00",
  "cor": "#3B82F6",
  "descricao": ""
}
```

#### Cliente
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(71) 99999-8888",
  "observacoes": "Prefere manhã",
  "criadoEm": "2025-01-10T10:00:00"
}
```

#### Espaço
```json
{
  "id": 1,
  "nome": "Sala 01",
  "descricao": "Sala de reuniões com projetor",
  "capacidade": 10,
  "cor": "#3B82F6",
  "ativo": true
}
```

#### Erros
```json
{
  "status": 400,
  "message": "Conflito de horário para o espaço selecionado.",
  "errors": ["Campo 'titulo' é obrigatório"]
}
```

### 4. Autenticação JWT (quando implementado)

O token é salvo via `localStorage.setItem('agendasys_token', token)` após o login.
A camada `api.js` o inclui automaticamente no header `Authorization: Bearer <token>` em todas as requisições.

### 5. CORS no Spring Boot

Adicione ao seu `WebMvcConfigurer` ou use a anotação `@CrossOrigin`:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000") // sua origem front-end
                .allowedMethods("GET","POST","PUT","PATCH","DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

---

## Convenções de desenvolvimento

- **Módulos JS**: padrão IIFE `(() => { ... })()` — sem dependências externas, sem bundler necessário
- **API errors**: sempre capturados com `UI.handleApiError(error)` nos blocos `catch`
- **Notificações**: `UI.showToast(message, 'success'|'error'|'warning'|'info')`
- **Loading**: `UI.setButtonLoading(btn, true/false)` para botões de submit
- **Navegação**: `UI.showPage('pageId')` — atualiza sidebar, topbar e dispara evento `pageChanged`
- **CSS**: tokens centralizados em `variables.css`; nunca use valores hardcoded nos outros arquivos CSS
