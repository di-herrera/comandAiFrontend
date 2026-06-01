# Frontend Backlog — ComandIA Admin

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

## Doing

## Review

### FE-013 Grupos de escolha do produto

**Objetivo**
Permitir configurar grupos de opcoes por produto, como tipo de pao, tipo de
hamburguer e adicionais.

**Escopo**
- Atualizar modelos TypeScript e servico HTTP para grupos de escolha.
- Adicionar listagem, criacao, edicao e remocao de grupos na tela de composicao.
- Permitir configurar nome, minimo, maximo, obrigatoriedade e opcoes do grupo.
- Atualizar documentacao de contratos HTTP do frontend.

**Criterios de aceite**
- Usuario consegue configurar grupos por empresa, unidade e produto.
- Formulario envia os contratos esperados pelo backend.
- Build do Angular passa.

**Notas de implementacao**
- Criados modelos `ProductOptionGroup` e request correspondente.
- `ProductCompositionApiService` passou a consumir `/option-groups`.
- Tela de composicao ganhou secao de grupos configurados e formulario de grupo.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

### FE-012 Ajuste responsivo do menu mobile

**Objetivo**
Corrigir o menu principal para uso em telas de celular.

**Escopo**
- Transformar o menu lateral em cabecalho compacto no mobile.
- Permitir abrir e fechar a navegacao por botao.
- Fechar o menu apos selecionar uma rota.
- Manter o menu lateral no desktop.
- Ajustar formularios, cabecalhos, botoes e tabelas para telas estreitas.

**Critérios de aceite**
- Menu nao ocupa toda a primeira dobra quando fechado no celular.
- Links continuam acessiveis em telas estreitas.
- Conteudo principal inicia abaixo do cabecalho mobile.
- Telas de cadastro nao geram overflow horizontal por cabecalho, formulario ou tabela.
- Rotas basicas continuam funcionando.

**Notas de implementação**
- Adicionado estado local para abrir e fechar o menu mobile no `AppComponent`.
- O menu mobile fica recolhido por padrao e fecha ao clicar em um item de navegacao.
- Estilos responsivos ajustados em `app.component.css` para cabecalho compacto ate 820px.
- Corrigido o icone do menu para empilhar as linhas sem sobreposicao.
- Ajustados estilos globais em `styles.css` para cabecalhos, grids, botoes e tabelas em telas pequenas.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

### FE-003 Detalhe de interacao da IA

**Objetivo**
Mostrar detalhes de uma chamada da IA para debug, auditoria e refinamento de prompt.

**Escopo**
- Exibir mensagem original do cliente.
- Exibir prompt enviado para a IA.
- Exibir resposta bruta.
- Exibir JSON parseado formatado.
- Exibir erro quando houver falha.

**Critérios de aceite**
- Usuario consegue selecionar um registro e ver detalhes completos.
- Textos longos ficam legiveis sem quebrar layout.
- JSON e exibido formatado quando valido.
- Dados sensiveis nao sao exibidos pelo contrato consumido.

**Notas de implementação**
- O detalhe foi implementado na tela `/auditoria-ia`, ao lado da listagem.
- Prompt, resposta bruta e JSON parseado usam blocos monoespacados com scroll.
- JSON valido e formatado com `JSON.stringify(JSON.parse(...), null, 2)`.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

### FE-002 Tela de auditoria de IA

**Objetivo**
Permitir visualizar chamadas feitas para IA, prompts, respostas e status de interpretacao.

**Escopo**
- Rota `/auditoria-ia`.
- Filtros por empresa, unidade, periodo, sucesso/falha, conversa e mensagem.
- Lista com data, provider, model, mensagem do cliente, status de parse e erro.
- Estados de loading, vazio e erro.

**Critérios de aceite**
- Tela lista auditorias usando o servico HTTP.
- Filtros atualizam a consulta.
- Estados visuais seguem o padrao simples do painel.

**Notas de implementação**
- Criada `AiAuditPage` standalone.
- Adicionado item de menu em Operacao.
- A tela exige contexto `tenantId + businessUnitId`.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

### FE-001 Modelos e servico de auditoria de IA

**Objetivo**
Preparar o frontend para consumir a auditoria de IA exposta pelo backend.

**Escopo**
- Modelos TypeScript para filtros e itens de auditoria.
- Servico HTTP para `GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/ai-interactions`.
- Endpoints centralizados em `ApiEndpoints`.

**Critérios de aceite**
- Servico compila e consome endpoint definido pelo backend.
- Modelos representam o contrato do backend.

