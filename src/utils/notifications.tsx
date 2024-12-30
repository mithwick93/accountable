import { Stack } from '@mui/material';
import React from 'react';
import { toast } from 'react-toastify';
import log from './logger';

export const notifyBackendError = (title: string, error: any) => {
  log.error(title, error);
  toast.error(
    <Stack>
      <strong>{title}</strong>
      <div>{`HTTP status: ${error.response?.data?.status}`}</div>
      <div>{`HTTP title: ${error.response?.data?.title}`}</div>
      <div>{error.response?.data?.detail}</div>
    </Stack>,
    { autoClose: false },
  );
};
