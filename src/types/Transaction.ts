import { Asset } from './Asset';
import { Liability } from './Liability';
import { PaymentSystemCredit } from './PaymentSystemCredit';
import { PaymentSystemDebit } from './PaymentSystemDebit';
import { SharedTransaction } from './SharedTransaction';
import { TransactionCategory } from './TransactionCategory';
import { User } from './User';

export type Transaction = {
  id: number;
  name: string;
  description?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: TransactionCategory;
  amount: number;
  currency: string;
  date: string;
  user: User;
  fromPaymentSystemCredit?: PaymentSystemCredit;
  fromPaymentSystemDebit?: PaymentSystemDebit;
  fromAsset?: Asset;
  toAsset?: Asset;
  toLiability?: Liability;
  sharedTransactions?: SharedTransaction[];
};
