export type Liability = {
  id: number;
  name: string;
  description?: string;
  type: string;
  currency: string;
  amount: number;
  balance: number;
  interestRate?: number;
  statementDay?: string;
  dueDay: string;
  status: string;
};
