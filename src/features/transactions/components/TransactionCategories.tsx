import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import {
  LiteralUnion,
  MaterialReactTable,
  type MRT_ColumnDef,
  MRT_EditActionButtons,
  MRT_Row,
  type MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../services/ApiService';
import { TransactionCategory } from '../../../types/TransactionCategory';
import {
  formatTransactionType,
  getOriginalTransactionType,
  stringToColor,
} from '../../../utils/common';
import log from '../../../utils/logger';
import { notifyBackendError } from '../../../utils/notifications';

const TransactionCategories: React.FC = () => {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        Edit: () => null,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        muiTableBodyCellProps: {
          sx: {
            textTransform: 'capitalize',
          },
        },
        muiEditTextFieldProps: {
          required: true,
          error: !!validationErrors?.name,
          helperText: validationErrors?.name,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              name: undefined,
            }),
        },
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
        editVariant: 'select',
        editSelectOptions: ['Income', 'Expense', 'Transfer'],
        muiEditTextFieldProps: {
          select: true,
          required: true,
          error: !!validationErrors?.type,
          helperText: validationErrors?.type,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              type: undefined,
            }),
        },
      },
    ],
    [validationErrors],
  );

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/transactions/categories');
        const categoriesData = response.data;
        setCategories(categoriesData);
      } catch (error) {
        log.error('Error fetching transaction categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const validateCategory = (category: Record<LiteralUnion<string>, any>) => {
    const errors: Record<string, string | undefined> = {};
    if (!category.name) {
      errors.name = 'Name is required';
    }
    if (!category.type) {
      errors.type = 'Type is required';
    }
    return errors;
  };

  const createCategory = async (category: TransactionCategory) => {
    setSaving(true);
    try {
      const response = await apiClient.post('/transactions/categories', {
        name: category.name,
        type: getOriginalTransactionType(category.type),
      });
      const newCategory = response.data;
      setCategories([...categories, newCategory]);
      toast.success(
        `Transaction category: '${newCategory.name}' created successfully`,
      );
    } catch (error) {
      notifyBackendError('Error creating transaction category', error);
    } finally {
      setSaving(false);
    }
  };

  const updateCategory = async (category: TransactionCategory) => {
    setUpdating(true);
    try {
      const { id } = category;
      const response = await apiClient.put(`/transactions/categories/${id}`, {
        name: category.name,
        type: getOriginalTransactionType(category.type),
      });
      const updatedCategory = response.data;
      setCategories(categories.map((c) => (c.id === id ? updatedCategory : c)));
      toast.success(
        `Transaction category: '${updatedCategory.name}' updated successfully`,
      );
    } catch (error) {
      log.error('Error updating transaction category: ', error);
      notifyBackendError('Error updating transaction category', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteCategory = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    try {
      const { id } = row.original;
      await apiClient.delete(`/transactions/categories/${id}`);
      setCategories(categories.filter((category) => category.id !== id));
      toast.success(`Transaction category: '${row.original.name}' deleted`);
    } catch (error) {
      notifyBackendError('Error deleting transaction category', error);
    } finally {
      setDeleting(false);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: categories,
    enableStickyHeader: true,
    enableEditing: true,
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
      columnVisibility: {
        id: false,
      },
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
    state: {
      isLoading: loading,
      isSaving: saving || updating || deleting,
    },
    onCreatingRowSave: async ({ table, values }) => {
      //validate data
      const newValidationErrors = validateCategory(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      //save data to api
      setValidationErrors({});
      await createCategory(values as TransactionCategory);
      table.setCreatingRow(null); //exit creating mode
    },
    onCreatingRowCancel: () => setValidationErrors({}),
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        variant="outlined"
        onClick={() => {
          table.setCreatingRow(true);
        }}
        startIcon={<AddIcon />}
      >
        Create
      </Button>
    ),
    renderCreateRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {internalEditComponents}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    onEditingRowSave: async ({ table, values }) => {
      //validate data
      const newValidationErrors = validateCategory(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }
      //save data to api
      setValidationErrors({});
      await updateCategory(values as TransactionCategory);
      table.setEditingRow(null); //exit editing mode
    },
    onEditingRowCancel: () => setValidationErrors({}),
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {internalEditComponents}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Tooltip title="Edit">
          <IconButton onClick={() => table.setEditingRow(row)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            color="error"
            onClick={async () => {
              if (
                window.confirm(
                  `Are you sure you want to delete '${row.original.name}' category?`,
                )
              ) {
                await deleteCategory(row);
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  });

  return <MaterialReactTable table={table} />;
};

export default TransactionCategories;
