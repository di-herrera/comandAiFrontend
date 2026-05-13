# Frontend Backlog — ComandAI Admin

Este backlog separa a parte de frontend do painel administrativo Angular.

O foco do painel é cadastrar dados mínimos para que o backend consiga interpretar mensagens do WhatsApp, validar catálogo e montar comandas. O painel não deve virar ERP, PDV, financeiro, marketplace ou sistema de atendimento em tempo real.

## Colunas

- Backlog: tarefas planejadas.
- Ready: tarefas prontas para implementação.
- Doing: tarefa em andamento.
- Review: tarefa implementada aguardando revisão humana.
- Done: tarefa aprovada pelo usuário.
- Blocked: tarefa bloqueada.

---

## Ready

## Backlog

### FE-004 Tela de unidades de negócio

**Objetivo**
Permitir listar, cadastrar e editar unidades vinculadas a uma empresa.

**Escopo**
- Selecionar empresa.
- Listar unidades da empresa.
- Criar unidade.
- Editar unidade.
- Campo de taxa fixa de entrega.
- Status ativo/inativo.

**Critérios de aceite**
- Toda listagem exige TenantId.
- Criação e edição enviam TenantId corretamente.

---

### FE-005 Tela de produtos

**Objetivo**
Permitir listar, cadastrar e editar produtos por empresa e unidade.

**Escopo**
- Selecionar empresa e unidade.
- Listar produtos filtrados.
- Criar produto com código persistido, exemplo `P001`.
- Editar nome, descrição, preço base, disponibilidade e status.

**Critérios de aceite**
- Produto sempre é criado com TenantId + BusinessUnitId + Code.
- Preço é obrigatório e maior ou igual a zero.
- Disponibilidade é editável.

---

### FE-006 Tela de ingredientes

**Objetivo**
Permitir listar, cadastrar e editar ingredientes por empresa e unidade.

**Escopo**
- Selecionar empresa e unidade.
- Listar ingredientes filtrados.
- Criar ingrediente com código persistido, exemplo `I001`.
- Editar nome e status.

**Critérios de aceite**
- Ingrediente sempre é criado com TenantId + BusinessUnitId + Code.

---

### FE-007 Tela de opções e adicionais

**Objetivo**
Permitir listar, cadastrar e editar opções/adicionais por empresa e unidade.

**Escopo**
- Selecionar empresa e unidade.
- Listar opções filtradas.
- Criar opção com código persistido, exemplo `O001`.
- Editar nome, preço adicional e status.

**Critérios de aceite**
- Opção sempre é criada com TenantId + BusinessUnitId + Code.
- Preço adicional é obrigatório e maior ou igual a zero.

---

### FE-008 Tela de composição do produto

**Objetivo**
Permitir associar produtos a ingredientes e opções/adicionais.

**Escopo**
- Selecionar empresa, unidade e produto.
- Exibir composição atual.
- Associar ingredientes aplicáveis.
- Definir se ingrediente pode ser removido.
- Associar opções/adicionais aplicáveis.
- Salvar composição via API.

**Critérios de aceite**
- Produto mostra seus ingredientes vinculados.
- Produto mostra suas opções vinculadas.
- A composição salva é carregada novamente com consistência.

---

### FE-009 Revisão de usabilidade do painel

**Objetivo**
Garantir que o painel seja simples para pequenos negócios e não pareça um ERP complexo.

**Escopo**
- Revisar textos.
- Revisar navegação.
- Revisar formulários.
- Revisar feedbacks.
- Garantir contexto visível de empresa/unidade.

**Critérios de aceite**
- Fluxo de cadastro é compreensível sem treinamento longo.
- Cada tela deixa claro o que deve ser preenchido.

---

## Doing

## Review

### FE-003 Tela de empresas

**Objetivo**
Permitir listar, cadastrar e editar empresas/tenants.

**Escopo**
- Listagem de empresas.
- Formulário reativo de criação.
- Formulário reativo de edição.
- Validações client-side alinhadas ao contrato.
- Feedback de carregamento, sucesso e erro.

**Critérios de aceite**
- Usuário lista empresas.
- Usuário cria empresa.
- Usuário edita empresa.
- Campos obrigatórios são validados antes do envio.

**Notas de implementação**
- Tela de empresas substitui o placeholder por listagem consumindo `TenantsApiService`.
- Formulário reativo cobre criação e edição com razão social, nome comercial, documento e status.
- Validação client-side impede envio sem razão social e nome comercial.
- Estados de carregamento, salvamento, sucesso e erro são exibidos na própria tela.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

### FE-002 Contratos TypeScript e cliente HTTP base

**Objetivo**
Criar a camada base de comunicação com a API.

**Escopo**
- Criar modelos TypeScript alinhados a `docs/contracts/http-api.md`.
- Criar serviço base para montar URLs da API.
- Criar tratamento básico de erro.
- Criar serviços iniciais: tenants, business units, products, ingredients, options.

**Critérios de aceite**
- Serviços tipados compilam.
- Nenhum endpoint é chamado com URL hardcoded fora da camada de API.
- Erros retornados pela API têm modelo tipado.

**Fora do escopo**
- Componentes finais de formulário.

**Notas de implementação**
- Contratos compartilhados criados para tenants, unidades, produtos, ingredientes, opções e composição de produto.
- `ApiEndpoints` centraliza os caminhos administrativos e monta rotas com `TenantId` e `BusinessUnitId` quando exigido.
- Serviços HTTP tipados adicionados para tenants, business units, products, ingredients e options.
- Interceptor normaliza erros para o modelo tipado `ApiFailure`/`ApiError`.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

### FE-001 Criar base Angular do painel administrativo

**Objetivo**
Criar o projeto Angular, estrutura base de rotas, layout e configurações essenciais.

**Escopo**
- Garantir que `npm install` e `npm start` funcionem.
- Criar layout base com menu lateral.
- Criar rotas iniciais para empresas, unidades, produtos, ingredientes, opções e composição.
- Configurar environments com URL base da API.
- Configurar aliases TypeScript.

**Critérios de aceite**
- `npm run build` passa.
- `npm start` sobe o frontend em `localhost:4200`.
- Todas as rotas iniciais carregam uma página placeholder.

**Fora do escopo**
- Consumo real da API.
- Formulários finais.
- Autenticação.

**Notas de implementação**
- Base Angular standalone validada com rotas lazy para início, empresas, unidades, produtos, ingredientes, opções e composição de produto.
- Layout administrativo com menu lateral e páginas placeholder já carrega pelas rotas básicas.
- Environments mantêm `apiBaseUrl`, com desenvolvimento apontando para `http://localhost:5080`.
- Aliases TypeScript configurados para `@core/*`, `@shared/*`, `@features/*` e `@env/*`.
- Adicionados placeholders rastreáveis para `core/errors`, `core/layout` e `shared/utils`.
- Ajustadas versões de `@angular/cli` e `@angular-devkit/build-angular` para `^21.2.10`, versão disponível no npm para o tooling Angular 21.
- `npm install` executado com sucesso usando `npm.cmd install`.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

## Done

## Blocked
