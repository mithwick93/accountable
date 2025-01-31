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
  Typography,
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
import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useData } from '../../../context/DataContext';
import { useStaticData } from '../../../context/StaticDataContext';
import apiClient from '../../../services/ApiService';
import { Asset } from '../../../types/Asset';
import {
  formatAssetType,
  formatCurrency,
  getOriginalAssetType,
  stringToColor,
} from '../../../utils/common';
import { notifyBackendError } from '../../../utils/notifications';

const Assets: React.FC = () => {
  const { assets, refetchData, loading: dataLoading } = useData();
  const { currencies, loading: staticDataLoading } = useStaticData();

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loading = dataLoading || staticDataLoading;
  const currencyCodes = currencies?.map((currency) => currency.code) ?? [];
  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
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
        accessorKey: 'description',
        header: 'Description',
        muiEditTextFieldProps: {
          required: true,
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
        accessorFn: (row) => formatAssetType(row.type),
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
        editVariant: 'select',
        editSelectOptions: ['Investment', 'Saving Account'],
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
        accessorKey: 'active',
        header: 'Status',
        Cell: ({ cell }) => {
          const label = cell.getValue() ? 'Active' : 'Inactive';
          return (
            <Chip
              label={label}
              sx={(theme) => ({
                backgroundColor: stringToColor(
                  label,
                  theme.palette.mode === 'dark',
                ),
              })}
            />
          );
        },
        editVariant: 'select',
        editSelectOptions: [
          { label: 'Active', value: true },
          { label: 'Inactive', value: false },
        ],
        muiEditTextFieldProps: {
          required: true,
          select: true,
          error: !!validationErrors?.active,
          helperText: validationErrors?.active,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              active: undefined,
            }),
        },
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
        visibleInShowHideMenu: false,
      },
      {
        accessorFn: (row) => row.balance,
        accessorKey: 'balance',
        header: 'Balance',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <Box component="span">
            {formatCurrency(
              cell.row.original.balance,
              cell.row.original.currency,
            )}
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
          error: !!validationErrors?.balance,
          helperText: validationErrors?.balance,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              balance: undefined,
            }),
        },
      },
    ],
    [validationErrors],
  );

  const validateAsset = (asset: Record<LiteralUnion<string>, any>) => {
    const errors: Record<string, string | undefined> = {};
    if (!asset.name) {
      errors.name = 'Name is required';
    }
    if (!asset.description) {
      errors.description = 'Description is required';
    }
    if (!asset.type) {
      errors.type = 'Type is required';
    }
    if (!asset.currency) {
      errors.currency = 'Currency is required';
    }
    if (
      asset.balance === undefined ||
      asset.balance === null ||
      asset.balance === ''
    ) {
      errors.balance = 'Balance is required';
    }

    if (
      asset.active === undefined ||
      asset.active === null ||
      asset.active === ''
    ) {
      errors.active = 'Status is required';
    }

    return errors;
  };

  const createAsset = async (asset: Asset) => {
    setSaving(true);
    try {
      const response = await apiClient.post('/assets', {
        name: asset.name,
        description: asset.description,
        type: getOriginalAssetType(asset.type),
        currency: asset.currency,
        balance: +asset.balance,
        active: asset.active,
      });
      await refetchData(['assets']);

      const newAsset = response.data;
      toast.success(`Created Asset: '${newAsset.name}' successfully`);
    } catch (error) {
      notifyBackendError('Error creating asset', error);
    } finally {
      setSaving(false);
    }
  };

  const updateAsset = async (asset: Asset) => {
    setUpdating(true);
    try {
      const { id } = asset;
      const response = await apiClient.put(`/assets/${id}`, {
        name: asset.name,
        description: asset.description,
        type: getOriginalAssetType(asset.type),
        currency: asset.currency,
        balance: +asset.balance,
        active: asset.active,
      });
      await refetchData(['assets']);

      const updatedAsset = response.data;
      toast.success(`Updated Asset: '${updatedAsset.name}' successfully`);
    } catch (error) {
      notifyBackendError('Error updating asset', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteAsset = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    try {
      const { id } = row.original;
      await apiClient.delete(`/assets/${id}`);
      await refetchData(['assets']);

      toast.success(`Deleted Asset: '${row.original.name}' successfully`);
    } catch (error) {
      notifyBackendError('Error deleting asset', error);
    } finally {
      setDeleting(false);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: assets,
    enableStickyHeader: true,
    enableStickyFooter: true,
    enableEditing: true,
    initialState: {
      density: 'compact',
      sorting: [
        {
          id: 'type',
          desc: true,
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
        id: false,
        description: false,
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
        maxHeight: '500px',
        overflowY: 'auto',
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
    onCreatingRowSave: async ({ table, values }) => {
      //validate data
      const newValidationErrors = validateAsset(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      //save data to api
      setValidationErrors({});
      await createAsset(values as Asset);
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
        <DialogTitle>Create New Asset</DialogTitle>
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
      const newValidationErrors = validateAsset(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      //save data to api
      setValidationErrors({});
      await updateAsset(values as Asset);
      table.setEditingRow(null); //exit editing mode
    },
    onEditingRowCancel: () => setValidationErrors({}),
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle>Edit Asset</DialogTitle>
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
                  `Are you sure you want to delete '${row.original.name}' Asset?`,
                )
              ) {
                await deleteAsset(row);
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

export default Assets;
