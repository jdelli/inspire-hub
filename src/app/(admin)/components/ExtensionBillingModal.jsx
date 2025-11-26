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
import DescriptionIcon from '@mui/icons-material/Description';
import { saveAs } from 'file-saver';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from "../../../../script/firebaseConfig";

const ExtensionBillingModal = ({
  open,
  onClose,
  client,
  refreshClients
}) => {
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [rate, setRate] = useState(0);
  
  // Manual Overrides
  const [overrideSubtotal, setOverrideSubtotal] = useState('');
  const [overrideVat, setOverrideVat] = useState('');
  const [overrideTotal, setOverrideTotal] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize rate from client data
  React.useEffect(() => {
    if (client?.billing?.rate) {
      setRate(client.billing.rate);
    }
    // Reset overrides on new client
    setOverrideSubtotal('');
    setOverrideVat('');
    setOverrideTotal('');
    setExtensionMonths(1);
  }, [client, open]);

  // 1. Calculate Defaults
  const calcSubtotal = rate * extensionMonths;
  const calcVat = calcSubtotal * 0.12;
  
  // 2. Determine Final Values (Use override or default)
  // Note: If User overrides Subtotal, we normally re-calc VAT/Total unless they are ALSO overridden.
  
  const activeSubtotal = overrideSubtotal !== '' ? parseFloat(overrideSubtotal) : calcSubtotal;
  
  // If VAT is overridden, use it. If not, calc 12% of the ACTIVE subtotal
  const activeVat = overrideVat !== '' ? parseFloat(overrideVat) : activeSubtotal * 0.12;
  
  // If Total is overridden, use it. If not, sum active subtotal + active vat
  const activeTotal = overrideTotal !== '' ? parseFloat(overrideTotal) : activeSubtotal + activeVat;


  const handleDownloadInvoice = async () => {
    if (!client) return;
    setIsDownloading(true);

    try {
      const variables = {
        companyName: client.company || "N/A",
        clientName: client.name || "N/A",
        address: client.address || "",
        tin: client.tin || "",
        
        invoiceDate: new Date().toLocaleDateString(),
        dueDate: client.billing?.billingEndDate ? new Date(client.billing.billingEndDate).toLocaleDateString() : new Date().toLocaleDateString(),
        
        description: `Tenancy Extension (${extensionMonths} month${extensionMonths > 1 ? 's' : ''})`,
        months: extensionMonths,
        rate: rate.toLocaleString(),
        currency: client.billing?.currency || "PHP",
        
        // Format as integers as requested by user ("do not includ the deciumal")
        // But keep VAT precision if manually entered (like 3395.2)
        subtotal: Math.round(activeSubtotal).toLocaleString(),
        vat: activeVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        total: Math.round(activeTotal).toLocaleString()
      };

      const response = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables,
          templateName: 'contract_template.docx'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const blob = await response.blob();
      saveAs(blob, `Invoice_${client.company?.replace(/\s+/g, '_')}_Extension.docx`);

    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

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

      const extensionRecord = {
        from: currentEndDate.toISOString(),
        to: newEndDate.toISOString(),
        extendedAt: new Date().toISOString(),
        subtotal: activeSubtotal,
        vat: activeVat,
        amount: activeTotal,
        months: extensionMonths,
        rate: rate
      };

      await updateDoc(clientRef, {
        "billing.billingEndDate": newEndDate.toISOString(),
        "billing.monthsToAvail": (client.billing?.monthsToAvail || 0) + extensionMonths,
        "billing.total": (client.billing?.total || 0) + activeTotal,
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
              <Grid item xs={6}>
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
                    size="small"
                    fullWidth
                    disabled={isSubmitting}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Monthly Rate
                </Typography>
                <Box mt={1}>
                   <TextField
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    variant="outlined"
                    size="small"
                    fullWidth
                    disabled={isSubmitting}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Subtotal (Auto: Rate * Months)
                </Typography>
                <Box mt={1}>
                  <TextField
                    type="number"
                    // Display Override if set, else Calculated
                    // Use Math.round for default display as requested
                    value={overrideSubtotal !== '' ? overrideSubtotal : Math.round(calcSubtotal)}
                    onChange={(e) => setOverrideSubtotal(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                    helperText={overrideSubtotal !== '' ? "Manual Override" : "Auto-calculated"}
                    disabled={isSubmitting}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  VAT (Auto: 12%)
                </Typography>
                <Box mt={1}>
                  <TextField
                    type="number"
                    value={overrideVat !== '' ? overrideVat : (activeSubtotal * 0.12).toFixed(2)}
                    onChange={(e) => setOverrideVat(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                    helperText={overrideVat !== '' ? "Manual Override" : "Auto-calculated"}
                    disabled={isSubmitting}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={6}>
                     <Typography variant="subtitle1" fontWeight={600}>
                      Extension Total
                    </Typography>
                     <Typography variant="caption" color="text.secondary">
                      (Subtotal + VAT)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                     <TextField
                        type="number"
                        value={overrideTotal !== '' ? overrideTotal : Math.round(activeTotal)}
                        onChange={(e) => setOverrideTotal(e.target.value)}
                        variant="outlined"
                        size="small"
                        fullWidth
                        error={Math.abs(activeTotal - (activeSubtotal + activeVat)) > 1 && overrideTotal !== ''}
                        helperText={overrideTotal !== '' ? "Manual Override (Check Math!)" : "Auto-calculated"}
                        InputProps={{
                          style: { fontWeight: 'bold', fontSize: '1.1rem', color: '#1976d2' }
                        }}
                        disabled={isSubmitting}
                      />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleDownloadInvoice}
          color="secondary"
          variant="outlined"
          startIcon={<DescriptionIcon />}
          disabled={isSubmitting || isDownloading}
        >
          {isDownloading ? "Generating..." : "Download Invoice"}
        </Button>
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
