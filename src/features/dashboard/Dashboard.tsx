import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect, useState } from 'react';
import apiClient from '../../services/ApiService';
import { Asset } from '../../types/Asset';

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totals, setTotals] = useState<{ [currency: string]: number }>({});

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await apiClient.get('/assets');
        const assetsData = response.data;
        setAssets(assetsData);

        const totalsData: { [currency: string]: number } = {};
        assetsData.forEach((asset: Asset) => {
          if (!totalsData[asset.currency]) {
            totalsData[asset.currency] = 0;
          }
          totalsData[asset.currency] += asset.balance;
        });
        setTotals(totalsData);
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };

    fetchAssets();
  }, []);

  const formatBalance = (balance: number) =>
    new Intl.NumberFormat('en-US', { style: 'decimal' }).format(balance);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="h5" gutterBottom>
        Asset Totals
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {Object.keys(totals).map((currency) => (
            <Grid size={3} key={currency}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{currency}</Typography>
                  <Typography color="textSecondary">
                    Total: {formatBalance(totals[currency])} {currency}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Typography variant="h5" gutterBottom>
        Assets
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          {assets.map((asset) => (
            <Grid size={3} key={asset.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{asset.name}</Typography>
                  <Typography color="textSecondary">
                    Type: {asset.type}
                  </Typography>
                  <Typography color="textSecondary">
                    Description: {asset.description}
                  </Typography>
                  <Typography color="textSecondary">
                    Balance: {formatBalance(asset.balance)} {asset.currency}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </div>
  );
};

export default Dashboard;
