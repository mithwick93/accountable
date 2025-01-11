export type TransactionCategory = {
  id: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  name: string;
};
