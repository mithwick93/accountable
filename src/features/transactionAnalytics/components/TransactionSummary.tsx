import {
  Box,
  Card,
  CardContent,
  CardHeader,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import React, { useEffect, useMemo } from 'react';
import DateRangeSelector from '../../../components/DateRangeSelector';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import {
  calculateGroupedExpenses,
  formatCurrency,
  getAggregatedDataForType,
  getStartEndDate,
  getTransactionsFetchOptions,
} from '../../../utils/common';

const renderChart = (
  title: string,
  data: { category: string; amount: number }[],
  currency: string,
  isMobile: boolean = false,
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

const TransactionSummary: React.FC = () => {
  const {
    transactions: transactionsResponse,
    loading: dataLoading,
    refetchData,
  } = useData();
  const theme = useTheme();
  const { settings, loading: settingsLoading } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const loading = dataLoading || settingsLoading;

  const currency: string = settings?.currency || 'USD';
  const searchParameters: Record<string, any> = useMemo(
    () => settings?.transactions?.search?.parameters || {},
    [settings],
  );
  const { startDate, endDate } = getStartEndDate(settings);

  const transactions = useMemo(
    () =>
      (transactionsResponse?.content || []).filter(
        (transaction) => transaction.currency === currency,
      ),
    [transactionsResponse, currency],
  );

  const groupedExpenses = useMemo(
    () => calculateGroupedExpenses(transactions),
    [transactions],
  );

  const incomeData = useMemo(
    () => getAggregatedDataForType(transactions, 'INCOME'),
    [transactions],
  );
  const expenseData = useMemo(
    () => getAggregatedDataForType(transactions, 'EXPENSE'),
    [transactions],
  );
  const transferData = useMemo(
    () => getAggregatedDataForType(transactions, 'TRANSFER'),
    [transactions],
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

  useEffect(() => {
    refetchData(
      ['transactions'],
      getTransactionsFetchOptions(searchParameters, startDate, endDate),
    );
    // eslint-disable-next-line
  }, [searchParameters, startDate, endDate]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
        <Typography variant="h6">Billing Period:</Typography>
        <DateRangeSelector />
      </Box>
      <Box component="div" mb={2}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Overview
          </Typography>
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
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            Breakdown
          </Typography>
          <Grid container spacing={2}>
            {renderChart(
              `Income : ${incomeTotal}`,
              incomeData,
              currency,
              isMobile,
            )}
            {renderChart(
              `Expenses : ${expenseTotal}`,
              expenseData,
              currency,
              isMobile,
            )}
            {renderChart(
              `Transfer : ${transferTotal}`,
              transferData,
              currency,
              isMobile,
            )}
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default TransactionSummary;
