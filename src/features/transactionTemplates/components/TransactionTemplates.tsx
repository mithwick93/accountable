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
  MaterialReactTable,
  type MRT_ColumnDef,
  MRT_EditActionButtons,
  MRT_Row,
  type MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useData } from '../../../context/DataContext';
import { useStaticData } from '../../../context/StaticDataContext';
import apiClient from '../../../services/ApiService';
import { TransactionCategory } from '../../../types/TransactionCategory';
import { TransactionTemplate } from '../../../types/TransactionTemplate';
import {
  formatCurrency,
  formatNumber,
  formatTransactionType,
  getOriginalTransactionType,
  notSelectedOption,
  stringToColor,
} from '../../../utils/common';
import log from '../../../utils/logger';
import { notifyBackendError } from '../../../utils/notifications';

const generateRequestPayload = (template: Record<string, any>) => {
  const request: Record<string, any> = {
    name: template.name,
    description: template.description,
    type: getOriginalTransactionType(template.type),
    categoryId: template.category,
    amount: template.amount ? parseFloat(template.amount) : 0,
    currency: template.currency,
  };

  if (template.frequency && template.frequency !== notSelectedOption.value) {
    request.frequency = template.frequency;

    if (request.frequency === 'MONTHLY') {
      request.dayOfMonth = template.dayOfMonth;
    } else if (request.frequency === 'YEARLY') {
      request.dayOfMonth = template.dayOfMonth;
      request.monthOfYear = template.monthOfYear;
    }
  }

  return request;
};

