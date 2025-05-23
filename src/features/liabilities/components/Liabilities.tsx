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
import { Liability } from '../../../types/Liability';
import {
  formatLiabilityStatus,
  formatLiabilityType,
  formatNumber,
  getCreditUtilizationColor,
  getDueDateColor,
  getLiabilityStatusOptions,
  getLiabilityTypeOptions,
  getOriginalLiabilityStatus,
  getOriginalLiabilityType,
  stringToColor,
} from '../../../utils/common';
import { calculateLiabilityDates } from '../../../utils/date';
import { notifyBackendError } from '../../../utils/notifications';

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
  const { liabilities, refetchData, loading: dataLoading } = useData();
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

  const liabilityCurrencies = useMemo(
    () =>
      Array.from(new Set(liabilities.map((asset) => asset.currency))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [liabilities],
  );

  const {
    totalUtilizedByCurrency,
    totalAvailableByCurrency,
    totalLimitByCurrency,
  } = useMemo(() => {
    const totals = liabilities.reduce(
      (acc, liability) => {
        const { currency, balance, amount } = liability;

        if (!acc[currency]) {
          acc[currency] = { utilized: 0, available: 0, limit: 0 };
        }

        acc[currency].utilized += balance;
        acc[currency].available += amount - balance;
        acc[currency].limit += amount;

        return acc;
      },
      {} as Record<
        string,
        { utilized: number; available: number; limit: number }
      >,
    );

    const sortedEntries = Object.entries(totals).sort(
      ([currencyA], [currencyB]) => currencyA.localeCompare(currencyB),
    );

    return {
      totalUtilizedByCurrency: Object.fromEntries(
        sortedEntries.map(([currency, values]) => [currency, values.utilized]),
      ),
      totalAvailableByCurrency: Object.fromEntries(
        sortedEntries.map(([currency, values]) => [currency, values.available]),
      ),
      totalLimitByCurrency: Object.fromEntries(
        sortedEntries.map(([currency, values]) => [currency, values.limit]),
      ),
    };
  }, [liabilities]);

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
        accessorFn: (row) => formatLiabilityType(row.type),
        accessorKey: 'type',
        header: 'Type',
        minSize: 130,
        size: 130,
        maxSize: 130,
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
        accessorFn: (row) => formatLiabilityStatus(row.status),
        accessorKey: 'status',
        header: 'Status',
        minSize: 100,
        size: 100,
        maxSize: 100,
        Cell: ({ cell }) => {
          const label = cell.getValue() as string;
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
      {
        accessorKey: 'statementDay',
        header: 'Statement Date',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        minSize: 150,
        size: 150,
        maxSize: 150,
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
          slotProps: {
            htmlInput: {
              min: 1,
              max: 31,
            },
          },
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
        minSize: 150,
        size: 150,
        maxSize: 150,
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
          slotProps: {
            htmlInput: {
              min: 1,
              max: 31,
            },
          },
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
        Footer: () => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {liabilityCurrencies.map((currency) => (
              <Typography
                key={currency}
                variant="caption"
                sx={{ fontWeight: 'bold' }}
              >
                {currency}
              </Typography>
            ))}
          </Box>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Utilized',
        minSize: 120,
        size: 120,
        maxSize: 120,
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
              {formatNumber(utilized)}
            </Box>
          );
        },
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
        Footer: () => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {Object.entries(totalUtilizedByCurrency).map(
              ([currency, total]) => (
                <Typography
                  key={currency}
                  variant="caption"
                  sx={{ fontWeight: 'bold' }}
                >
                  {formatNumber(total)}
                </Typography>
              ),
            )}
          </Box>
        ),
      },
      {
        header: 'Available',
        minSize: 120,
        size: 120,
        maxSize: 120,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <Box component="span">
            {formatNumber(cell.row.original.amount - cell.row.original.balance)}
          </Box>
        ),
        Edit: () => null,
        Footer: () => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {Object.entries(totalAvailableByCurrency).map(
              ([currency, total]) => (
                <Typography
                  key={currency}
                  variant="caption"
                  sx={{ fontWeight: 'bold' }}
                >
                  {formatNumber(total)}
                </Typography>
              ),
            )}
          </Box>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Limit',
        minSize: 120,
        size: 120,
        maxSize: 120,
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <Box component="span">{formatNumber(cell.row.original.amount)}</Box>
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
        Footer: () => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {Object.entries(totalLimitByCurrency).map(([currency, total]) => (
              <Typography
                key={currency}
                variant="caption"
                sx={{ fontWeight: 'bold' }}
              >
                {formatNumber(total)}
              </Typography>
            ))}
          </Box>
        ),
      },
    ],
    [
      validationErrors,
      currencyCodes,
      liabilityCurrencies,
      totalUtilizedByCurrency,
      totalAvailableByCurrency,
      totalLimitByCurrency,
    ],
  );

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
      await refetchData(['liabilities', 'paymentSystems']);

      const newLiability = response.data;
      toast.success(`Created Liability: '${newLiability.name}' successfully`);
    } catch (error) {
      notifyBackendError('Error creating liability', error);
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
      await refetchData(['liabilities', 'paymentSystems']);

      const updatedLiability = response.data;
      toast.success(
        `Updated Liability: '${updatedLiability.name}' successfully`,
      );
    } catch (error) {
      notifyBackendError('Error updating liability', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteLiability = async (row: MRT_Row<MRT_RowData>) => {
    setDeleting(true);
    try {
      const { id } = row.original;
      await apiClient.delete(`/liabilities/${id}`);
      await refetchData(['liabilities', 'paymentSystems']);

      toast.success(`Deleted Liability: '${row.original.name}' successfully`);
    } catch (error) {
      notifyBackendError('Error deleting liability', error);
    } finally {
      setDeleting(false);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: liabilities,
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
          id: 'type',
          desc: false,
        },

        {
          id: 'name',
          desc: false,
        },
      ],
      columnVisibility: {
        status: false,
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
          <Typography>Description: {row.original.description}</Typography>
        )}
        {row.original.interestRate && (
          <Typography>Interest Rate: {row.original.interestRate}%</Typography>
        )}
      </Box>
    ),
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
