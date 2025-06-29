import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { DialogProps } from '@toolpad/core/useDialogs';
import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../services/ApiService';
import { TransactionScan } from '../types/TransactionScan';
import { notifyBackendError } from '../utils/notifications';

const UploadTransactionImageDialog = ({
  onClose,
  open,
}: DialogProps<undefined, TransactionScan | null>) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of Array.from(items)) {
        if (item.type.indexOf('image') === 0) {
          const blob = item.getAsFile();
          if (blob) {
            if (imagePreview) {
              URL.revokeObjectURL(imagePreview);
            }
            setImagePreview(URL.createObjectURL(blob));
            setImageFile(
              new File([blob], 'clipboard.png', { type: blob.type }),
            );
          }
        }
      }
    };

    if (open) {
      document.addEventListener('paste', handlePaste);
    }
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [open, imagePreview]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file);
    }
  };

  const handleUpload = async () => {
    if (!imageFile) {
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      setLoading(true);
      const response = await apiClient.post('/transactions/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const transactionScan: TransactionScan = response.data;
      onClose(transactionScan);
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      notifyBackendError('Error extracting transaction', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose(null);
      }}
    >
      <DialogTitle>Scan Transaction</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Box mb={2}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              hidden
            />
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <Typography variant="body2">
                / (Ctrl/Cmd + V) directly here
              </Typography>
            </Box>
          </Box>
        )}
        {imagePreview && (
          <Box mt={2} display="flex" justifyContent="center">
            <Box
              border="2px solid"
              borderRadius={2}
              p={1}
              boxShadow={2}
              display="inline-block"
            >
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: 320, maxHeight: 300, display: 'block' }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            onClose(null);
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!imageFile || loading}>
          {loading ? 'Processing...' : 'Scan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadTransactionImageDialog;
