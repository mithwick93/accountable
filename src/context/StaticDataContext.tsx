import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import apiClient from '../services/ApiService';
import { AssetType } from '../types/AssetType';
import { Currency } from '../types/Currency';
import { LiabilityType } from '../types/LiabilityType';
import log from '../utils/logger';

type StaticDataContextType = {
  currencies: Currency[] | null;
  liabilityTypes: LiabilityType[] | null;
  assetTypes: AssetType[] | null;
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
    liabilityTypes: null,
    assetTypes: null,
    loading: true,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStaticData = async () => {
      setLoading(true);
      try {
        const [currencies, liabilityTypes, assetTypes] = await Promise.all([
          apiClient.get('/currencies'),
          apiClient.get('/liabilities/types'),
          apiClient.get('/assets/types'),
        ]);

        setStaticData({
          currencies: currencies.data.sort((a: Currency, b: Currency) =>
            a.code.localeCompare(b.code),
          ),
          liabilityTypes: liabilityTypes.data.sort(
            (a: LiabilityType, b: LiabilityType) =>
              a.name.localeCompare(b.name),
          ),
          assetTypes: assetTypes.data.sort((a: AssetType, b: AssetType) =>
            a.name.localeCompare(b.name),
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
