const adminPrefix = '/api/admin';
const enc = encodeURIComponent;

export const ApiEndpoints = {
  auth: {
    login: '/api/auth/login',
    session: '/api/auth/session',
    logout: '/api/auth/logout'
  },
  adminUsers: {
    list: `${adminPrefix}/users`,
    detail: (userId: string) => `${adminPrefix}/users/${enc(userId)}`,
    password: (userId: string) => `${adminPrefix}/users/${enc(userId)}/password`
  },
  tenants: {
    list: `${adminPrefix}/tenants`,
    detail: (tenantId: string) => `${adminPrefix}/tenants/${enc(tenantId)}`
  },
  businessUnits: {
    list: (tenantId: string) => `${adminPrefix}/tenants/${enc(tenantId)}/business-units`,
    detail: (tenantId: string, businessUnitId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}`
  },
  products: {
    list: (tenantId: string, businessUnitId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/products`,
    detail: (tenantId: string, businessUnitId: string, productId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/products/${enc(productId)}`,
    composition: (tenantId: string, businessUnitId: string, productId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/products/${enc(productId)}/composition`
  },
  productCategories: {
    list: (tenantId: string, businessUnitId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/product-categories`,
    detail: (tenantId: string, businessUnitId: string, categoryId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/product-categories/${enc(categoryId)}`
  },
  ingredients: {
    list: (tenantId: string, businessUnitId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/ingredients`,
    detail: (tenantId: string, businessUnitId: string, ingredientId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/ingredients/${enc(ingredientId)}`
  },
  options: {
    list: (tenantId: string, businessUnitId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/options`,
    detail: (tenantId: string, businessUnitId: string, optionId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/options/${enc(optionId)}`
  },
  orders: {
    list: (tenantId: string, businessUnitId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/orders`,
    detail: (tenantId: string, businessUnitId: string, orderId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/orders/${enc(orderId)}`
  },
  aiAudit: {
    list: (tenantId: string, businessUnitId: string) =>
      `${adminPrefix}/tenants/${enc(tenantId)}/business-units/${enc(businessUnitId)}/ai-interactions`
  },
  dev: {
    simulateMessage: '/dev/simulate-message'
  }
} as const;
