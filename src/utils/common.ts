export const alertColors = {
  green: { dark: '#81C784', light: '#388E3C' },
  orange: { dark: '#FFB74D', light: '#F57C00' },
  red: { dark: '#E57373', light: '#D32F2F' },
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

export const stringToColor = (input: string, isDarkTheme: boolean) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 7) - hash);
  }

  const color = [0, 1, 2].map((i) => (hash >> (i * 8)) & 0xff);

  const adjustBrightness = (value: number, factor: number) =>
    Math.min(255, Math.max(0, Math.floor(value * factor)));

  const brightnessFactor = isDarkTheme ? 0.5 : 1.2;
  const adjustedColor = color.map((component) =>
    adjustBrightness(component, brightnessFactor),
  );

  return `#${adjustedColor
    .map((c) => `00${c.toString(16)}`.slice(-2))
    .join('')}`;
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
