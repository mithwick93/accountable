import { Liability } from './Liability';
import { PaymentSystem } from './PaymentSystem';

export type PaymentSystemCredit = PaymentSystem & {
  liability: Liability;
};
