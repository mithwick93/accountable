import { endOfMonth, isBefore, parse } from 'date-fns';
import Payment from 'payment';
import { PaymentSystemCredit } from '../types/PaymentSystemCredit';
import { PaymentSystemDebit } from '../types/PaymentSystemDebit';

export const isValidCard = (
  paymentSystem: PaymentSystemCredit | PaymentSystemDebit,
) =>
  paymentSystem.cardHolderName !== null &&
  paymentSystem.cardNumber !== null &&
  paymentSystem.securityCode !== null &&
  paymentSystem.expiryDate !== null;

export const getCardDetails = (
  paymentSystem: PaymentSystemCredit | PaymentSystemDebit,
) => ({
  name: paymentSystem.name || '',
  cardHolderName: paymentSystem.cardHolderName || '',
  cardNumber: paymentSystem.cardNumber || '',
  securityCode: paymentSystem.securityCode || '',
  expiryDate: paymentSystem.expiryDate || '',
  additionalNote: paymentSystem.additionalNote || '',
});

const clearNumber = (value = '') => value.replace(/\D+/g, '');

export const formatCreditCardNumber = (value: string | undefined | null) => {
  if (!value) {
    return 'Invalid card number';
  }

  const issuer = Payment.fns.cardType(value);
  const clearValue = clearNumber(value);
  let nextValue;

  switch (issuer) {
    case 'amex':
      nextValue = `${clearValue.slice(0, 4)} ${clearValue.slice(
        4,
        10,
      )} ${clearValue.slice(10, 15)}`;
      break;
    case 'dinersclub':
      nextValue = `${clearValue.slice(0, 4)} ${clearValue.slice(
        4,
        10,
      )} ${clearValue.slice(10, 14)}`;
      break;
    default:
      nextValue = `${clearValue.slice(0, 4)} ${clearValue.slice(
        4,
        8,
      )} ${clearValue.slice(8, 12)} ${clearValue.slice(12, 19)}`;
      break;
  }

  return nextValue.trim();
};

export const formatExpirationDate = (value: string) => {
  const clearValue = clearNumber(value);

  if (clearValue.length >= 6) {
    // If input is in MM/YYYY
    const month = clearValue.slice(0, 2);
    const year = clearValue.slice(4, 6);
    return `${month}/${year}`;
  }

  if (clearValue.length >= 4) {
    // If input is in MM/YY or similar
    const month = clearValue.slice(0, 2);
    const year = clearValue.slice(2, 4);
    return `${month}/${year}`;
  }

  return clearValue;
};

export const formatCVC = (value: string, issuer: string) => {
  const clearValue = clearNumber(value);
  const maxLength = issuer === 'amex' ? 4 : 3;
  return clearValue.slice(0, maxLength);
};

export const isCardExpired = (expiryDate: string) => {
  const [month, year] = expiryDate.split('/').map(Number);
  const fullYear = year < 100 ? 2000 + year : year;

  const parsedDate = endOfMonth(
    parse(`${month}/${fullYear}`, 'MM/yyyy', new Date()),
  );

  return isBefore(parsedDate, new Date());
};
