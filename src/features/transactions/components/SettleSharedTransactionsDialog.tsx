import CloseIcon from '@mui/icons-material/Close';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  DialogActions,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DialogProps } from '@toolpad/core/useDialogs';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_RowData,
  MRT_RowSelectionState,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import SlideUpTransition from '../../../components/SlideUpTransition';
import { useCurrencyRates } from '../../../context/CurrencyRatesContext';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import apiClient from '../../../services/ApiService';
import { Transaction } from '../../../types/Transaction';
import {
  calculateTotalInBaseCurrency,
  formatNumber,
  generateAvatarProps,
  getStartEndDate,
  getTransactionsFetchOptions,
  stringToColor,
} from '../../../utils/common';
import { notifyBackendError } from '../../../utils/notifications';

type SettleTransactionCandidate = {
  transactionId: number;
  transactionName: string;
  transactionCategory: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionDate: string;
  sharedTransactionId: number;
  sharedTransactionUserName: string;
  sharedTransactionShare: number;
  sharedTransactionRemaining: number;
  isSettled: boolean;
};

const getSettleTransactionCandidates = (transactions: Transaction[]) => {
  const candidates: SettleTransactionCandidate[] = [];
  transactions.forEach((transaction) => {
    if (transaction.sharedTransactions) {
      transaction.sharedTransactions.forEach((sharedTransaction) => {
        candidates.push({
          transactionId: transaction.id,
          transactionName: transaction.name,
          transactionCategory: transaction.category.name,
          transactionAmount: transaction.amount,
          transactionCurrency: transaction.currency,
          transactionDate: transaction.date,
          sharedTransactionId: sharedTransaction.id,
          sharedTransactionUserName: `${sharedTransaction.user.firstName} ${sharedTransaction.user.lastName}`,
          sharedTransactionShare: sharedTransaction.share,
          sharedTransactionRemaining:
            sharedTransaction.share - sharedTransaction.paidAmount,
          isSettled: sharedTransaction.isSettled,
        });
      });
    }
  });
  return candidates;
};

type DueAmountsSummaryProps = {
  selectedSharedTransactionIds: number[];
  candidates: SettleTransactionCandidate[];
};

