export type SharedTransaction = {
  id?: number;
  userId: string;
  share: number;
  paidAmount: number;
  isSettled?: boolean;
};
