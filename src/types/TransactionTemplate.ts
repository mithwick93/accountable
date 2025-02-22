import { TransactionCategory } from './TransactionCategory';

export type TransactionFrequency = 'MONTHLY' | 'YEARLY';

export type TransactionTemplate = {
  id: number;
  name: string;
  description?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: TransactionCategory;
  amount: number;
  currency: string;
  frequency?: TransactionFrequency;
  dayOfMonth?: number;
  monthOfYear?: number;
  startDate?: string;
  endDate?: string;
};
