import { Box, Chip, Typography } from '@mui/material';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../../services/ApiService';
import { Liability } from '../../../types/Liability';
import {
  formatCurrency,
  formatLiabilityStatus,
  formatLiabilityType,
  getCreditUtilizationColor,
  getDueDateColor,
  stringToColor,
} from '../../../utils/common';
import { calculateLiabilityDates } from '../../../utils/date';
import log from '../../../utils/logger';

const Liabilities: React.FC = () => {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        muiTableBodyCellProps: {
          sx: {
            textTransform: 'capitalize',
          },
        },
      },
      {
        accessorFn: (row) => formatLiabilityType(row.type),
        accessorKey: 'type',
        header: 'Type',
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
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
          calculateLiabilityDates(new Date(), row.dueDay, row.statementDay)
            .statementDate,
        header: 'Statement Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        accessorFn: (row) =>
          calculateLiabilityDates(new Date(), row.dueDay, row.statementDay)
            .dueDate,
        header: 'Due Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ renderedCellValue }) => (
          <Box
            component="span"
            sx={(theme) => ({
              color: getDueDateColor(
                renderedCellValue as string,
                theme.palette.mode,
              ),
            })}
          >
            {renderedCellValue}
          </Box>
        ),
      },
      {
        accessorFn: (row) => formatCurrency(row.balance, row.currency),
        header: 'Utilized',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ row }) => {
          const utilized = row.original.balance;
          const limit = row.original.amount;
          return (
            <Box
              component="span"
              sx={(theme) => ({
                color: getCreditUtilizationColor(
                  utilized,
                  limit,
                  theme.palette.mode,
                ),
              })}
            >
              {formatCurrency(utilized, row.original.currency)}
            </Box>
          );
        },
      },
      {
        accessorFn: (row) =>
          formatCurrency(row.amount - row.balance, row.currency),
        header: 'Available',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        accessorFn: (row) => formatCurrency(row.amount, row.currency),
        header: 'Limit',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
      },
      {
        accessorKey: 'currency',
        header: 'Currency',
      },
    ],
    [],
  );

  useEffect(() => {
    const fetchLiabilities = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/liabilities');
        const liabilitiesData = response.data;
        setLiabilities(liabilitiesData);
      } catch (error) {
        log.error('Error fetching liabilities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiabilities();
  }, []);

  const table = useMaterialReactTable({
    columns,
    data: liabilities,
    enableStickyHeader: true,
    initialState: {
      sorting: [
        {
          id: 'type',
          desc: false,
        },
        {
          id: 'currency',
          desc: false,
        },
        {
          id: 'name',
          desc: false,
        },
      ],
      columnVisibility: {
        currency: false,
      },
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
    state: {
      isLoading: loading,
    },
    renderDetailPanel: ({ row }) => {
      const formattedStatus = formatLiabilityStatus(row.original.status);
      return (
        <Box
          sx={{
            display: 'grid',
            margin: 'auto',
            gridTemplateColumns: '1fr 1fr',
            width: '100%',
          }}
        >
          <Typography>Id: {row.original.id}</Typography>
          {row.original.description && (
            <Typography>Description: {row.original.description}%</Typography>
          )}
          <Typography>
            Status:{' '}
            <Chip
              label={formattedStatus}
              sx={(theme) => ({
                backgroundColor: stringToColor(
                  formattedStatus as string,
                  theme.palette.mode === 'dark',
                ),
              })}
            />
          </Typography>
          {row.original.interestRate && (
            <Typography>Interest Rate: {row.original.interestRate}%</Typography>
          )}
        </Box>
      );
    },
  });

  return <MaterialReactTable table={table} />;
};

export default Liabilities;
