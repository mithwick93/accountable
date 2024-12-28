import { Button, DialogActions, DialogContent, TextField } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import React from 'react';
import SlideUpTransition from '../transition/SlideUpTransition';

interface CreateTransactionDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateTransactionDialog = ({
  onClose,
  open,
}: CreateTransactionDialogProps) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      TransitionComponent={SlideUpTransition}
      keepMounted
      aria-describedby="alert-dialog-slide-description"
      fullWidth
    >
      <DialogTitle>Record Transaction</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        <TextField
          margin="dense"
          id="name"
          label="Name"
          type="text"
          fullWidth
        />
        <TextField
          margin="dense"
          id="amount"
          label="Amount"
          type="number"
          fullWidth
        />
        <TextField
          margin="dense"
          id="date"
          label="Date"
          type="date"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTransactionDialog;
