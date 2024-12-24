import { Box, Skeleton, Stack } from '@mui/material';
import React from 'react';

const LoadingSkeleton: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      padding: 2,
    }}
  >
    <Skeleton
      variant="rectangular"
      height={200}
      width="100%"
      sx={{ borderRadius: 1 }}
    />

    <Skeleton variant="rounded" height={40} width="70%" />

    <Skeleton variant="text" width="50%" />

    <Stack direction="row" spacing={2} alignItems="center">
      <Skeleton variant="circular" width={50} height={50} />
      <Stack spacing={1} width="100%">
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="80%" />
      </Stack>
    </Stack>
  </Box>
);

export default LoadingSkeleton;
