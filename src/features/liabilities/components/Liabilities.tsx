import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect, useState } from 'react';
import apiClient from '../../../services/ApiService';
import { Liability } from '../../../types/Liability';
import { formatNumber } from '../../../utils/common';
import log from '../../../utils/logger';

const Liabilities: React.FC = () => {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);

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

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          {liabilities.map((liability) => (
            <Grid size={3} key={liability.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{liability.name}</Typography>
                  <Typography color="textSecondary">
                    Type: {liability.type}
                  </Typography>
                  {liability.description && (
                    <Typography color="textSecondary">
                      Description: {liability.description}
                    </Typography>
                  )}
                  <Typography color="textSecondary">
                    Amount: {formatNumber(liability.amount)}{' '}
                    {liability.currency}
                  </Typography>
                  <Typography color="textSecondary">
                    Balance: {formatNumber(liability.balance)}{' '}
                    {liability.currency}
                  </Typography>
                  <Typography color="textSecondary">
                    Available to Spend:{' '}
                    {formatNumber(liability.amount - liability.balance)}{' '}
                    {liability.currency}
                  </Typography>
                  {liability.interestRate !== null &&
                    liability.interestRate !== undefined && (
                      <Typography color="textSecondary">
                        Interest Rate: {liability.interestRate}%
                      </Typography>
                    )}
                  {liability.statementDay && (
                    <Typography color="textSecondary">
                      Statement Day: {liability.statementDay}
                    </Typography>
                  )}
                  <Typography color="textSecondary">
                    Due Day: {liability.dueDay}
                  </Typography>
                  <Typography color="textSecondary">
                    Status: {liability.status}
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

export default Liabilities;
