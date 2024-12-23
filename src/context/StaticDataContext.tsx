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

interface StaticDataContextType {
  currencies: Currency[] | null;
  transactionTypes: string[] | null;
  liabilityStatuses: string[] | null;
  liabilityTypes: LiabilityType[] | null;
  installmentPlanStatuses: string[] | null;
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
    transactionTypes: null,
    liabilityStatuses: null,
    liabilityTypes: null,
    installmentPlanStatuses: null,
    assetTypes: null,
  });

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [
          currencies,
          transactionTypes,
          liabilityStatuses,
          liabilityTypes,
          installmentPlanStatuses,
          assetTypes,
        ] = await Promise.all([
          apiClient.get('/currencies'),
          apiClient.get('/transactions/types'),
          apiClient.get('/liabilities/statuses'),
          apiClient.get('/liabilities/types'),
          apiClient.get('/installment-plans/statuses'),
          apiClient.get('/assets/types'),
        ]);

        setStaticData({
          currencies: currencies.data,
          transactionTypes: transactionTypes.data,
          liabilityStatuses: liabilityStatuses.data,
          liabilityTypes: liabilityTypes.data,
          installmentPlanStatuses: installmentPlanStatuses.data,
          assetTypes: assetTypes.data,
        });
      } catch (error) {
        log.error('Failed to fetch static data:', error);
      }
    };

    fetchStaticData();
  }, []);

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
