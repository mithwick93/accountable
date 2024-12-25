import { Card, CardContent } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { TransitionProps } from '@mui/material/transitions';
import React from 'react';
import { useCurrencyRates } from '../context/CurrencyRatesContext';
import { useSettings } from '../context/SettingsContext';
import { formatNumber } from '../utils/common';
import { StyledTableCell, StyledTableRow } from './table/Table';

export interface SimpleDialogProps {
  open: boolean;
  onClose: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CurrencyRatesDialog = ({ onClose, open }: SimpleDialogProps) => {
  const { currencyRates } = useCurrencyRates();
  const { settings } = useSettings();
  const baseCurrency = settings?.currency || 'USD';
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      TransitionComponent={Transition}
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
