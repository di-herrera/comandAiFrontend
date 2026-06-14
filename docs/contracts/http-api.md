# Contratos HTTP — ComandIA Admin

Este documento define os contratos esperados entre o frontend Angular e a API `ComandIA.Api`.

A API é a fonte da verdade. O frontend deve seguir estes contratos e registrar qualquer mudança em documentação antes de implementar telas definitivas.

## Convenções

Base URL local esperada:

```text
http://localhost:5080
```

Prefixo administrativo:

```text
/api/admin
```

As chamadas administrativas exigem cookie de autenticacao emitido por
`POST /api/auth/login`. O frontend deve enviar credenciais/cookies nas chamadas
para a API.

Formato de erro recomendado:

```json
{
  "code": "ValidationError",
  "message": "A requisição contém dados inválidos.",
  "details": {
    "name": ["Nome é obrigatório."]
  }
}
```

Status HTTP esperados:

| Código | Uso |
|---:|---|
| 200 | Consulta ou atualização com retorno |
| 201 | Criação com sucesso |
| 204 | Remoção ou atualização sem corpo, se adotado |
| 400 | Validação inválida |
| 404 | Recurso não encontrado |
| 403 | Usuario autenticado sem permissao para o recurso |
| 409 | Conflito de unicidade |
| 500 | Erro inesperado |

## 0. Autenticacao e Usuarios

```http
POST /api/auth/login
GET /api/auth/session
POST /api/auth/logout
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/{userId}
PUT /api/admin/users/{userId}/password
DELETE /api/admin/users/{userId}
```

Login:

```json
{
  "email": "admin@comandia.local",
  "password": "ComandIA123"
}
```

Usuario:

```json
{
  "id": "identity-user-id",
  "email": "admin@comandia.local",
  "userName": "admin@comandia.local",
  "displayName": "Administrador",
  "isActive": true,
  "roles": ["SystemAdmin"],
  "tenantId": null,
  "businessUnitId": null,
  "createdAt": "2026-05-22T00:00:00Z",
  "updatedAt": null
}
```

Roles administrativas:

- `SystemAdmin`: acesso global ao painel.
- `CompanyAdmin`: acesso ao proprio `tenantId` e unidades da empresa.
- `UnitAdmin`: acesso ao proprio `tenantId` e `businessUnitId`.

O frontend usa `roles`, `tenantId` e `businessUnitId` para ajustar menu,
guards e seletor de contexto. O backend continua sendo a fonte da verdade e
retorna `403 Forbidden` quando o usuario tenta acessar recurso fora do escopo.

Criacao de usuario:

```json
{
  "email": "operador@comandia.local",
  "displayName": "Operador",
  "password": "ComandIA123",
  "role": "UnitAdmin",
  "tenantId": "uuid",
  "businessUnitId": "uuid",
  "isActive": true
}
```

Atualizacao de usuario:

```json
{
  "email": "operador@comandia.local",
  "displayName": "Operador",
  "role": "CompanyAdmin",
  "tenantId": "uuid",
  "businessUnitId": null,
  "isActive": true
}
```

Combinacoes validas:

| Role | tenantId | businessUnitId |
|---|---|---|
| `SystemAdmin` | `null` | `null` |
| `CompanyAdmin` | obrigatorio | `null` |
| `UnitAdmin` | obrigatorio | obrigatorio |

Atualizacao de usuario:

```json
{
  "email": "operador@comandia.local",
  "displayName": "Operador",
  "isActive": true
}
```

Respostas `401` indicam sessao ausente ou expirada. Respostas `403` indicam
usuario autenticado sem acesso.

## 1. Empresas / Tenants

### Listar empresas

```http
GET /api/admin/tenants
```

