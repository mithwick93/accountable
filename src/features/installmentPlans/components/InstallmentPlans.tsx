import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import { format } from 'date-fns';
import {
  DropdownOption,
  LiteralUnion,
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
import { InstallmentPlan } from '../../../types/InstallmentPlan';
import { Liability } from '../../../types/Liability';
import { formatNumber } from '../../../utils/common';
import { notifyBackendError } from '../../../utils/notifications';

const createPayload = (installmentPlan: Record<string, any>) => {
  const payload: any = {
    name: installmentPlan.name,
    liabilityId: installmentPlan.liabilityId,
    currency: installmentPlan.currency,
    installmentAmount: installmentPlan.installmentAmount,
    totalInstallments: installmentPlan.totalInstallments,
    installmentsPaid: installmentPlan.installmentsPaid,
    startDate: installmentPlan.startDate,
    status: installmentPlan.status,
  };

  if (installmentPlan.description) {
    payload.description = installmentPlan.description;
  }
  if (installmentPlan.interestRate) {
    payload.interestRate = installmentPlan.interestRate;
  }
  if (installmentPlan.endDate) {
    payload.endDate = installmentPlan.endDate;
  }

  return payload;
};

const InstallmentPlans: React.FC = () => {
  const {
    liabilities,
    installmentPlans,
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
  const currencyCodes = useMemo(
    () => currencies?.map((currency) => currency.code) ?? [],
    [currencies],
  );

  const liabilitiesOptions: DropdownOption[] = useMemo(
    () =>
      liabilities.map((item: Liability) => ({
        value: item.id,
        label: item.name,
      })),
    [liabilities],
  );
  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    // eslint-disable-next-line complexity
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        Edit: () => null,
        visibleInShowHideMenu: false,
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
        accessorKey: 'status',
        header: 'Status',
        minSize: 100,
        size: 100,
        maxSize: 100,
        editVariant: 'select',
        editSelectOptions: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Canceled', value: 'CANCELED' },
          { label: 'Defaulted', value: 'DEFAULTED' },
          { label: 'Deferred', value: 'DEFERRED' },
          { label: 'Overdue', value: 'OVERDUE' },
          { label: 'Restructured', value: 'RESTRUCTURED' },
          { label: 'Settled', value: 'SETTLED' },
        ],
        muiEditTextFieldProps: {
          required: true,
          select: true,
          error: !!validationErrors?.status,
          helperText: validationErrors?.status,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              status: undefined,
            }),
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
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
        visibleInShowHideMenu: false,
      },
      {
        accessorFn: (row) => row.liability?.id,
        accessorKey: 'liabilityId',
        header: 'Liability',
        minSize: 150,
        size: 150,
        maxSize: 150,
        editVariant: 'select',
        editSelectOptions: liabilitiesOptions,
        muiEditTextFieldProps: {
          select: true,
          required: true,
          error: !!validationErrors?.liabilityId,
          helperText: validationErrors?.liabilityId,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              liabilityId: undefined,
            }),
        },
      },
      {
        accessorKey: 'currency',
        header: 'Currency',
        minSize: 50,
        size: 50,
        maxSize: 50,
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
      },
      {
        accessorKey: 'installmentAmount',
        header: 'Amount',
        minSize: 125,
        size: 125,
        maxSize: 125,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <Box component="span">
            {formatNumber(cell.row.original.installmentAmount)}
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
          error: !!validationErrors?.installmentAmount,
          helperText: validationErrors?.installmentAmount,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              installmentAmount: undefined,
            }),
        },
      },
      {
        accessorKey: 'totalInstallments',
        header: 'Total Installments',
        minSize: 125,
        size: 125,
        maxSize: 125,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        muiEditTextFieldProps: {
          type: 'number',
          slotProps: {
            htmlInput: {
              min: 1,
            },
          },
          required: true,
          error: !!validationErrors?.totalInstallments,
          helperText: validationErrors?.totalInstallments,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              totalInstallments: undefined,
            }),
        },
      },
      {
        accessorKey: 'installmentsPaid',
        header: 'Remaining',
        minSize: 125,
        size: 125,
        maxSize: 125,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        muiEditTextFieldProps: {
          type: 'number',
          slotProps: {
            htmlInput: {
              min: 0,
            },
          },
          required: true,
          error: !!validationErrors?.installmentsPaid,
          helperText: validationErrors?.installmentsPaid,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              installmentsPaid: undefined,
            }),
        },
      },
      {
        accessorKey: 'interestRate',
        header: 'Interest Rate',
        muiEditTextFieldProps: {
          type: 'number',
          slotProps: {
            htmlInput: {
              min: 0,
            },
          },
          required: false,
          error: !!validationErrors?.interestRate,
          helperText: validationErrors?.interestRate,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              interestRate: undefined,
            }),
        },
        visibleInShowHideMenu: false,
      },
      {
        accessorKey: 'startDate',
        header: 'Start',
        minSize: 125,
        size: 125,
        maxSize: 125,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => format(cell.getValue<Date>(), 'dd/MM/yyyy'),
        muiEditTextFieldProps: {
          type: 'date',
          required: true,
          error: !!validationErrors?.startDate,
          helperText: validationErrors?.startDate,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              startDate: undefined,
            }),
        },
      },
      {
        accessorKey: 'endDate',
        header: 'End',
        minSize: 125,
        size: 125,
        maxSize: 125,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => {
          if (!cell.row.original.endDate) {
            return 'N/A';
          }
          return format(cell.getValue<Date>(), 'dd/MM/yyyy');
        },
        muiEditTextFieldProps: {
          type: 'date',
          required: false,
          error: !!validationErrors?.endDate,
          helperText: validationErrors?.endDate,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              endDate: undefined,
            }),
        },
      },
    ],
    [validationErrors, liabilitiesOptions, currencyCodes],
  );

  const validateInstallmentPlan = (
    installmentPlan: Record<LiteralUnion<string>, any>,
  ) => {
    const errors: Record<string, string | undefined> = {};
    if (!installmentPlan.name) {
      errors.name = 'Name is required';
    }
    if (!installmentPlan.status) {
      errors.status = 'Status is required';
    }
    if (!installmentPlan.liabilityId) {
      errors.liabilityId = 'Liability is required';
    }
    if (!installmentPlan.currency) {
      errors.currency = 'Currency is required';
    }
    if (!installmentPlan.installmentAmount) {
      errors.installmentAmount = 'Installment amount is required';
    }
    if (!installmentPlan.totalInstallments) {
      errors.totalInstallments = 'Total installments amount is required';
    }
    if (!installmentPlan.installmentsPaid) {
      errors.installmentsPaid = 'Installments paid amount is required';
    }
    if (!installmentPlan.startDate) {
      errors.startDate = 'Start date paid amount is required';
    }

    return errors;
  };

  const createInstallmentPlan = async (installmentPlan: InstallmentPlan) => {
    setSaving(true);
    try {
      const payload = createPayload(installmentPlan);
      const response = await apiClient.post('/installment-plans', payload);
      await refetchData(['installmentPlans']);

      const newInstallmentPlan = response.data;
      toast.success(
        `Created Installment plan: '${newInstallmentPlan.name}' successfully`,
      );
    } catch (error) {
      notifyBackendError('Error creating installment plan', error);
    } finally {
      setSaving(false);
    }
  };

  const updateInstallmentPlan = async (installmentPlan: InstallmentPlan) => {
    setUpdating(true);
    try {
      const { id } = installmentPlan;
      const payload = createPayload(installmentPlan);
      const response = await apiClient.put(`/installment-plans/${id}`, payload);
      await refetchData(['installmentPlans']);

      const updatedInstallmentPlan = response.data;
      toast.success(
        `Updated Installment plan: '${updatedInstallmentPlan.name}' successfully`,
      );
    } catch (error) {
      notifyBackendError('Error updating installment plan', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteInstallmentPlan = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    try {
      const { id } = row.original;
      await apiClient.delete(`/installment-plans/${id}`);
      await refetchData(['installmentPlans']);

      toast.success(
        `Deleted Installment plan: '${row.original.name}' successfully`,
      );
    } catch (error) {
      notifyBackendError('Error deleting installment plan', error);
    } finally {
      setDeleting(false);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: installmentPlans,
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableEditing: true,
    enablePagination: false,
    initialState: {
      density: 'compact',
      sorting: [
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
        id: false,
        description: false,
        interestRate: false,
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
        {row.original.description && (
          <Typography>Description: {row.original.description}%</Typography>
        )}
        {row.original.interestRate && (
          <Typography>Interest Rate: {row.original.interestRate}%</Typography>
        )}
      </Box>
    ),
    onCreatingRowSave: async ({ table, values }) => {
      //validate data
      const newValidationErrors = validateInstallmentPlan(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      //save data to api
      setValidationErrors({});
      await createInstallmentPlan(values as InstallmentPlan);
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
        <DialogTitle>Create Installment Plan</DialogTitle>
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
      const newValidationErrors = validateInstallmentPlan(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      //save data to api
      setValidationErrors({});
      await updateInstallmentPlan(values as InstallmentPlan);
      table.setEditingRow(null); //exit editing mode
    },
    onEditingRowCancel: () => setValidationErrors({}),
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle>Edit Installment Plan</DialogTitle>
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
                  `Are you sure you want to delete '${row.original.name}' Installment Plan?`,
                )
              ) {
                await deleteInstallmentPlan(row);
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

export default InstallmentPlans;
