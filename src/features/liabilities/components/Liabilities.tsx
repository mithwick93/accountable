import { Box, Chip, Typography } from '@mui/material';
import { PaletteMode } from '@mui/material/styles/createPalette';
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
  alertColors,
  formatCurrency,
  formatLiabilityStatus,
  formatLiabilityType,
  stringToColor,
} from '../../../utils/common';
import { calculateLiabilityDates } from '../../../utils/date';
import log from '../../../utils/logger';

const getCreditUtilizationColor = (
  utilized: number,
  limit: number,
  palateMode: PaletteMode,
) => {
  const utilizationPercentage = (utilized / limit) * 100;

  if (utilizationPercentage < 30) {
    return alertColors.green[palateMode];
  } else if (utilizationPercentage < 70) {
    return alertColors.orange[palateMode];
  } else {
    return alertColors.red[palateMode];
  }
};

const getDueDateColor = (dueDateString: string, palateMode: PaletteMode) => {
  const [day, month, year] = dueDateString.split('/');
  const dueDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  const timeDiff = dueDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysRemaining <= 7) {
    return alertColors.red[palateMode];
  } else if (daysRemaining <= 14) {
    return alertColors.orange[palateMode];
  } else {
    return alertColors.green[palateMode];
  }
};

const Liabilities: React.FC = () => {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
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
        // eslint-disable-next-line react/prop-types
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
        /* eslint-disable react/prop-types */
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
        /* eslint-enable react/prop-types */
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
        /* eslint-disable react/prop-types */
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
        /* eslint-enable react/prop-types */
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
      try {
        const response = await apiClient.get('/liabilities');
        const liabilitiesData = response.data;
        setLiabilities(liabilitiesData);
      } catch (error) {
        log.error('Error fetching liabilities:', error);
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
