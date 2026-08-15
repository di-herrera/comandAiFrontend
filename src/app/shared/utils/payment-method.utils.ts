const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  pix: 'Pix',
  bank_transfer: 'Transferência bancária',
  meal_voucher: 'Vale-refeição',
  food_voucher: 'Vale-alimentação'
};

export function paymentMethodLabel(value?: string | null): string {
  if (!value) {
    return 'Não informado';
  }

  const normalizedValue = value.trim().toLowerCase();
  return PAYMENT_METHOD_LABELS[normalizedValue] ?? humanizePaymentMethod(normalizedValue);
}

function humanizePaymentMethod(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase());
}
