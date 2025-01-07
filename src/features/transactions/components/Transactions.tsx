import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Avatar,
  Box,
  Chip,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
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
import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { Transaction } from '../../../types/Transaction';
import {
  formatNumber,
  formatTransactionType,
  generateAvatarProps,
  stringToColor,
} from '../../../utils/common';

const getStartEndDate = (settings: Record<string, any> | null) => {
  const billingPeriod: ColumnFilter | undefined =
    settings?.transactions?.search?.columnFilters?.find(
      (filter: ColumnFilter) =>
        filter.id === 'date' && Array.isArray(filter.value),
    );

  let startDate, endDate;
  if (billingPeriod && Array.isArray(billingPeriod.value)) {
    [startDate, endDate] = billingPeriod.value;
  }
  return { startDate, endDate };
};

const getBillingPeriodText = (settings: Record<string, any> | null): string => {
  const { startDate, endDate } = getStartEndDate(settings);

  if (startDate && endDate) {
    return `${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(
      new Date(endDate),
      'dd/MM/yyyy',
    )}`;
  } else if (startDate) {
    return `${format(new Date(startDate), 'dd/MM/yyyy')} - !`;
  } else if (endDate) {
    return `! - ${format(new Date(endDate), 'dd/MM/yyyy')}`;
  } else {
    return 'All time';
  }
};

const calculateGroupedExpenses = (
  transactions: Transaction[],
  currency: string,
) => {
  const groupedExpenses: { [category: string]: number } = {};

  transactions
    .filter((transaction) => transaction.currency === currency)
    .forEach((transaction) => {
      const type = formatTransactionType(transaction.type) || 'Unknown';
      if (!groupedExpenses[type]) {
        groupedExpenses[type] = 0;
      }
      groupedExpenses[type] += transaction.amount;
    });

  return groupedExpenses;
};

const calculateGroupedExpensesByCategory = (
  transactions: Transaction[],
  currency: string,
) => {
  const groupedExpenses: { [category: string]: number } = {};

  transactions
    .filter((transaction) => transaction.currency === currency)
    .forEach((transaction) => {
      const category = transaction.category?.name || 'Unknown';
      if (!groupedExpenses[category]) {
        groupedExpenses[category] = 0;
      }
      groupedExpenses[category] += transaction.amount;
    });

  return groupedExpenses;
};

type SummedTransactionsProps = {
  transactions: Transaction[];
};
const SummedTransactions: React.FC<SummedTransactionsProps> = ({
  transactions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { settings } = useSettings();
  const currency: string = settings?.currency || 'USD';

  const [groupedExpenses, setGroupedExpenses] = useState<{
    [type: string]: number;
  }>({
    Income: 0,
    Expense: 0,
    Transfer: 0,
  });

  const [groupedExpensesByCategory, setGroupedExpensesByCategory] = useState<{
    [category: string]: number;
  }>({});

  useEffect(() => {
    const expenses = calculateGroupedExpenses(transactions, currency);
    setGroupedExpenses(expenses);

    const expensesByCategory = calculateGroupedExpensesByCategory(
      transactions,
      currency,
    );
    setGroupedExpensesByCategory(expensesByCategory);
  }, [transactions, currency]);

  const dataByType = Object.keys(groupedExpenses).map((group) => ({
    group,
    amount: groupedExpenses[group],
  }));

  const dataByCategory = Object.keys(groupedExpensesByCategory).map(
    (category) => ({
      category,
      amount: groupedExpensesByCategory[category],
    }),
  );

  return (
    <Box component="div" mb={2}>
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography component="span">Summery</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2-content"
              id="panel2-header"
            >
              <Typography component="span">Type</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" justifyContent="center" width="100%">
                <BarChart
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: dataByType.map((item) => item.group),
                    },
                  ]}
                  yAxis={[{ label: `Amount (${currency})` }]}
                  series={[{ data: dataByType.map((item) => item.amount) }]}
                  width={isMobile ? 300 : 500}
                  height={isMobile ? 200 : 300}
                  sx={{
                    [`& .${axisClasses.left} .${axisClasses.label}`]: {
                      transform: 'translateX(-50px)',
                    },
                  }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel3-content"
              id="panel3-header"
            >
              <Typography component="span">Categories</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" justifyContent="center" width="100%">
                <BarChart
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: dataByCategory.map((item) => item.category),
                    },
                  ]}
                  yAxis={[{ label: `Amount (${currency})` }]}
                  series={[{ data: dataByCategory.map((item) => item.amount) }]}
                  width={isMobile ? 300 : 500}
                  height={isMobile ? 200 : 300}
                  sx={{
                    [`& .${axisClasses.left} .${axisClasses.label}`]: {
                      transform: 'translateX(-50px)',
                    },
                  }}
                />
              </Box>
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
  const pageSize = searchParameters.pageSize || 50;

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
    refetchData(['transactions'], {
      transactions: {
        search: {
          parameters: {
            pageIndex: searchParameters.pageIndex,
            pageSize: searchParameters.pageSize,
            sorting: searchParameters.sorting,
            dateFrom: startDate && format(startDate, 'yyyy-MM-dd'),
            dateTo: endDate && format(endDate, 'yyyy-MM-dd'),
          },
        },
      },
    });
  }, [searchParameters, settings]);

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
