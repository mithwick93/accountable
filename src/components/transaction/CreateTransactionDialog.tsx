import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
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
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DialogProps } from '@toolpad/core/useDialogs';
import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import { useStaticData } from '../../context/StaticDataContext';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/ApiService';
import { Asset } from '../../types/Asset';
import { Liability } from '../../types/Liability';
import { PaymentSystem } from '../../types/PaymentSystem';
import { PaymentSystemCredit } from '../../types/PaymentSystemCredit';
import { PaymentSystemDebit } from '../../types/PaymentSystemDebit';
import { SharedTransactionRequest } from '../../types/SharedTransactionRequest';
import { TransactionCategory } from '../../types/TransactionCategory';
import { User } from '../../types/User';
import {
  formatCurrency,
  getActiveAssets,
  getActiveLiabilities,
  getActivePaymentSystems,
  getStartEndDate,
  getTransactionsFetchOptions,
} from '../../utils/common';
import { notifyBackendError } from '../../utils/notifications';
import NumberInput from '../NumberInput';
import SlideUpTransition from '../transition/SlideUpTransition';

type FormStateType = {
  updateAccounts: boolean;
  userId?: string;
  type?: string;
  name?: string;
  description?: string;
  categoryId?: number;
  categoryDisplayName?: string;
  currency?: string;
  amount?: number;
  charges?: number;
  date?: string;
  toAssetId?: number;
  fromAssetId?: number;
  fromPaymentSystemId?: number;
  toLiabilityId?: number;
};

