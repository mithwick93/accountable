import { Asset } from './Asset';
import { PaymentSystem } from './PaymentSystem';

export interface PaymentSystemDebit extends PaymentSystem {
  dailyLimit?: number;
  asset: Asset;
}
