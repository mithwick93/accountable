import { Box, Typography } from '@mui/material';
import React from 'react';

const NotFoundPage = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
    bgcolor="background.default"
    px={3}
  >
    <Typography variant="h2" gutterBottom>
      404 - Page Not Found
    </Typography>
  </Box>
);

export default NotFoundPage;
