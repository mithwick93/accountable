import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import InputIcon from '@mui/icons-material/Input';
import MoneyIcon from '@mui/icons-material/Money';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import OutputIcon from '@mui/icons-material/Output';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid2';
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
import React, { ElementType, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import DateRangeSelector from '../../../components/DateRangeSelector';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import apiClient from '../../../services/ApiService';
import { SharedTransaction } from '../../../types/SharedTransaction';
import { Transaction } from '../../../types/Transaction';
import {
  calculateGroupedExpenses,
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
import TransactionSummeryDialog from './TransactionSummeryDialog';

const FILTER_COLUMNS = ['name', 'description', 'currency', 'type', 'category'];

type GridItemWithIconProps = {
  title: string;
  value: string;
  Icon: ElementType;
};
const GridItemWithIcon: React.FC<GridItemWithIconProps> = ({
  title,
  value,
  Icon,
}) => (
  <Grid size={{ lg: 3 }}>
    <Tooltip title={title}>
      <Box display="flex" alignItems="center">
        <Icon />
        <Typography variant="body1" component="div" ml={1}>
          {value}
        </Typography>
      </Box>
    </Tooltip>
  </Grid>
);

type TransactionsSummeryProps = {
  transactions: Transaction[];
};
const TransactionsSummery: React.FC<TransactionsSummeryProps> = ({
  transactions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const dialogs = useDialogs();
  const { settings, loading } = useSettings();

  if (loading) {
    return null;
  }
  const currency: string = settings?.currency || 'USD';

  const transactionsForCurrency = useMemo(
    () =>
      transactions.filter((transaction) => transaction.currency === currency),
    [transactions, currency],
  );

  const groupedExpenses = useMemo(
    () => calculateGroupedExpenses(transactionsForCurrency),
    [transactionsForCurrency],
  );

  const expenses = groupedExpenses.Expense || 0;
  const income = groupedExpenses.Income || 0;
  const incomeExpenseDifference = income - expenses;
  const transfers = groupedExpenses.Transfer || 0;

  const expenseTotal = useMemo(
    () => formatCurrency(expenses, currency),
    [expenses, currency],
  );
  const incomeTotal = useMemo(
    () => formatCurrency(income, currency),
    [income, currency],
  );
  const cashFlow = useMemo(
    () => formatCurrency(incomeExpenseDifference, currency),
    [incomeExpenseDifference, currency],
  );
  const transferTotal = useMemo(
    () => formatCurrency(transfers, currency),
    [transfers, currency],
  );

  const renderShowSummeryButton = () => (
    <Tooltip title="Show Transactions Summery">
      <IconButton
        onClick={async () => {
          await dialogs.open(TransactionSummeryDialog, transactionsForCurrency);
        }}
        color="primary"
        size="small"
      >
        <OpenInFullIcon />
      </IconButton>
    </Tooltip>
  );

  if (isMobile) {
    return renderShowSummeryButton();
  }

  return (
    <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
      <Grid container sx={{ width: '100%' }}>
        <GridItemWithIcon title="Income" value={incomeTotal} Icon={InputIcon} />
        <GridItemWithIcon
          title="Expenses"
          value={expenseTotal}
          Icon={OutputIcon}
        />
        <GridItemWithIcon
          title="Cash Flow"
          value={cashFlow}
          Icon={CompareArrowsIcon}
        />
        <GridItemWithIcon
          title="Transfers"
          value={transferTotal}
          Icon={MoveDownIcon}
        />
      </Grid>
      {renderShowSummeryButton()}
    </Box>
  );
};

const Transactions: React.FC = () => {
  const {
    transactions: transactionsResponse,
    loading: dataLoading,
    refetchData,
  } = useData();
  const { settings, update, loading: settingsLoading } = useSettings();
  const theme = useTheme();
  const dialogs = useDialogs();
  const [deleting, setDeleting] = useState(false);

  const loading = dataLoading || settingsLoading;
  const transactions = useMemo(
    () => transactionsResponse?.content || [],
    [transactionsResponse],
  );
  const transactionsWithShares = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.sharedTransactions &&
          transaction.sharedTransactions.some(
            (sharedTransaction) => !sharedTransaction.isSettled,
          ),
      ),
    [transactions],
  );

  const searchParameters: Record<string, any> =
    settings?.transactions?.search?.parameters || {};
  const pageIndex = searchParameters.pageIndex || 0;
  const pageSize = searchParameters.pageSize || 100;

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
  const appliedFilters = useMemo(
    () =>
      columnFilters
        .filter(
          // @ts-expect-error ignore
          ({ id, value }) => FILTER_COLUMNS.includes(id) && value.length > 0,
        )
        // @ts-expect-error ignore
        .map(({ id }) => id),
    [columnFilters, FILTER_COLUMNS],
  );
  const appliedFiltersString = useMemo(
    () => (appliedFilters.length > 0 ? ` (${appliedFilters.join(', ')})` : ''),
    [appliedFilters],
  );
  const { startDate, endDate } = getStartEndDate(settings);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        // @ts-expect-error ignore
        columnFilters.every(({ id, value }) => {
          switch (id) {
            case 'name':
              return transaction.name
                .toLowerCase()
                .includes(value.toLowerCase());
            case 'description':
              return transaction.description
                ? transaction.description
                    .toLowerCase()
                    .includes(value.toLowerCase())
                : false;
            case 'currency':
              return value.includes(transaction.currency);
            case 'type':
              return value.includes(
                transaction.type.charAt(0) +
                  transaction.type.slice(1).toLowerCase(),
              );
            case 'category':
              return value.includes(transaction.category.name);
            default:
              return true;
          }
        }),
      ),
    [transactions, columnFilters],
  );

  const transactionCurrencies = useMemo(
    () =>
      Array.from(
        new Set(
          filteredTransactions.map((transaction) => transaction.currency),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [filteredTransactions],
  );

  const totalAmountByCurrency = useMemo(() => {
    const totals = filteredTransactions.reduce(
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
  }, [filteredTransactions]);

  useEffect(() => {
    refetchData(
      ['transactions'],
      getTransactionsFetchOptions(searchParameters, startDate, endDate),
    );
  }, [searchParameters, startDate, endDate]);

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorFn: (row) => `${row.user?.firstName} ${row.user?.lastName}`,
        accessorKey: 'user',
        header: 'User',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 150,
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
        filterVariant: 'multi-select',
      },
      {
        accessorKey: 'name',
        header: 'Name',
        minSize: 200,
        size: 200,
        maxSize: 500,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 400,
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
        accessorFn: (row) => new Date(row.date),
        accessorKey: 'date',
        header: 'Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 150,
        size: 150,
        maxSize: 200,
        Cell: ({ cell }) => format(cell.getValue<Date>(), 'dd/MM/yyyy'),
        filterVariant: 'date-range',
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
        minSize: 150,
        size: 150,
        maxSize: 200,
        filterVariant: 'multi-select',
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
        minSize: 150,
        size: 150,
        maxSize: 200,
        Cell: ({ cell }) => (
          <Box component="span">{formatNumber(cell.row.original.amount)}</Box>
        ),
        filterVariant: 'range-slider',
        filterFn: 'betweenInclusive',
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
        minSize: 150,
        size: 150,
        maxSize: 150,
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
        filterVariant: 'multi-select',
      },
      {
        accessorFn: (row) => row.category?.name,
        accessorKey: 'category',
        header: 'Category',
        minSize: 150,
        size: 200,
        maxSize: 200,
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
        filterVariant: 'multi-select',
      },
      {
        accessorKey: 'description',
        header: 'Description',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
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
        size: 150,
        maxSize: 200,
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
        filterVariant: 'multi-select',
      },
      {
        accessorFn: (row) => row.fromAsset?.name,
        accessorKey: 'fromAsset',
        header: 'From Asset',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
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
        filterVariant: 'multi-select',
      },
      {
        accessorFn: (row) => row.toAsset?.name,
        accessorKey: 'toAsset',
        header: 'To Asset',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
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
        filterVariant: 'multi-select',
      },
      {
        accessorFn: (row) => row.toLiability?.name,
        accessorKey: 'toLiability',
        header: 'To Liability',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
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
        filterVariant: 'multi-select',
      },
    ],
    [filteredTransactions],
  );

  const deleteTransaction = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    try {
      const updateAccounts = settings?.transactions.updateAccounts ?? false;

      const { id } = row.original;
      await apiClient.delete(
        `/transactions/${id}?updateAccounts=${updateAccounts}`,
      );
      await refetchData([
        'transactions',
        'assets',
        'liabilities',
        'paymentSystems',
      ]);

      toast.success(`Deleted transaction: '${row.original.name}' successfully`);
    } catch (error) {
      notifyBackendError('Error deleting transaction', error);
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    const resetColumnFilters = columnFilters.filter(
      // @ts-expect-error ignore
      ({ id }) => !FILTER_COLUMNS.includes(id),
    );
    update({
      ...settings,
      transactions: {
        ...(settings?.transactions || {}),
        search: {
          ...(settings?.transactions?.search || {}),
          columnFilters: resetColumnFilters,
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
      columnVisibility: { user: false },
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
        <Tooltip title={`Clear filters${appliedFiltersString}`}>
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

      update({
        ...settings,
        transactions: {
          ...(settings?.transactions || {}),
          search: {
            ...(settings?.transactions?.search || {}),
            columnFilters: newColumnFilters,
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
