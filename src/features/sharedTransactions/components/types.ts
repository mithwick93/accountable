export type SettleTransactionCandidate = {
  transactionId: number;
  transactionName: string;
  transactionCategory: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionDate: string;
  sharedTransactionId: number;
  sharedTransactionUserName: string;
  sharedTransactionShare: number;
  sharedTransactionRemaining: number;
  isSettled: boolean;
};

export type SettleSharedTransactionsPayload = {
  selectedSharedTransactionIds: number[];
  candidates: SettleTransactionCandidate[];
  currencyRates: { [currency: string]: number };
  baseCurrency: string;
};
