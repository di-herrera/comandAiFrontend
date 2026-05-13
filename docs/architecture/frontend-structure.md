# Arquitetura do Frontend

## Objetivo

O frontend Angular da ComandAI é um painel administrativo simples para manter cadastros essenciais do MVP.

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

- `core`: serviços globais, config, interceptors, API helpers.
- `shared`: componentes e modelos reutilizáveis.
- `features`: telas e serviços específicos de cada cadastro.
- Rotas devem usar lazy loading com `loadComponent`.
- Não usar módulos Angular tradicionais salvo necessidade futura registrada.

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
