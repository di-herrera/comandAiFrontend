# Decisões Arquiteturais - Frontend

## ADR-FE-001 - Frontend separado da API

Status: Accepted

Decisão:
O painel administrativo será um projeto Angular separado da API `ComandIA.Api`.

Motivo:
Permite evoluir frontend e backend de forma independente, mantendo o backend como fonte da verdade.

## ADR-FE-002 - Angular com componentes standalone

Status: Accepted

Decisão:
Usar componentes standalone, roteamento nativo e Reactive Forms.

Motivo:
Segue padrão moderno do Angular e reduz boilerplate.

## ADR-FE-003 - Sem autenticação completa no MVP

Status: Accepted

Decisão:
O painel não implementará autenticação completa neste escopo.

Motivo:
O objetivo inicial é cadastrar dados mínimos para validar fluxo de pedidos. Segurança completa entra em backlog futuro.

## ADR-FE-004 - Sem UI kit obrigatório no MVP

Status: Accepted

Decisão:
Usar CSS simples e componentes próprios inicialmente.

Motivo:
Reduz dependências e mantém o projeto mais fácil de evoluir. Um design system pode ser adicionado depois.

## ADR-FE-005 - Contratos HTTP documentados antes das telas definitivas

Status: Accepted

Decisão:
Antes de implementar telas definitivas, contratos HTTP devem estar documentados em `docs/contracts/http-api.md`.

Motivo:
Permite trabalho paralelo entre backend e frontend com menor retrabalho.

## ADR-FE-006 - Biblioteca de componentes Angular

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

## ADR-FE-007 - Nome do produto e domínio

Status: Accepted

Decisão:
Usar `ComandIA` como nome do produto e `https://www.comandia.com.br` como domínio público reservado.

Motivo:
O nome `ComandIA` e o domínio `www.comandia.com.br` estão disponíveis para o projeto.

## ADR-FE-008 - Overrides para vulnerabilidades transitivas do tooling

Status: Accepted

Decisão:
Usar `overrides` no `package.json` para corrigir vulnerabilidades transitivas de dependências de desenvolvimento quando o pacote direto do Angular ainda não disponibilizar a resolução.

Motivo:
Permite manter o tooling Angular atual e corrigir o `npm audit` sem adicionar novas bibliotecas nem alterar código de produto. Os overrides devem ser removidos quando as dependências diretas passarem a resolver versões seguras por conta própria.

## ADR-FE-009 - Padrão mobile/desktop para telas CRUD

Status: Accepted

Decisão:
Telas CRUD do painel devem usar lista como primeira área útil, busca local quando os dados já estiverem carregados, botão `Novo`, e criação/edição em painel sobreposto.

No desktop, o painel deve se comportar como drawer lateral. No mobile, deve se comportar como bottom sheet ou tela sobreposta quase cheia. Listagens principais devem renderizar como tabela no desktop e cards no mobile.

Motivo:
Esse padrão evita que o usuário precise voltar ao topo da página para editar um registro e melhora a busca de cadastros em telas pequenas, mantendo o painel simples e operacional.

Referência:
`docs/architecture/crud-screen-patterns.md`

## ADR-FE-010 - Contexto operacional no header global

Status: Accepted

Decisão:
Telas operacionais que dependem de empresa e unidade devem declarar `data: { requiresCatalogContext: true }` na rota. O shell autenticado deve exibir o contexto ativo no header global e abrir um drawer de filtro quando uma dessas rotas for acessada sem empresa/unidade selecionadas.

Se o usuário fechar o drawer sem selecionar o contexto, a área útil da rota deve ficar bloqueada com uma mensagem no topo e um botão `Selecionar filtro`. O estado do contexto continua centralizado em `CatalogContextService`.

Motivo:
O filtro de empresa/unidade muda pouco durante a operação e ocupava espaço recorrente nas telas. Centralizar esse fluxo no header mantém o contexto visível, reduz repetição visual e evita que o operador use uma tela sem TenantId + BusinessUnitId válidos.

Referência:
`docs/architecture/frontend-structure.md`

## ADR-FE-011 - Slug publico da unidade no admin

Status: Accepted

Decisao:
O painel administrativo permite informar `publicSlug` no cadastro da unidade e
exibe o link `{publicSlug}.comandia.com.br` na listagem.

Motivo:
O frontend store sera um projeto separado, mas a publicacao do cardapio depende
de um campo operacional da unidade. O painel admin deve cadastrar esse valor sem
duplicar regras de publicacao, pedido ou seguranca.

Regras:
- O frontend valida apenas formato, tamanho e preview do dominio.
- Slugs reservados, unicidade e normalizacao sao validados pelo backend.
- O link exibido e informativo; a disponibilidade real do cardapio depende do
  frontend store, DNS wildcard e API publica.

## ADR-FE-012 - Angular 22 e padrao visual compartilhado

Status: Accepted

Decisao:
O frontend administrativo passa a usar Angular 22 e o builder `@angular/build`,
alinhado ao StoreFront. Novas implementacoes visuais devem seguir
`docs/design/ui-ux-angular-guidelines.md`, usando a mesma direcao visual moderna
do StoreFront com adaptacao para operacao interna.

Motivo:
O StoreFront consolidou um padrao mais moderno para Angular e UI/UX. Alinhar o
admin reduz divergencia entre os frontends ComandIA e melhora a experiencia em
mobile, especialmente para telas operacionais como pedidos.

Regras:
- Usar base visual neutra `slate`, destaque `indigo-600`, cantos maiores,
  sombras sutis e foco acessivel.
- Manter o admin denso e eficiente para operacao, sem transformar telas
  administrativas em landing pages.
- Em mobile, detalhes e edicoes de item devem abrir como bottom sheet, modal ou
  tela sobreposta, evitando que o usuario role listas longas para agir.
- Migracoes visuais devem ser incrementais e aproveitar tokens globais antes de
  criar CSS novo por feature.

## ADR-FE-013 - Estado compartilhado para listagens HTTP

Status: Accepted

Decisao:
Listagens administrativas que consomem `PagedResult<T>` devem usar
`PagedListState<T>` para centralizar `items`, `total`, `loading`, timeout,
tratamento de erro e descarte de respostas obsoletas. O componente da tela
continua responsavel por filtros, formularios e regras especificas da entidade.

Motivo:
Manter esse ciclo de vida duplicado em cada tela permitiu que uma mudanca no
Angular deixasse varias listagens presas no estado inicial ao mesmo tempo.
Uma abstracao pequena reduz a superficie de regressao sem acoplar formularios
ou contratos de negocio entre features.

Referencia:
`src/app/shared/state/paged-list.state.ts`
