import DeleteIcon from '@mui/icons-material/Delete';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import MoneyIcon from '@mui/icons-material/Money';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';

import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ColumnFilter } from '@tanstack/table-core/src/features/ColumnFiltering';
import { useDialogs } from '@toolpad/core/useDialogs';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_Row,
  MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import DateRangeSelector from '../../../components/DateRangeSelector';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { useStaticData } from '../../../context/StaticDataContext';
import { useUser } from '../../../context/UserContext';
import apiClient from '../../../services/ApiService';
import { SharedTransaction } from '../../../types/SharedTransaction';
import {
  formatCurrency,
  formatNumber,
  formatTransactionType,
  generateAvatarProps,
  getStartEndDate,
  getTransactionsFetchOptions,
  stringToColor,
} from '../../../utils/common';
import { notifyBackendError } from '../../../utils/notifications';
import SettleSharedTransactionsDialog from './SettleSharedTransactionsDialog';
import TransactionsSummery from './TransactionsSummery';

const FILTER_COLUMNS: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  currency: 'Currency',
  amount: 'Amount',
  type: 'Type',
  category: 'Category',
  fromPaymentSystem: 'From Payment System',
  fromAsset: 'From Asset',
  toAsset: 'To Asset',
  toLiability: 'To Liability',
};

const computeSearchParameters = (
  searchParameters: Record<string, any>,
  newColumnFilters: ColumnFilter[],
) => {
  const newSearchParameters = { ...searchParameters };
  const presenceFlags: Record<string, boolean> = {};

  // eslint-disable-next-line no-unused-vars
  const filterMapping: Record<string, (value: any) => void> = {
    user: (value) => {
      if (Array.isArray(value)) {
        newSearchParameters.userIds = value;
      }
      presenceFlags.user = true;
    },
    name: (value) => {
      newSearchParameters.name = value;
      presenceFlags.name = true;
    },
    description: (value) => {
      newSearchParameters.description = value;
      presenceFlags.description = true;
    },
    currency: (value) => {
      if (Array.isArray(value)) {
        newSearchParameters.currencies = value;
      }
      presenceFlags.currency = true;
    },
    amount: (value) => {
      if (Array.isArray(value) && value.length === 2) {
        const [amountFrom, amountTo] = value;
        newSearchParameters.amountFrom = amountFrom;
        newSearchParameters.amountTo = amountTo;
      }
      presenceFlags.amount = true;
    },
    type: (value) => {
      if (Array.isArray(value)) {
        newSearchParameters.types = value;
      }
      presenceFlags.type = true;
    },
    category: (value) => {
      if (Array.isArray(value)) {
        newSearchParameters.categoryIds = value;
      }
      presenceFlags.category = true;
    },
    fromPaymentSystem: (value) => {
      if (Array.isArray(value)) {
        newSearchParameters.fromPaymentSystemIds = value;
      }
      presenceFlags.fromPaymentSystem = true;
    },
    fromAsset: (value) => {
      if (Array.isArray(value)) {
        newSearchParameters.fromAssetIds = value;
      }
      presenceFlags.fromAsset = true;
    },
    toAsset: (value) => {
      if (Array.isArray(value)) {
        newSearchParameters.toAssetIds = value;
      }
      presenceFlags.toAsset = true;
    },
    toLiability: (value) => {
      if (Array.isArray(value)) {
        newSearchParameters.toLiabilityIds = value;
      }
      presenceFlags.toLiability = true;
    },
  };

  newColumnFilters.forEach(({ id, value }) => {
    const handler = filterMapping[id];
    if (handler) {
      handler(value);
    }
  });

  if (!presenceFlags.user) {
    newSearchParameters.userIds = null;
  }
  if (!presenceFlags.name) {
    newSearchParameters.name = null;
  }
  if (!presenceFlags.description) {
    newSearchParameters.description = null;
  }
  if (!presenceFlags.currency) {
    newSearchParameters.currencies = null;
  }
  if (!presenceFlags.amount) {
    newSearchParameters.amountFrom = null;
    newSearchParameters.amountTo = null;
  }
  if (!presenceFlags.type) {
    newSearchParameters.types = null;
  }
  if (!presenceFlags.category) {
    newSearchParameters.categoryIds = null;
  }
  if (!presenceFlags.fromPaymentSystem) {
    newSearchParameters.fromPaymentSystemIds = null;
  }
  if (!presenceFlags.fromAsset) {
    newSearchParameters.fromAssetIds = null;
  }
  if (!presenceFlags.toAsset) {
    newSearchParameters.toAssetIds = null;
  }
  if (!presenceFlags.toLiability) {
    newSearchParameters.toLiabilityIds = null;
  }

  return newSearchParameters;
};

const Transactions: React.FC = () => {
  const { users, loading: userLoading } = useUser();
  const { currencies, loading: staticDataLoading } = useStaticData();
  const {
    assets,
    liabilities,
    paymentSystems,
    categories,
    transactions: transactionsResponse,
    loading: dataLoading,
    refetchData,
  } = useData();
  const { settings, update, loading: settingsLoading } = useSettings();
  const theme = useTheme();
  const dialogs = useDialogs();
  const [deleting, setDeleting] = useState(false);

  const loading =
    userLoading || staticDataLoading || dataLoading || settingsLoading;

  const userFilterOptions = useMemo(() => {
    if (!users) {
      return [];
    }

    return users.map((user) => ({
      label: `${user.firstName} ${user?.lastName}`,
      value: user.id,
    }));
  }, [users]);
  const currencyOptions = useMemo(
    () => currencies?.map((currency) => currency.code) ?? [],
    [currencies],
  );
  const categoriesOptions = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categories],
  );
  const assetsOptions = useMemo(
    () =>
      assets.map((asset) => ({
        label: asset.name,
        value: asset.id,
      })),
    [assets],
  );
  const liabilitiesOptions = useMemo(
    () =>
      liabilities.map((liability) => ({
        label: liability.name,
        value: liability.id,
      })),
    [liabilities],
  );
  const paymentSystemsOptions = useMemo(
    () =>
      paymentSystems.map((paymentSystem) => ({
        label: paymentSystem.name,
        value: paymentSystem.id,
      })),
    [paymentSystems],
  );

  const transactions = useMemo(
    () => transactionsResponse?.content || [],
    [transactionsResponse],
  );
  const transactionsWithShares = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.sharedTransactions &&
          transaction.sharedTransactions.length > 0,
      ),
    [transactions],
  );

  const searchParameters: Record<string, any> = useMemo(
    () => settings?.transactions?.search?.parameters || {},
    [settings],
  );
  const pageIndex = searchParameters.pageIndex || 0;
  const pageSize = searchParameters.pageSize || 100;
  const { startDate, endDate } = getStartEndDate(settings);

  const columnFilters = useMemo(
    () =>
      (settings?.transactions?.search?.columnFilters || []).map(
        (filter: ColumnFilter) => {
          if (filter.id === 'date' && Array.isArray(filter.value)) {
            return {
              ...filter,
              value: filter.value.map((item) =>
                !item ? undefined : new Date(item),
              ),
            };
          }
          return filter;
        },
      ),
    [settings],
  );

  const appliedFilters: string = useMemo(() => {
    const filterKeys = Object.keys(FILTER_COLUMNS);
    const presentFilters = columnFilters
      .filter(
        // @ts-expect-error ignore
        ({ id, value }) => filterKeys.includes(id) && value.length > 0,
      )
      // @ts-expect-error ignore
      .map(({ id }) => FILTER_COLUMNS[id]);

    if (presentFilters.length === 0) {
      return '';
    }

    return ` (${presentFilters.join(', ')})`;
  }, [columnFilters]);

  const transactionCurrencies = useMemo(
    () =>
      Array.from(
        new Set(transactions.map((transaction) => transaction.currency)),
      ).sort((a, b) => a.localeCompare(b)),
    [transactions],
  );

  const totalAmountByCurrency = useMemo(() => {
    const totals = transactions.reduce(
      (acc, transaction) => {
        const { currency, amount } = transaction;
        if (!acc[currency]) {
          acc[currency] = 0;
        }
        acc[currency] += amount;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.fromEntries(
      Object.entries(totals).sort(([currencyA], [currencyB]) =>
        currencyA.localeCompare(currencyB),
      ),
    );
  }, [transactions]);

  useEffect(() => {
    refetchData(
      ['transactions'],
      getTransactionsFetchOptions(searchParameters, startDate, endDate),
    );
    // eslint-disable-next-line
  }, [searchParameters, startDate, endDate]);

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorFn: (row) => `${row.user?.firstName} ${row.user?.lastName}`,
        accessorKey: 'user',
        header: 'User',
        grow: false,
        minSize: 125,
        size: 125,
        maxSize: 150,
        filterVariant: 'multi-select',
        filterSelectOptions: userFilterOptions,
        filterFn: () => true,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Avatar
              {...generateAvatarProps(
                cell.getValue<string>() || 'User',
                theme.palette.mode === 'dark',
                { width: 24, height: 24, fontSize: 12 },
              )}
            />
          </Tooltip>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        minSize: 150,
        size: 200,
        maxSize: 250,
        filterFn: () => true,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textTransform: 'capitalize',
              }}
            >
              {cell.getValue<string>()}
            </Box>
          </Tooltip>
        ),
      },
      {
        accessorFn: (row) => new Date(row.date),
        accessorKey: 'date',
        header: 'Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 100,
        size: 125,
        maxSize: 150,
        filterVariant: 'date-range',
        filterFn: () => true,
        Cell: ({ cell }) => format(cell.getValue<Date>(), 'dd/MM/yyyy'),
      },
      {
        accessorFn: (row) => row.currency,
        accessorKey: 'currency',
        header: 'Currency',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 100,
        size: 150,
        maxSize: 150,
        filterVariant: 'multi-select',
        filterFn: () => true,
        filterSelectOptions: currencyOptions,
        Footer: () => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {transactionCurrencies.map((currency) => (
              <Typography
                key={currency}
                variant="caption"
                sx={{ fontWeight: 'bold' }}
              >
                {currency}
              </Typography>
            ))}
          </Box>
        ),
      },
      {
        accessorFn: (row) => row.amount,
        accessorKey: 'amount',
        header: 'Amount',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 125,
        size: 140,
        maxSize: 200,
        filterVariant: 'range-slider',
        filterFn: () => true,
        Cell: ({ cell }) => (
          <Box component="span">{formatNumber(cell.row.original.amount)}</Box>
        ),
        aggregationFn: 'sum',
        AggregatedCell: ({ cell }) => (
          <span>
            {formatCurrency(
              cell.getValue<number>(),
              cell.row.original.currency,
            )}
          </span>
        ),
        Footer: () => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {Object.entries(totalAmountByCurrency).map(([currency, total]) => (
              <Typography
                key={currency}
                variant="caption"
                sx={{ fontWeight: 'bold' }}
              >
                {formatNumber(total)}
              </Typography>
            ))}
          </Box>
        ),
      },
      {
        accessorFn: (row) => formatTransactionType(row.type),
        accessorKey: 'type',
        header: 'Type',
        minSize: 125,
        size: 125,
        maxSize: 150,
        filterVariant: 'multi-select',
        filterFn: () => true,
        filterSelectOptions: [
          { label: 'Expense', value: 'EXPENSE' },
          {
            label: 'Income',
            value: 'INCOME',
          },
          { label: 'Transfer', value: 'TRANSFER' },
        ],
        Cell: ({ renderedCellValue }) => (
          <Chip
            label={renderedCellValue}
            sx={(theme) => ({
              backgroundColor: stringToColor(
                renderedCellValue as string,
                theme.palette.mode === 'dark',
              ),
            })}
          />
        ),
      },
      {
        accessorFn: (row) => row.category?.name,
        accessorKey: 'category',
        header: 'Category',
        minSize: 125,
        size: 150,
        maxSize: 200,
        filterVariant: 'multi-select',
        filterFn: () => true,
        filterSelectOptions: categoriesOptions,
        Cell: ({ renderedCellValue }) => (
          <Chip
            label={renderedCellValue}
            sx={(theme) => ({
              backgroundColor: stringToColor(
                renderedCellValue as string,
                theme.palette.mode === 'dark',
              ),
            })}
          />
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        grow: false,
        minSize: 150,
        size: 200,
        maxSize: 200,
        filterFn: () => true,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cell.getValue<string>()}
            </Box>
          </Tooltip>
        ),
      },
      {
        accessorFn: (row) =>
          row.fromPaymentSystemCredit?.name || row.fromPaymentSystemDebit?.name,
        accessorKey: 'fromPaymentSystem',
        header: 'From Payment System',
        grow: false,
        minSize: 150,
        size: 200,
        maxSize: 200,
        filterVariant: 'multi-select',
        filterFn: () => true,
        filterSelectOptions: paymentSystemsOptions,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cell.getValue<string>()}
            </Box>
          </Tooltip>
        ),
      },
      {
        accessorFn: (row) => row.fromAsset?.name,
        accessorKey: 'fromAsset',
        header: 'From Asset',
        grow: false,
        minSize: 150,
        size: 200,
        maxSize: 200,
        filterVariant: 'multi-select',
        filterFn: () => true,
        filterSelectOptions: assetsOptions,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cell.getValue<string>()}
            </Box>
          </Tooltip>
        ),
      },
      {
        accessorFn: (row) => row.toAsset?.name,
        accessorKey: 'toAsset',
        header: 'To Asset',
        grow: false,
        minSize: 150,
        size: 200,
        maxSize: 200,
        filterVariant: 'multi-select',
        filterFn: () => true,
        filterSelectOptions: assetsOptions,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cell.getValue<string>()}
            </Box>
          </Tooltip>
        ),
      },
      {
        accessorFn: (row) => row.toLiability?.name,
        accessorKey: 'toLiability',
        header: 'To Liability',
        grow: false,
        minSize: 150,
        size: 200,
        maxSize: 200,
        filterVariant: 'multi-select',
        filterFn: () => true,
        filterSelectOptions: liabilitiesOptions,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cell.getValue<string>()}
            </Box>
          </Tooltip>
        ),
      },
    ],
    [
      userFilterOptions,
      currencyOptions,
      categoriesOptions,
      paymentSystemsOptions,
      assetsOptions,
      liabilitiesOptions,
      theme.palette.mode,
      transactionCurrencies,
      totalAmountByCurrency,
    ],
  );

  const deleteTransaction = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    try {
      const updateAccounts = settings?.transactions.updateAccounts ?? false;

      const { id } = row.original;
      await apiClient.delete(
        `/transactions/${id}?updateAccounts=${updateAccounts}`,
      );
      await refetchData(
        ['transactions', 'assets', 'liabilities', 'paymentSystems'],
        getTransactionsFetchOptions(searchParameters, startDate, endDate),
      );

      toast.success(`Deleted transaction: '${row.original.name}' successfully`);
    } catch (error) {
      notifyBackendError('Error deleting transaction', error);
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    const filterKeys = Object.keys(FILTER_COLUMNS);
    const resetColumnFilters = columnFilters.filter(
      // @ts-expect-error ignore
      ({ id }) => !filterKeys.includes(id),
    );
    const resetSearchParameters = computeSearchParameters(
      searchParameters,
      resetColumnFilters,
    );

    update({
      ...settings,
      transactions: {
        ...(settings?.transactions || {}),
        search: {
          ...(settings?.transactions?.search || {}),
          columnFilters: resetColumnFilters,
          parameters: resetSearchParameters,
        },
      },
    });
  };

  const table = useMaterialReactTable({
    columns,
    data: transactions,
    enableRowNumbers: true,
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableEditing: true,
    enableRowVirtualization: true,
    manualPagination: true,
    enableGrouping: true,
    enableColumnDragging: false,
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, 100, 250, 500, 1000],
    },
    muiTableContainerProps: {
      sx: {
        height: 'calc(100vh - 327px)',
        overflowY: 'auto',
      },
    },
    isMultiSortEvent: () => true,
    initialState: {
      density: 'compact',
      showColumnFilters: true,
      sorting: [
        {
          id: 'date',
          desc: true,
        },
      ],
    },
    columnFilterDisplayMode: 'popover',
    enableFacetedValues: true,
    enableColumnResizing: true,
    columnResizeMode: 'onEnd',
    rowCount: transactionsResponse?.totalElements || 0,
    state: {
      isLoading: loading,
      isSaving: deleting,
      pagination: {
        pageIndex: pageIndex,
        pageSize: pageSize,
      },
      columnFilters: columnFilters,
    },
    renderTopToolbarCustomActions: () => (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Tooltip title="Settle Shared Transactions">
          <span>
            <IconButton
              disabled={transactionsWithShares.length === 0}
              onClick={async () => {
                await dialogs.open(
                  SettleSharedTransactionsDialog,
                  transactionsWithShares,
                );
              }}
            >
              <MoneyIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={`Clear filters${appliedFilters}`}>
          <span>
            <IconButton
              disabled={appliedFilters.length === 0}
              onClick={clearFilters}
            >
              <FormatClearIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    ),
    renderDetailPanel: ({ row }) => {
      if (
        !row.original.sharedTransactions ||
        row.original.sharedTransactions.length === 0
      ) {
        return null;
      }

      return (
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Shared Transactions
          </Typography>
          <TableContainer component={Paper}>
            <Table size="medium" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Share
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Paid
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Settled
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {row.original.sharedTransactions.map(
                  (sharedTransaction: SharedTransaction) => (
                    <TableRow key={sharedTransaction.user.id}>
                      <TableCell component="th" scope="row">
                        {`${sharedTransaction.user.firstName} ${sharedTransaction.user.lastName}`}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          sharedTransaction.share,
                          row.original.currency,
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          sharedTransaction.paidAmount,
                          row.original.currency,
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Checkbox
                          checked={sharedTransaction.isSettled}
                          disabled
                        />
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    },
    onColumnFiltersChange: (updaterOrValue) => {
      const newColumnFilters =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(columnFilters)
          : updaterOrValue;

      const newSearchParameters = computeSearchParameters(
        searchParameters,
        newColumnFilters,
      );

      update({
        ...settings,
        transactions: {
          ...(settings?.transactions || {}),
          search: {
            ...(settings?.transactions?.search || {}),
            columnFilters: newColumnFilters,
            parameters: newSearchParameters,
          },
        },
      });
    },
    onPaginationChange: (updaterOrValue) => {
      const newState =
        typeof updaterOrValue === 'function'
          ? updaterOrValue({ pageIndex, pageSize })
          : updaterOrValue;
      update({
        ...settings,
        transactions: {
          ...(settings?.transactions || {}),
          search: {
            ...(settings?.transactions?.search || {}),
            parameters: {
              ...searchParameters,
              pageIndex: newState.pageIndex,
              pageSize: newState.pageSize,
            },
          },
        },
      });
    },
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Tooltip title="Delete">
          <IconButton
            color="error"
            onClick={async () => {
              if (
                window.confirm(
                  `Are you sure you want to delete '${row.original.name}' Transaction?`,
                )
              ) {
                await deleteTransaction(row);
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
          <Typography variant="h6">Billing Period:</Typography>
          <DateRangeSelector />
        </Box>
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <TransactionsSummery transactions={transactions} />
        </Box>
      </Box>
      <MaterialReactTable table={table} />
    </LocalizationProvider>
  );
};

export default Transactions;
