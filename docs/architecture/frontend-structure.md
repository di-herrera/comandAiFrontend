# Arquitetura do Frontend

## Objetivo

O frontend Angular da ComandIA é um painel administrativo simples para manter cadastros essenciais do MVP.

## Estrutura

```text
src/app/
  core/
    api/
    config/
    errors/
    http/
    layout/
  shared/
    components/
    models/
    utils/
  features/
    tenants/
    business-units/
    products/
    ingredients/
    options/
    product-composition/
```

## Regras

- `core`: serviços globais, config, interceptors, API helpers e componentes de layout.
- `shared`: componentes e modelos reutilizáveis.
- `features`: telas e serviços específicos de cada cadastro.
- Rotas devem usar lazy loading com `loadComponent`.
- Não usar módulos Angular tradicionais salvo necessidade futura registrada.

## Layout e contexto operacional

- O shell autenticado usa um header global em `core/layout` para exibir usuário, ação de sair e contexto ativo.
- Telas que dependem de TenantId + BusinessUnitId devem marcar a rota com `data: { requiresCatalogContext: true }`.
- Quando uma rota exige contexto e não há empresa/unidade selecionadas, o layout abre o drawer de filtro automaticamente.
- Se o usuário fechar o drawer sem selecionar o contexto, o conteúdo da rota fica bloqueado e mostra um aviso com o botão `Selecionar filtro`.
- O seletor reutilizável `CatalogContextSelectorComponent` continua usando `CatalogContextService` como fonte única do contexto selecionado.
- O simulador de chat não deve exigir contexto obrigatório enquanto o contrato permitir `tenantId` e `businessUnitId` nulos para usar o padrão do backend.

## Decisões técnicas

- Componentes standalone.
- Angular 22 com builder `@angular/build`.
- Lazy loading por rota/feature com `loadComponent`.
- Controle de fluxo nativo (`@if`, `@for`, `@switch`) em novas telas.
- Signals (`signal()`/`computed()`) para estado local quando simplificar a implementação.
- Reactive Forms.
- HttpClient.
- CSS global próprio no admin, guiado pelos tokens e premissas de `docs/design/ui-ux-angular-guidelines.md`.
- O StoreFront e o admin compartilham a mesma direção visual moderna, mas o admin pode ser mais denso e operacional.
- Sem UI kit obrigatório.

## Evolução futura

Poderá ser adicionado depois:

- autenticação;
- guards;
- evolucao incremental para componentes/tokens compartilhados;
- interceptors para token;
- testes E2E;
- paginação avançada;
- permissões por usuário.
