import { Asset } from './Asset';
import { Liability } from './Liability';
import { PaymentSystemCredit } from './PaymentSystemCredit';
import { PaymentSystemDebit } from './PaymentSystemDebit';
import { TransactionCategory } from './TransactionCategory';

export type TransactionScan = {
  name?: string;
  description?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category?: TransactionCategory;
  amount?: number;
  currency?: string;
  date?: string;
  fromPaymentSystemCredit?: PaymentSystemCredit;
  fromPaymentSystemDebit?: PaymentSystemDebit;
  fromAsset?: Asset;
  toAsset?: Asset;
  toLiability?: Liability;
};
