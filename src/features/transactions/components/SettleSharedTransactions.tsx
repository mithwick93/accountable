import CloseIcon from '@mui/icons-material/Close';
import {
  Avatar,
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
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
import SlideUpTransition from '../../../components/transition/SlideUpTransition';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import apiClient from '../../../services/ApiService';
import { Transaction } from '../../../types/Transaction';
import {
  formatNumber,
  generateAvatarProps,
  getStartEndDate,
  getTransactionsFetchOptions,
  stringToColor,
} from '../../../utils/common';
import { notifyBackendError } from '../../../utils/notifications';

type SettleTransactionCandidate = {
  transactionName: string;
  transactionCategory: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionDate: string;
  sharedTransactionId: number;
  sharedTransactionUserName: string;
  sharedTransactionShare: number;
};

const getSettleTransactionCandidates = (transactions: Transaction[]) => {
  const candidates: SettleTransactionCandidate[] = [];
  transactions.forEach((transaction) => {
    if (transaction.sharedTransactions) {
      transaction.sharedTransactions
        .filter((sharedTransaction) => !sharedTransaction.isSettled)
        .forEach((sharedTransaction) => {
          candidates.push({
            transactionName: transaction.name,
            transactionCategory: transaction.category.name,
            transactionAmount: transaction.amount,
            transactionCurrency: transaction.currency,
            transactionDate: transaction.date,
            sharedTransactionId: sharedTransaction.id,
            sharedTransactionUserName: `${sharedTransaction.user.firstName} ${sharedTransaction.user.lastName}`,
            sharedTransactionShare: sharedTransaction.share,
          });
        });
    }
  });
  return candidates;
};

const SettleSharedTransactions = ({
  onClose,
  open,
  payload: transactions,
}: DialogProps<Transaction[]>) => {
  const { settings } = useSettings();
  const { refetchData } = useData();
  const theme = useTheme();
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

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
        minSize: 250,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 600,
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
        minSize: 150,
        size: 150,
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
    ],
    [],
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
    columnFilterDisplayMode: 'popover',
    enableFacetedValues: true,
    isMultiSortEvent: () => true,
    enableRowSelection: true,
    getRowId: (row) => row.sharedTransactionId,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
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
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
          <MaterialReactTable table={table} />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Box sx={{ width: '1rem' }} />
        <Button
          disabled={selectedSharedTransactionIds.length === 0}
          onClick={handleSettleSharedTransactions}
          variant="contained"
        >
          Settle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettleSharedTransactions;
