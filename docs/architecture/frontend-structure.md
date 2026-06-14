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
- Reactive Forms.
- HttpClient.
- CSS simples no MVP.
- Sem UI kit obrigatório no início.

## Evolução futura

Poderá ser adicionado depois:

- autenticação;
- guards;
- design system;
- interceptors para token;
- testes E2E;
- paginação avançada;
- permissões por usuário.
