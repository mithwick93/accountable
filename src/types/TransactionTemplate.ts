import { Asset } from './Asset';
import { PaymentSystemCredit } from './PaymentSystemCredit';
import { PaymentSystemDebit } from './PaymentSystemDebit';
import { TransactionCategory } from './TransactionCategory';
import { User } from './User';

export type TransactionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type TransactionTemplate = {
  id: number;
  name: string;
  description?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: TransactionCategory;
  amount: number;
  currency: string;
  user: User;
  fromAsset?: Asset;
  toAsset?: Asset;
  fromPaymentSystemCredit?: PaymentSystemCredit;
  toPaymentSystemCredit?: PaymentSystemCredit;
  fromPaymentSystemDebit?: PaymentSystemDebit;
  toPaymentSystemDebit?: PaymentSystemDebit;
  frequency?: TransactionFrequency;
  dayOfWeek?: DayOfWeek;
  dayOfMonth?: number;
  monthOfYear?: number;
  startDate?: string;
  endDate?: string;
};
