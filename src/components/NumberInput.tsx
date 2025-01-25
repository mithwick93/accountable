import TextField from '@mui/material/TextField';
import React, { FocusEventHandler } from 'react';
import { NumericFormat } from 'react-number-format';

interface NumberInputProps {
  label: string;
  name: string;
  value: string | number | undefined;
  required?: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  onFocus?: FocusEventHandler<HTMLInputElement> | undefined;
  error?: boolean;
  helperText?: string;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  allowNegative?: boolean;
  allowLeadingZeros?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  name,
  value,
  onChange,
  helperText,
  onFocus,
  error = false,
  required = false,
  decimalScale = 4,
  fixedDecimalScale = true,
  allowNegative = false,
  allowLeadingZeros = true,
  ...props
}) => (
  <NumericFormat
    label={label}
    name={name}
    value={value || ''}
    required={required}
    onChange={onChange}
    error={error}
    helperText={helperText}
    onFocus={onFocus}
    variant="outlined"
    customInput={TextField}
    allowedDecimalSeparators={[',', '.']}
    allowLeadingZeros={allowLeadingZeros}
    allowNegative={allowNegative}
    decimalScale={decimalScale}
    fixedDecimalScale={fixedDecimalScale}
    {...props}
  />
);

export default NumberInput;
