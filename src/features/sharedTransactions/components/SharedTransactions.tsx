import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Avatar, Box, Button, Chip, Tooltip, useTheme } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useDialogs } from '@toolpad/core/useDialogs';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
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
import React, { useEffect, useMemo, useState } from 'react';
import DateRangeSelector from '../../../components/DateRangeSelector';
import { useCurrencyRates } from '../../../context/CurrencyRatesContext';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { Transaction } from '../../../types/Transaction';
import {
  calculateTotalInBaseCurrency,
  formatNumber,
  generateAvatarProps,
  getStartEndDate,
  getTransactionsFetchOptions,
  stringToColor,
} from '../../../utils/common';
import SettleSharedTransactionsDialog from './SettleSharedTransactionsDialog';
import { SettleTransactionCandidate } from './types';

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

const calculateSummary = (
  selectedCandidates: SettleTransactionCandidate[],
  currencyRates: Record<string, number>,
) => {
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
  } = calculateSummary(
    rows.map((row) => row.original),
    currencyRates,
  );

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

const SharedTransactions: React.FC = () => {
  const {
    transactions: transactionsResponse,
    loading: dataLoading,
    refetchData,
  } = useData();
  const { settings, loading: settingsLoading } = useSettings();
  const { currencyRates, loading: currencyRatesLoading } = useCurrencyRates();
  const theme = useTheme();
  const dialogs = useDialogs();

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const baseCurrency: string = settings?.currency || 'USD';

  const loading = dataLoading || settingsLoading || currencyRatesLoading;

  const transactions = useMemo(
    () =>
      (transactionsResponse?.content || []).filter(
        (transaction) =>
          transaction.sharedTransactions &&
          transaction.sharedTransactions.length > 0,
      ),
    [transactionsResponse],
  );

  const searchParameters: Record<string, any> = useMemo(
    () => settings?.transactions?.search?.parameters || {},
    [settings],
  );
  const { startDate, endDate } = getStartEndDate(settings);

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

  useEffect(() => {
    // eslint-disable-next-line
    const { userIds, ...searchParametersWithoutUser } = searchParameters;
    refetchData(
      ['transactions'],
      getTransactionsFetchOptions(
        searchParametersWithoutUser,
        startDate,
        endDate,
      ),
    );
    // eslint-disable-next-line
  }, [searchParameters, startDate, endDate]);

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'sharedTransactionUserName',
        header: 'User',
        grow: false,
        minSize: 125,
        size: 125,
        maxSize: 125,
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
        minSize: 100,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 450,
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
        accessorFn: (row) => new Date(row.transactionDate),
        accessorKey: 'transactionDate',
        header: 'Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 125,
        size: 125,
        maxSize: 125,
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
    enableStickyFooter: true,
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
        height: 'calc(100vh - 390px)',
        overflowY: 'auto',
      },
    },
    columnFilterDisplayMode: 'popover',
    enableFacetedValues: true,
    isMultiSortEvent: () => true,
    enableRowSelection: true,
    getRowId: (row) => row.sharedTransactionId,
    onRowSelectionChange: setRowSelection,
    renderTopToolbarCustomActions: () => (
      <Box
        sx={{
          display: 'flex',
          gap: '5px',
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="outlined"
          disabled={selectedSharedTransactionIds.length === 0}
          onClick={async () => {
            await dialogs.open(SettleSharedTransactionsDialog, {
              selectedSharedTransactionIds,
              candidates,
              currencyRates,
              baseCurrency,
            });
          }}
          startIcon={<CloseFullscreenIcon />}
        >
          Settle
        </Button>
      </Box>
    ),
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
          <Typography variant="h6">Billing Period:</Typography>
          <DateRangeSelector
            onRangeChange={() => {
              setRowSelection({});
            }}
          />
        </Box>
        <Box display="flex" gap={1}>
          <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            onClick={() =>
              handleExportPDF(
                table.getPrePaginationRowModel()
                  .rows as unknown as MRT_Row<SettleTransactionCandidate>[],
                currencyRates,
                baseCurrency,
              )
            }
            startIcon={<FileDownloadIcon />}
          >
            PDF
          </Button>
        </Box>
      </Box>
      <MaterialReactTable table={table} />
    </LocalizationProvider>
  );
};

export default SharedTransactions;
