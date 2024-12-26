import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import BackdropLoader from '../components/BackdropLoader';
import apiClient from '../services/ApiService';
import { AssetType } from '../types/AssetType';
import { Currency } from '../types/Currency';
import { LiabilityType } from '../types/LiabilityType';
import log from '../utils/logger';

interface StaticDataContextType {
  currencies: Currency[] | null;
  liabilityTypes: LiabilityType[] | null;
  assetTypes: AssetType[] | null;
}

interface StaticDataProviderProps {
  children: ReactNode;
}

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
        });
      } catch (error) {
        log.error('Failed to fetch static data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaticData();
  }, []);

  if (loading) {
    return <BackdropLoader />;
  }

  return (
    <StaticDataContext.Provider value={staticData}>
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
