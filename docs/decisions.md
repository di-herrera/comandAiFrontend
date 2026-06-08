# Decisões Arquiteturais — Frontend

## ADR-FE-001 — Frontend separado da API

Status: Accepted

Decisão:
O painel administrativo será um projeto Angular separado da API `ComandIA.Api`.

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

## ADR-FE-006 — Biblioteca de componentes Angular

Status: Accepted

Decisão:
Usar PrimeNG com tema Aura como biblioteca principal de componentes UI do painel administrativo da ComandIA.

Motivos:
- Grande variedade de componentes prontos.
- Forte para CRUDs, tabelas, filtros e dashboards.
- Boa produtividade para MVP.
- Ecossistema maduro no Angular.
- Evita construir componentes administrativos do zero.

Alternativas consideradas:
- Angular Material: mais oficial e estável, mas menos completo para dashboards administrativos.
- NG-ZORRO: visual enterprise forte, mas comunidade menor.
- Kendo UI/Syncfusion: completos, porém com maior atenção a licenciamento/custo.

## ADR-FE-007 — Nome do produto e domínio

Status: Accepted

Decisão:
Usar `ComandIA` como nome do produto e `https://www.comandia.com.br` como domínio público reservado.

Motivo:
O nome `ComandIA` e o domínio `www.comandia.com.br` estão disponíveis para o projeto.

## ADR-FE-008 - Overrides para vulnerabilidades transitivas do tooling

Status: Accepted

Decisao:
Usar `overrides` no `package.json` para corrigir vulnerabilidades transitivas de dependencias de desenvolvimento quando o pacote direto do Angular ainda nao disponibilizar a resolucao.

Motivo:
Permite manter o tooling Angular atual e corrigir o `npm audit` sem adicionar novas bibliotecas nem alterar codigo de produto. Os overrides devem ser removidos quando as dependencias diretas passarem a resolver versoes seguras por conta propria.

## ADR-FE-009 - Padrao mobile/desktop para telas CRUD

Status: Accepted

Decisao:
Telas CRUD do painel devem usar lista como primeira area util, busca local quando os dados ja estiverem carregados, botao `Novo`, e criacao/edicao em painel sobreposto.

No desktop, o painel deve se comportar como drawer lateral. No mobile, deve se comportar como bottom sheet ou tela sobreposta quase cheia. Listagens principais devem renderizar como tabela no desktop e cards no mobile.

Motivo:
Esse padrao evita que o usuario precise voltar ao topo da pagina para editar um registro e melhora a busca de cadastros em telas pequenas, mantendo o painel simples e operacional.

Referencia:
`docs/architecture/crud-screen-patterns.md`
