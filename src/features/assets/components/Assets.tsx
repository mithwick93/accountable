import { Box, Chip, Typography } from '@mui/material';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../../services/ApiService';
import { Asset } from '../../../types/Asset';
import {
  formatAssetType,
  formatCurrency,
  stringToColor,
} from '../../../utils/common';
import log from '../../../utils/logger';

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
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
        accessorFn: (row) => formatAssetType(row.type),
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
        accessorFn: (row) => formatCurrency(row.balance, row.currency),
        header: 'Balance',
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
    const fetchAssets = async () => {
      try {
        const response = await apiClient.get('/assets');
        const assetsData = response.data;
        setAssets(assetsData);
      } catch (error) {
        log.error('Error fetching assets:', error);
      }
    };

    fetchAssets();
  }, []);

  const table = useMaterialReactTable({
    columns,
    data: assets,
    enableStickyHeader: true,
    initialState: {
      sorting: [
        {
          id: 'currency',
          desc: false,
        },
        {
          id: 'type',
          desc: true,
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

export default Assets;