Resposta:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Demo Foods LTDA",
      "tradeName": "Demo Foods",
      "document": "00.000.000/0001-00",
      "status": "Active"
    }
  ],
  "total": 1
}
```

### Obter empresa

```http
GET /api/admin/tenants/{tenantId}
```

### Criar empresa

```http
POST /api/admin/tenants
```

Request:

```json
{
  "name": "Demo Foods LTDA",
  "tradeName": "Demo Foods",
  "document": "00.000.000/0001-00",
  "status": "Active"
}
```

### Atualizar empresa

```http
PUT /api/admin/tenants/{tenantId}
```

Request igual ao de criação.

## 2. Unidades de negócio

### Listar unidades por empresa

```http
GET /api/admin/tenants/{tenantId}/business-units
```

Resposta:

```json
{
  "items": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Unidade Principal",
      "phone": "+5517999999999",
      "address": "Rua Exemplo, 123",
      "fixedDeliveryFee": 7.0,
      "whatsAppWelcomeMessage": "Ola! Este e o atendimento automatico da loja. Posso montar seu pedido e chamar uma pessoa quando for necessario.",
      "status": "Active"
    }
  ],
  "total": 1
}
```

### Criar unidade

```http
POST /api/admin/tenants/{tenantId}/business-units
```

Request:

```json
{
  "name": "Unidade Principal",
  "phone": "+5517999999999",
  "address": "Rua Exemplo, 123",
  "fixedDeliveryFee": 7.0,
  "whatsAppWelcomeMessage": "Ola! Este e o atendimento automatico da loja. Posso montar seu pedido e chamar uma pessoa quando for necessario.",
  "status": "Active"
}
```

`whatsAppWelcomeMessage` e opcional. Quando enviado como `null`, vazio ou
somente com espacos, o backend usa a mensagem padrao no primeiro contato do
cliente pelo WhatsApp.

### Atualizar unidade

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}
```

### WhatsApp da unidade

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/whatsapp
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/whatsapp/connect
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/whatsapp/status
```

Resposta:

```json
{
  "channelId": "uuid",
  "tenantId": "uuid",
  "businessUnitId": "uuid",
  "provider": "Evolution",
  "instanceId": "cmdia-2222222222222222",
  "channelStatus": "Active",
  "connectionStatus": "open",
  "qrCode": null,
  "pairingCode": null
}
```

Quando `qrCode` vier preenchido, o painel deve exibir a imagem para o lojista
conectar o WhatsApp da unidade. O valor esperado deve ser uma imagem
renderizavel pelo navegador: data URI `data:image/...`, URL HTTP/HTTPS, SVG cru
ou base64 puro de PNG/JPEG/GIF/WebP. Se a API retornar apenas o payload textual
do QR Code, o frontend nao consegue renderizar a imagem sem gerar o QR Code.

## 3. Categorias de Produto

### Listar categorias

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/product-categories
```

Resposta:

```json
{
  "items": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "businessUnitId": "uuid",
      "name": "Lanches",
      "description": "Produtos principais do cardapio",
      "displayOrder": 1,
      "status": "Active"
    }
  ],
  "total": 1
}
```

### Criar categoria

```http
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/product-categories
```

Request:

```json
{
  "name": "Lanches",
  "description": "Produtos principais do cardapio",
  "displayOrder": 1,
  "status": "Active"
}
```

### Atualizar categoria

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/product-categories/{categoryId}
```

## 4. Produtos

### Listar produtos

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products
```

Resposta:

```json
{
  "items": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "businessUnitId": "uuid",
      "categoryId": "uuid",
      "categoryName": "Lanches",
      "code": "P001",
      "name": "X-Bacon",
      "description": "Pão, hambúrguer, bacon, queijo e salada",
      "price": 28.9,
      "isAvailable": true,
      "status": "Active",
      "variants": [
        {
          "id": "uuid",
          "code": "G",
          "name": "Grande",
          "price": 34.9,
          "isAvailable": true,
          "displayOrder": 1
        }
      ]
    }
  ],
  "total": 1
}
```

Variantes sao globais por unidade; o produto informa o preco e disponibilidade do vinculo produto-variante.

### Criar produto

```http
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products
```

Request:

```json
{
  "categoryId": "uuid",
  "code": "P001",
  "name": "X-Bacon",
  "description": "Pão, hambúrguer, bacon, queijo e salada",
  "price": 28.9,
  "isAvailable": true,
  "status": "Active",
  "variants": [
    {
      "code": "G",
      "name": "Grande",
      "price": 34.9,
      "isAvailable": true,
      "displayOrder": 1
    },
    {
      "code": "M",
      "name": "Medio",
      "price": 28.9,
      "isAvailable": true,
      "displayOrder": 2
    }
  ]
}
```

Se `categoryId` nao for enviado, a API cria ou reutiliza a categoria padrao `Geral`.

### Atualizar produto

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products/{productId}
```

## 5. Ingredientes

### Listar ingredientes

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/ingredients
```

### Criar ingrediente

```http
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/ingredients
```

Request:

```json
{
  "code": "I001",
  "name": "Cebola",
  "status": "Active"
}
```

### Atualizar ingrediente

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/ingredients/{ingredientId}
```

## 5. Opções e adicionais

### Listar opções

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/options
```

Resposta:

```json
{
  "items": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "businessUnitId": "uuid",
      "code": "O001",
      "name": "Bacon extra",
      "additionalPrice": 5.0,
      "isAvailable": true,
      "status": "Active"
    }
  ],
  "total": 1
}
```

### Criar opção

```http
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/options
```

Request:

```json
{
  "code": "O001",
  "name": "Bacon extra",
  "additionalPrice": 5.0,
  "status": "Active"
}
```

### Atualizar opção

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/options/{optionId}
```

## 6. Composição do produto

### Obter composição

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products/{productId}/composition
```

Resposta:

```json
{
  "productId": "uuid",
  "ingredients": [
    {
      "ingredientId": "uuid",
      "ingredientCode": "I001",
      "ingredientName": "Cebola",
      "isDefault": true,
      "canBeRemoved": true
    }
  ],
  "options": [
    {
      "optionId": "uuid",
      "optionCode": "O001",
      "optionName": "Bacon extra",
      "additionalPrice": 5.0,
      "isAvailable": true
    }
  ]
}
```

### Atualizar composição

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products/{productId}/composition
```

Request:

```json
{
  "ingredients": [
    {
      "ingredientId": "uuid",
      "isDefault": true,
      "canBeRemoved": true
    }
  ],
  "optionIds": ["uuid"]
}
```

## 6.1 Grupos de escolha

Grupos de escolha configuram perguntas como `Tipo de pao`, `Tipo de hamburguer`
e `Adicionais`. Eles pertencem a unidade, usam opcoes ja cadastradas e podem ser
vinculados a varios produtos.

### Listar grupos da unidade

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/option-groups
```

### Listar grupos vinculados ao produto

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products/{productId}/option-groups
```

Resposta:

```json
{
  "items": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "businessUnitId": "uuid",
          "name": "Tipo de pao",
          "minSelected": 1,
          "maxSelected": 1,
          "isRequired": true,
          "linkSource": "Category",
          "options": [
        {
          "id": "uuid",
          "optionId": "uuid",
          "code": "PAO-FR",
          "name": "Pao frances",
          "additionalPrice": 0.0,
          "isAvailable": true,
          "displayOrder": 1
        }
      ]
    }
  ],
  "total": 1
}
```

### Criar grupo

```http
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/option-groups
```

### Atualizar grupo

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/option-groups/{optionGroupId}
```

### Vincular grupo ao produto

```http
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products/{productId}/option-groups/{optionGroupId}
```

