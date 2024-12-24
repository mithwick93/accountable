import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import BackdropLoader from '../components/BackdropLoader';
import apiClient from '../services/ApiService';
import log from '../utils/logger';
import { useSettings } from './SettingsContext';

interface CurrencyRatesType {
  currencyRates: { [currency: string]: number };
}

interface CurrencyRatesProviderProps {
  children: ReactNode;
}

const CurrencyRatesContext = createContext<CurrencyRatesType | undefined>(
  undefined,
);

export const CurrencyRatesProvider: React.FC<CurrencyRatesProviderProps> = ({
  children,
}) => {
  const [currencyRates, setCurrencyRates] = useState<{
    [currency: string]: number;
  }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { settings } = useSettings();
  const currency = settings?.currency || 'USD';

  useEffect(() => {
    const fetchCurrencyRates = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(
          `/exchange-rates?baseCurrency=${currency}&onlySupported=true`,
        );
        const currencyRatesData = response.data.conversionRates;

        const sortedCurrencyRatesData = Object.keys(currencyRatesData)
          .sort()
          .reduce(
            (acc, key) => {
              acc[key] = currencyRatesData[key];
              return acc;
            },
            {} as { [currency: string]: number },
          );

        setCurrencyRates(sortedCurrencyRatesData);
      } catch (error) {
        log.error('Error fetching currency rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyRates();
  }, [currency]);

  if (loading) {
    return <BackdropLoader />;
  }

  return (
    <CurrencyRatesContext.Provider value={{ currencyRates }}>
      {children}
    </CurrencyRatesContext.Provider>
  );
};

export const useCurrencyRates = (): CurrencyRatesType => {
  const context = useContext(CurrencyRatesContext);
  if (!context) {
    throw new Error(
      'useCurrencyRates must be used within a CurrencyRatesProvider',
    );
  }
  return context;
};
