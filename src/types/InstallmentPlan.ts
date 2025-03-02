import { Liability } from './Liability';

export type InstallmentPlan = {
  id: number;
  name: string;
  description?: string;
  liability: Liability;
  currency: string;
  installmentAmount: number;
  totalInstallments: number;
  installmentsPaid: number;
  interestRate?: number;
  startDate: string;
  endDate?: string;
  status: string;
};
