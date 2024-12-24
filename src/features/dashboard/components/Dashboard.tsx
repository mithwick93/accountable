import { Card, CardContent, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DefaultizedPieValueType } from '@mui/x-charts/models';
import { PieChart } from '@mui/x-charts/PieChart';
import React, { useEffect, useState } from 'react';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import {
  StyledTableCell,
  StyledTableRow,
} from '../../../components/table/Table';
import { useCurrencyRates } from '../../../context/CurrencyRatesContext';
import { useSettings } from '../../../context/SettingsContext';
import apiClient from '../../../services/ApiService';
import { Asset } from '../../../types/Asset';
import { Liability } from '../../../types/Liability';
import { formatCurrency } from '../../../utils/common';
import log from '../../../utils/logger';

interface NetWorthProps {
  totals: { [currency: string]: number };
  currencyRates: {
    [currency: string]: number;
  };
}

const NetWorth: React.FC<NetWorthProps> = ({ totals, currencyRates }) => {
  const [netWorth, setNetWorth] = useState<number>(0);
  const { settings } = useSettings();
  const currency: string = settings?.currency || 'USD';

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

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totals, setTotals] = useState<{ [currency: string]: number }>({});
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [assetsLoading, setAssetsLoading] = useState<boolean>(true);
  const [liabilitiesLoading, setLiabilitiesLoading] = useState<boolean>(true);
  const { currencyRates } = useCurrencyRates();

  useEffect(() => {
    const fetchAssetTotals = async () => {
      setAssetsLoading(true);
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
      } finally {
        setAssetsLoading(false);
      }
    };

    fetchAssetTotals();
  }, []);

  useEffect(() => {
    const fetchLiabilities = async () => {
      setLiabilitiesLoading(true);
      try {
        const response = await apiClient.get('/liabilities');
        const liabilitiesData = response.data;
        setLiabilities(liabilitiesData);
      } catch (error) {
        log.error('Error fetching liabilities:', error);
      } finally {
        setLiabilitiesLoading(false);
      }
    };

    fetchLiabilities();
  }, []);

  if (assetsLoading || liabilitiesLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NetWorth totals={totals} currencyRates={currencyRates} />
        </Grid>
      </Grid>
      <Grid container spacing={2} size={{ xs: 12, sm: 6 }} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AssetSummary assets={assets} totals={totals} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LiabilitySummary liabilities={liabilities} />
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;
