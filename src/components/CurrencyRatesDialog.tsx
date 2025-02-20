import { Card, CardContent } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DialogProps } from '@toolpad/core/useDialogs';
import React from 'react';
import { useCurrencyRates } from '../context/CurrencyRatesContext';
import { useSettings } from '../context/SettingsContext';
import { formatNumber } from '../utils/common';
import LoadingSkeleton from './LoadingSkeleton';
import SlideUpTransition from './SlideUpTransition';
import { StyledTableCell, StyledTableRow } from './Table';

const CurrencyRatesDialog = ({ onClose, open }: DialogProps) => {
  const { currencyRates, loading } = useCurrencyRates();
  const { settings } = useSettings();
  const baseCurrency = settings?.currency || 'USD';
  const handleClose = () => {
    onClose();
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      TransitionComponent={SlideUpTransition}
      keepMounted
      aria-describedby="alert-dialog-slide-description"
      fullWidth
    >
      <DialogTitle>Exchange Rates</DialogTitle>
      <Card>
        <CardContent>
          <TableContainer>
            <Table aria-label="currency rates table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Currency</StyledTableCell>
                  <StyledTableCell align="right">{`Rate (${baseCurrency})`}</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(currencyRates)
                  .filter((currency) => currency !== baseCurrency)
                  .map((currency) => (
                    <StyledTableRow key={currency}>
                      <TableCell component="th" scope="row">
                        {currency}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(1 / currencyRates[currency])}
                      </TableCell>
                    </StyledTableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Dialog>
  );
};

export default CurrencyRatesDialog;
