# Padrao de telas de cadastro

Este padrao deve ser usado em novas telas CRUD do painel administrativo da ComandIA.

## Objetivo

Manter a experiencia fluida em mobile e desktop, evitando que o usuario precise procurar um registro na lista, clicar em editar e voltar ate o topo da pagina para alterar os dados.

## Estrutura esperada

- A tela deve abrir com a listagem como primeira area util.
- O contexto de empresa/unidade deve ficar visivel quando a tela depender de TenantId ou BusinessUnitId.
- A listagem deve ter busca local simples quando os dados ja estiverem carregados.
- A acao de criacao deve ficar visivel como botao `Novo`.
- Criacao e edicao devem abrir em painel sobreposto.
- No desktop, o painel deve se comportar como drawer lateral.
- No mobile, o painel deve se comportar como bottom sheet ou tela sobreposta quase cheia.
- Listagens principais devem renderizar como tabela no desktop e cards no mobile.
- Modal central deve ser usado apenas para confirmacoes curtas e acoes pequenas.

## Regras de implementacao

- Usar Reactive Forms dentro do painel de criacao/edicao.
- Preservar a posicao e os filtros da lista ao abrir e fechar o painel.
- Fechar o painel apos salvar com sucesso.
- Manter feedbacks de sucesso e erro na tela principal.
- Nao adicionar bibliotecas novas apenas para esse padrao.
- Nao mover regras de negocio do backend para o frontend.