const DueAmountsSummary: React.FC<DueAmountsSummaryProps> = ({
  selectedSharedTransactionIds,
  candidates,
}) => {
  const { currencyRates, loading: currencyRatesLoading } = useCurrencyRates();
  const { settings, loading: settingsLoading } = useSettings();
  const baseCurrency: string = settings?.currency || 'USD';
  const loading = currencyRatesLoading || settingsLoading;

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
      totalString += `${currency}: ${formatNumber(amount)} | `;
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

  if (!selectedSharedTransactionIds.length || loading) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, flexShrink: 0 }}>
      <Typography variant="h6" gutterBottom>
        Settlement Summary
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'normal',
          alignItems: 'center',
          gap: 2,
          mb: 1,
        }}
      >
        <Typography variant="body2">{`Date Range: [${startDate} - ${endDate}]`}</Typography>
        <Typography variant="body2">{`Records   : [${selectedSharedTransactionIds.length}]`}</Typography>
        <Typography variant="body2">{`Total     : [${totalShared}]`}</Typography>
      </Box>
      <Grid container spacing={2}>
        {Object.entries(shareAmountsSummary)
          .sort(([userNameA], [userNameB]) =>
            userNameA.localeCompare(userNameB),
          )
          .map(([userName, currencyMap]) => (
            <Grid key={userName} size={{ xs: 12, sm: 4, lg: 3 }}>
              <Card
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
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
                        <Typography variant="body2">
                          {`Payable (${baseCurrency})`}
                        </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'right' }}>
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
  payload: transactions,
}: DialogProps<Transaction[]>) => {
  const { settings, loading: settingsLoading } = useSettings();
  const { refetchData, loading: dataLoading } = useData();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const loading = settingsLoading || dataLoading;
  const candidates = useMemo(
    () => getSettleTransactionCandidates(transactions),
    [transactions],
  );
  const selectedSharedTransactionIds = useMemo<number[]>(
    () =>
      Object.entries(rowSelection)
        .filter(([, value]) => value)
        .map(([key]) => +key),
    [rowSelection],
  );
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
      const { startDate, endDate } = getStartEndDate(settings);
      await refetchData(
        ['transactions'],
        getTransactionsFetchOptions(searchParameters, startDate, endDate),
      );

      handleClose();
    } catch (error) {
      notifyBackendError('Error settling shared transactions', error);
    }
  };

  const handleClose = () => {
    setRowSelection({});
    onClose();
  };

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'sharedTransactionUserName',
        header: 'User',
        grow: false,
        minSize: 100,
        size: 100,
        maxSize: 100,
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
        accessorKey: 'transactionName',
        header: 'Name',
        minSize: 150,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 600,
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
        accessorKey: 'transactionCategory',
        header: 'Category',
        minSize: 125,
        size: 125,
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
        accessorFn: (row) => new Date(row.transactionDate),
        accessorKey: 'transactionDate',
        header: 'Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 150,
        size: 150,
        maxSize: 150,
        Cell: ({ cell }) => format(cell.getValue<Date>(), 'dd/MM/yyyy'),
        filterVariant: 'date-range',
      },
      {
        accessorKey: 'transactionCurrency',
        header: 'Currency',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 125,
        size: 125,
        maxSize: 150,
        filterVariant: 'multi-select',
      },
      {
        accessorKey: 'transactionAmount',
        header: 'Amount',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 150,
        size: 150,
        maxSize: 150,
        Cell: ({ cell }) => (
          <Box component="span">
            {formatNumber(cell.row.original.transactionAmount)}
          </Box>
        ),
        filterVariant: 'range-slider',
        filterFn: 'betweenInclusive',
      },
      {
        accessorKey: 'sharedTransactionShare',
        header: 'Share',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 150,
        size: 150,
        maxSize: 150,
        Cell: ({ cell }) => (
          <Box component="span">
            {formatNumber(cell.row.original.sharedTransactionShare)}
          </Box>
        ),
      },
      {
        accessorKey: 'sharedTransactionRemaining',
        header: 'Remaining',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 150,
        size: 150,
        maxSize: 150,
        Cell: ({ cell }) => (
          <Box component="span">
            {formatNumber(cell.row.original.sharedTransactionRemaining)}
          </Box>
        ),
      },
      {
        accessorKey: 'isSettled',
        header: 'Settled',
        minSize: 150,
        size: 150,
        maxSize: 150,
        Cell: ({ cell }) => (
          <Box component="span">
            <Checkbox disabled checked={cell.row.original.isSettled} />
          </Box>
        ),
        filterVariant: 'checkbox',
      },
    ],
    [theme.palette.mode],
  );

  const table = useMaterialReactTable({
    columns,
    data: candidates,
    enableRowNumbers: true,
    enableStickyHeader: true,
    enablePagination: false,

    initialState: {
      density: 'compact',
      showColumnFilters: true,
      sorting: [
        {
          id: 'transactionDate',
          desc: true,
        },
      ],
    },
    state: { rowSelection, isLoading: loading },
    muiTableContainerProps: {
      sx: {
        height:
          selectedSharedTransactionIds.length > 0
            ? isSmallScreen
              ? 'calc(100vh - 600px)'
              : 'calc(100vh - 500px)'
            : 'calc(100vh - 300px)',
        overflowY: 'auto',
      },
    },
    muiTableFooterProps: {
      sx: {
        display: 'none',
      },
    },
    muiBottomToolbarProps: {
      sx: {
        display: 'none',
      },
    },
    columnFilterDisplayMode: 'popover',
    enableFacetedValues: true,
    isMultiSortEvent: () => true,
    enableRowSelection: true,
    getRowId: (row) => row.sharedTransactionId,
    onRowSelectionChange: setRowSelection,
  });

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
          Shared Transactions
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
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
            }}
          >
            <MaterialReactTable table={table} />
          </Box>
          <DueAmountsSummary
            selectedSharedTransactionIds={selectedSharedTransactionIds}
            candidates={candidates}
          />
        </LocalizationProvider>
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
