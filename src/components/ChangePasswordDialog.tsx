import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { DialogProps } from '@toolpad/core/useDialogs';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { AuthService } from '../services/AuthService';
import { PASSWORD_PATTERN } from '../utils/common';

const ChangePasswordDialog = ({ onClose, open }: DialogProps) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errors: typeof validationErrors = {};
    if (!oldPassword) {
      errors.oldPassword = 'Old password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!PASSWORD_PATTERN.test(newPassword)) {
      errors.newPassword =
        'Password must be at least 8 characters and include upper, lower, number, and special character.';
    } else if (newPassword === oldPassword) {
      errors.newPassword = 'New password must be different from old password';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'New passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await AuthService.changePassword(oldPassword, newPassword);
      toast.success('Password changed successfully. Please log in again.');
      onClose();
    } catch (e: any) {
      toast.error(
        e.response?.data?.detail || e.message || 'Failed to change password',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (
    field: 'oldPassword' | 'newPassword' | 'confirmPassword',
    value: string,
  ) => {
    if (field === 'oldPassword') {
      setOldPassword(value);
    }
    if (field === 'newPassword') {
      setNewPassword(value);
    }
    if (field === 'confirmPassword') {
      setConfirmPassword(value);
    }
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
      }}
    >
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <TextField
          label="Old Password"
          type="password"
          fullWidth
          margin="normal"
          value={oldPassword}
          onChange={(e) => handleFieldChange('oldPassword', e.target.value)}
          error={!!validationErrors.oldPassword}
          helperText={validationErrors.oldPassword}
          onFocus={() =>
            setValidationErrors((prev) => ({ ...prev, oldPassword: undefined }))
          }
          required
        />
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={(e) => handleFieldChange('newPassword', e.target.value)}
          error={!!validationErrors.newPassword}
          helperText={validationErrors.newPassword}
          onFocus={() =>
            setValidationErrors((prev) => ({ ...prev, newPassword: undefined }))
          }
          required
        />
        <TextField
          label="Confirm New Password"
          type="password"
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
          error={!!validationErrors.confirmPassword}
          helperText={validationErrors.confirmPassword}
          onFocus={() =>
            setValidationErrors((prev) => ({
              ...prev,
              confirmPassword: undefined,
            }))
          }
          required
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            onClose();
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          Change
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