### Vincular grupo a categoria

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/product-categories/{categoryId}/option-groups
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/product-categories/{categoryId}/option-groups/{optionGroupId}
DELETE /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/product-categories/{categoryId}/option-groups/{optionGroupId}
```

A listagem de grupos do produto retorna vinculos diretos e herdados da
categoria. O campo `linkSource` indica `Product`, `Category`,
`ProductAndCategory` ou `None`.

Request de criacao/atualizacao:

```json
{
  "name": "Tipo de pao",
  "minSelected": 1,
  "maxSelected": 1,
  "isRequired": true,
  "options": [
    {
      "optionId": "uuid",
      "isAvailable": true,
      "displayOrder": 1
    }
  ]
}
```

### Desvincular grupo do produto

```http
DELETE /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products/{productId}/option-groups/{optionGroupId}
```

Remove apenas o vinculo com o produto. Para remover o cadastro reutilizavel do
grupo, use:

```http
DELETE /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/option-groups/{optionGroupId}
```

O backend rejeita a remocao do cadastro quando alguma opcao do grupo ja foi
usada em rascunho ou comanda. O frontend apenas exibe a mensagem retornada.

## 7. Acompanhamento de pedidos

### Listar pedidos

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/orders
```

Filtros opcionais:

- `status`: `ReadyForExecution`, `HumanReviewRequired`, `Completed` ou `Cancelled`.
- `createdFromUtc`: data/hora inicial em ISO 8601.
- `createdToUtc`: data/hora final em ISO 8601.
- `search`: nome ou telefone do cliente.

### Obter detalhe da comanda

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/orders/{orderId}
```

A resposta inclui cliente, conversa, entrega, pagamento informado, itens,
variantes, opcoes/adicionais, ingredientes removidos e totais calculados pelo
backend. O frontend apenas exibe `subtotal`, `deliveryFee`, `total`, subtotais
de item e totais de opcao retornados pela API.

## 7.1 Painel operador

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/operator/conversations
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/operator/conversations/{conversationId}
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/operator/conversations/{conversationId}/handoff
DELETE /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/operator/conversations/{conversationId}/handoff
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/operator/conversations/{conversationId}/messages
POST /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/operator/conversations/{conversationId}/close
```

O painel operador consome um snapshot de conversas em andamento e assina o hub
SignalR `/hubs/operator-conversations`. Apos conectar, o frontend chama
`JoinBusinessUnit(tenantId, businessUnitId)`.

Eventos esperados:

- `operatorConversationChanged`: atualiza ou inclui um card.
- `operatorConversationDetailChanged`: atualiza a modal de detalhe aberta.
- `operatorConversationRemoved`: remove um card e fecha a modal se ela estiver aberta.

O envio manual de mensagem (`POST /messages`) deve ser habilitado na UI apenas
quando `requiresHumanAttention` for `true`. Caso contrario, o operador deve
assumir o atendimento primeiro.

## 8. Auditoria de IA

### Listar interacoes

```http
GET /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/ai-interactions
```

Filtros opcionais:

- `conversationId`: identificador da conversa.
- `incomingMessageId`: identificador da mensagem recebida.
- `parsedSuccessfully`: `true` ou `false`.
- `createdFromUtc`: data/hora inicial em ISO 8601.
- `createdToUtc`: data/hora final em ISO 8601.

Resposta:

```json
{
  "items": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "businessUnitId": "uuid",
      "conversationId": "uuid",
      "incomingMessageId": "uuid",
      "provider": "Gemini",
      "model": "gemini-flash-latest",
      "customerMessage": "Quero um x-bacon",
      "prompt": "Prompt enviado para a IA",
      "responseText": "{\"actions\":[]}",
      "parsedResultJson": "{\"message_type\":\"order\",\"confidence\":0.9,\"actions\":[]}",
      "parsedSuccessfully": true,
      "errorMessage": null,
      "durationMs": 123,
      "createdAtUtc": "2026-05-17T09:00:00Z"
    }
  ],
  "total": 1
}
```

O backend nao retorna secrets, API keys ou headers sensiveis.

## Decisões abertas

- Confirmar se `status` será string `Active/Inactive` ou boolean `isActive`.
- Confirmar se endpoints terão paginação real ou apenas `items + total` inicialmente.
