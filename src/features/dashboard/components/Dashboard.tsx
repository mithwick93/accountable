import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect, useState } from 'react';
import apiClient from '../../../services/ApiService';
import { Asset } from '../../../types/Asset';
import { formatCurrency } from '../../../utils/common';
import log from '../../../utils/logger';

const Dashboard: React.FC = () => {
  const [totals, setTotals] = useState<{ [currency: string]: number }>({});

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
        setTotals(totalsData);
      } catch (error) {
        log.error('Error fetching assets:', error);
      }
    };

    fetchAssetTotals();
  }, []);

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Asset Summary
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {Object.keys(totals).map((currency) => (
            <Grid size={3} key={currency}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{currency}</Typography>
                  <Typography color="textSecondary">
                    Total: {formatCurrency(totals[currency])} {currency}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default Dashboard;
