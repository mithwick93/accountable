import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DropdownOption,
  MaterialReactTable,
  type MRT_ColumnDef,
  MRT_EditActionButtons,
  MRT_Row,
  type MRT_RowData,
  useMaterialReactTable,
} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useData } from '../../../context/DataContext';
import { useStaticData } from '../../../context/StaticDataContext';
import apiClient from '../../../services/ApiService';
import { Asset } from '../../../types/Asset';
import { Liability } from '../../../types/Liability';
import { PaymentSystemCredit } from '../../../types/PaymentSystemCredit';
import { PaymentSystemDebit } from '../../../types/PaymentSystemDebit';
import { notSelectedOption, stringToColor } from '../../../utils/common';
import log from '../../../utils/logger';
import { notifyBackendError } from '../../../utils/notifications';

const PaymentSystems: React.FC = () => {
  const { assets, liabilities, paymentSystems, refetchData, loading } =
    useData();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [assetsOptions, setAssetsOptions] = useState<DropdownOption[]>([]);
  const [liabilitiesOptions, setLiabilitiesOptions] = useState<
    DropdownOption[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { currencies } = useStaticData();
  const currencyCodes = currencies?.map((currency) => currency.code) ?? [];

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        Edit: () => null,
      },
      {
        accessorKey: 'currency',
        header: 'Currency',
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
        accessorKey: 'type',
        header: 'Type',
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        size: 50,
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
        editSelectOptions: ['Credit', 'Debit'],
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
        accessorFn: (row) => row.asset?.id,
        accessorKey: 'assetId',
        header: 'Asset',
        editVariant: 'select',
        editSelectOptions: assetsOptions,
        muiEditTextFieldProps: {
          select: true,
          required: false,
          error: !!validationErrors?.asset,
          helperText: validationErrors?.asset,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              asset: undefined,
            }),
        },
      },
      {
        accessorFn: (row) => row.liability?.id,
        accessorKey: 'liabilityId',
        header: 'Liability',
        editVariant: 'select',
        editSelectOptions: liabilitiesOptions,
        muiEditTextFieldProps: {
          select: true,
          required: false,
          error: !!validationErrors?.liability,
          helperText: validationErrors?.liability,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              liability: undefined,
            }),
        },
      },
    ],
    [validationErrors],
  );

  useEffect(() => {
    const fetchPaymentSystems = () => {
      try {
        const assetsData = assets.map((item: Asset) => ({
          value: item.id,
          label: item.name,
        }));
        const liabilitiesData = liabilities.map((item: Liability) => ({
          value: item.id,
          label: item.name,
        }));
        setAssetsOptions([notSelectedOption, ...assetsData]);
        setLiabilitiesOptions([notSelectedOption, ...liabilitiesData]);
      } catch (error) {
        log.error('Error fetching asset and liability options:', error);
      }
    };

    fetchPaymentSystems();
  }, [assets, liabilities]);

  const validatePaymentSystem = (paymentSystem: Record<string, any>) => {
    const errors: Record<string, string | undefined> = {};
    if (!paymentSystem.name) {
      errors.name = 'Name is required';
    }
    if (!paymentSystem.type) {
      errors.type = 'Type is required';
    }
    if (!paymentSystem.currency) {
      errors.currency = 'Currency is required';
    }
    if (paymentSystem.id) {
      const existingPaymentSystemType = paymentSystems.find(
        (ps) => ps.id === paymentSystem.id,
      )?.type;
      if (existingPaymentSystemType !== paymentSystem.type) {
        errors.type = 'Type cannot be changed';
      }
    }
    if (
      paymentSystem.type === 'Debit' &&
      (!paymentSystem.assetId ||
        paymentSystem.assetId === notSelectedOption.value)
    ) {
      errors.asset = 'Asset is required';
    }

    if (
      paymentSystem.type === 'Credit' &&
      (!paymentSystem.liabilityId ||
        paymentSystem.liabilityId === notSelectedOption.value)
    ) {
      errors.liability = 'Liability is required';
    }

    if (
      paymentSystem.type === 'Credit' &&
      paymentSystem.assetId &&
      paymentSystem.assetId !== notSelectedOption.value
    ) {
      errors.asset = 'Asset is not required for Credit payment system';
    }

    if (
      paymentSystem.type === 'Debit' &&
      paymentSystem.liabilityId &&
      paymentSystem.liabilityId !== notSelectedOption.value
    ) {
      errors.liability = 'Liability is not required for Debit payment system';
    }

    return errors;
  };

  const createPaymentSystem = async (paymentSystem: any) => {
    setSaving(true);
    const { type } = paymentSystem;
    try {
      if (type === 'Debit') {
        const response = await apiClient.post('/payment-systems/debits', {
          name: paymentSystem.name,
          currency: paymentSystem.currency,
          assetId: paymentSystem.assetId,
        });
        await refetchData(['paymentSystems']);

        const newPaymentSystem = response.data;
        toast.success(
          `Payment system: '${newPaymentSystem.name}' created successfully`,
        );
        return;
      } else if (type === 'Credit') {
        const response = await apiClient.post('/payment-systems/credits', {
          name: paymentSystem.name,
          currency: paymentSystem.currency,
          liabilityId: paymentSystem.liabilityId,
        });
        await refetchData(['paymentSystems']);

        const newPaymentSystem = response.data;
        toast.success(
          `Payment system: '${newPaymentSystem.name}' created successfully`,
        );
        return;
      }
    } catch (error) {
      notifyBackendError('Error creating payment system', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentSystem = async (paymentSystem: any) => {
    setUpdating(true);
    const { id, type } = paymentSystem;
    try {
      if (type === 'Debit') {
        const response = await apiClient.put(`/payment-systems/debits/${id}`, {
          name: paymentSystem.name,
          currency: paymentSystem.currency,
          assetId: paymentSystem.assetId,
        });
        await refetchData(['paymentSystems']);

        const updatedPaymentSystem = response.data;
        toast.success(
          `Payment system: '${updatedPaymentSystem.name}' updated successfully`,
        );
        return;
      } else if (type === 'Credit') {
        const response = await apiClient.put(`/payment-systems/credits/${id}`, {
          name: paymentSystem.name,
          currency: paymentSystem.currency,
          liabilityId: paymentSystem.liabilityId,
        });
        await refetchData(['paymentSystems']);

        const updatedPaymentSystem = response.data;
        toast.success(
          `Payment system: '${updatedPaymentSystem.name}' updated successfully`,
        );
        return;
      }
    } catch (error) {
      log.error('Error updating payment system: ', error);
      notifyBackendError('Error updating payment system', error);
    } finally {
      setUpdating(false);
    }
  };

  const deletePaymentSystem = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    const { id, type } = row.original;
    try {
      if (type === 'Debit') {
        await apiClient.delete(`/payment-systems/debits/${id}`);
      } else if (type === 'Credit') {
        await apiClient.delete(`/payment-systems/credits/${id}`);
      }
      await refetchData(['paymentSystems']);

      toast.success(`Payment system: '${row.original.name}' deleted`);
    } catch (error) {
      notifyBackendError('Error deleting payment system', error);
    } finally {
      setDeleting(false);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: paymentSystems,
    enableStickyHeader: true,
    enableEditing: true,
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
      columnVisibility: {
        id: false,
        assetId: false,
        liabilityId: false,
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
        {row.original.type === 'Debit' && (
          <Typography>Asset: {row.original.asset.name}</Typography>
        )}
        {row.original.type === 'Credit' && (
          <Typography>Liability: {row.original.liability.name}</Typography>
        )}
      </Box>
    ),
    onCreatingRowSave: async ({ table, values }) => {
      const newValidationErrors = validatePaymentSystem(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }
      setValidationErrors({});
      await createPaymentSystem(values);
      table.setCreatingRow(null);
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
        <DialogTitle>Create New Payment System</DialogTitle>
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
      const newValidationErrors = validatePaymentSystem(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }
      setValidationErrors({});
      await updatePaymentSystem(
        values as PaymentSystemCredit | PaymentSystemDebit,
      );
      table.setEditingRow(null);
    },
    onEditingRowCancel: () => setValidationErrors({}),
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle>Edit Payment System</DialogTitle>
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
                  `Are you sure you want to delete '${row.original.name}' payment system?`,
                )
              ) {
                await deletePaymentSystem(row);
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

export default PaymentSystems;
