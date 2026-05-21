# Contratos HTTP — ComandAI Admin

Este documento define os contratos esperados entre o frontend Angular e a API `ComandAI.Api`.

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
| 409 | Conflito de unicidade |
| 500 | Erro inesperado |

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
  "status": "Active"
}
```

### Atualizar unidade

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}
```

## 3. Produtos

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

### Atualizar produto

```http
PUT /api/admin/tenants/{tenantId}/business-units/{businessUnitId}/products/{productId}
```

## 4. Ingredientes

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
- Confirmar se `options` terá grupos no MVP ou será lista simples de adicionais por unidade.
- Confirmar se endpoints terão paginação real ou apenas `items + total` inicialmente.
