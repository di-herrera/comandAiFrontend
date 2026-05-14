const adminPrefix = '/api/admin';
const enc = encodeURIComponent;

export const ApiEndpoints = {
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
  dev: {
    simulateMessage: '/dev/simulate-message'
  }
} as const;
