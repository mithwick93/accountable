import { Avatar, Box, Chip, Tooltip, useTheme } from '@mui/material';
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
  generateAvatarProps,
  stringToColor,
} from '../../../utils/common';

const Transactions: React.FC = () => {
  const {
    transactions: transactionsResponse,
    loading,
    refetchData,
  } = useData();
  const { settings, update } = useSettings();
  const theme = useTheme();

  const transactions = transactionsResponse?.content || [];
  const searchParameters: Record<string, any> =
    settings?.transactions?.search?.parameters || {};
  const pageIndex = searchParameters.pageIndex || 0;
  const pageSize = searchParameters.pageSize || 50;

  useEffect(() => {
    refetchData(['transactions']);
  }, [searchParameters]);

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorFn: (row) => row.user,
        accessorKey: 'user',
        header: 'User',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 150,
        Cell: ({ cell }) => {
          const name = `${cell.row.original.user.firstName} ${cell.row.original.user.lastName}`;
          return (
            <Tooltip title={name}>
              <Avatar
                {...generateAvatarProps(
                  name || 'User',
                  theme.palette.mode === 'dark',
                  { width: 24, height: 24, fontSize: 12 },
                )}
              />
            </Tooltip>
          );
        },
      },
      {
        accessorKey: 'name',
        header: 'Name',
        minSize: 200,
        size: 200,
        maxSize: 400,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 400,
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
        accessorFn: (row) => row.amount,
        accessorKey: 'amount',
        header: 'Amount',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 150,
        size: 150,
        maxSize: 200,
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
        minSize: 150,
        size: 150,
        maxSize: 200,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
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
        accessorFn: (row) => formatTransactionType(row.type),
        accessorKey: 'type',
        header: 'Type',
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
      },
      {
        accessorFn: (row) => row.category.name,
        accessorKey: 'category',
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
      },
      {
        accessorFn: (row) =>
          row.fromPaymentSystemCredit?.name || row.fromPaymentSystemDebit?.name,
        accessorKey: 'fromPaymentSystem',
        header: 'From Payment System',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
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
        accessorFn: (row) => row.fromAsset?.name,
        accessorKey: 'fromAsset',
        header: 'From Asset',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
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
        accessorFn: (row) => row.toAsset?.name,
        accessorKey: 'toAsset',
        header: 'To Asset',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
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
        accessorFn: (row) => row.toLiability?.name,
        accessorKey: 'toLiability',
        header: 'To Liability',
        grow: false,
        minSize: 150,
        size: 150,
        maxSize: 200,
        Cell: ({ cell }) => (
          <Tooltip title={cell.getValue<string>()}>
            <Box
              component="span"
              sx={{
                maxWidth: 150,
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
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: transactions,
    enableRowNumbers: true,
    enableStickyHeader: true,
    manualPagination: true,
    enableColumnResizing: true,
    columnResizeMode: 'onEnd',
    rowCount: transactionsResponse?.totalElements || 0,
    state: {
      isLoading: loading,
      pagination: {
        pageIndex: pageIndex,
        pageSize: pageSize,
      },
    },
    onPaginationChange: (updaterOrValue) => {
      const newState =
        typeof updaterOrValue === 'function'
          ? updaterOrValue({ pageIndex, pageSize })
          : updaterOrValue;
      update({
        ...settings,
        transactions: {
          ...(settings?.transactions || {}),
          search: {
            ...(settings?.transactions?.search || {}),
            parameters: {
              ...searchParameters,
              pageIndex: newState.pageIndex,
              pageSize: newState.pageSize,
            },
          },
        },
      });
    },
  });

  return <MaterialReactTable table={table} />;
};

export default Transactions;
