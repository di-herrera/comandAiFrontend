# Padrão de telas de cadastro

Este padrão deve ser usado em novas telas CRUD do painel administrativo da ComandIA.

## Objetivo

Manter a experiência fluida em mobile e desktop, evitando que o usuário precise procurar um registro na lista, clicar em editar e voltar até o topo da página para alterar os dados.

## Estrutura esperada

- A tela deve abrir com a listagem como primeira área útil.
- O contexto de empresa/unidade deve ficar visível no header global quando a tela depender de TenantId ou BusinessUnitId.
- Telas que exigem empresa/unidade devem usar `data: { requiresCatalogContext: true }` na rota.
- A listagem deve ter busca local simples quando os dados já estiverem carregados.
- A ação de criação deve ficar visível como botão `Novo`.
- Criação e edição devem abrir em painel sobreposto.
- No desktop, o painel deve se comportar como drawer lateral.
- No mobile, o painel deve se comportar como bottom sheet ou tela sobreposta quase cheia.
- Listagens principais devem renderizar como tabela no desktop e cards no mobile.
- Modal central deve ser usado apenas para confirmações curtas e ações pequenas.

## Contexto obrigatório

- O filtro de empresa/unidade é controlado pelo layout global, não por seletores repetidos dentro de cada tela.
- Ao entrar em uma rota que exige contexto sem empresa/unidade selecionadas, o drawer de filtro deve abrir automaticamente.
- Se o usuário fechar o drawer sem selecionar o contexto, a área útil da tela deve ficar bloqueada.
- O bloqueio deve exibir uma mensagem clara no topo e um botão `Selecionar filtro` para reabrir o drawer.
- Depois de selecionar empresa e unidade, a tela pode carregar a lista e habilitar ações como criar, editar, atualizar e salvar.

## Regras de implementação

- Usar Reactive Forms dentro do painel de criação/edição.
- Preservar a posição e os filtros da lista ao abrir e fechar o painel.
- Fechar o painel após salvar com sucesso.
- Manter feedbacks de sucesso e erro na tela principal.
- Não adicionar bibliotecas novas apenas para esse padrão.
- Não mover regras de negócio do backend para o frontend.
