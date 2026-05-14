# Workflow com Codex

## Como trabalhar

1. Leia `AGENTS.md`.
2. Leia `docs/backlog/frontend-backlog.md`.
3. Pegue uma tarefa da coluna `Ready`.
4. Mova para `Doing`.
5. Implemente somente a tarefa escolhida.
6. Rode `npm run build`.
7. Se passar, mova para `Review`.
8. Adicione notas de implementação na tarefa.

## Prompt recomendado

```text
Leia AGENTS.md, README.md, docs/backlog/frontend-backlog.md e docs/contracts/http-api.md.

Pegue somente a primeira tarefa da coluna Ready.
Mova para Doing.
Implemente apenas essa tarefa.
Não implemente autenticação, financeiro, PDV, marketplace ou features fora do escopo.
Rode npm run build.
Se passar, mova a tarefa para Review e adicione notas de implementação.
```

## Restrições importantes

- Não implementar múltiplas tarefas ao mesmo tempo.
- Não adicionar bibliotecas sem necessidade.
- Não modificar contratos sem atualizar documentação.
- Não mover para `Done`; isso é decisão humana.
