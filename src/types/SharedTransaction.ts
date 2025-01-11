import { User } from './User';

export type SharedTransaction = {
  id: number;
  user: User;
  share: number;
  paidAmount: number;
  isSettled: boolean;
};
