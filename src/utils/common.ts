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
