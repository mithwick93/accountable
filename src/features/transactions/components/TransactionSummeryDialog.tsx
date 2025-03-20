import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { DialogProps } from '@toolpad/core/useDialogs';
import React, { useMemo } from 'react';
import SlideUpTransition from '../../../components/SlideUpTransition';
import { useSettings } from '../../../context/SettingsContext';
import { Transaction } from '../../../types/Transaction';
import {
  calculateGroupedExpenses,
  formatCurrency,
  getAggregatedDataForType,
} from '../../../utils/common';

const TransactionSummeryDialog = ({
  onClose,
  open,
  payload: transactions,
}: DialogProps<Transaction[]>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { settings } = useSettings();

  const currency: string = settings?.currency || 'USD';

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

  const handleClose = () => {
    onClose();
  };

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

  return (
    <Dialog
      fullScreen
      fullWidth
      onClose={handleClose}
      open={open}
      TransitionComponent={SlideUpTransition}
      keepMounted
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Transactions summery
          <Box
            sx={{
              display: 'flex-end',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box component="div" mb={2}>
          <Accordion expanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <Typography component="span" variant="h5">
                Overview
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
            </AccordionDetails>
          </Accordion>
          <Accordion expanded>
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
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionSummeryDialog;