const TransactionTemplates: React.FC = () => {
  const {
    templates,
    categories,
    refetchData,
    loading: dataLoading,
  } = useData();
  const { currencies, loading: staticDataLoading } = useStaticData();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const loading = dataLoading || staticDataLoading;

  const categoryOptions = useMemo(
    () =>
      categories.map((item: TransactionCategory) => ({
        value: item.id,
        label: item.name,
      })),
    [categories],
  );
  const currencyCodes = useMemo(
    () => currencies?.map((currency) => currency.code) ?? [],
    [currencies],
  );

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        Edit: () => null,
        visibleInShowHideMenu: false,
      },
      {
        accessorFn: (row) => formatTransactionType(row.type),
        accessorKey: 'type',
        header: 'Type',
        minSize: 100,
        size: 100,
        maxSize: 100,
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
        editSelectOptions: ['Expense', 'Income', 'Transfer'],
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
      {
        accessorKey: 'name',
        header: 'Name',
        minSize: 100,
        size: 150,
        maxSize: 200,
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
        accessorKey: 'description',
        header: 'Description',
        minSize: 100,
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
        muiEditTextFieldProps: {
          required: false,
          error: !!validationErrors?.description,
          helperText: validationErrors?.description,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              description: undefined,
            }),
        },
      },
      {
        accessorFn: (row) => row.category?.id,
        accessorKey: 'category',
        header: 'Category',
        minSize: 125,
        size: 125,
        maxSize: 150,
        Cell: ({ cell }) => (
          <Chip
            label={cell.row.original.category?.name}
            sx={(theme) => ({
              backgroundColor: stringToColor(
                cell.row.original.category?.name as string,
                theme.palette.mode === 'dark',
              ),
            })}
          />
        ),
        editVariant: 'select',
        editSelectOptions: categoryOptions,
        muiEditTextFieldProps: {
          select: true,
          required: true,
          error: !!validationErrors?.category,
          helperText: validationErrors?.category,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              category: undefined,
            }),
        },
      },
      {
        accessorKey: 'currency',
        header: 'Currency',
        minSize: 100,
        size: 125,
        maxSize: 150,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        editVariant: 'select',
        editSelectOptions: currencyCodes,
        muiEditTextFieldProps: {
          select: true,
          required: true,
          error: !!validationErrors?.currency,
          helperText: validationErrors?.currency,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              currency: undefined,
            }),
        },
        visibleInShowHideMenu: false,
      },
      {
        accessorFn: (row) => row.amount,
        accessorKey: 'amount',
        header: 'Amount',
        minSize: 125,
        size: 125,
        maxSize: 150,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <Box component="span">
            {cell.row.original.amount
              ? formatNumber(cell.row.original.amount)
              : ''}
          </Box>
        ),
        muiEditTextFieldProps: {
          type: 'number',
          slotProps: {
            htmlInput: {
              min: 0,
            },
          },
          required: true,
          error: !!validationErrors?.amount,
          helperText: validationErrors?.amount,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              amount: undefined,
            }),
        },
        aggregationFn: 'sum',
        AggregatedCell: ({ cell }) => (
          <span>
            {formatCurrency(
              cell.getValue<number>(),
              cell.row.original.currency,
            )}
          </span>
        ),
      },
      {
        accessorKey: 'frequency',
        header: 'Frequency',
        minSize: 125,
        size: 125,
        maxSize: 150,
        Cell: ({ cell }) => (
          <Box component="span" sx={{ textTransform: 'capitalize' }}>
            {cell.getValue<string>()?.toLowerCase &&
              cell.getValue<string>()?.toLowerCase()}
          </Box>
        ),
        editVariant: 'select',
        editSelectOptions: [
          notSelectedOption,
          { value: 'MONTHLY', label: 'Monthly' },
          { value: 'YEARLY', label: 'Yearly' },
        ],
        muiEditTextFieldProps: {
          select: true,
          required: false,
          error: !!validationErrors?.frequency,
          helperText: validationErrors?.frequency,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              frequency: undefined,
            }),
        },
      },
      {
        accessorFn: (row) => row.dayOfMonth,
        accessorKey: 'dayOfMonth',
        header: 'DOM',
        minSize: 125,
        size: 125,
        maxSize: 150,
        muiEditTextFieldProps: {
          type: 'number',
          slotProps: {
            htmlInput: {
              min: 1,
              max: 31,
            },
          },
          error: !!validationErrors?.dayOfMonth,
          helperText: validationErrors?.dayOfMonth,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              dayOfMonth: undefined,
            }),
        },
      },
      {
        accessorFn: (row) => row.monthOfYear,
        accessorKey: 'monthOfYear',
        header: 'MoY',
        minSize: 125,
        size: 125,
        maxSize: 150,
        muiEditTextFieldProps: {
          type: 'number',
          slotProps: {
            htmlInput: {
              min: 1,
              max: 12,
            },
          },
          error: !!validationErrors?.monthOfYear,
          helperText: validationErrors?.monthOfYear,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              monthOfYear: undefined,
            }),
        },
      },
    ],
    [validationErrors, categoryOptions, currencyCodes],
  );

  const validateTemplate = (
    template: Record<string, any>,
  ): Record<string, string | undefined> => {
    const errors: Record<string, string | undefined> = {};

    const requiredFields = ['name', 'type', 'category', 'currency'];
    requiredFields.forEach((field) => {
      if (!template[field]) {
        errors[field] =
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    const validateDayOfMonth = () => {
      const day = Number(template.dayOfMonth);
      if (!template.dayOfMonth) {
        errors.dayOfMonth = 'Day of month is required';
      } else if (day < 1 || day > 31) {
        errors.dayOfMonth = 'Day of month must be between 1 and 31';
      }
    };

    if (template.frequency === 'MONTHLY' || template.frequency === 'YEARLY') {
      validateDayOfMonth();
    }

    if (template.frequency === 'YEARLY') {
      const month = Number(template.monthOfYear);
      if (!template.monthOfYear) {
        errors.monthOfYear = 'Month of year is required';
      } else if (month < 1 || month > 12) {
        errors.monthOfYear = 'Month of year must be between 1 and 12';
      }
    }

    if (template.type && template.category) {
      const transactionCategory = categories.find(
        (cat) => cat.id === Number(template.category),
      );
      if (
        transactionCategory &&
        transactionCategory.type !== getOriginalTransactionType(template.type)
      ) {
        errors.category = `Category type must be ${template.type}`;
      }
    }

    return errors;
  };

  const createTemplate = async (template: Record<string, any>) => {
    setSaving(true);
    try {
      const request = generateRequestPayload(template);
      const response = await apiClient.post('/transactions/templates', request);
      await refetchData(['templates']);

      const newTemplate = response.data;
      toast.success(
        `Transaction template: '${newTemplate.name}' created successfully`,
      );
    } catch (error) {
      notifyBackendError('Error creating transaction template', error);
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = async (template: Record<string, any>) => {
    setUpdating(true);
    try {
      const { id } = template;
      const request = generateRequestPayload(template);
      const response = await apiClient.put(
        `/transactions/templates/${id}`,
        request,
      );
      await refetchData(['templates']);

      const updatedTemplate = response.data;
      toast.success(
        `Transaction template: '${updatedTemplate.name}' updated successfully`,
      );
    } catch (error) {
      log.error('Error updating transaction template: ', error);
      notifyBackendError('Error updating transaction template', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteTemplate = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    try {
      const { id } = row.original;
      await apiClient.delete(`/transactions/templates/${id}`);
      await refetchData(['templates']);

      toast.success(`Transaction template: '${row.original.name}' deleted`);
    } catch (error) {
      notifyBackendError('Error deleting transaction template', error);
    } finally {
      setDeleting(false);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: templates,
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableEditing: true,
    enablePagination: false,
    enableGrouping: true,
    enableColumnDragging: false,
    initialState: {
      density: 'compact',
      grouping: ['currency', 'type', 'frequency', 'category'],
      sorting: [
        {
          id: 'dayOfMonth',
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
        pageSize: 100,
      },
    },
    state: {
      isLoading: loading,
      isSaving: saving || updating || deleting,
    },
    muiTableContainerProps: {
      sx: {
        height: 'calc(100vh - 207px)',
        overflowY: 'auto',
      },
    },
    muiBottomToolbarProps: {
      sx: {
        display: 'none',
      },
    },
    onCreatingRowSave: async ({ table, values }) => {
      //validate data
      const newValidationErrors = validateTemplate(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      //save data to api
      setValidationErrors({});
      await createTemplate(values as TransactionTemplate);
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
        <DialogTitle>Create New Template</DialogTitle>
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
      const newValidationErrors = validateTemplate(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }
      //save data to api
      setValidationErrors({});
      await updateTemplate(values as TransactionCategory);
      table.setEditingRow(null); //exit editing mode
    },
    onEditingRowCancel: () => setValidationErrors({}),
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle>Edit Template</DialogTitle>
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
                  `Are you sure you want to delete '${row.original.name}' template?`,
                )
              ) {
                await deleteTemplate(row);
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

export default TransactionTemplates;
