import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  DialogActions,
  DialogContent,
  FormHelperText,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useSettings } from '../../context/SettingsContext';
import { useStaticData } from '../../context/StaticDataContext';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/ApiService';
import { Asset } from '../../types/Asset';
import { Liability } from '../../types/Liability';
import { PaymentSystem } from '../../types/PaymentSystem';
import { PaymentSystemCredit } from '../../types/PaymentSystemCredit';
import { PaymentSystemDebit } from '../../types/PaymentSystemDebit';
import { SharedTransaction } from '../../types/SharedTransaction';
import { TransactionCategory } from '../../types/TransactionCategory';
import { User } from '../../types/User';
import log from '../../utils/logger';
import SlideUpTransition from '../transition/SlideUpTransition';

interface CreateTransactionDialogProps {
  open: boolean;
  onClose: () => void;
}

type FormStateType = {
  updateAccounts: boolean;
  type?: string;
  name?: string;
  description?: string;
  categoryId?: number;
  currency?: string;
  amount?: number;
  date?: string;
  toAssetId?: number;
  fromAssetId?: number;
  fromPaymentSystemId?: number;
  toLiabilityId?: number;
};

const CreateTransactionDialog = ({
  onClose,
  open,
}: CreateTransactionDialogProps) => {
  const { settings, update } = useSettings();
  const { currencies } = useStaticData();
  const { loggedInUser, users } = useUser();
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const baseCurrency = settings?.currency || 'USD';
  const updateAccounts = settings?.transactions.updateAccounts ?? false;
  const initialFormValues: FormStateType = {
    type: 'EXPENSE',
    updateAccounts: updateAccounts,
    currency: baseCurrency,
    date: new Date().toISOString().split('T')[0],
  };

  const [formValues, setFormValues] =
    useState<FormStateType>(initialFormValues);
  const [sharedTransactions, setSharedTransactions] = useState<
    SharedTransaction[]
  >([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [
    sharedTransactionValidationErrors,
    setSharedTransactionValidationErrors,
  ] = useState<Record<string, string | undefined>[]>([]);
  const [data, setData] = useState<
    | {
        assets: Asset[];
        liabilities: Liability[];
        paymentSystems: (PaymentSystemCredit | PaymentSystemDebit)[];
        categories: TransactionCategory[];
      }
    | undefined
  >();

  const userOptions = users ?? [];
  const assets = data?.assets ?? [];
  const liabilities = data?.liabilities ?? [];
  const paymentSystems = data?.paymentSystems ?? [];
  const categoryOptions =
    data?.categories.filter((category) => category.type === formValues.type) ??
    [];
  const currencyCodes = currencies?.map((currency) => currency.code) ?? [];
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const enableDivideEvenly =
    formValues.type === 'EXPENSE' &&
    sharedTransactions.length > 1 &&
    formValues.amount &&
    formValues.amount > 0;

  useEffect(() => {
    if (!open) {
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          assetsResponse,
          liabilitiesResponse,
          creditsResponse,
          debitsResponse,
          categoriesResponse,
        ] = await Promise.all([
          apiClient.get('/assets'),
          apiClient.get('/liabilities'),
          apiClient.get('/payment-systems/credits'),
          apiClient.get('/payment-systems/debits'),
          apiClient.get('/transactions/categories'),
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

        const categories = categoriesResponse.data.sort(
          (a: TransactionCategory, b: TransactionCategory) =>
            a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
        );

        setData({
          assets: assetsResponse.data,
          liabilities: liabilitiesResponse.data,
          paymentSystems: [...creditsData, ...debitsData],
          categories,
        });
      } catch (error) {
        log.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === 'type') {
      setFormValues({
        ...formValues,
        [name]: value,
        toAssetId: initialFormValues.toAssetId,
        fromAssetId: initialFormValues.fromAssetId,
        fromPaymentSystemId: initialFormValues.fromPaymentSystemId,
        toLiabilityId: initialFormValues.toLiabilityId,
        categoryId: initialFormValues.categoryId,
      });
    } else if (name === 'amount') {
      setFormValues({
        ...formValues,
        // @ts-expect-error value is always a number or undefined
        [name]: value ? parseFloat(value) : value,
      });
    } else {
      setFormValues({
        ...formValues,
        [name]: value,
      });
    }
  };

  const handleAutoCompleteChange = (
    key: string,
    value: number | string | undefined | null,
  ) => {
    setFormValues({
      ...formValues,
      [key]: value,
    });
  };

  const handleAddSharedTransaction = () => {
    setSharedTransactions([
      ...sharedTransactions,
      { userId: '', share: 0, paidAmount: 0, isSettled: false },
    ]);
  };

  const handleRemoveSharedTransaction = (index: number) => {
    setSharedTransactions(sharedTransactions.filter((_, i) => i !== index));
  };

  const handleSharedTransactionChange = (
    index: number,
    field: keyof SharedTransaction,
    value: any,
  ) => {
    const updatedTransactions = [...sharedTransactions];
    // @ts-expect-error ignore
    updatedTransactions[index][field] = value;
    setSharedTransactions(updatedTransactions);
  };

  const handleDivideEvenly = () => {
    const totalAmount = formValues.amount || 0;
    const share = totalAmount / (sharedTransactions.length || 1);
    const updatedTransactions = sharedTransactions.map((transaction) => ({
      ...transaction,
      share,
    }));

    setSharedTransactions(updatedTransactions);
  };

  const handleSave = async () => {
    const isFormValid = validateForm();
    const areSharedTransactionsValid = validateSharedTransactions();
    if (isFormValid && areSharedTransactionsValid) {
      try {
        await apiClient.post('/transactions', getRequestPayload());
        toast.success('Transaction created successfully');
        handleClose();
        // TODO: switch to context based updating
      } catch (error) {
        log.error('Error creating transaction:', error);
        toast.error('Error creating transaction', { autoClose: false });
      }
    }
  };

  const handleClose = () => {
    setFormValues(initialFormValues);
    setSharedTransactions([]);
    setValidationErrors({});
    setSharedTransactionValidationErrors([]);
    onClose();
  };

  const handleFocus = (field: string) => {
    setValidationErrors({
      ...validationErrors,
      [field]: undefined,
    });
  };

  const handleSharedTransactionFocus = (
    index: number,
    field: keyof SharedTransaction,
  ) => {
    const updatedErrors = [...sharedTransactionValidationErrors];
    if (updatedErrors[index]) {
      updatedErrors[index][field] = undefined;
    }
    setSharedTransactionValidationErrors(updatedErrors);
  };

  const validateForm = () => {
    const errors: Record<string, string | undefined> = {};

    if (!formValues.type) {
      errors.type = 'Type is required';
    } else {
      if (!formValues.name) {
        errors.name = 'Name is required';
      }

      if (!formValues.categoryId) {
        errors.categoryId = 'Category is required';
      }

      if (!formValues.currency) {
        errors.currency = 'Currency is required';
      }

      if (!formValues.amount) {
        errors.amount = 'Amount is required';
      }

      if (!formValues.date) {
        errors.date = 'Date is required';
      }

      if (formValues.type === 'INCOME' && !formValues.toAssetId) {
        errors.toAssetId = 'To Asset is required';
      }

      if (formValues.type === 'EXPENSE' && !formValues.fromPaymentSystemId) {
        errors.fromPaymentSystemId = 'From Payment System is required';
      }

      if (formValues.type === 'TRANSFER') {
        if (!formValues.fromAssetId) {
          errors.fromAssetId = 'From Asset is required';
        }

        if (
          formValues.fromAssetId &&
          formValues.toAssetId &&
          formValues.fromAssetId === formValues.toAssetId
        ) {
          errors.fromAssetId = 'From Asset and To Asset cannot be the same';
          errors.toAssetId = 'From Asset and To Asset cannot be the same';
        }

        if (!formValues.toAssetId && !formValues.toLiabilityId) {
          errors.toAssetId = 'To Asset or To Liability is required';
          errors.toLiabilityId = 'To Asset or To Liability is required';
        }

        if (formValues.toAssetId && formValues.toLiabilityId) {
          errors.toAssetId = 'Cannot have both To Asset and To Liability';
          errors.toLiabilityId = 'Cannot have both To Asset and To Liability';
        }
      }
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateSharedTransactions = () => {
    const errors: Record<string, string | undefined>[] = [];

    sharedTransactions.forEach((transaction, index) => {
      const transactionErrors: Record<string, string | undefined> = {};

      if (!transaction.userId || transaction.userId === '') {
        transactionErrors.userId = 'User is required';
      }

      if (transaction.share <= 0) {
        transactionErrors.share = 'Share must be greater than 0';
      }

      if (transaction.paidAmount < 0) {
        transactionErrors.paidAmount = 'Paid Amount cannot be negative';
      }

      errors[index] = transactionErrors;
    });

    setSharedTransactionValidationErrors(errors);

    return errors.every((error) => Object.keys(error).length === 0);
  };

  const getRequestPayload = () => {
    const payload: any = {
      updateAccounts: formValues.updateAccounts,
      type: formValues.type,
      name: formValues.name,
      description: formValues.description,
      categoryId: formValues.categoryId,
      currency: formValues.currency,
      amount: formValues.amount,
      date: formValues.date,
      userId: loggedInUser?.sub,
      sharedTransactions: [],
    };

    if (formValues.type === 'INCOME') {
      payload.toAssetId = formValues.toAssetId;
    } else if (formValues.type === 'EXPENSE') {
      payload.fromPaymentSystemId = formValues.fromPaymentSystemId;
    } else if (formValues.type === 'TRANSFER') {
      payload.fromAssetId = formValues.fromAssetId;

      if (formValues.toAssetId) {
        payload.toAssetId = formValues.toAssetId;
      } else {
        payload.toLiabilityId = formValues.toLiabilityId;
      }
    }

    if (sharedTransactions.length > 0) {
      payload.sharedTransactions = sharedTransactions.map((transaction) => ({
        userId: transaction.userId,
        share: transaction.share,
        paidAmount: transaction.paidAmount,
        isSettled: transaction.isSettled,
      }));
    }

    return payload;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex' }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <>
        <FormControl required error={!!validationErrors?.type}>
          <FormLabel id="controlled-radio-buttons-group">Type</FormLabel>
          <RadioGroup
            value={formValues.type}
            row={!smallScreen}
            aria-labelledby="controlled-radio-buttons-group"
            name="type"
            onChange={handleInputChange}
            onFocus={() => handleFocus('type')}
          >
            <FormControlLabel
              value="EXPENSE"
              control={<Radio />}
              label="Expense"
            />
            <FormControlLabel
              value="INCOME"
              control={<Radio />}
              label="Income"
            />
            <FormControlLabel
              value="TRANSFER"
              control={<Radio />}
              label="Transfer"
            />
          </RadioGroup>
          <FormHelperText>{validationErrors?.type}</FormHelperText>
        </FormControl>
        {formValues.type && (
          <>
            <TextField
              label="Name"
              name="name"
              type="text"
              required
              onChange={handleInputChange}
              error={!!validationErrors?.name}
              helperText={validationErrors?.name}
              onFocus={() => handleFocus('name')}
            />
            <TextField
              label="Description"
              name="description"
              type="text"
              onChange={handleInputChange}
              error={!!validationErrors?.description}
              helperText={validationErrors?.description}
              onFocus={() => handleFocus('description')}
            />
            <Autocomplete
              options={categoryOptions}
              autoComplete
              autoHighlight
              autoSelect
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  required
                  error={!!validationErrors?.categoryId}
                  helperText={validationErrors?.categoryId}
                />
              )}
              onChange={(_event: any, newValue: TransactionCategory | null) => {
                handleAutoCompleteChange('categoryId', newValue?.id);
              }}
              onFocus={() => handleFocus('categoryId')}
            />
            <Autocomplete
              value={formValues.currency}
              options={currencyCodes}
              autoComplete
              autoHighlight
              autoSelect
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Currency"
                  required
                  error={!!validationErrors?.currency}
                  helperText={validationErrors?.currency}
                />
              )}
              onChange={(_event: any, newValue: string | null) => {
                handleAutoCompleteChange('currency', newValue);
              }}
              onFocus={() => handleFocus('currency')}
            />
            <TextField
              label="Amount"
              name="amount"
              type="number"
              required
              onChange={handleInputChange}
              error={!!validationErrors?.amount}
              helperText={validationErrors?.amount}
              onFocus={() => handleFocus('amount')}
              slotProps={{
                htmlInput: {
                  min: 0,
                },
              }}
            />
            <TextField
              value={formValues.date}
              label="Date"
              name="date"
              type="date"
              required
              onChange={handleInputChange}
              error={!!validationErrors?.date}
              helperText={validationErrors?.date}
              onFocus={() => handleFocus('date')}
            />
            {formValues.type === 'INCOME' && (
              <Autocomplete
                options={assets}
                autoComplete
                autoHighlight
                autoSelect
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="To Asset"
                    required
                    error={!!validationErrors?.toAssetId}
                    helperText={validationErrors?.toAssetId}
                  />
                )}
                onChange={(_event: any, newValue: Asset | null) => {
                  handleAutoCompleteChange('toAssetId', newValue?.id);
                }}
                onFocus={() => handleFocus('toAssetId')}
              />
            )}
            {formValues.type === 'EXPENSE' && (
              <>
                <Autocomplete
                  options={paymentSystems}
                  autoComplete
                  autoHighlight
                  autoSelect
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="From Payment System"
                      required
                      error={!!validationErrors?.fromPaymentSystemId}
                      helperText={validationErrors?.fromPaymentSystemId}
                    />
                  )}
                  onChange={(_event: any, newValue: PaymentSystem | null) => {
                    handleAutoCompleteChange(
                      'fromPaymentSystemId',
                      newValue?.id,
                    );
                  }}
                  onFocus={() => handleFocus('fromPaymentSystemId')}
                />
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="subtitle1">
                      Shared Transactions
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex-end',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Tooltip title="Divide evenly">
                        <span>
                          <IconButton
                            onClick={handleDivideEvenly}
                            disabled={!enableDivideEvenly}
                          >
                            <CalculateIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Add shared trsnaction">
                        <span>
                          <IconButton
                            onClick={handleAddSharedTransaction}
                            disabled={!formValues.amount}
                          >
                            <AddIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                  {sharedTransactions.map((transaction, index) => (
                    <Box
                      key={index}
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="flex-start"
                      gap={2}
                      flexDirection={smallScreen ? 'column' : 'row'}
                    >
                      <Autocomplete
                        options={userOptions.filter(
                          (user) =>
                            !sharedTransactions.some(
                              (t) => t.userId === user.id,
                            ),
                        )}
                        autoComplete
                        autoHighlight
                        autoSelect
                        getOptionLabel={(option) =>
                          `${option.firstName} ${option.lastName}`
                        }
                        sx={{ width: '50%' }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="User"
                            required
                            error={
                              !!sharedTransactionValidationErrors[index]?.userId
                            }
                            helperText={
                              sharedTransactionValidationErrors[index]?.userId
                            }
                            onFocus={() =>
                              handleSharedTransactionFocus(index, 'userId')
                            }
                          />
                        )}
                        onChange={(_event: any, newValue: User | null) => {
                          handleSharedTransactionChange(
                            index,
                            'userId',
                            newValue?.id || '',
                          );
                        }}
                      />
                      <TextField
                        label="Share"
                        type="number"
                        value={transaction.share}
                        required
                        error={
                          !!sharedTransactionValidationErrors[index]?.share
                        }
                        helperText={
                          sharedTransactionValidationErrors[index]?.share
                        }
                        onFocus={() =>
                          handleSharedTransactionFocus(index, 'share')
                        }
                        onChange={(e) =>
                          handleSharedTransactionChange(
                            index,
                            'share',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        slotProps={{
                          htmlInput: {
                            min: 0,
                          },
                        }}
                      />
                      <TextField
                        label="Paid Amount"
                        type="number"
                        value={transaction.paidAmount}
                        required
                        error={
                          !!sharedTransactionValidationErrors[index]?.paidAmount
                        }
                        helperText={
                          sharedTransactionValidationErrors[index]?.paidAmount
                        }
                        onFocus={() =>
                          handleSharedTransactionFocus(index, 'paidAmount')
                        }
                        onChange={(e) =>
                          handleSharedTransactionChange(
                            index,
                            'paidAmount',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        slotProps={{
                          htmlInput: {
                            min: 0,
                          },
                        }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={transaction.isSettled}
                            onChange={(e) =>
                              handleSharedTransactionChange(
                                index,
                                'isSettled',
                                e.target.checked,
                              )
                            }
                          />
                        }
                        label="Settled"
                      />
                      <IconButton
                        onClick={() => handleRemoveSharedTransaction(index)}
                        sx={{ backgroundColor: theme.palette.error.main }}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
            {formValues.type === 'TRANSFER' && (
              <>
                <Autocomplete
                  options={assets.filter(
                    (asset) => asset.id !== formValues.toAssetId,
                  )}
                  autoComplete
                  autoHighlight
                  autoSelect
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="From Asset"
                      required
                      error={!!validationErrors?.fromAssetId}
                      helperText={validationErrors?.fromAssetId}
                    />
                  )}
                  onChange={(_event: any, newValue: Asset | null) => {
                    handleAutoCompleteChange('fromAssetId', newValue?.id);
                  }}
                  onFocus={() => handleFocus('fromAssetId')}
                />
                <Autocomplete
                  options={assets.filter(
                    (asset) => asset.id !== formValues.fromAssetId,
                  )}
                  autoComplete
                  autoHighlight
                  autoSelect
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="To Asset"
                      required
                      error={!!validationErrors?.toAssetId}
                      helperText={validationErrors?.toAssetId}
                    />
                  )}
                  onChange={(_event: any, newValue: Asset | null) => {
                    handleAutoCompleteChange('toAssetId', newValue?.id);
                  }}
                  onFocus={() => handleFocus('toAssetId')}
                />
                <Autocomplete
                  options={liabilities}
                  autoComplete
                  autoHighlight
                  autoSelect
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="To Liability"
                      required
                      error={!!validationErrors?.toLiabilityId}
                      helperText={validationErrors?.toLiabilityId}
                    />
                  )}
                  onChange={(_event: any, newValue: Liability | null) => {
                    handleAutoCompleteChange('toLiabilityId', newValue?.id);
                  }}
                  onFocus={() => handleFocus('toLiabilityId')}
                />
              </>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <Dialog
      fullScreen
      fullWidth
      onClose={handleClose}
      open={open}
      TransitionComponent={SlideUpTransition}
      keepMounted
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Add Transaction
          <Box
            sx={{
              display: 'flex-end',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.updateAccounts}
                  onChange={(event) => {
                    update({
                      ...settings,
                      transactions: {
                        ...(settings?.transactions || {}),
                        updateAccounts: event.target.checked,
                      },
                    });
                    setFormValues({
                      ...formValues,
                      updateAccounts: event.target.checked,
                    });
                  }}
                  name="updateAccounts"
                  color="primary"
                />
              }
              label="Update accounts"
            />
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Box sx={{ width: '1rem' }} />
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTransactionDialog;
