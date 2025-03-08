import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import apiClient from '../services/ApiService';
import { Currency } from '../types/Currency';
import log from '../utils/logger';

type StaticDataContextType = {
  currencies: Currency[] | null;
  loading: boolean;
};

type StaticDataProviderProps = {
  children: ReactNode;
};

const StaticDataContext = createContext<StaticDataContextType | undefined>(
  undefined,
);

export const StaticDataProvider: React.FC<StaticDataProviderProps> = ({
  children,
}) => {
  const [staticData, setStaticData] = useState<StaticDataContextType>({
    currencies: null,
    loading: true,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStaticData = async () => {
      setLoading(true);
      try {
        const currencies = await apiClient.get('/currencies');

        setStaticData({
          currencies: currencies.data.sort((a: Currency, b: Currency) =>
            a.code.localeCompare(b.code),
          ),
          loading: false,
        });
      } catch (error) {
        log.error('Failed to fetch static data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaticData();
  }, []);

  return (
    <StaticDataContext.Provider value={{ ...staticData, loading }}>
      {children}
    </StaticDataContext.Provider>
  );
};

export const useStaticData = (): StaticDataContextType => {
  const context = useContext(StaticDataContext);
  if (!context) {
    throw new Error('useStaticData must be used within a StaticDataProvider');
  }
  return context;
};
