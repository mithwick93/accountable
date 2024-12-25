import { Chip } from '@mui/material';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../../services/ApiService';
import { TransactionCategory } from '../../../types/TransactionCategory';
import { formatTransactionType, stringToColor } from '../../../utils/common';
import log from '../../../utils/logger';

const TransactionCategories: React.FC = () => {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
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
        accessorFn: (row) => formatTransactionType(row.type),
        accessorKey: 'type',
        header: 'Type',
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
    ],
    [],
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/transactions/categories');
        const categoriesData = response.data;
        setCategories(categoriesData);
      } catch (error) {
        log.error('Error fetching transaction categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const table = useMaterialReactTable({
    columns,
    data: categories,
    enableStickyHeader: true,
    initialState: {
      sorting: [
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
  });

  return <MaterialReactTable table={table} />;
};

export default TransactionCategories;
