import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import {
  Box,
  Button,
  Card,
  CardContent,
  DialogActions,
  DialogContent,
  IconButton,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { DialogProps } from '@toolpad/core/useDialogs';
import React, { useMemo } from 'react';
import { toast } from 'react-toastify';
import SlideUpTransition from '../../../components/SlideUpTransition';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import apiClient from '../../../services/ApiService';
import {
  calculateTotalInBaseCurrency,
  formatNumber,
  getStartEndDate,
  getTransactionsFetchOptions,
} from '../../../utils/common';
import { notifyBackendError } from '../../../utils/notifications';
import { SettleSharedTransactionsPayload } from './types';

const DueAmountsSummary: React.FC<SettleSharedTransactionsPayload> = ({
  selectedSharedTransactionIds,
  candidates,
  currencyRates,
  baseCurrency,
}) => {
  const [startDate, endDate] = useMemo(() => {
    const sortedSharedTransactions = candidates
      .filter((candidate) =>
        selectedSharedTransactionIds.includes(candidate.sharedTransactionId),
      )
      .sort((candidateA, candidateB) =>
        candidateA.transactionDate.localeCompare(candidateB.transactionDate),
      );

    if (sortedSharedTransactions.length === 0) {
      return ['N/A', 'N/A'];
    }

    const startDate = sortedSharedTransactions[0].transactionDate;
    const endDate =
      sortedSharedTransactions[sortedSharedTransactions.length - 1]
        .transactionDate;

    return [startDate, endDate];
  }, [selectedSharedTransactionIds, candidates]);

  const totalShared = useMemo(() => {
    const totalCurrencyMap: Record<string, Record<string, number>> = {};

    candidates
      .filter((candidate) =>
        selectedSharedTransactionIds.includes(candidate.sharedTransactionId),
      )
      .forEach((candidate) => {
        if (!totalCurrencyMap[candidate.transactionId]) {
          totalCurrencyMap[candidate.transactionId] = {};
        }
        totalCurrencyMap[candidate.transactionId][
          candidate.transactionCurrency
        ] = candidate.transactionAmount;
      });

    const totalMap: Record<string, number> = {};
    Object.values(totalCurrencyMap).forEach((currencyMap) => {
      Object.entries(currencyMap).forEach(([currency, amount]) => {
        if (!totalMap[currency]) {
          totalMap[currency] = 0;
        }
        totalMap[currency] += amount;
      });
    });

    let totalString = '';
    Object.entries(totalMap).forEach(([currency, amount]) => {
      totalString += `${currency}: ${formatNumber(amount, 2, 2)} | `;
    });
    totalString = `${totalString.slice(0, -3)}`;

    return totalString;
  }, [selectedSharedTransactionIds, candidates]);

  const [shareAmountsSummary, dueAmountsSummary] = useMemo(() => {
    const shareMap: Record<string, Record<string, number>> = {};
    const remainingMap: Record<string, Record<string, number>> = {};

    selectedSharedTransactionIds.forEach((sharedTransactionId) => {
      const settleTransactionCandidate = candidates.find(
        (candidate) => candidate.sharedTransactionId === sharedTransactionId,
      );
      const {
        sharedTransactionUserName = '',
        transactionCurrency = '',
        sharedTransactionShare = 0,
        sharedTransactionRemaining = 0,
      } = settleTransactionCandidate || {};

      if (!shareMap[sharedTransactionUserName]) {
        shareMap[sharedTransactionUserName] = {};
      }
      if (!remainingMap[sharedTransactionUserName]) {
        remainingMap[sharedTransactionUserName] = {};
      }

      if (!shareMap[sharedTransactionUserName][transactionCurrency]) {
        shareMap[sharedTransactionUserName][transactionCurrency] = 0;
      }
      if (!remainingMap[sharedTransactionUserName][transactionCurrency]) {
        remainingMap[sharedTransactionUserName][transactionCurrency] = 0;
      }

      shareMap[sharedTransactionUserName][transactionCurrency] +=
        sharedTransactionShare;
      remainingMap[sharedTransactionUserName][transactionCurrency] +=
        sharedTransactionRemaining;
    });
    return [shareMap, remainingMap];
  }, [selectedSharedTransactionIds, candidates]);

  const [shareTotals, dueTotals] = useMemo(() => {
    const shareSummaryMap: Record<string, number> = {};
    const remainingSummaryMap: Record<string, number> = {};

    Object.entries(shareAmountsSummary).forEach(([userName, currencyMap]) => {
      shareSummaryMap[userName] = calculateTotalInBaseCurrency(
        currencyMap,
        currencyRates,
      );
    });
    Object.entries(dueAmountsSummary).forEach(([userName, currencyMap]) => {
      remainingSummaryMap[userName] = calculateTotalInBaseCurrency(
        currencyMap,
        currencyRates,
      );
    });

    return [shareSummaryMap, remainingSummaryMap];
  }, [shareAmountsSummary, dueAmountsSummary, currencyRates]);

  const pairPayable = useMemo(() => {
    const payableMap: Record<string, number> = {};
    const users = Object.keys(dueTotals).sort((a, b) => a.localeCompare(b));
    const userCount = users.length;
    if (userCount !== 2) {
      return payableMap;
    }

    const [firstUser, secondUser] = users;
    payableMap[firstUser] = dueTotals[firstUser] - dueTotals[secondUser];
    payableMap[secondUser] = dueTotals[secondUser] - dueTotals[firstUser];

    return payableMap;
  }, [dueTotals]);

  if (!selectedSharedTransactionIds.length) {
    return null;
  }

  return (
    <Box>
      <Box>
        <List dense sx={{ py: 0 }}>
          <ListItem>
            <ListItemIcon>
              <DateRangeIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={`${startDate} - ${endDate}`} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <FormatListNumberedIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={selectedSharedTransactionIds.length} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AttachMoneyIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={totalShared} />
          </ListItem>
        </List>
      </Box>
      <Grid container spacing={2} mt={1}>
        {Object.entries(shareAmountsSummary)
          .sort(([userNameA], [userNameB]) =>
            userNameA.localeCompare(userNameB),
          )
          .map(([userName, currencyMap]) => (
            <Grid key={userName} size={{ xs: 12, sm: 12, lg: 12 }}>
              <Card>
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <Typography variant="body1" gutterBottom>
                    {userName}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">
                      {`Share Total (${baseCurrency})`}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'right' }}>
                      {formatNumber(shareTotals[userName], 2, 2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">
                      {`Due Total (${baseCurrency})`}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'right' }}>
                      {formatNumber(dueTotals[userName], 2, 2)}
                    </Typography>
                  </Box>
                  {Object.keys(pairPayable).length === 2 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgb(220, 53, 69)',
                          }}
                        >
                          {`Payable (${baseCurrency})`}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            textAlign: 'right',
                            color: 'rgb(220, 53, 69)',
                          }}
                        >
                          {formatNumber(pairPayable[userName], 2, 2)}
                        </Typography>
                      </Box>
                    </>
                  )}
                  <Divider sx={{ my: 1 }} />
                  {Object.entries(currencyMap)
                    .sort(([currencyA], [currencyB]) =>
                      currencyA.localeCompare(currencyB),
                    )
                    .map(([currency, amount]) => (
                      <Box
                        key={currency}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2" color="textSecondary">
                          {currency}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ textAlign: 'right' }}
                        >
                          {formatNumber(amount, 2, 2)}
                        </Typography>
                      </Box>
                    ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};

