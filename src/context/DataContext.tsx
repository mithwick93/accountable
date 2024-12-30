import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import apiClient from '../services/ApiService';
import { Asset } from '../types/Asset';
import { Liability } from '../types/Liability';
import { PaymentSystemCredit } from '../types/PaymentSystemCredit';
import { PaymentSystemDebit } from '../types/PaymentSystemDebit';
import { TransactionCategory } from '../types/TransactionCategory';
import log from '../utils/logger';

type DATA_TYPES = 'assets' | 'liabilities' | 'paymentSystems' | 'categories';

interface DataContextType {
  assets: Asset[];
  liabilities: Liability[];
  paymentSystems: (PaymentSystemCredit | PaymentSystemDebit)[];
  categories: TransactionCategory[];
  loading: boolean;
  // eslint-disable-next-line no-unused-vars
  refetchData: (dataTypes?: DATA_TYPES[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [paymentSystems, setPaymentSystems] = useState<
    (PaymentSystemCredit | PaymentSystemDebit)[]
  >([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async (
    dataTypes: DATA_TYPES[] = [
      'assets',
      'liabilities',
      'paymentSystems',
      'categories',
    ],
  ) => {
    setLoading(true);
    try {
      const promises = [];

      if (dataTypes.includes('assets')) {
        promises.push(apiClient.get('/assets'));
      }
      if (dataTypes.includes('liabilities')) {
        promises.push(apiClient.get('/liabilities'));
      }
      if (dataTypes.includes('paymentSystems')) {
        promises.push(apiClient.get('/payment-systems/credits'));
        promises.push(apiClient.get('/payment-systems/debits'));
      }
      if (dataTypes.includes('categories')) {
        promises.push(apiClient.get('/transactions/categories'));
      }

      const responses = await Promise.all(promises);

      if (dataTypes.includes('assets') && responses[0]) {
        const assets = responses
          .shift()
          ?.data.sort((a: Asset, b: Asset) => a.name.localeCompare(b.name));
        setAssets(assets);
      }
      if (dataTypes.includes('liabilities') && responses[0]) {
        const liabilities = responses
          .shift()
          ?.data.sort((a: Liability, b: Liability) =>
            a.name.localeCompare(b.name),
          );
        setLiabilities(liabilities);
      }
      if (dataTypes.includes('paymentSystems') && responses[0]) {
        const credits = responses
          .shift()
          ?.data.map((item: PaymentSystemCredit) => ({
            ...item,
            type: 'Credit',
          }))
          .sort((a: PaymentSystemCredit, b: PaymentSystemCredit) =>
            a.name.localeCompare(b.name),
          );
        const debits = responses
          .shift()
          ?.data.map((item: PaymentSystemDebit) => ({ ...item, type: 'Debit' }))
          .sort((a: PaymentSystemDebit, b: PaymentSystemDebit) =>
            a.name.localeCompare(b.name),
          );
        setPaymentSystems([...credits, ...debits]);
      }
      if (dataTypes.includes('categories') && responses[0]) {
        const categories = responses
          .shift()
          ?.data.sort(
            (a: TransactionCategory, b: TransactionCategory) =>
              a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
          );
        setCategories(categories);
      }
    } catch (error) {
      log.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetchData = (dataTypes?: DATA_TYPES[]) => fetchData(dataTypes);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        assets,
        liabilities,
        paymentSystems,
        categories,
        refetchData,
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