const CreateTransactionDialog = ({ onClose, open }: DialogProps) => {
  const { settings, update, loading: settingsLoading } = useSettings();
  const { currencies, loading: staticDataLoading } = useStaticData();
  const {
    assets: rawAssets,
    liabilities: rawLiabilities,
    paymentSystems: rawPaymentSystems,
    categories,
    refetchData,
    loading: dataLoading,
  } = useData();
  const { loggedInUser, users, loading: userLoading } = useUser();
  const theme = useTheme();

  const loading =
    settingsLoading || staticDataLoading || dataLoading || userLoading;

  const assets = useMemo<Asset[]>(
    () => getActiveAssets(rawAssets),
    [rawAssets],
  );
  const liabilities = useMemo<Liability[]>(
    () => getActiveLiabilities(rawLiabilities),
    [rawLiabilities],
  );
  const paymentSystems = useMemo<(PaymentSystemCredit | PaymentSystemDebit)[]>(
    () => getActivePaymentSystems(rawPaymentSystems),
    [rawPaymentSystems],
  );
  const baseCurrency = settings?.currency || 'USD';
  const updateAccounts = settings?.transactions.updateAccounts ?? false;
  const initialFormValues: FormStateType = {
    type: 'EXPENSE',
    userId: loggedInUser?.sub,
    updateAccounts: updateAccounts,
    currency: baseCurrency,
    date: new Date().toISOString().split('T')[0],
  };

  const [formValues, setFormValues] =
    useState<FormStateType>(initialFormValues);
  const [sharedTransactions, setSharedTransactions] = useState<
    SharedTransactionRequest[]
  >([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [
    sharedTransactionValidationErrors,
    setSharedTransactionValidationErrors,
  ] = useState<Record<string, string | undefined>[]>([]);
  const [
    sharedTransactionCommonValidationErrors,
    setSharedTransactionCommonValidationErrors,
  ] = useState<string[]>([]);

  const userOptions = users ?? [];
  const categoryOptions =
    categories.filter((category) => category.type === formValues.type) ?? [];
  const currencyCodes = currencies?.map((currency) => currency.code) ?? [];
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const enableDivideEvenly =
    formValues.type === 'EXPENSE' &&
    sharedTransactions.length > 1 &&
    formValues.amount &&
    formValues.amount > 0;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === 'type') {
      setFormValues({
        ...formValues,
        [name]: value,
        categoryId: initialFormValues.categoryId,
        categoryDisplayName: initialFormValues.categoryDisplayName,
        charges: undefined,
        toAssetId: initialFormValues.toAssetId,
        fromAssetId: initialFormValues.fromAssetId,
        fromPaymentSystemId: initialFormValues.fromPaymentSystemId,
        toLiabilityId: initialFormValues.toLiabilityId,
      });
      setSharedTransactions([]);
    } else if (name === 'amount' || name === 'charges') {
      setFormValues({
        ...formValues,
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
    const updatedSharedTransactions = sharedTransactions.filter(
      (_, i) => i !== index,
    );
    setSharedTransactions(updatedSharedTransactions);

    if (updatedSharedTransactions.length === 0) {
      setSharedTransactionCommonValidationErrors([]);
    }
  };

  const handleSharedTransactionChange = (
    index: number,
    field: keyof SharedTransactionRequest,
    value: any,
  ) => {
    const updatedTransactions = [...sharedTransactions];
    // @ts-expect-error ignore
    updatedTransactions[index][field] = value;
    setSharedTransactions(updatedTransactions);
  };

  const handleCopySharedAmount = (index: number) => {
    const updatedTransactions = [...sharedTransactions];

    updatedTransactions[index]['paidAmount'] =
      sharedTransactions[index]['share'] || 0;
    setSharedTransactions(updatedTransactions);
  };

  const handleDivideEvenly = () => {
    const totalAmount = parseFloat(
      String((formValues.amount || 0) + (formValues.charges || 0)),
    );
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

        const searchParameters: Record<string, any> =
          settings?.transactions?.search?.parameters || {};
        const { startDate, endDate } = getStartEndDate(settings);
        await refetchData(
          ['assets', 'liabilities', 'paymentSystems', 'transactions'],
          getTransactionsFetchOptions(searchParameters, startDate, endDate),
        );
        handleClose();
      } catch (error: any) {
        notifyBackendError('Error creating transaction', error);
      }
    }
  };

  const handleClose = () => {
    setFormValues(initialFormValues);
    setSharedTransactions([]);
    setValidationErrors({});
    setSharedTransactionValidationErrors([]);
    setSharedTransactionCommonValidationErrors([]);
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
    field: keyof SharedTransactionRequest,
  ) => {
    const updatedErrors = [...sharedTransactionValidationErrors];
    if (updatedErrors[index]) {
      updatedErrors[index][field] = undefined;
    }
    setSharedTransactionValidationErrors(updatedErrors);
    setSharedTransactionCommonValidationErrors([]);
  };

  const validateForm = () => {
    const errors: Record<string, string | undefined> = {};

    if (!formValues.type) {
      errors.type = 'Type is required';
    } else {
      if (!formValues.userId) {
        errors.userId = 'User is required';
      }

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
      } else if (formValues.amount <= 0) {
        errors.amount = 'Amount must be greater than 0';
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
    const commonErrors: string[] = [];
    let hasPositiveShare = false;
    let hasPositivePaidAmount = false;
    let hasSettledTransaction = false;

    sharedTransactions.forEach((transaction, index) => {
      const transactionErrors: Record<string, string | undefined> = {};

      if (!transaction.userId || transaction.userId === '') {
        transactionErrors.userId = 'User is required';
      }

      if (transaction.share < 0) {
        transactionErrors.share = 'Share cannot be negative';
      } else if (transaction.share > 0) {
        hasPositiveShare = true;
      }

      if (transaction.paidAmount < 0) {
        transactionErrors.paidAmount = 'Paid Amount cannot be negative';
      } else if (transaction.paidAmount > 0) {
        hasPositivePaidAmount = true;
      }

      if (transaction.isSettled) {
        hasSettledTransaction = true;
      }

      errors[index] = transactionErrors;
    });

    if (sharedTransactions.length > 0) {
      if (!hasPositiveShare) {
        commonErrors.push('At least one share must be greater than 0');
      }
    }

    if (sharedTransactions.length > 1) {
      if (!hasPositivePaidAmount) {
        commonErrors.push('At least one paid amount must be greater than 0');
      }

      if (!hasSettledTransaction) {
        commonErrors.push('At least one shared transaction must be settled');
      }
    }

    setSharedTransactionValidationErrors(errors);
    setSharedTransactionCommonValidationErrors(commonErrors);

    return (
      commonErrors.length === 0 &&
      errors.every((error) => Object.keys(error).length === 0)
    );
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
      userId: formValues.userId,
      sharedTransactions: [],
    };

    if (formValues.type === 'EXPENSE') {
      payload.fromPaymentSystemId = formValues.fromPaymentSystemId;
      payload.amount = parseFloat(
        String((formValues.amount || 0) + (formValues.charges || 0)),
      );
    } else if (formValues.type === 'INCOME') {
      payload.toAssetId = formValues.toAssetId;
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
        share: transaction.share || 0,
        paidAmount: transaction.paidAmount || 0,
        isSettled: transaction.isSettled || false,
      }));
    }

    return payload;
  };

  const selectedUser = React.useMemo(
    () => userOptions.find((user) => `${user.id}` === `${formValues.userId}`),
    [userOptions, formValues.userId],
  );

  const selectedCategory = React.useMemo(
    () =>
      categoryOptions.find(
        (category) => `${category.id}` === `${formValues.categoryId}`,
      ),
    [categoryOptions, formValues.categoryId],
  );

  // eslint-disable-next-line complexity
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
            <Autocomplete
              value={selectedUser || null}
              options={userOptions}
              autoComplete
              getOptionLabel={(option) =>
                `${option.firstName} ${option.lastName}`
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Paid by"
                  required
                  error={!!validationErrors?.userId}
                  helperText={validationErrors?.userId}
                  onFocus={() => handleFocus('userId')}
                />
              )}
              onChange={(_event: any, newValue: User | null) => {
                handleAutoCompleteChange('userId', newValue?.id);
              }}
            />
            <TextField
              label="Name"
              name="name"
              type="text"
              value={formValues.name || ''}
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
              value={formValues.description || ''}
              onChange={handleInputChange}
              error={!!validationErrors?.description}
              helperText={validationErrors?.description}
              onFocus={() => handleFocus('description')}
            />
            <Autocomplete
              value={selectedCategory || null}
              inputValue={formValues.categoryDisplayName || ''}
              options={categoryOptions}
              autoComplete
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
              onInputChange={(_event: any, newInputValue: string) => {
                setFormValues({
                  ...formValues,
                  categoryDisplayName: newInputValue,
                });
              }}
              onFocus={() => handleFocus('categoryId')}
            />
            <Autocomplete
              value={formValues.currency || null}
              options={currencyCodes}
              autoComplete
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
            <NumberInput
              label="Amount"
              name="amount"
              value={formValues.amount || ''}
              required
              onChange={handleInputChange}
              onFocus={() => handleFocus('amount')}
              error={!!validationErrors?.amount}
              helperText={validationErrors?.amount}
            />
            {formValues.type === 'EXPENSE' && (
              <NumberInput
                label="Transaction charges"
                name="charges"
                value={formValues.charges || ''}
                onChange={handleInputChange}
                onFocus={() => handleFocus('charges')}
                error={!!validationErrors?.charges}
                helperText={validationErrors?.charges}
              />
            )}
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
            {formValues.type === 'EXPENSE' && (
              <>
                <Autocomplete
                  options={paymentSystems.filter(
                    (paymentSystem) =>
                      paymentSystem.currency === formValues.currency,
                  )}
                  autoComplete
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
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    let content;

                    if (option.type === 'Credit') {
                      const credit = option as PaymentSystemCredit;
                      content = `${credit.name} (${formatCurrency(
                        credit.liability.amount - credit.liability.balance,
                        credit.currency,
                      )})`;
                    } else if (option.type === 'Debit') {
                      const debit = option as PaymentSystemDebit;
                      content = `${debit.name} (${formatCurrency(
                        debit.asset.balance,
                        debit.currency,
                      )})`;
                    } else {
                      content = option.name;
                    }

                    return (
                      <Box key={key} component="li" {...optionProps}>
                        {content}
                      </Box>
                    );
                  }}
                  groupBy={(option) => option.type}
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
                  {sharedTransactionCommonValidationErrors.length > 0 && (
                    <FormHelperText error sx={{ whiteSpace: 'pre-wrap' }}>
                      {sharedTransactionCommonValidationErrors.join('\n')}
                    </FormHelperText>
                  )}
                  {sharedTransactions.map((transaction, index) => (
                    <Box key={index}>
                      <Box
                        display="flex"
                        alignItems={smallScreen ? 'flex-start' : 'center'}
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
                                !!sharedTransactionValidationErrors[index]
                                  ?.userId
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
                        <NumberInput
                          label="Share"
                          name="share"
                          value={transaction.share || ''}
                          required
                          onChange={(e) =>
                            handleSharedTransactionChange(
                              index,
                              'share',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          onFocus={() =>
                            handleSharedTransactionFocus(index, 'share')
                          }
                          error={
                            !!sharedTransactionValidationErrors[index]?.share
                          }
                          helperText={
                            sharedTransactionValidationErrors[index]?.share
                          }
                        />
                        <IconButton
                          onClick={() => handleCopySharedAmount(index)}
                        >
                          {!smallScreen && <KeyboardDoubleArrowRightIcon />}
                          {smallScreen && <KeyboardDoubleArrowDownIcon />}
                        </IconButton>
                        <NumberInput
                          label="Paid Amount"
                          name="paidAmount"
                          value={transaction.paidAmount || ''}
                          onChange={(e) =>
                            handleSharedTransactionChange(
                              index,
                              'paidAmount',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          onFocus={() =>
                            handleSharedTransactionFocus(index, 'paidAmount')
                          }
                          error={
                            !!sharedTransactionValidationErrors[index]
                              ?.paidAmount
                          }
                          helperText={
                            sharedTransactionValidationErrors[index]?.paidAmount
                          }
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
                          onFocus={() =>
                            handleSharedTransactionFocus(index, 'isSettled')
                          }
                        />
                        <IconButton
                          onClick={() => handleRemoveSharedTransaction(index)}
                          sx={{ backgroundColor: theme.palette.error.main }}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Box>
                      {index < sharedTransactions.length - 1 && (
                        <Divider sx={{ marginTop: 2 }} />
                      )}
                    </Box>
                  ))}
                </Stack>
              </>
            )}
            {formValues.type === 'INCOME' && (
              <Autocomplete
                options={assets.filter(
                  (asset) => asset.currency === formValues.currency,
                )}
                autoComplete
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
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box key={key} component="li" {...optionProps}>
                      {option.name} (
                      {formatCurrency(option.balance, option.currency)})
                    </Box>
                  );
                }}
                onChange={(_event: any, newValue: Asset | null) => {
                  handleAutoCompleteChange('toAssetId', newValue?.id);
                }}
                onFocus={() => handleFocus('toAssetId')}
              />
            )}
            {formValues.type === 'TRANSFER' && (
              <>
                <Autocomplete
                  options={assets.filter(
                    (asset) =>
                      asset.id !== formValues.toAssetId &&
                      asset.currency === formValues.currency,
                  )}
                  autoComplete
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
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box key={key} component="li" {...optionProps}>
                        {option.name} (
                        {formatCurrency(option.balance, option.currency)})
                      </Box>
                    );
                  }}
                  onChange={(_event: any, newValue: Asset | null) => {
                    handleAutoCompleteChange('fromAssetId', newValue?.id);
                  }}
                  onFocus={() => handleFocus('fromAssetId')}
                />
                <Autocomplete
                  options={assets.filter(
                    (asset) =>
                      asset.id !== formValues.fromAssetId &&
                      asset.currency === formValues.currency,
                  )}
                  autoComplete
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
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box key={key} component="li" {...optionProps}>
                        {option.name} (
                        {formatCurrency(option.balance, option.currency)})
                      </Box>
                    );
                  }}
                  onChange={(_event: any, newValue: Asset | null) => {
                    handleAutoCompleteChange('toAssetId', newValue?.id);
                  }}
                  onFocus={() => handleFocus('toAssetId')}
                />
                <Autocomplete
                  options={liabilities.filter(
                    (liability) => liability.currency === formValues.currency,
                  )}
                  autoComplete
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
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box key={key} component="li" {...optionProps}>
                        {option.name} (
                        {formatCurrency(option.balance, option.currency)})
                      </Box>
                    );
                  }}
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

  if (!open) {
    return null;
  }

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
