export type PaymentSystem = {
  id: string;
  name: string;
  description: string;
  type: string;
  currency: string;
  active: boolean;
  cardHolderName: string | null;
  cardNumber: string | null;
  securityCode: string | null;
  expiryDate: string | null;
  additionalNote: string | null;
};
