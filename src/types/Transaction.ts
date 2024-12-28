import { Asset } from './Asset';
import { Liability } from './Liability';
import { PaymentSystemCredit } from './PaymentSystemCredit';
import { PaymentSystemDebit } from './PaymentSystemDebit';
import { SharedTransaction } from './SharedTransaction';
import { TransactionCategory } from './TransactionCategory';

export type Transaction = {
  id: number;
  name: string;
  description?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: TransactionCategory;
  amount: number;
  currency: string;
  date: string;
  fromAsset?: Asset;
  toAsset?: Asset;
  fromPaymentSystemCredit?: PaymentSystemCredit;
  toPaymentSystemCredit?: PaymentSystemCredit;
  fromPaymentSystemDebit?: PaymentSystemDebit;
  toPaymentSystemDebit?: PaymentSystemDebit;
  fromLiability?: Liability;
  toLiability?: Liability;
  sharedTransactions?: SharedTransaction[];
};
