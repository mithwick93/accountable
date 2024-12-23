export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount);
