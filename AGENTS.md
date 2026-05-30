# AGENTS.md

## Projeto

Este repositório contém o frontend administrativo Angular da ComandIA.

A ComandIA é uma camada inteligente que transforma conversas do WhatsApp em pedidos organizados, validados e prontos para execução.

O frontend não é o produto principal para o cliente final. Ele é um painel operacional simples para cadastrar os dados mínimos que permitem ao backend validar mensagens recebidas do WhatsApp.

## Premissas fixas

- Framework: Angular 21 ou versão estável equivalente instalada no momento da criação.
- Linguagem: TypeScript.
- Usar componentes standalone.
- Usar Angular Router nativo.
- Usar Reactive Forms.
- Usar HttpClient para comunicação com API.
- Manter tipagem forte para contratos HTTP.
- O backend `ComandIA.Api` continua sendo a fonte da verdade.
- Não implementar autenticação completa neste MVP.
- Não implementar PDV, ERP, financeiro, pagamentos ou marketplace.
- Não implementar disparo em massa.
- Não implementar atendimento ao cliente em tempo real neste frontend.

## Arquitetura do frontend

A estrutura esperada é:

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

## Regras de organização

- Cada feature deve ter suas próprias páginas, componentes, serviços e modelos específicos quando necessário.
- Contratos compartilhados devem ficar em `src/app/shared/models` ou `src/app/core/api`.
- Serviços HTTP devem ficar próximos da feature ou em `core/api` quando forem reutilizáveis.
- Não misturar regra de negócio de backend no frontend.
- O frontend pode validar campos obrigatórios e formato, mas a validação final é sempre do backend.
- Não duplicar cálculo de preço como fonte de verdade. O frontend pode exibir valores retornados pela API.

## Regras multi-tenant

- Toda tela operacional deve respeitar TenantId.
- Dados vinculados a unidade devem respeitar TenantId + BusinessUnitId.
- Produtos, ingredientes e opções usam códigos persistidos por TenantId + BusinessUnitId.
- O frontend deve sempre enviar os identificadores exigidos pelos contratos HTTP.

## Regras de UI/UX

- O painel deve ser simples e operacional.
- Evitar aparência de ERP complexo.
- Priorizar telas claras, formulários objetivos e feedbacks de sucesso/erro.
- Sempre mostrar quando uma listagem está filtrada por empresa e unidade.
- Não esconder contexto do usuário: empresa/unidade selecionada devem ficar visíveis.

## Regras para Codex

- Leia o backlog antes de implementar.
- Implemente apenas uma tarefa por vez.
- Não antecipe tarefas futuras.
- Não adicionar bibliotecas novas sem necessidade clara.
- Se uma decisão não estiver documentada, registre em `docs/decisions.md`.
- Ao finalizar uma tarefa, rode `npm run build`.
- Atualize o backlog movendo a tarefa para `Review`, não para `Done`.
- O usuário move para `Done` após revisar.

## Antes de finalizar qualquer tarefa

- Rodar `npm run build`.
- Não deixar imports quebrados.
- Garantir que as rotas básicas continuem funcionando.
- Atualizar documentação se mudar contrato, estrutura ou decisão técnica.
