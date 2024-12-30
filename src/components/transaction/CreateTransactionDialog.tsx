import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  FormHelperText,
  Switch,
  TextField,
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  sharedTransactions?: SharedTransaction[];
};

const initialFormValues: FormStateType = { updateAccounts: true };

const CreateTransactionDialog = ({
  onClose,
  open,
}: CreateTransactionDialogProps) => {
  const [formValues, setFormValues] =
    useState<FormStateType>(initialFormValues);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [data, setData] = useState<
    | {
        assets: Asset[];
        liabilities: Liability[];
        paymentSystems: (PaymentSystemCredit | PaymentSystemDebit)[];
        categories: TransactionCategory[];
      }
    | undefined
  >();
  const { currencies } = useStaticData();
  const { loggedInUser } = useUser();
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const navigate = useNavigate();

  const assets = data?.assets ?? [];
  const liabilities = data?.liabilities ?? [];
  const paymentSystems = data?.paymentSystems ?? [];
  const categoryOptions =
    data?.categories.filter((category) => category.type === formValues.type) ??
    [];
  const currencyCodes = currencies?.map((currency) => currency.code) ?? [];
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

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

  const handleSave = async () => {
    log.info(JSON.stringify(formValues));

    if (validateForm()) {
      try {
        await apiClient.post('/transactions', getRequestPayload());
        toast.success('Transaction created successfully');
        handleClose();
        navigate(0);
      } catch (error) {
        log.error('Error creating transaction:', error);
        toast.error('Error creating transaction', { autoClose: false });
      }
    }
  };

  const handleClose = () => {
    setFormValues(initialFormValues);
    onClose();
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
            row={!fullScreen}
            aria-labelledby="controlled-radio-buttons-group"
            name="type"
            onChange={handleInputChange}
            onFocus={() =>
              setValidationErrors({
                ...validationErrors,
                type: undefined,
              })
            }
          >
            <FormControlLabel
              value="INCOME"
              control={<Radio />}
              label="Income"
            />
            <FormControlLabel
              value="EXPENSE"
              control={<Radio />}
              label="Expense"
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
              onFocus={() =>
                setValidationErrors({
                  ...validationErrors,
                  name: undefined,
                })
              }
            />
            <TextField
              label="Description"
              name="description"
              type="text"
              onChange={handleInputChange}
              error={!!validationErrors?.description}
              helperText={validationErrors?.description}
              onFocus={() =>
                setValidationErrors({
                  ...validationErrors,
                  description: undefined,
                })
              }
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
              onFocus={() =>
                setValidationErrors({
                  ...validationErrors,
                  categoryId: undefined,
                })
              }
            />
            <Autocomplete
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
              onFocus={() =>
                setValidationErrors({
                  ...validationErrors,
                  currency: undefined,
                })
              }
            />
            <TextField
              label="Amount"
              name="amount"
              type="number"
              required
              onChange={handleInputChange}
              error={!!validationErrors?.amount}
              helperText={validationErrors?.amount}
              onFocus={() =>
                setValidationErrors({
                  ...validationErrors,
                  amount: undefined,
                })
              }
            />
            <TextField
              label="Date"
              name="date"
              type="date"
              required
              onChange={handleInputChange}
              error={!!validationErrors?.date}
              helperText={validationErrors?.date}
              onFocus={() =>
                setValidationErrors({
                  ...validationErrors,
                  date: undefined,
                })
              }
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
                onFocus={() =>
                  setValidationErrors({
                    ...validationErrors,
                    toAssetId: undefined,
                  })
                }
              />
            )}
            {formValues.type === 'EXPENSE' && (
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
                  handleAutoCompleteChange('fromPaymentSystemId', newValue?.id);
                }}
                onFocus={() =>
                  setValidationErrors({
                    ...validationErrors,
                    fromPaymentSystemId: undefined,
                  })
                }
              />
            )}
            {formValues.type === 'TRANSFER' && (
              <>
                <Autocomplete
                  options={assets}
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
                  onFocus={() =>
                    setValidationErrors({
                      ...validationErrors,
                      fromAssetId: undefined,
                    })
                  }
                />
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
                  onFocus={() =>
                    setValidationErrors({
                      ...validationErrors,
                      toAssetId: undefined,
                    })
                  }
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
                  onFocus={() =>
                    setValidationErrors({
                      ...validationErrors,
                      toLiabilityId: undefined,
                    })
                  }
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
      fullScreen={fullScreen}
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
          Record Transaction
          <FormControlLabel
            control={
              <Switch
                checked={formValues.updateAccounts}
                onChange={(event) =>
                  setFormValues({
                    ...formValues,
                    updateAccounts: event.target.checked,
                  })
                }
                name="updateAccounts"
                color="primary"
              />
            }
            label="Update accounts"
          />
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTransactionDialog;