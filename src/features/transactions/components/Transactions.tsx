import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoneyIcon from '@mui/icons-material/Money';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  SelectChangeEvent,
  Skeleton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid2';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ColumnFilter } from '@tanstack/table-core/src/features/ColumnFiltering';
import { useDialogs } from '@toolpad/core/useDialogs';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo } from 'react';
import DateRangeSelector from '../../../components/DateRangeSelector';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { SharedTransaction } from '../../../types/SharedTransaction';
import { Transaction } from '../../../types/Transaction';
import {
  calculateGroupedExpenses,
  formatCurrency,
  formatNumber,
  formatTransactionType,
  generateAvatarProps,
  getAggregatedDataForType,
  getStartEndDate,
  getTransactionsFetchOptions,
  getUserTransactionSummary,
  stringToColor,
} from '../../../utils/common';
import SettleSharedTransactions from './SettleSharedTransactions';

type TransactionsSummeryProps = {
  transactions: Transaction[];
};
const TransactionsSummery: React.FC<TransactionsSummeryProps> = ({
  transactions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { settings, update, loading } = useSettings();

  if (loading) {
    return <Skeleton variant="rounded" width="100%" height={56} />;
  }
  const expandSummery = settings?.transactions?.expandSummery || false;
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

  const sharedTransactionsSummary = useMemo(
    () => getUserTransactionSummary(transactionsForCurrency),
    [transactionsForCurrency],
  );

  const incomeData = useMemo(
    () => getAggregatedDataForType(transactionsForCurrency, 'INCOME'),
    [transactionsForCurrency],
  );
  const expenseData = useMemo(
    () => getAggregatedDataForType(transactionsForCurrency, 'EXPENSE'),
    [transactionsForCurrency],
  );
  const transferData = useMemo(
    () => getAggregatedDataForType(transactionsForCurrency, 'TRANSFER'),
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

  const renderChart = (
    title: string,
    data: { category: string; amount: number }[],
    currency: string,
  ) => (
    <Grid size={{ xs: 12 }}>
      <Card>
        <CardHeader title={title} />
        <CardContent
          sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
        >
          {data.length > 0 ? (
            <BarChart
              dataset={data}
              xAxis={[
                {
                  scaleType: 'band',
                  dataKey: 'category',
                  // @ts-expect-error library error
                  barGapRatio: 0.1,
                  categoryGapRatio: 0.7,
                },
              ]}
              yAxis={[{ label: `Amount (${currency})` }]}
              series={[
                {
                  dataKey: 'amount',
                  label: 'Amount',
                  valueFormatter: (value: number | null) =>
                    formatCurrency(value || 0, currency),
                },
              ]}
              grid={{ vertical: true, horizontal: true }}
              borderRadius={5}
              width={isMobile ? 400 : 800}
              height={isMobile ? 250 : 500}
              slotProps={{ legend: { hidden: true } }}
              sx={{
                [`& .${axisClasses.left} .${axisClasses.label}`]: {
                  transform: 'translateX(-35px)',
                },
              }}
              margin={{ top: 5, right: 5, bottom: 80, left: 100 }}
            />
          ) : (
            <Typography component="span">No data to display</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );

  const onExpandSummeryChange = () => {
    update({
      ...settings,
      transactions: {
        ...(settings?.transactions || {}),
        expandSummery: !expandSummery,
      },
    });
  };

  return (
    <Box component="div" mb={2}>
      <Accordion expanded={expandSummery} onChange={onExpandSummeryChange}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography component="span" variant="h5">
            Summery
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2} mb={2}>
            <Grid size={{ xs: 12, sm: 12, lg: 3 }}>
              <Card>
                <CardHeader title="Income" />
                <CardContent>
                  <Typography
                    variant="h5"
                    component="div"
                    style={{ fontWeight: 'bold' }}
                  >
                    {incomeTotal}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, lg: 3 }}>
              <Card>
                <CardHeader title="Expenses" />
                <CardContent>
                  <Typography
                    variant="h5"
                    component="div"
                    style={{ fontWeight: 'bold' }}
                  >
                    {expenseTotal}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, lg: 3 }}>
              <Card>
                <CardHeader title="Cash Flow" />
                <CardContent>
                  <Typography
                    variant="h5"
                    component="div"
                    style={{ fontWeight: 'bold' }}
                  >
                    {cashFlow}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, lg: 3 }}>
              <Card>
                <CardHeader title="Transfers" />
                <CardContent>
                  <Typography
                    variant="h5"
                    component="div"
                    style={{ fontWeight: 'bold' }}
                  >
                    {transferTotal}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2-content"
              id="panel2-header"
            >
              <Typography component="span" variant="h6">
                Breakdown
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {renderChart(`Income : ${incomeTotal}`, incomeData, currency)}
                {renderChart(
                  `Expenses : ${expenseTotal}`,
                  expenseData,
                  currency,
                )}
                {renderChart(
                  `Transfer : ${transferTotal}`,
                  transferData,
                  currency,
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel3-content"
              id="panel3-header"
            >
              <Typography component="span" variant="h6">
                Shared Transactions
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {sharedTransactionsSummary.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="medium" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          Paid
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          Owed
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sharedTransactionsSummary.map((row) => (
                        <TableRow
                          key={row.user.id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {`${row.user.firstName} ${row.user.lastName}`}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(row.totalPaid, currency)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(row.totalOwed, currency)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(row.totalShare, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography
                  component="span"
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                >
                  No data to display
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </AccordionDetails>
      </Accordion>
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
  const sharedTransactions = useMemo(
    () =>
      searchParameters.hasSharedTransactions === null ||
      searchParameters.hasSharedTransactions === undefined
        ? 'all'
        : searchParameters.hasSharedTransactions
          ? 'include'
          : 'exclude',
    [searchParameters],
  );

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
  const { startDate, endDate } = getStartEndDate(settings);

  useEffect(() => {
    refetchData(
      ['transactions'],
      getTransactionsFetchOptions(searchParameters, startDate, endDate),
    );
  }, [searchParameters, startDate, endDate]);

  const handleSharedTransactionsChange = (event: SelectChangeEvent) => {
    update({
      ...settings,
      transactions: {
        ...(settings?.transactions || {}),
        search: {
          ...(settings?.transactions?.search || {}),
          parameters: {
            ...searchParameters,
            hasSharedTransactions:
              event.target.value === 'include'
                ? true
                : event.target.value === 'exclude'
                  ? false
                  : null,
          },
        },
      },
    });
  };

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
        size: 200,
        maxSize: 200,
        filterVariant: 'multi-select',
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
        size: 200,
        maxSize: 200,
        Cell: ({ cell }) => (
          <Box component="span">{formatNumber(cell.row.original.amount)}</Box>
        ),
        filterVariant: 'range-slider',
        filterFn: 'betweenInclusive',
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
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: transactions,
    enableRowNumbers: true,
    enableStickyHeader: true,
    manualPagination: true,
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, 100, 250, 500, 1000],
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '1000px',
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
        <FormControl sx={{ minWidth: 140 }} size="small">
          <InputLabel id="shared-transactions-select-label">
            Shared Transactions
          </InputLabel>
          <Select
            labelId="shared-transactions-select-label"
            id="shared-transactions-select"
            label="Shared Transactions"
            value={sharedTransactions}
            onChange={handleSharedTransactionsChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="include">Include</MenuItem>
            <MenuItem value="exclude">Exclude</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Settle Shared Transactions">
          <span>
            <Button
              variant="outlined"
              disabled={transactionsWithShares.length === 0}
              onClick={async () => {
                await dialogs.open(
                  SettleSharedTransactions,
                  transactionsWithShares,
                );
              }}
              startIcon={<MoneyIcon />}
            >
              Settle
            </Button>
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
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h6" gutterBottom>
          Billing Period:
        </Typography>
        <DateRangeSelector />
      </Box>
      <TransactionsSummery transactions={transactions} />
      <MaterialReactTable table={table} />
    </LocalizationProvider>
  );
};

export default Transactions;
