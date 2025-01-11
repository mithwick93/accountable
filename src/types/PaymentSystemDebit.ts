import { Asset } from './Asset';
import { PaymentSystem } from './PaymentSystem';

export type PaymentSystemDebit = PaymentSystem & {
  dailyLimit?: number;
  asset: Asset;
};
