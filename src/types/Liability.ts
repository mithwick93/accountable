export interface Liability {
  id: number;
  name: string;
  description: string | undefined | null;
  type: string;
  currency: string;
  amount: number;
  balance: number;
  interestRate: number | undefined | null;
  statementDay: string | undefined | null;
  dueDay: string;
  status: string;
}
