import { Box, Chip, Typography } from '@mui/material';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../../services/ApiService';
import { PaymentSystemCredit } from '../../../types/PaymentSystemCredit';
import { PaymentSystemDebit } from '../../../types/PaymentSystemDebit';
import { stringToColor } from '../../../utils/common';
import log from '../../../utils/logger';

const PaymentSystems: React.FC = () => {
  const [paymentSystems, setPaymentSystems] = useState<
    (PaymentSystemCredit | PaymentSystemDebit)[]
  >([]);
  const [loading, setLoading] = useState(true);

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'currency',
        header: 'Currency',
      },
      {
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
        accessorKey: 'name',
        header: 'Name',
        muiTableBodyCellProps: {
          sx: {
            textTransform: 'capitalize',
          },
        },
      },
      {
        accessorKey: 'liability.name',
        header: 'Liability',
      },
      {
        accessorKey: 'asset.name',
        header: 'Asset',
      },
    ],
    [],
  );

  useEffect(() => {
    const fetchPaymentSystems = async () => {
      setLoading(true);
      try {
        const [creditsResponse, debitsResponse] = await Promise.all([
          apiClient.get('/payment-systems/credits'),
          apiClient.get('/payment-systems/debits'),
        ]);

        const creditsData = creditsResponse.data.map(
          (item: PaymentSystemCredit) => ({
            ...item,
            type: 'Credit',
          }),
        );

        const debitsData = debitsResponse.data.map(
          (item: PaymentSystemDebit) => ({
            ...item,
            type: 'Debit',
          }),
        );

        setPaymentSystems([...creditsData, ...debitsData]);
      } catch (error) {
        log.error('Error fetching payment systems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSystems();
  }, []);

  const table = useMaterialReactTable({
    columns,
    data: paymentSystems,
    enableStickyHeader: true,
    initialState: {
      sorting: [
        {
          id: 'currency',
          desc: false,
        },
        {
          id: 'type',
          desc: false,
        },
        {
          id: 'name',
          desc: false,
        },
      ],
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
    state: {
      isLoading: loading,
    },
    renderDetailPanel: ({ row }) => (
      <Box
        sx={{
          display: 'grid',
          margin: 'auto',
          gridTemplateColumns: '1fr 1fr',
          width: '100%',
        }}
      >
        <Typography>Id: {row.original.id}</Typography>
        <Typography>Description: {row.original.description}</Typography>
      </Box>
    ),
  });

  return <MaterialReactTable table={table} />;
};

export default PaymentSystems;
