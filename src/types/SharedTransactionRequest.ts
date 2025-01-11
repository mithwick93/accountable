export type SharedTransactionRequest = {
  id?: number;
  userId: string;
  share: number;
  paidAmount: number;
  isSettled?: boolean;
};
