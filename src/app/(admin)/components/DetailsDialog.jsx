import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider
} from '@mui/material';

const DetailsDialog = ({ open, onClose, data }) => {
  if (!data) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Meeting Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Client Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Name:</strong> {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Email:</strong> {data.email}
          </Typography>
          {data.phone && (
            <Typography variant="body2" color="text.secondary">
              <strong>Phone:</strong> {data.phone}
            </Typography>
          )}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Meeting Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Room:</strong> {data.room}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Date:</strong> {data.date}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Time:</strong> {data.from_time} - {data.to_time}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Duration:</strong> {data.duration}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Guests:</strong> {data.guests}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailsDialog;