const SettleSharedTransactionsDialog = ({
  onClose,
  open,
  payload,
}: DialogProps<SettleSharedTransactionsPayload>) => {
  const { settings } = useSettings();
  const { refetchData } = useData();
  const {
    selectedSharedTransactionIds,
    candidates,
    currencyRates,
    baseCurrency,
  } = payload;

  const enableSettle = useMemo(
    () =>
      selectedSharedTransactionIds.some((id) => {
        const transaction = candidates.find(
          (candidate) => candidate.sharedTransactionId === id,
        );
        return transaction && !transaction.isSettled;
      }),
    [candidates, selectedSharedTransactionIds],
  );

  const handleSettleSharedTransactions = async () => {
    try {
      const response = await apiClient.put('/transactions/mark-as-paid', {
        sharedTransactionIds: selectedSharedTransactionIds,
      });

      const {
        data: { message },
      } = response;

      toast.success(message);

      const searchParameters: Record<string, any> =
        settings?.transactions?.search?.parameters || {};
      // eslint-disable-next-line
      const { userIds, ...searchParametersWithoutUser } = searchParameters;
      const { startDate, endDate } = getStartEndDate(settings);
      await refetchData(
        ['transactions'],
        getTransactionsFetchOptions(
          searchParametersWithoutUser,
          startDate,
          endDate,
        ),
      );

      await handleClose();
    } catch (error) {
      notifyBackendError('Error settling shared transactions', error);
    }
  };

  const handleClose = async () => {
    await onClose();
  };

  return (
    <Dialog
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
          Settle Shared Transactions
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
      <DialogContent>
        <DueAmountsSummary
          selectedSharedTransactionIds={selectedSharedTransactionIds}
          candidates={candidates}
          currencyRates={currencyRates}
          baseCurrency={baseCurrency}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Box sx={{ width: '1rem' }} />
        <Button
          disabled={!enableSettle}
          onClick={async () => {
            if (
              window.confirm(
                `Are you sure you want to mark ${selectedSharedTransactionIds.length} shared transaction(s) as settled?`,
              )
            ) {
              await handleSettleSharedTransactions();
            }
          }}
          variant="contained"
        >
          Settle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettleSharedTransactionsDialog;
