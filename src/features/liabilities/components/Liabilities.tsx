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
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useStaticData } from '../../../context/StaticDataContext';
import apiClient from '../../../services/ApiService';
import { Liability } from '../../../types/Liability';
import {
  formatCurrency,
  formatLiabilityStatus,
  formatLiabilityType,
  getCreditUtilizationColor,
  getDueDateColor,
  getLiabilityStatusOptions,
  getLiabilityTypeOptions,
  getOriginalLiabilityStatus,
  getOriginalLiabilityType,
  stringToColor,
} from '../../../utils/common';
import { calculateLiabilityDates } from '../../../utils/date';
import log from '../../../utils/logger';

const createPayload = (liability: Liability) => {
  const payload: any = {
    name: liability.name,
    type: getOriginalLiabilityType(liability.type),
    currency: liability.currency,
    amount: +liability.amount,
    balance: +liability.balance,
    dueDay: +liability.dueDay,
    status: getOriginalLiabilityStatus(liability.status),
  };

  if (liability.description) {
    payload.description = liability.description;
  }
  if (liability.interestRate) {
    payload.interestRate = liability.interestRate;
  }
  if (liability.statementDay) {
    payload.statementDay = +liability.statementDay;
  }
  return payload;
};

const Liabilities: React.FC = () => {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { currencies } = useStaticData();
  const currencyCodes = currencies?.map((currency) => currency.code) ?? [];
  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    // eslint-disable-next-line complexity
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
        editVariant: 'select',
        editSelectOptions: getLiabilityTypeOptions(),
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
        accessorKey: 'statementDay',
        header: 'Statement Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <Box component="span">
            {
              calculateLiabilityDates(
                new Date(),
                cell.row.original.dueDay,
                cell.row.original.statementDay,
              ).statementDate
            }
          </Box>
        ),
        muiEditTextFieldProps: {
          type: 'number',
          required: false,
          error: !!validationErrors?.statementDay,
          helperText: validationErrors?.statementDay,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              statementDay: undefined,
            }),
        },
      },
      {
        accessorKey: 'dueDay',
        header: 'Due Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => {
          const { dueDate } = calculateLiabilityDates(
            new Date(),
            cell.row.original.dueDay,
            cell.row.original.statementDay,
          );

          return (
            <Box
              component="span"
              sx={(theme) => ({
                color: getDueDateColor(dueDate, theme.palette.mode),
              })}
            >
              {dueDate}
            </Box>
          );
        },
        muiEditTextFieldProps: {
          type: 'number',
          required: true,
          error: !!validationErrors?.dueDay,
          helperText: validationErrors?.dueDay,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              dueDay: undefined,
            }),
        },
      },
      {
        accessorKey: 'interestRate',
        header: 'Interest Rate',
        muiEditTextFieldProps: {
          type: 'number',
          required: false,
          error: !!validationErrors?.interestRate,
          helperText: validationErrors?.interestRate,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              interestRate: undefined,
            }),
        },
      },
      {
        accessorKey: 'balance',
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
        muiEditTextFieldProps: {
          type: 'number',
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
      {
        header: 'Available',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <Box component="span">
            {formatCurrency(
              cell.row.original.amount - cell.row.original.balance,
              cell.row.original.currency,
            )}
          </Box>
        ),
        Edit: () => null,
      },
      {
        accessorKey: 'amount',
        header: 'Limit',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <Box component="span">
            {formatCurrency(
              cell.row.original.amount,
              cell.row.original.currency,
            )}
          </Box>
        ),
        muiEditTextFieldProps: {
          type: 'number',
          required: true,
          error: !!validationErrors?.amount,
          helperText: validationErrors?.amount,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              amount: undefined,
            }),
        },
      },
      {
        accessorFn: (row) => formatLiabilityStatus(row.status),
        accessorKey: 'status',
        header: 'Status',
        editVariant: 'select',
        editSelectOptions: getLiabilityStatusOptions(),
        muiEditTextFieldProps: {
          select: true,
          required: true,
          error: !!validationErrors?.status,
          helperText: validationErrors?.status,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              status: undefined,
            }),
        },
      },
    ],
    [validationErrors],
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

  // eslint-disable-next-line complexity
  const validateLiability = (liability: Record<LiteralUnion<string>, any>) => {
    const errors: Record<string, string | undefined> = {};
    if (!liability.name) {
      errors.name = 'Name is required';
    }
    if (!liability.type) {
      errors.type = 'Type is required';
    }
    if (!liability.currency) {
      errors.currency = 'Currency is required';
    }
    if (liability.statementDay) {
      if (+liability.statementDay < 1 || +liability.statementDay > 31) {
        errors.statementDay = 'Statement Day must be between 1 and 31';
      }
    }
    if (!liability.dueDay) {
      errors.dueDay = 'Due Day is required';
    } else if (+liability.dueDay < 1 || +liability.dueDay > 31) {
      errors.dueDay = 'Due Day must be between 1 and 31';
    }
    if (liability.interestRate) {
      if (+liability.interestRate <= 0) {
        errors.interestRate = 'Interest Rate should be positive';
      }
    }
    if (
      liability.balance === undefined ||
      liability.balance === null ||
      liability.balance === ''
    ) {
      errors.balance = 'Utilized is required';
    } else if (+liability.balance < 0) {
      errors.balance = 'Utilized should be non negative';
    }
    if (
      liability.amount === undefined ||
      liability.amount === null ||
      liability.amount === '' ||
      liability.amount === '0'
    ) {
      errors.amount = 'Limit is required';
    } else if (+liability.amount <= 0) {
      errors.amount = 'Limit should be positive';
    }
    if (liability.balance && liability.amount) {
      if (+liability.balance >= +liability.amount) {
        errors.balance = 'Utilized cannot be greater than Limit';
      }
    }
    if (!liability.status) {
      errors.status = 'Status is required';
    }
    return errors;
  };

  const createLiability = async (liability: Liability) => {
    setSaving(true);
    try {
      const payload = createPayload(liability);
      const response = await apiClient.post('/liabilities', payload);
      const newLiability = response.data;
      setLiabilities([...liabilities, newLiability]);
      toast.success(`Created Liability: '${newLiability.name}' successfully`);
    } catch (error) {
      log.error('Error creating liability:', error);
      toast.error('Error creating liability', { autoClose: false });
    } finally {
      setSaving(false);
    }
  };

  const updateLiability = async (liability: Liability) => {
    setUpdating(true);
    try {
      const { id } = liability;
      const payload = createPayload(liability);
      const response = await apiClient.put(`/liabilities/${id}`, payload);
      const updatedLiability = response.data;
      setLiabilities(
        liabilities.map((l) => (l.id === id ? updatedLiability : l)),
      );
      toast.success(
        `Updated Liability: '${updatedLiability.name}' successfully`,
      );
    } catch (error) {
      log.error('Error updating liability:', error);
      toast.error('Error updating liability', { autoClose: false });
    } finally {
      setUpdating(false);
    }
  };

  const deleteLiability = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    try {
      const { id } = row.original;
      await apiClient.delete(`/liabilities/${id}`);
      setLiabilities(liabilities.filter((l) => l.id !== id));
      toast.success(`Deleted Liability: '${row.original.name}' successfully`);
    } catch (error) {
      log.error('Error deleting liability:', error);
      toast.error('Error deleting liability', { autoClose: false });
    } finally {
      setDeleting(false);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: liabilities,
    enableStickyHeader: true,
    enableEditing: true,
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
        id: false,
        description: false,
        interestRate: false,
        status: false,
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
    onCreatingRowSave: async ({ table, values }) => {
      //validate data
      const newValidationErrors = validateLiability(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      //save data to api
      setValidationErrors({});
      await createLiability(values as Liability);
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
        <DialogTitle>Create New Liability</DialogTitle>
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
      const newValidationErrors = validateLiability(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      //save data to api
      setValidationErrors({});
      await updateLiability(values as Liability);
      table.setEditingRow(null); //exit editing mode
    },
    onEditingRowCancel: () => setValidationErrors({}),
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle>Edit Liability</DialogTitle>
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
                await deleteLiability(row);
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

export default Liabilities;
