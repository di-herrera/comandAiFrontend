# Workflow com Codex

## Como trabalhar

1. Leia `AGENTS.md`, `README.md` e os documentos relevantes em `docs/`.
2. Abra ou localize a issue/card correspondente no GitHub antes de implementar.
3. Mova a tarefa no GitHub Projects para `Doing`.
4. Crie uma branch dedicada a partir da branch base atual.
5. Implemente somente a tarefa escolhida.
6. Atualize documentação quando mudar fluxo, contrato, estrutura ou decisão técnica.
7. Rode `npm run build`.
8. Faça commit com uma mensagem clara.
9. Envie a branch para o GitHub.
10. Abra um pull request para revisão.
11. Comente na issue/card o que foi feito, quais validações foram executadas e o link do PR.
12. Mova a tarefa no GitHub Projects para `Review`.

## Prompt recomendado

```text
Leia AGENTS.md, README.md e docs/contracts/http-api.md.

Abra a issue/card correspondente no GitHub antes de implementar.
Pegue somente uma tarefa por vez.
Mova para Doing.
Crie uma branch dedicada.
Implemente apenas essa tarefa.
Não implemente autenticação, financeiro, PDV, marketplace ou features fora do escopo.
Atualize documentação quando mudar fluxo, contrato, estrutura ou decisão técnica.
Rode npm run build.
Se passar, faça commit, envie a branch, abra PR, comente na issue/card e mova a tarefa para Review.
```

## Restrições importantes

- Não implementar múltiplas tarefas ao mesmo tempo.
- Não adicionar bibliotecas sem necessidade.
- Não modificar contratos sem atualizar documentação.
- Não deixar alterações sem issue, branch, commit e PR, salvo pedido explícito do mantenedor.
- Não mover tarefa para `Done`; isso é decisão humana após revisão.
