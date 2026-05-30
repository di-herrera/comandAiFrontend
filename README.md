# ComandIA Admin Frontend

Painel administrativo Angular da **ComandIA**.

A ComandIA é uma camada inteligente que transforma conversas do WhatsApp em pedidos organizados, validados e prontos para execução. Este frontend existe apenas para cadastrar e manter os dados mínimos que o backend precisa para interpretar mensagens, validar catálogo e montar comandas.

Domínio público reservado para o produto:

```text
https://www.comandia.com.br
```

## Escopo deste projeto

Este projeto é o **frontend administrativo** separado da API `ComandIA.Api`.

Ele cobre:

- Empresas/Tenants.
- Unidades de negócio.
- Produtos.
- Ingredientes.
- Opções/adicionais.
- Composição de produto: ingredientes removíveis e opções aplicáveis.

Ele **não** cobre:

- PDV.
- ERP.
- Financeiro.
- Pagamentos.
- Marketplace.
- Disparo em massa.
- Autenticação completa no MVP.
- Atendimento em tempo real.

## Stack

- Angular 21.
- TypeScript.
- Standalone components.
- Angular Router.
- Reactive Forms.
- HttpClient.
- CSS simples sem dependência obrigatória de UI kit.

> Em maio de 2026, Angular 21 é a linha estável ativa mais recente segundo os releases públicos do Angular. Se sua máquina instalar uma versão mais nova via `ng new`, mantenha os padrões deste repositório e registre a decisão em `docs/decisions.md`.

## Como rodar

```bash
npm install
npm start
```

A aplicação roda em:

```text
http://localhost:4200
```

Por padrão, a API esperada é:

```text
http://localhost:5080
```

Altere em:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

## Scripts

```bash
npm start        # ng serve
npm run build    # ng build
npm test         # ng test
npm run lint     # placeholder inicial
```

## Workflow com Codex

Leia antes:

```text
AGENTS.md
docs/backlog/frontend-backlog.md
docs/contracts/http-api.md
docs/development/codex-workflow.md
```

Prompt recomendado:

```text
Leia AGENTS.md, README.md, docs/backlog/frontend-backlog.md e docs/contracts/http-api.md.

Pegue somente a primeira tarefa da coluna Ready.
Mova para Doing.
Implemente apenas essa tarefa.
Não implemente autenticação, financeiro, PDV, marketplace ou features fora do escopo.
Rode npm run build.
Se passar, mova a tarefa para Review e adicione notas de implementação.
```
