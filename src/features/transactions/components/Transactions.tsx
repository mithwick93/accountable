import { Box, Chip } from '@mui/material';
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import {
  formatCurrency,
  formatTransactionType,
  stringToColor,
} from '../../../utils/common';

const Transactions: React.FC = () => {
  const {
    transactions: transactionsResponse,
    loading,
    refetchData,
  } = useData();
  const { settings } = useSettings();
  const transactions = transactionsResponse?.content || [];
  const searchParameters = settings?.transactions.search.parameters || {};
  const page = searchParameters.page || 0;
  const size = searchParameters.size || 50;

  useEffect(() => {
    refetchData(['transactions']);
  }, [searchParameters]);

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        maxSize: 100,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        maxSize: 100,
      },
      {
        accessorFn: (row) => formatTransactionType(row.type),
        accessorKey: 'type',
        header: 'Type',
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
        accessorFn: (row) => row.category.name,
        accessorKey: 'category',
        header: 'Category',
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
        Cell: ({ cell }) => (
          <Box component="span">
            {formatCurrency(
              cell.row.original.amount,
              cell.row.original.currency,
            )}
          </Box>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
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

  const table = useMaterialReactTable({
    columns,
    data: transactions,
    enableStickyHeader: true,
    initialState: {
      pagination: {
        pageIndex: page,
        pageSize: size,
      },
    },
    state: {
      isLoading: loading,
    },
  });

  return <MaterialReactTable table={table} />;
};

export default Transactions;
