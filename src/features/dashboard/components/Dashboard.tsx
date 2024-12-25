import { Card, CardContent, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
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
import { formatNumber } from '../../../utils/common';
import log from '../../../utils/logger';

interface NetSummeryProps {
  title: string;
  totals: { [currency: string]: number };
  currencyRates: { [currency: string]: number };
  currency: string;
}

const NetSummary: React.FC<NetSummeryProps> = ({
  title,
  totals,
  currencyRates,
  currency,
}) => {
  const [netValue, setNetValue] = useState<number>(0);

  useEffect(() => {
    const calculateNetValue = () => {
      let total = 0;
      Object.keys(totals).forEach((key) => {
        const totalValue = totals[key];
        const exchangeRate = currencyRates[key];
        if (exchangeRate) {
          total += totalValue / exchangeRate;
        }
      });
      setNetValue(total);
    };

    calculateNetValue();
  }, [totals, currencyRates]);

  const getArcLabel = (params: { value: number }) => {
    const percent = params.value / netValue;
    return `${(percent * 100).toFixed(0)}%`;
  };

  const pieChartData = Object.keys(totals).map((key) => ({
    id: key,
    value: totals[key] / currencyRates[key],
    label: key,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
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
              {formatNumber(netValue)} {currency}
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

/* eslint-disable no-unused-vars */
interface SummaryCardProps {
  title: string;
  totals: { [currency: string]: number };
  breakdownFn: (currency: string) => string[];
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  totals,
  breakdownFn,
}) => {
  if (Object.keys(totals).length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1">No data found.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <TableContainer>
          <Table aria-label={`${title} table`}>
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
                          {breakdownFn(currency).map((line, index) => (
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
                        {formatNumber(totals[currency])} {currency}
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
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [assetTotals, setAssetTotals] = useState<{
    [currency: string]: number;
  }>({});
  const [liabilityTotals, setLiabilityTotals] = useState<{
    [currency: string]: number;
  }>({});
  const { currencyRates } = useCurrencyRates();
  const { settings } = useSettings();
  const currency: string = settings?.currency || 'USD';
  const [loading, setLoading] = useState(true);

  const calculateTotals = (items: (Asset | Liability)[]) =>
    items.reduce(
      (acc, item) => {
        acc[item.currency] = (acc[item.currency] || 0) + item.balance;
        return acc;
      },
      {} as { [currency: string]: number },
    );

  const getBreakdown = (items: (Asset | Liability)[], currency: string) =>
    items
      .filter((item) => item.currency === currency)
      .map((item) => `${item.name}: ${formatNumber(item.balance)}`);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const [assetResponse, liabilityResponse] = await Promise.all([
          apiClient.get<Asset[]>('/assets'),
          apiClient.get<Liability[]>('/liabilities'),
        ]);

        setAssets(assetResponse.data);
        setLiabilities(liabilityResponse.data);
        setAssetTotals(calculateTotals(assetResponse.data));
        setLiabilityTotals(calculateTotals(liabilityResponse.data));
      } catch (error) {
        log.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NetSummary
          title="Net Worth"
          totals={assetTotals}
          currencyRates={currencyRates}
          currency={currency}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <NetSummary
          title="Net Liabilities"
          totals={liabilityTotals}
          currencyRates={currencyRates}
          currency={currency}
        />
      </Grid>
      <Grid container spacing={2} size={{ xs: 12, sm: 12 }} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SummaryCard
            title="Assets Summary"
            totals={assetTotals}
            breakdownFn={(currency) => getBreakdown(assets, currency)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SummaryCard
            title="Liabilities Summary"
            totals={liabilityTotals}
            breakdownFn={(currency) => getBreakdown(liabilities, currency)}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
