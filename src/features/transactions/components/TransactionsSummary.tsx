import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import InputIcon from '@mui/icons-material/Input';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import OutputIcon from '@mui/icons-material/Output';
import { Box, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import React, { ElementType, useMemo } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { Transaction } from '../../../types/Transaction';
import {
  calculateGroupedExpenses,
  formatCurrency,
} from '../../../utils/common';

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

type TransactionsSummaryProps = {
  transactions: Transaction[];
};
const TransactionsSummary: React.FC<TransactionsSummaryProps> = ({
  transactions,
}) => {
  const { settings } = useSettings();

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
    </Box>
  );
};

export default TransactionsSummary;
