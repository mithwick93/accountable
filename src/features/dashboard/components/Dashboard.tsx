import { Card, CardContent, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DefaultizedPieValueType } from '@mui/x-charts/models';
import { PieChart } from '@mui/x-charts/PieChart';
import React, { useEffect, useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import apiClient from '../../../services/ApiService';
import { Asset } from '../../../types/Asset';
import { Liability } from '../../../types/Liability';
import { formatCurrency } from '../../../utils/common';
import log from '../../../utils/logger';

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    fontWeight: 'bold',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

interface NetWorthProps {
  totals: { [currency: string]: number };
  currencyRates: {
    [currency: string]: number;
  };
  currency: string;
}

const NetWorth: React.FC<NetWorthProps> = ({
  totals,
  currencyRates,
  currency,
}) => {
  const [netWorth, setNetWorth] = useState<number>(0);

  useEffect(() => {
    const calculateNetWorth = () => {
      let totalNetWorth = 0;
      Object.keys(totals).forEach((assetCurrency) => {
        const assetTotal = totals[assetCurrency];
        const exchangeRate = currencyRates[assetCurrency];
        if (exchangeRate) {
          totalNetWorth += assetTotal / exchangeRate;
        }
      });
      setNetWorth(totalNetWorth);
    };

    calculateNetWorth();
  }, [totals, currencyRates]);

  const getArcLabel = (params: DefaultizedPieValueType) => {
    const percent = params.value / netWorth;
    return `${(percent * 100).toFixed(0)}%`;
  };

  const pieChartData = Object.keys(totals).map((currency) => ({
    id: currency,
    value: totals[currency] / currencyRates[currency],
    label: currency,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Net Worth
        </Typography>
        <Grid
          container
          spacing={2}
          size={{ xs: 12, sm: 12 }}
          alignItems="center"
          justifyContent="center"
          style={{ height: '100%' }}
        >
          <Grid
            size={{ xs: 12, sm: 6 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <Typography
              variant="h5"
              component="div"
              style={{ fontWeight: 'bold' }}
            >
              {formatCurrency(netWorth)} {currency}
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <PieChart
              series={[
                {
                  data: pieChartData,
                  arcLabel: getArcLabel,
                  arcLabelMinAngle: 5,
                  sortingValues: 'desc',
                  innerRadius: 0,
                  outerRadius: 75,
                  cornerRadius: 3,
                  highlightScope: { fade: 'global', highlight: 'item' },
                  faded: {
                    innerRadius: 30,
                    additionalRadius: -30,
                    color: 'gray',
                  },
                },
              ]}
              width={50}
              height={150}
              slotProps={{
                legend: { hidden: true },
              }}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

interface AssetSummaryProps {
  assets: Asset[];
  totals: { [currency: string]: number };
}

const AssetSummary: React.FC<AssetSummaryProps> = ({ assets, totals }) => {
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

  const getAssetBreakdown = (currency: string) =>
    assets
      .filter((asset) => asset.currency === currency)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(
        (asset) =>
          `${asset.name}: ${formatCurrency(asset.balance)} ${currency}`,
      );

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
                <StyledTableCell>Currency</StyledTableCell>
                <StyledTableCell align="right">Total</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(totals).map((currency) => (
                <StyledTableRow key={currency}>
                  <TableCell component="th" scope="row">
                    {currency}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip
                      title={
                        <React.Fragment>
                          {getAssetBreakdown(currency).map((line, index) => (
                            <Typography key={index} variant="body2">
                              {line}
                            </Typography>
                          ))}
                        </React.Fragment>
                      }
                      arrow
                      followCursor
                    >
                      <span>
                        {formatCurrency(totals[currency])} {currency}
                      </span>
                    </Tooltip>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

interface LiabilitySummaryProps {
  liabilities: Liability[];
}

const LiabilitySummary: React.FC<LiabilitySummaryProps> = ({ liabilities }) => {
  if (liabilities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Liability Summary
          </Typography>
          <Typography variant="body1">No liabilities found.</Typography>
        </CardContent>
      </Card>
    );
  }

  const getLiabilityBreakdown = (currency: string) =>
    liabilities
      .filter((liability) => liability.currency === currency)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(
        (liability) =>
          `${liability.name}: ${formatCurrency(liability.balance)} ${currency}`,
      );

  const totals = liabilities.reduce(
    (acc, liability) => {
      if (!acc[liability.currency]) {
        acc[liability.currency] = 0;
      }
      acc[liability.currency] += liability.balance;
      return acc;
    },
    {} as { [currency: string]: number },
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Liability Summary
        </Typography>
        <TableContainer>
          <Table aria-label="liability summary table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Currency</StyledTableCell>
                <StyledTableCell align="right">Total</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(totals).map((currency) => (
                <StyledTableRow key={currency}>
                  <TableCell component="th" scope="row">
                    {currency}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip
                      title={
                        <React.Fragment>
                          {getLiabilityBreakdown(currency).map(
                            (line, index) => (
                              <Typography key={index} variant="body2">
                                {line}
                              </Typography>
                            ),
                          )}
                        </React.Fragment>
                      }
                      arrow
                      followCursor
                    >
                      <span>
                        {formatCurrency(totals[currency])} {currency}
                      </span>
                    </Tooltip>
                  </TableCell>
                </StyledTableRow>
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
                <StyledTableCell>Currency</StyledTableCell>
                <StyledTableCell align="right">Rate</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(currencyRates).map((currency) => (
                <StyledTableRow key={currency}>
                  <TableCell component="th" scope="row">
                    {currency}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(1 / currencyRates[currency])}
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totals, setTotals] = useState<{ [currency: string]: number }>({});
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
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

        setAssets(assetsData);
        setTotals(sortedTotalsData);
      } catch (error) {
        log.error('Error fetching assets:', error);
      }
    };

    fetchAssetTotals();
  }, []);

  useEffect(() => {
    const fetchLiabilities = async () => {
      try {
        const response = await apiClient.get('/liabilities');
        const liabilitiesData = response.data;
        setLiabilities(liabilitiesData);
      } catch (error) {
        log.error('Error fetching liabilities:', error);
      }
    };

    fetchLiabilities();
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
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NetWorth
            totals={totals}
            currencyRates={currencyRates}
            currency={currency}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} size={{ xs: 12, sm: 6 }} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetSummary assets={assets} totals={totals} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LiabilitySummary liabilities={liabilities} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CurrencyRates currencyRates={currencyRates} />
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;
