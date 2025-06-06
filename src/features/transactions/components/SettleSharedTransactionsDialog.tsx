import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
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
// @ts-expect-error ignore
import { download, generateCsv, mkConfig } from 'export-to-csv';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_Row,
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

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
  filename: 'shared-transactions',
});

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
  currencyRates: { [currency: string]: number };
  baseCurrency: string;
};

const DueAmountsSummary: React.FC<DueAmountsSummaryProps> = ({
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

const calculateSummary = (
  rows: MRT_Row<SettleTransactionCandidate>[],
  currencyRates: Record<string, number>,
) => {
  const selectedCandidates = rows.map((row) => row.original);

  const uniqueTransactionIds = new Set(
    selectedCandidates.map((c) => c.transactionId),
  );
  const uniqueTransactionCount = uniqueTransactionIds.size;

  // Date range
  const sortedByDate = [...selectedCandidates].sort((a, b) =>
    a.transactionDate.localeCompare(b.transactionDate),
  );
  const dateRange = sortedByDate.length
    ? [
        sortedByDate[0].transactionDate,
        sortedByDate[sortedByDate.length - 1].transactionDate,
      ]
    : ['N/A', 'N/A'];

  // Total per currency
  const totalCurrencyMap: Record<string, Record<string, number>> = {};
  selectedCandidates.forEach((candidate) => {
    if (!totalCurrencyMap[candidate.transactionId]) {
      totalCurrencyMap[candidate.transactionId] = {};
    }
    totalCurrencyMap[candidate.transactionId][candidate.transactionCurrency] =
      candidate.transactionAmount;
  });

  // Aggregate total per currency
  const totalMap: Record<string, number> = {};
  Object.values(totalCurrencyMap).forEach((currencyMap) => {
    Object.entries(currencyMap).forEach(([currency, amount]) => {
      if (!totalMap[currency]) {
        totalMap[currency] = 0;
      }
      totalMap[currency] += amount;
    });
  });
  let totalShared = '';
  Object.entries(totalMap).forEach(([currency, amount]) => {
    totalShared += `${currency}: ${formatNumber(amount, 2, 2)} | `;
  });
  totalShared = `${totalShared.slice(0, -3)}`;

  // Summary of shares and dues
  const shareAmountsSummary: Record<string, Record<string, number>> = {};
  const dueAmountsSummary: Record<string, Record<string, number>> = {};
  selectedCandidates.forEach((settleTransactionCandidate) => {
    const {
      sharedTransactionUserName = '',
      transactionCurrency = '',
      sharedTransactionShare = 0,
      sharedTransactionRemaining = 0,
    } = settleTransactionCandidate || {};

    if (!shareAmountsSummary[sharedTransactionUserName]) {
      shareAmountsSummary[sharedTransactionUserName] = {};
    }
    if (!dueAmountsSummary[sharedTransactionUserName]) {
      dueAmountsSummary[sharedTransactionUserName] = {};
    }

    if (!shareAmountsSummary[sharedTransactionUserName][transactionCurrency]) {
      shareAmountsSummary[sharedTransactionUserName][transactionCurrency] = 0;
    }
    if (!dueAmountsSummary[sharedTransactionUserName][transactionCurrency]) {
      dueAmountsSummary[sharedTransactionUserName][transactionCurrency] = 0;
    }

    shareAmountsSummary[sharedTransactionUserName][transactionCurrency] +=
      sharedTransactionShare;
    dueAmountsSummary[sharedTransactionUserName][transactionCurrency] +=
      sharedTransactionRemaining;
  });

  // Calculate totals in base currency
  const shareTotals: Record<string, number> = {};
  const dueTotals: Record<string, number> = {};
  Object.entries(shareAmountsSummary).forEach(([userName, currencyMap]) => {
    shareTotals[userName] = calculateTotalInBaseCurrency(
      currencyMap,
      currencyRates,
    );
  });
  Object.entries(dueAmountsSummary).forEach(([userName, currencyMap]) => {
    dueTotals[userName] = calculateTotalInBaseCurrency(
      currencyMap,
      currencyRates,
    );
  });

  // Calculate pair payable amounts
  const pairPayable: Record<string, number> = {};
  const users = Object.keys(dueTotals).sort((a, b) => a.localeCompare(b));
  const userCount = users.length;
  if (userCount === 2) {
    const [firstUser, secondUser] = users;
    pairPayable[firstUser] = dueTotals[firstUser] - dueTotals[secondUser];
    pairPayable[secondUser] = dueTotals[secondUser] - dueTotals[firstUser];
  }

  return {
    selectedCandidates,
    uniqueTransactionCount,
    dateRange,
    totalShared,
    shareTotals,
    dueTotals,
    shareAmountsSummary,
    pairPayable,
  };
};

const handleExportPDF = (
  rows: MRT_Row<SettleTransactionCandidate>[],
  currencyRates: Record<string, number>,
  baseCurrency: string,
) => {
  const doc = new jsPDF({
    orientation: 'l',
  });
  const defaultFontSize = doc.getFontSize();

  const {
    selectedCandidates,
    uniqueTransactionCount,
    dateRange,
    totalShared,
    shareTotals,
    dueTotals,
    shareAmountsSummary,
    pairPayable,
  } = calculateSummary(rows, currencyRates);

  let y = 14;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Shared transactions', 14, y);
  doc.setFont('helvetica', 'normal');
  y += 7;
  doc.setFontSize(12);
  doc.text(`\t• Range: ${dateRange[0]} - ${dateRange[1]}`, 14, y);
  y += 7;
  doc.text(`\t• # Records: ${selectedCandidates.length}`, 14, y);
  y += 7;
  doc.text(`\t• Unique Transactions: ${uniqueTransactionCount}`, 14, y);
  y += 7;
  doc.text(`\t• Total: ${totalShared}`, 14, y);
  y += 7;
  doc.text('\t• User shares:', 14, y);
  y += 5;
  Object.entries(shareAmountsSummary)
    .sort(([userNameA], [userNameB]) => userNameA.localeCompare(userNameB))
    .forEach(([userName, currencyMap]) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`\t\t• ${userName}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      doc.setFontSize(10);
      doc.text(
        `\t\t\tShare Total (${baseCurrency})  ${formatNumber(
          shareTotals[userName],
          2,
          2,
        )}`,
        14,
        y,
      );
      y += 6;
      doc.text(
        `\t\t\tDue Total (${baseCurrency})  ${formatNumber(
          dueTotals[userName],
          2,
          2,
        )}`,
        14,
        y,
      );
      y += 6;
      if (Object.keys(pairPayable).length === 2) {
        doc.setTextColor(220, 53, 69);
        doc.text(
          `\t\t\tPayable (${baseCurrency})  ${formatNumber(
            pairPayable[userName],
            2,
            2,
          )}`,
          14,
          y,
        );
        doc.setTextColor(0, 0, 0);
        y += 6;
      }
      doc.text('\t\t\tBreakdown', 14, y);
      y += 6;
      Object.entries(currencyMap)
        .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
        .forEach(([currency, amount]) => {
          doc.setFontSize(8);
          doc.text(`\t\t\t\t${currency}: ${formatNumber(amount, 2, 2)}`, 14, y);
          y += 4;
        });
      y += 8;
    });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(defaultFontSize);
  doc.addPage();

  const tableData = rows.map((row) => {
    const data = row.original;
    return [
      row.index + 1,
      data.sharedTransactionUserName,
      data.transactionName,
      data.transactionCategory,
      format(new Date(data.transactionDate), 'dd/MM/yyyy'),
      data.transactionCurrency,
      formatNumber(data.transactionAmount, 2, 2),
      formatNumber(data.sharedTransactionShare, 2, 2),
      formatNumber(data.sharedTransactionRemaining, 2, 2),
      data.isSettled ? 'Yes' : 'No',
    ];
  });

  autoTable(doc, {
    head: [
      [
        '#',
        'User',
        'Name',
        'Category',
        'Date',
        'Currency',
        'Amount',
        'Share',
        'Remaining',
        'Settled',
      ],
    ],
    body: tableData,
    styles: {
      fontSize: 10,
    },
  });
  window.open(doc.output('bloburl'), '_blank');
};

const SettleSharedTransactionsDialog = ({
  onClose,
  open,
  payload: transactions,
}: DialogProps<Transaction[]>) => {
  const { settings, loading: settingsLoading } = useSettings();
  const { currencyRates, loading: currencyRatesLoading } = useCurrencyRates();
  const { refetchData, loading: dataLoading } = useData();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const baseCurrency: string = settings?.currency || 'USD';

  const loading = settingsLoading || dataLoading || currencyRatesLoading;
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

  const handleExportCSV = () => {
    const csv = generateCsv(csvConfig)(candidates);
    download(csvConfig)(csv);
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
            {formatNumber(cell.row.original.transactionAmount, 2, 2)}
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
            {formatNumber(cell.row.original.sharedTransactionShare, 2, 2)}
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
            {formatNumber(cell.row.original.sharedTransactionRemaining, 2, 2)}
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
    enableRowVirtualization: true,
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
    renderTopToolbarCustomActions: ({ table }) => (
      <Box
        sx={{
          display: 'flex',
          gap: '5px',
          flexWrap: 'wrap',
        }}
      >
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          onClick={handleExportCSV}
          startIcon={<FileDownloadIcon />}
        >
          CSV
        </Button>
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          onClick={() =>
            handleExportPDF(
              // @ts-expect-error ignore
              table.getPrePaginationRowModel().rows,
              currencyRates,
              baseCurrency,
            )
          }
          startIcon={<FileDownloadIcon />}
        >
          PDF
        </Button>
      </Box>
    ),
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
            currencyRates={currencyRates}
            baseCurrency={baseCurrency}
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
