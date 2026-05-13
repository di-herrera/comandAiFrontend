# Decisões Arquiteturais — Frontend

## ADR-FE-001 — Frontend separado da API

Status: Accepted

Decisão:
O painel administrativo será um projeto Angular separado da API `ComandAI.Api`.

Motivo:
Permite evoluir frontend e backend de forma independente, mantendo o backend como fonte da verdade.

## ADR-FE-002 — Angular com componentes standalone

Status: Accepted

Decisão:
Usar componentes standalone, roteamento nativo e Reactive Forms.

Motivo:
Segue padrão moderno do Angular e reduz boilerplate.

## ADR-FE-003 — Sem autenticação completa no MVP

Status: Accepted

Decisão:
O painel não implementará autenticação completa neste escopo.

Motivo:
O objetivo inicial é cadastrar dados mínimos para validar fluxo de pedidos. Segurança completa entra em backlog futuro.

## ADR-FE-004 — Sem UI kit obrigatório no MVP

Status: Accepted

Decisão:
Usar CSS simples e componentes próprios inicialmente.

Motivo:
Reduz dependências e mantém o projeto mais fácil de evoluir. Um design system pode ser adicionado depois.

## ADR-FE-005 — Contratos HTTP documentados antes das telas definitivas

Status: Accepted

Decisão:
Antes de implementar telas definitivas, contratos HTTP devem estar documentados em `docs/contracts/http-api.md`.

Motivo:
Permite trabalho paralelo entre backend e frontend com menor retrabalho.
