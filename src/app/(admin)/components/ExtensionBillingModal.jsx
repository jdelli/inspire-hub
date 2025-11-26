import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
  Stack,
  TextField
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from "../../../../script/firebaseConfig";

const ExtensionBillingModal = ({
  open,
  onClose,
  client,
  refreshClients
}) => {
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExtendTenancy = async () => {
    if (!client || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const collectionName = client.selectedPO ? "privateOffice" : "seatMap";
      const clientRef = doc(db, collectionName, client.id);

      const currentEndDate = client.billing?.billingEndDate 
        ? new Date(client.billing.billingEndDate)
        : new Date();

      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

      const subtotal = client.billing?.rate 
        ? client.billing.rate * extensionMonths
        : 0;
      
      const vat = subtotal * 0.12; // 12% VAT
      const newTotal = subtotal + vat;

      const extensionRecord = {
        from: currentEndDate.toISOString(),
        to: newEndDate.toISOString(),
        extendedAt: new Date().toISOString(),
        subtotal: subtotal,
        vat: vat,
        amount: newTotal,
        months: extensionMonths,
      };

      await updateDoc(clientRef, {
        "billing.billingEndDate": newEndDate.toISOString(),
        "billing.monthsToAvail": (client.billing?.monthsToAvail || 0) + extensionMonths,
        "billing.total": (client.billing?.total || 0) + newTotal,
        "billing.extensionHistory": [
          ...(client.billing?.extensionHistory || []),
          extensionRecord
        ],
      });

      await refreshClients();
      onClose();
    } catch (error) {
      console.error("Error extending tenancy:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {/* Avoid nested headings */}
        <Box>
          <Typography component="h2" variant="h6" fontWeight={700}>
            Extend Tenancy
          </Typography>
          <Typography component="p" variant="subtitle2" color="text.secondary">
            {client?.company} - {client?.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Current Billing Period
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {client?.billing?.startDate || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {client?.billing?.billingEndDate || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Extension Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Months to Extend
                </Typography>
                <Box mt={1}>
                  <TextField
                    type="number"
                    value={extensionMonths}
                    onChange={(e) => setExtensionMonths(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1, max: 12 }}
                    variant="outlined"
                    fullWidth
                    disabled={isSubmitting}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Monthly Rate
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {client?.billing?.rate 
                    ? `${client.billing.rate} ${client.billing.currency || ""}`
                    : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {client?.billing?.rate 
                    ? `${(client.billing.rate * extensionMonths).toFixed(2)} ${client.billing.currency || ""}`
                    : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  VAT (12%)
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {client?.billing?.rate 
                    ? `${(client.billing.rate * extensionMonths * 0.12).toFixed(2)} ${client.billing.currency || ""}`
                    : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Extension Total
                </Typography>
                <Typography variant="body2" fontWeight={600} color="primary">
                  {client?.billing?.rate 
                    ? `${(client.billing.rate * extensionMonths * 1.12).toFixed(2)} ${client.billing.currency || ""}`
                    : "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary" variant="outlined" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleExtendTenancy} 
          color="primary" 
          variant="contained"
          startIcon={<EventAvailableIcon />}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Confirm Extension"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtensionBillingModal;
