import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import apiClient from '../services/ApiService';
import { Asset } from '../types/Asset';
import { InstallmentPlan } from '../types/InstallmentPlan';
import { Liability } from '../types/Liability';
import { PaymentSystemCredit } from '../types/PaymentSystemCredit';
import { PaymentSystemDebit } from '../types/PaymentSystemDebit';
import { Transaction } from '../types/Transaction';
import { TransactionCategory } from '../types/TransactionCategory';
import { TransactionTemplate } from '../types/TransactionTemplate';
import log from '../utils/logger';
import { useSettings } from './SettingsContext';

type DATA_TYPES =
  | 'assets'
  | 'liabilities'
  | 'installmentPlans'
  | 'paymentSystems'
  | 'categories'
  | 'templates'
  | 'transactions';

type TransactionResponse = {
  content: Transaction[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
  };
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  size: number;
};

type DataContextType = {
  assets: Asset[];
  installmentPlans: InstallmentPlan[];
  liabilities: Liability[];
  paymentSystems: (PaymentSystemCredit | PaymentSystemDebit)[];
  categories: TransactionCategory[];
  templates: TransactionTemplate[];
  transactions: TransactionResponse | null;
  loading: boolean;

  refetchData: (
    // eslint-disable-next-line no-unused-vars
    dataTypes?: DATA_TYPES[],
    // eslint-disable-next-line no-unused-vars
    options?: Record<string, any>,
  ) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const prepareTransactionSearchRequestPayload = (
  params: Record<string, any> | null | undefined,
): Record<string, any> => {
  const filteredParams: Record<string, any> = {};

  if (!params) {
    return filteredParams;
  }

  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      filteredParams[key] = params[key];
    }
  }
  return filteredParams;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(
    [],
  );
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [paymentSystems, setPaymentSystems] = useState<
    (PaymentSystemCredit | PaymentSystemDebit)[]
  >([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [transactions, setTransactions] = useState<TransactionResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const { settings } = useSettings();

  // eslint-disable-next-line complexity
  const fetchData = async (
    dataTypes: DATA_TYPES[] = [
      'assets',
      'installmentPlans',
      'liabilities',
      'paymentSystems',
      'categories',
      'templates',
    ],
    options: Record<string, any> = {},
  ) => {
    setLoading(true);
    try {
      const promises = [];

      if (dataTypes.includes('assets')) {
        promises.push(apiClient.get('/assets'));
      }
      if (dataTypes.includes('installmentPlans')) {
        promises.push(apiClient.get('/installment-plans'));
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

      if (dataTypes.includes('templates')) {
        promises.push(apiClient.get('/transactions/templates'));
      }

      if (dataTypes.includes('transactions')) {
        const searchParameters: Record<string, any> =
          options?.transactions?.search?.parameters ||
          settings?.transactions?.search?.parameters ||
          {};
        const {
          pageIndex = 0,
          pageSize = 50,
          sorting,
          ...requestPayload
        } = searchParameters;
        const sortParams = sorting
          ? sorting
              .map((s: string) => {
                if (s.startsWith('date,')) {
                  const [, direction] = s.split(',');
                  return `sort=${s}&sort=modified,${direction}`;
                }
                return `sort=${s}`;
              })
              .join('&')
          : '';
        promises.push(
          apiClient.post(
            `/transactions/search?page=${pageIndex}&size=${pageSize}${
              sortParams ? '&' : ''
            }${sortParams}`,
            prepareTransactionSearchRequestPayload(requestPayload),
          ),
        );
      }

      const responses = await Promise.all(promises);

      if (dataTypes.includes('assets') && responses[0]) {
        const assets = responses
          .shift()
          ?.data.sort((a: Asset, b: Asset) => a.name.localeCompare(b.name));
        setAssets(assets);
      }
      if (dataTypes.includes('installmentPlans') && responses[0]) {
        const installmentPlans = responses
          .shift()
          ?.data.sort((a: InstallmentPlan, b: InstallmentPlan) =>
            a.name.localeCompare(b.name),
          );
        setInstallmentPlans(installmentPlans);
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
      if (dataTypes.includes('templates') && responses[0]) {
        const templates = responses
          .shift()
          ?.data.sort(
            (a: TransactionTemplate, b: TransactionTemplate) =>
              a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
          );
        setTemplates(templates);
      }
      if (dataTypes.includes('transactions') && responses[0]) {
        const transactions = responses.shift()?.data;
        setTransactions(transactions);
      }
    } catch (error) {
      log.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetchData = (
    dataTypes?: DATA_TYPES[],
    options: Record<string, any> = {},
  ) => fetchData(dataTypes, options);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        assets,
        installmentPlans,
        liabilities,
        paymentSystems,
        categories,
        templates,
        transactions,
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
