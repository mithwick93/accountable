import { PaletteMode } from '@mui/material/styles/createPalette';

export const alertColors = {
  green: { dark: '#81C784', light: '#388E3C' },
  orange: { dark: '#FFB74D', light: '#F57C00' },
  red: { dark: '#E57373', light: '#D32F2F' },
};

export const notSelectedOption = {
  value: -999,
  label: '--- Not selected ---',
};

export const formatAssetType = (type: string | undefined) => {
  switch (type) {
    case 'INVESTMENT':
      return 'Investment';
    case 'SAVINGS_ACCOUNT':
      return 'Saving Account';
    default:
      return type;
  }
};

export const getOriginalAssetType = (type: string | undefined) => {
  switch (type) {
    case 'Investment':
      return 'INVESTMENT';
    case 'Saving Account':
      return 'SAVINGS_ACCOUNT';
    default:
      return type;
  }
};

export const getLiabilityTypeOptions = () => [
  'Credit Card',
  'Personal Loan',
  'Mortgage',
  'Auto Loan',
  'Student Loan',
  'Line of Credit',
  'Business Loan',
];

export const formatLiabilityType = (type: string | undefined) => {
  switch (type) {
    case 'CREDIT_CARD':
      return 'Credit Card';
    case 'PERSONAL_LOAN':
      return 'Personal Loan';
    case 'MORTGAGE':
      return 'Mortgage';
    case 'AUTO_LOAN':
      return 'Auto Loan';
    case 'STUDENT_LOAN':
      return 'Student Loan';
    case 'LINE_OF_CREDIT':
      return 'Line of Credit';
    case 'BUSINESS_LOAN':
      return 'Business Loan';
    default:
      return type;
  }
};

export const getOriginalLiabilityType = (type: string | undefined) => {
  switch (type) {
    case 'Credit Card':
      return 'CREDIT_CARD';
    case 'Personal Loan':
      return 'PERSONAL_LOAN';
    case 'Mortgage':
      return 'MORTGAGE';
    case 'Auto Loan':
      return 'AUTO_LOAN';
    case 'Student Loan':
      return 'STUDENT_LOAN';
    case 'Line of Credit':
      return 'LINE_OF_CREDIT';
    case 'Business Loan':
      return 'BUSINESS_LOAN';
    default:
      return type;
  }
};

export const getLiabilityStatusOptions = () => [
  'Active',
  'Paid Off',
  'Overdue',
  'Settled',
  'Defaulted',
  'Closed',
  'In Dispute',
  'Suspended',
  'Pending Activation',
];

export const formatLiabilityStatus = (status: string | undefined) => {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'PAID_OFF':
      return 'Paid Off';
    case 'OVERDUE':
      return 'Overdue';
    case 'SETTLED':
      return 'Settled';
    case 'DEFAULTED':
      return 'Defaulted';
    case 'CLOSED':
      return 'Closed';
    case 'IN_DISPUTE':
      return 'In Dispute';
    case 'SUSPENDED':
      return 'Suspended';
    case 'PENDING_ACTIVATION':
      return 'Pending Activation';
    default:
      return status;
  }
};

export const getOriginalLiabilityStatus = (status: string | undefined) => {
  switch (status) {
    case 'Active':
      return 'ACTIVE';
    case 'Paid Off':
      return 'PAID_OFF';
    case 'Overdue':
      return 'OVERDUE';
    case 'Settled':
      return 'SETTLED';
    case 'Defaulted':
      return 'DEFAULTED';
    case 'Closed':
      return 'CLOSED';
    case 'In Dispute':
      return 'IN_DISPUTE';
    case 'Suspended':
      return 'SUSPENDED';
    case 'Pending Activation':
      return 'PENDING_ACTIVATION';
    default:
      return status;
  }
};

export const formatTransactionType = (type: string | undefined) => {
  switch (type) {
    case 'INCOME':
      return 'Income';
    case 'EXPENSE':
      return 'Expense';
    case 'TRANSFER':
      return 'Transfer';
    default:
      return type;
  }
};

export const getOriginalTransactionType = (type: string | undefined) => {
  switch (type) {
    case 'Income':
      return 'INCOME';
    case 'Expense':
      return 'EXPENSE';
    case 'Transfer':
      return 'TRANSFER';
    default:
      return type;
  }
};

export const stringToColor = (input: string, isDarkTheme: boolean): string => {
  // Create a hash from the input string
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate RGB values from the hash
  let r = (hash >> 0) & 0xff;
  let g = (hash >> 8) & 0xff;
  let b = (hash >> 16) & 0xff;

  // Adjust colors for dark mode or light mode
  if (isDarkTheme) {
    // Darken the colors for dark mode
    r = Math.floor(r * 0.5);
    g = Math.floor(g * 0.5);
    b = Math.floor(b * 0.5);
  } else {
    // Lighten the colors for light mode
    r = Math.floor(r + (255 - r) * 0.5);
    g = Math.floor(g + (255 - g) * 0.5);
    b = Math.floor(b + (255 - b) * 0.5);
  }

  // Ensure RGB values are in the 0-255 range
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  // Convert RGB values to hexadecimal and return the color
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
};

export const getCreditUtilizationColor = (
  utilized: number,
  limit: number,
  palateMode: PaletteMode,
) => {
  const utilizationPercentage = (utilized / limit) * 100;

  if (utilizationPercentage < 30) {
    return alertColors.green[palateMode];
  } else if (utilizationPercentage < 70) {
    return alertColors.orange[palateMode];
  } else {
    return alertColors.red[palateMode];
  }
};

export const getDueDateColor = (
  dueDateString: string,
  palateMode: PaletteMode,
) => {
  const [day, month, year] = dueDateString.split('/');
  const dueDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  const timeDiff = dueDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysRemaining <= 7) {
    return alertColors.red[palateMode];
  } else if (daysRemaining <= 14) {
    return alertColors.orange[palateMode];
  } else {
    return alertColors.green[palateMode];
  }
};

export const formatNumber = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(amount);

export const formatCurrency = (amount: number, currency: string) => {
  if (currency === 'G24') {
    return `G24 ${formatNumber(amount)}`;
  }

  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency,
  });
};
