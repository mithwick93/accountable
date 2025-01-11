import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ColumnFilter } from '@tanstack/table-core/src/features/ColumnFiltering';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { Transaction } from '../../../types/Transaction';
import {
  calculateGroupedExpenses,
  formatCurrency,
  formatNumber,
  formatTransactionType,
  generateAvatarProps,
  getAggregatedDataForType,
  getBillingPeriodText,
  getStartEndDate,
  getTransactionsFetchOptions,
  stringToColor,
} from '../../../utils/common';

type SummedTransactionsProps = {
  transactions: Transaction[];
};
const SummedTransactions: React.FC<SummedTransactionsProps> = ({
  transactions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { settings, update } = useSettings();
  const expandSummery = settings?.transactions?.expandSummery || false;
  const currency: string = settings?.currency || 'USD';

  const transactionsForCurrency = transactions.filter(
    (transaction) => transaction.currency === currency,
  );
  const groupedExpenses = calculateGroupedExpenses(transactionsForCurrency);

  const incomeData = getAggregatedDataForType(
    transactionsForCurrency,
    'INCOME',
  );
  const expenseData = getAggregatedDataForType(
    transactionsForCurrency,
    'EXPENSE',
  );
  const transferData = getAggregatedDataForType(
    transactionsForCurrency,
    'TRANSFER',
  );

  const expenses = groupedExpenses.Expense || 0;
  const income = groupedExpenses.Income || 0;
  const incomeExpenseDifference =
    (groupedExpenses.Income || 0) - (groupedExpenses.Expense || 0);
  const transfers = groupedExpenses.Transfer || 0;

  const expenseTotal = formatCurrency(expenses, currency);
  const incomeTotal = formatCurrency(income, currency);
  const cashFlow = formatCurrency(incomeExpenseDifference, currency);
  const transferTotal = formatCurrency(transfers, currency);

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
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

const Transactions: React.FC = () => {
  const {
    transactions: transactionsResponse,
    loading,
    refetchData,
  } = useData();
  const { settings, update } = useSettings();
  const theme = useTheme();

  const transactions = transactionsResponse?.content || [];
  const searchParameters: Record<string, any> =
    settings?.transactions?.search?.parameters || {};
  const pageIndex = searchParameters.pageIndex || 0;
  const pageSize = searchParameters.pageSize || 100;

  const columnFilters = (
    settings?.transactions?.search?.columnFilters || []
  ).map((filter: ColumnFilter) => {
    if (filter.id === 'date' && Array.isArray(filter.value)) {
      return {
        ...filter,
        value: filter.value.map((item) => (!item ? undefined : new Date(item))),
      };
    }
    return filter;
  });

  useEffect(() => {
    const { startDate, endDate } = getStartEndDate(settings);
    refetchData(
      ['transactions'],
      getTransactionsFetchOptions(searchParameters, startDate, endDate),
    );
  }, [searchParameters, settings?.currency]);

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
      <Typography variant="h6" gutterBottom>
        Billing Period: {getBillingPeriodText(settings)}
      </Typography>
      <SummedTransactions transactions={transactions} />
      <MaterialReactTable table={table} />
    </LocalizationProvider>
  );
};

export default Transactions;
