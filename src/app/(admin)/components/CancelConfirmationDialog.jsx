import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const CancelConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  reservation
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Cancel Meeting</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to cancel this meeting?
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Meeting Details:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Room:</strong> {reservation?.room}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Date:</strong> {reservation?.date}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Time:</strong> {reservation?.from_time} - {reservation?.to_time}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelConfirmationDialog;
