import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect, useState } from 'react';
import apiClient from '../../../services/ApiService';
import { Asset } from '../../../types/Asset';
import log from '../../../utils/logger';

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await apiClient.get('/assets');
        const assetsData = response.data;
        setAssets(assetsData);
      } catch (error) {
        log.error('Error fetching assets:', error);
      }
    };

    fetchAssets();
  }, []);

  const formatBalance = (balance: number) =>
    new Intl.NumberFormat('en-US', { style: 'decimal' }).format(balance);

  return (
    <>
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
    </>
  );
};

export default Assets;
