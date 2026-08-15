# Padrao UI/UX e Angular

Este documento e obrigatorio para novas implementacoes visuais no frontend administrativo da ComandIA.

## Premissas

- Atuar como Designer UI/UX especialista em interfaces operacionais minimalistas e modernas.
- Preservar o foco do admin: operacao rapida, leitura densa quando necessaria e baixa carga cognitiva.
- Usar o StoreFront como referencia visual compartilhada, adaptando o tom para painel interno.

## Direcao visual

- Cores: usar base neutra `slate` com superficies claras, texto `slate-900` e destaque principal `indigo-600`.
- Cantos: preferir `12px` a `18px`, equivalentes a `rounded-xl`/`rounded-2xl`.
- Espacamento: seguir escala de 4px com grupos previsiveis (`.75rem`, `1rem`, `1.5rem`).
- Tipografia: titulos objetivos, labels em peso medio/forte e textos de apoio em neutro suave.
- Elevacao: usar sombras sutis em cards, drawers e modais; evitar contraste pesado.
- Movimento: aplicar microinteracoes discretas em botoes, cards clicaveis e campos, sempre com foco visivel.

## Leis de UX aplicadas

- Lei de Proximidade: agrupar informacoes relacionadas em cards, paineis ou secoes com borda leve.
- Hierarquia de botoes: acao primaria preenchida, secundaria com superficie clara e perigo com feedback vermelho suave.
- Reducao de carga cognitiva: filtros e dados secundarios devem ficar em controles, acordeoes, drawers ou modais quando isso limpar a area principal.
- Ajuda contextual: nao depender apenas de hover; ajuda importante deve funcionar com clique/toque ou foco.

## Padrao responsivo

- Desktop: manter listas, tabelas e paineis laterais quando isso aumenta produtividade.
- Mobile: transformar tabelas em cards e abrir edicao/detalhe em bottom sheet, modal ou tela sobreposta quase cheia.
- O usuario nunca deve precisar rolar ate o fim de uma lista para editar, alterar status ou confirmar uma acao do item selecionado.
- Headers e acoes principais em modais longos devem permanecer proximos do topo da superficie.

## Estados obrigatorios

- Loading: quando possivel, usar skeleton ou area reservada parecida com o conteudo final.
- Empty state: exibir texto claro e acao principal quando houver proximo passo.
- Erro: feedback visivel, objetivo e recuperavel.
- Processamento: botoes devem indicar salvamento/processamento e bloquear envio duplicado mantendo tamanho estavel.

## Padrao Angular

- Usar componentes standalone com `standalone: true`.
- Usar lazy loading por rota/feature com `loadComponent`.
- Usar controle de fluxo nativo: `@if`, `@for` e `@switch`.
- Usar `signal()` e `computed()` para estado local e derivado quando isso simplificar a tela.
- Preferir `inject()` em novas implementacoes quando reduzir boilerplate, sem refatorar componentes legados apenas por estilo.
- Manter tipagem forte para contratos HTTP e estados da interface.

## Regra de evolucao

Nao e necessario refatorar todo o legado em tarefas nao relacionadas. Porem, qualquer alteracao visual relevante deve melhorar a aderencia a este documento e evitar introduzir novo CSS ad hoc fora dos tokens globais.
