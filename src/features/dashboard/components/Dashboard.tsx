import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect, useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import apiClient from '../../../services/ApiService';
import { Asset } from '../../../types/Asset';
import { formatCurrency } from '../../../utils/common';
import log from '../../../utils/logger';

interface AssetSummaryProps {
  totals: { [currency: string]: number };
}

const AssetSummary: React.FC<AssetSummaryProps> = ({ totals }) => {
  if (Object.keys(totals).length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Asset Summary
          </Typography>
          <Typography variant="body1">No assets found.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Asset Summary
        </Typography>
        <TableContainer>
          <Table aria-label="asset summary table">
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(totals).map((currency) => (
                <TableRow key={currency}>
                  <TableCell component="th" scope="row">
                    {currency}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(totals[currency])} {currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

interface CurrencyRatesProps {
  currencyRates: { [currency: string]: number };
}

const CurrencyRates: React.FC<CurrencyRatesProps> = ({ currencyRates }) => {
  if (Object.keys(currencyRates).length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Exchange Rates
          </Typography>
          <Typography variant="body1">No exchange rates found.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Exchange Rates
        </Typography>
        <TableContainer>
          <Table aria-label="currency rates table">
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(currencyRates).map((currency) => (
                <TableRow key={currency}>
                  <TableCell component="th" scope="row">
                    {currency}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(1 / currencyRates[currency])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const [totals, setTotals] = useState<{ [currency: string]: number }>({});
  const [currencyRates, setCurrencyRates] = useState<{
    [currency: string]: number;
  }>({});
  const { settings } = useSettings();
  const currency = settings?.currency || 'USD';

  useEffect(() => {
    const fetchAssetTotals = async () => {
      try {
        const response = await apiClient.get('/assets');
        const assetsData = response.data;

        const totalsData: { [currency: string]: number } = {};
        assetsData.forEach((asset: Asset) => {
          if (!totalsData[asset.currency]) {
            totalsData[asset.currency] = 0;
          }
          totalsData[asset.currency] += asset.balance;
        });

        const sortedTotalsData = Object.keys(totalsData)
          .sort()
          .reduce(
            (acc, key) => {
              acc[key] = totalsData[key];
              return acc;
            },
            {} as { [currency: string]: number },
          );

        setTotals(sortedTotalsData);
      } catch (error) {
        log.error('Error fetching assets:', error);
      }
    };

    fetchAssetTotals();
  }, []);

  useEffect(() => {
    const fetchCurrencyRates = async () => {
      try {
        const response = await apiClient.get(
          `/exchange-rates?baseCurrency=${currency}&onlySupported=true`,
        );
        const currencyRatesData = response.data.conversionRates;

        const sortedCurrencyRatesData = Object.keys(currencyRatesData)
          .sort()
          .reduce(
            (acc, key) => {
              acc[key] = currencyRatesData[key];
              return acc;
            },
            {} as { [currency: string]: number },
          );

        setCurrencyRates(sortedCurrencyRatesData);
      } catch (error) {
        log.error('Error fetching currency rates:', error);
      }
    };

    fetchCurrencyRates();
  }, [currency]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <AssetSummary totals={totals} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <CurrencyRates currencyRates={currencyRates} />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
