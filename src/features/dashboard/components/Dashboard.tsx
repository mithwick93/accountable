import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { PieChart } from '@mui/x-charts/PieChart';
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import { useCurrencyRates } from '../../../context/CurrencyRatesContext';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { Asset } from '../../../types/Asset';
import { Liability } from '../../../types/Liability';
import {
  formatCurrency,
  formatLiabilityType,
  formatNumber,
  getCreditUtilizationColor,
  getDueDateColor,
  stringToColor,
} from '../../../utils/common';
import { calculateLiabilityDates } from '../../../utils/date';
import log from '../../../utils/logger';

interface NetSummeryProps {
  title: string;
  totals: { [currency: string]: number };
  currencyRates: { [currency: string]: number };
  currency: string;
  isLoading: boolean;
}

const NetSummary: React.FC<NetSummeryProps> = ({
  title,
  totals,
  currencyRates,
  currency,
  isLoading,
}) => {
  const [netValue, setNetValue] = useState<number>(0);

  useEffect(() => {
    const calculateNetValue = () => {
      let total = 0;
      Object.keys(totals).forEach((key) => {
        const totalValue = totals[key];
        const exchangeRate = currencyRates[key];
        if (exchangeRate) {
          total += totalValue / exchangeRate;
        }
      });
      setNetValue(total);
    };

    calculateNetValue();
  }, [totals, currencyRates]);

  const getArcLabel = (params: { value: number }) => {
    const percent = params.value / netValue;
    return `${(percent * 100).toFixed(0)}%`;
  };

  const pieChartData = Object.keys(totals).map((key) => ({
    id: key,
    value: totals[key] / currencyRates[key],
    label: key,
  }));

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <Grid
          container
          spacing={2}
          size={{ xs: 12, sm: 12 }}
          alignItems="center"
          justifyContent="center"
          style={{ height: '100%' }}
        >
          <Grid
            size={{ xs: 12, sm: 6 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <Typography
              variant="h5"
              component="div"
              style={{ fontWeight: 'bold' }}
            >
              {formatNumber(netValue)} {currency}
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <PieChart
              series={[
                {
                  data: pieChartData,
                  arcLabel: getArcLabel,
                  arcLabelMinAngle: 5,
                  sortingValues: 'desc',
                  innerRadius: 0,
                  outerRadius: 75,
                  cornerRadius: 3,
                  highlightScope: { fade: 'global', highlight: 'item' },
                  faded: {
                    innerRadius: 30,
                    additionalRadius: -30,
                    color: 'gray',
                  },
                },
              ]}
              width={50}
              height={150}
              slotProps={{
                legend: { hidden: true },
              }}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { assets, liabilities, loading } = useData();
  const [assetTotals, setAssetTotals] = useState<{
    [currency: string]: number;
  }>({});
  const [liabilityTotals, setLiabilityTotals] = useState<{
    [currency: string]: number;
  }>({});
  const { currencyRates } = useCurrencyRates();
  const { settings } = useSettings();
  const currency: string = settings?.currency || 'USD';

  const calculateTotals = (items: (Asset | Liability)[]) =>
    items.reduce(
      (acc, item) => {
        acc[item.currency] = (acc[item.currency] || 0) + item.balance;
        return acc;
      },
      {} as { [currency: string]: number },
    );

  const assetsColumns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'currency',
        header: 'Currency',
        size: 50,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        size: 200,
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
        accessorFn: (row) => row.balance,
        header: 'Balance',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        aggregationFn: 'sum',
        Cell: ({ row }) => (
          <Box component="span">
            {formatCurrency(row.original.balance, row.original.currency)}
          </Box>
        ),
        AggregatedCell: ({ cell }) => (
          <span>
            {formatCurrency(
              cell.getValue<number>(),
              cell.row.original.currency,
            )}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        muiTableBodyCellProps: {
          sx: {
            textTransform: 'capitalize',
          },
        },
      },
    ],
    [],
  );

  const liabilitiesColumns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'currency',
        header: 'Currency',
        size: 50,
      },
      {
        accessorFn: (row) => formatLiabilityType(row.type),
        accessorKey: 'type',
        header: 'Type',
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        size: 200,
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
        // accessorFn: (row) => formatCurrency(row.balance, row.currency),
        accessorFn: (row) => row.balance,
        header: 'Utilized',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        aggregationFn: 'sum',
        Cell: ({ row }) => {
          const utilized = row.original.balance;
          const limit = row.original.amount;
          return (
            <Box
              component="span"
              sx={(theme) => ({
                color: getCreditUtilizationColor(
                  utilized,
                  limit,
                  theme.palette.mode,
                ),
              })}
            >
              {formatCurrency(utilized, row.original.currency)}
            </Box>
          );
        },
        AggregatedCell: ({ cell }) => (
          <span>
            {formatCurrency(
              cell.getValue<number>(),
              cell.row.original.currency,
            )}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        muiTableBodyCellProps: {
          sx: {
            textTransform: 'capitalize',
          },
        },
      },
      {
        accessorFn: (row) =>
          calculateLiabilityDates(new Date(), row.dueDay, row.statementDay)
            .statementDate,
        header: 'Statement Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        accessorFn: (row) =>
          calculateLiabilityDates(new Date(), row.dueDay, row.statementDay)
            .dueDate,
        header: 'Due Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ renderedCellValue }) => (
          <Box
            component="span"
            sx={(theme) => ({
              color: getDueDateColor(
                renderedCellValue as string,
                theme.palette.mode,
              ),
            })}
          >
            {renderedCellValue}
          </Box>
        ),
      },
      {
        accessorFn: (row) =>
          formatCurrency(row.amount - row.balance, row.currency),
        header: 'Available',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        accessorFn: (row) => formatCurrency(row.amount, row.currency),
        header: 'Limit',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
    ],
    [],
  );

  useEffect(() => {
    const fetchFinancialData = () => {
      try {
        setAssetTotals(calculateTotals(assets));
        setLiabilityTotals(calculateTotals(liabilities));
      } catch (error) {
        log.error('Error fetching financial data:', error);
      }
    };

    fetchFinancialData();
  }, [assets, liabilities]);

  const assetsTable = useMaterialReactTable({
    columns: assetsColumns,
    data: assets,
    enableGrouping: true,
    enablePagination: false,
    enableColumnDragging: false,
    enableStickyHeader: true,
    groupedColumnMode: false,
    initialState: {
      grouping: ['currency', 'type'],
      sorting: [
        {
          id: 'currency',
          desc: false,
        },
        {
          id: 'type',
          desc: false,
        },
        {
          id: 'name',
          desc: false,
        },
      ],
    },
    state: {
      isLoading: loading,
    },
  });

  const liabilitiesTable = useMaterialReactTable({
    columns: liabilitiesColumns,
    data: liabilities,
    enableGrouping: true,
    enablePagination: false,
    enableColumnDragging: false,
    enableStickyHeader: true,
    groupedColumnMode: false,
    initialState: {
      grouping: ['currency', 'type'],
      sorting: [
        {
          id: 'currency',
          desc: false,
        },
        {
          id: 'type',
          desc: false,
        },
        {
          id: 'name',
          desc: false,
        },
      ],
    },
    state: {
      isLoading: loading,
    },
  });

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NetSummary
          title="Net Worth"
          totals={assetTotals}
          currencyRates={currencyRates}
          currency={currency}
          isLoading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NetSummary
          title="Net Liabilities"
          totals={liabilityTotals}
          currencyRates={currencyRates}
          currency={currency}
          isLoading={loading}
        />
      </Grid>
      <Grid
        container
        spacing={2}
        size={{ xs: 12, sm: 12 }}
        sx={{ mt: 2 }}
      ></Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardHeader title="Assets Summery" />
          <CardContent>
            <MaterialReactTable table={assetsTable} />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardHeader title="Liabilities Summery" />
          <CardContent>
            <MaterialReactTable table={liabilitiesTable} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