**Notas de implementação**
- Criado `src/app/shared/models/ai-audit.models.ts`.
- Criado `AiAuditApiService`.
- `ApiEndpoints` recebeu rotas de auditoria de IA.
- Documentacao de contratos HTTP e modelos TypeScript atualizada.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

### FE-011 Tela de acompanhamento de pedidos dos clientes

**Objetivo**
Permitir que a loja acompanhe comandas recebidas pelo WhatsApp, com detalhe operacional do pedido.

**Escopo**
- Lista de comandas por empresa e unidade.
- Filtros por status, periodo e busca por cliente/telefone.
- Destaque de pedidos prontos para execucao e sinalizacao de atencao humana.
- Detalhe com itens, variantes, adicionais, ingredientes removidos, entrega e totais.

**Critérios de aceite**
- Rota `/pedidos` acessivel no painel.
- Tela consome `OrdersApiService`.
- Valores exibidos vêm dos contratos do backend.
- Sem acoes de pagamento, desconto, cancelamento ou alteracao automatica.

**Notas de implementação**
- Criada tela standalone `OrdersPage` com selecao de empresa/unidade e filtros operacionais.
- Lista exibe cliente, telefone, status, horario, quantidade de itens e total.
- Detalhe mostra origem, entrega, pagamento informado, itens, adicionais, remocoes, observacoes e totais retornados pela API.
- Estados de carregamento, erro, vazio e selecao vazia tratados visualmente.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

### FE-010 Modelos e servico para acompanhamento de pedidos

**Objetivo**
Criar a camada tipada para consumir os endpoints de acompanhamento de pedidos/comandas.

**Escopo**
- Modelos TypeScript para filtros, listagem e detalhe.
- Servico HTTP para listagem e detalhe.
- Endpoints centralizados em `ApiEndpoints`.

**Critérios de aceite**
- Contratos representam listagem, filtros, cliente, conversa, itens, opcoes, ingredientes removidos e totais.
- Servico nao recalcula total nem taxa; apenas consome a API.
- Implementacao pronta para uso pela tela operacional.

**Notas de implementação**
- Criado `src/app/shared/models/orders.models.ts`.
- Criado `OrdersApiService` com `list` e `detail`.
- `ApiEndpoints` recebeu rotas de `/orders`.
- Documentacao de contratos HTTP e modelos TypeScript atualizada.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

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

**Notas de implementação**
- Home revisada para orientar o fluxo de cadastro em ordem operacional.
- Menu lateral agrupado em Base e Catálogo, com textos mais diretos.
- Visual ajustado para painel simples, com raio de borda menor e espaçamentos mais contidos.
- Telas operacionais mantêm empresa/unidade/produto visíveis nos filtros ativos quando aplicável.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

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

**Notas de implementação**
- Criado `ProductCompositionApiService` para obter e atualizar composição pelo contrato HTTP.
- Tela exige empresa, unidade e produto antes de carregar a composição.
- Ingredientes e opções da unidade são mesclados com a composição atual para marcar vínculos existentes.
- Usuário pode marcar ingredientes, definir padrão/removível e marcar opções aplicáveis.
- Após salvar, a composição é recarregada para refletir o retorno persistido.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

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

**Notas de implementação**
- Tela de opções exige empresa e unidade antes de listar ou salvar.
- Listagem usa TenantId + BusinessUnitId e mostra o filtro ativo.
- Formulário reativo cobre código persistido, nome, preço adicional e status.
- Validação client-side exige preço adicional maior ou igual a zero.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

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

**Notas de implementação**
- Tela de ingredientes exige empresa e unidade antes de listar ou salvar.
- Listagem usa TenantId + BusinessUnitId e mostra o filtro ativo.
- Formulário reativo cobre criação e edição com código persistido, nome e status.
- Salvamento envia TenantId e BusinessUnitId via `IngredientsApiService`.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

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

**Notas de implementação**
- Tela de produtos exige empresa e unidade antes de listar ou salvar.
- Listagem usa TenantId + BusinessUnitId e deixa o contexto visível no filtro ativo.
- Formulário reativo cobre código, nome, descrição, preço base, disponibilidade e status.
- Validação client-side exige código, nome e preço maior ou igual a zero.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

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

**Notas de implementação**
- Tela de unidades carrega empresas e exige seleção de TenantId antes de listar ou salvar.
- Listagem é filtrada via `BusinessUnitsApiService.list(tenantId)` e mostra o contexto ativo.
- Formulário reativo cobre criação e edição com nome, telefone, endereço, taxa fixa de entrega e status.
- Salvamento usa TenantId selecionado em criação e edição.
- `npm run build` executado com sucesso usando `npm.cmd run build`.

---

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
