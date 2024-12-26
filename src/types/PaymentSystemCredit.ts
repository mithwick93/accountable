import { Liability } from './Liability';
import { PaymentSystem } from './PaymentSystem';

export interface PaymentSystemCredit extends PaymentSystem {
  liability: Liability;
}
