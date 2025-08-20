// components/EditTenantModal.js
"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Grid,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { green, blue, grey, orange, red } from "@mui/material/colors";
import { AttachMoney as AttachMoneyIcon, Calculate as CalculateIcon, Info as InfoIcon } from "@mui/icons-material";
import { updateTenantBillingInfo, calculateBillingAmount, formatPHP, getMonthlyBillingRecords } from "../utils/billingService";

export default function EditTenantModal({ open, onClose, client, onSave }) {
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    billing: {
      plan: "",
      rate: "",
      currency: "PHP",
      paymentMethod: "",
      startDate: "",
      billingStartDate: "",
      billingEndDate: "",
      price: "",
      frequency: "monthly",
      billingAddress: "",
      monthsToAvail: "",
      total: "",
      cusaFee: "",
      parkingFee: "",
      penaltyFee: "",
      damageFee: "",
    },
    selectedSeats: [],
    selectedPO: [],
    virtualOfficeFeatures: "",
    type: "dedicated",
  });

  const [billingPreview, setBillingPreview] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingBillingHistory, setLoadingBillingHistory] = useState(false);

  // Derived UI state
  const currencySymbol = useMemo(() => (formData.billing.currency === "USD" ? "$" : "₱"), [formData.billing.currency]);
  const isFormInvalid = useMemo(() => {
    return (
      !formData.company?.trim() ||
      !formData.name?.trim() ||
      !formData.email?.trim() ||
      !formData.billing?.startDate ||
      !formData.billing?.billingStartDate ||
      !formData.billing?.billingEndDate
    );
  }, [
    formData.company,
    formData.name,
    formData.email,
    formData.billing.startDate,
    formData.billing.billingStartDate,
    formData.billing.billingEndDate,
  ]);

  // Effect to update form data when the 'client' prop changes
  useEffect(() => {
    if (client) {
      setFormData({
        company: client.company || "",
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        billing: {
          plan: client.billing?.plan || "",
          rate: client.billing?.rate || "",
          currency: client.billing?.currency || "PHP",
          paymentMethod: client.billing?.paymentMethod || "",
          startDate: client.billing?.startDate || "",
          billingStartDate: client.billing?.billingStartDate || "",
          billingEndDate: client.billing?.billingEndDate || "",
          price: client.billing?.price || "",
          frequency: client.billing?.frequency || "monthly",
          billingAddress: client.billing?.billingAddress || "",
          monthsToAvail: client.billing?.monthsToAvail || "",
          total: client.billing?.total || "",
          cusaFee: client.billing?.cusaFee || "",
          parkingFee: client.billing?.parkingFee || "",
          penaltyFee: client.billing?.penaltyFee || "",
          damageFee: client.billing?.damageFee || "",
        },
        selectedSeats: Array.isArray(client.selectedSeats) ? client.selectedSeats : [],
        selectedPO: Array.isArray(client.selectedPO) ? client.selectedPO : [],
        virtualOfficeFeatures: client.virtualOfficeFeatures || "",
        type: client.type || "dedicated",
        id: client.id,
      });
    }
  }, [client]);

  // Calculate billing preview whenever relevant fields change
  useEffect(() => {
    if (formData.billing.rate || formData.billing.cusaFee || formData.billing.parkingFee) {
      calculateBillingPreview();
    }
  }, [formData.billing.rate, formData.billing.cusaFee, formData.billing.parkingFee, formData.selectedSeats, formData.selectedPO]);

  // Load billing history when client changes
  useEffect(() => {
    if (client && client.id) {
      loadBillingHistory();
    }
  }, [client]);

  const loadBillingHistory = async () => {
    if (!client?.id) return;
    
    setLoadingBillingHistory(true);
    try {
      // Get billing records for the last 12 months
      const currentDate = new Date();
      const billingRecords = [];
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        try {
          const monthRecords = await getMonthlyBillingRecords(monthKey);
          const tenantRecords = monthRecords.filter(record => record.tenantId === client.id);
          billingRecords.push(...tenantRecords);
        } catch (error) {
          console.warn(`Error loading billing records for ${monthKey}:`, error);
        }
      }
      
      setBillingHistory(billingRecords);
    } catch (error) {
      console.error('Error loading billing history:', error);
    } finally {
      setLoadingBillingHistory(false);
    }
  };

  const calculateBillingPreview = () => {
    setIsCalculating(true);
    try {
      const tenantForCalculation = {
        ...formData,
        billing: {
          ...formData.billing,
          rate: parseFloat(formData.billing.rate) || 0,
          cusaFee: parseFloat(formData.billing.cusaFee) || 0,
          parkingFee: parseFloat(formData.billing.parkingFee) || 0,
          penaltyFee: parseFloat(formData.billing.penaltyFee) || 0,
          damageFee: parseFloat(formData.billing.damageFee) || 0,
        }
      };

      const billingAmounts = calculateBillingAmount(tenantForCalculation);
      setBillingPreview(billingAmounts);
    } catch (error) {
      console.error('Error calculating billing preview:', error);
      setBillingPreview(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("billing.")) {
      setFormData((prev) => ({
        ...prev,
        billing: {
          ...prev.billing,
          [name.split(".")[1]]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSeatInputChange = (e) => {
    const { value } = e.target;
    const seatsArray = value.split(',').map(seat => seat.trim()).filter(seat => seat !== '');
    setFormData(prev => ({
      ...prev,
      selectedSeats: seatsArray,
    }));
  };

  const handleDeleteSeat = (seatToDelete) => {
    setFormData(prev => ({
      ...prev,
      selectedSeats: prev.selectedSeats.filter(seat => seat !== seatToDelete),
    }));
  };

  const handlePOInputChange = (e) => {
    const { value } = e.target;
    const poArray = value.split(',').map(po => po.trim()).filter(po => po !== '');
    setFormData(prev => ({
      ...prev,
      selectedPO: poArray,
    }));
  };

  const handleDeletePO = (poToDelete) => {
    setFormData(prev => ({
      ...prev,
      selectedPO: prev.selectedPO.filter(po => po !== poToDelete),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company || !formData.name || !formData.email) {
      setAlert({
        type: 'error',
        message: 'Company, Name, and Email are required fields.'
      });
      return;
    }

    setIsSaving(true);
    setAlert(null);

    try {
      // Update tenant information
      const updatedClientData = { ...formData };
      
      // Update billing information in the database
      if (formData.id) {
        const billingUpdateResult = await updateTenantBillingInfo(
          formData.id,
          formData.type,
          formData.billing
        );

        if (billingUpdateResult.success) {
          setAlert({
            type: 'success',
            message: billingUpdateResult.message
          });
        }
      }

      // Call the parent's onSave function
      onSave(updatedClientData);
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error updating tenant:', error);
      setAlert({
        type: 'error',
        message: `Failed to update tenant: ${error.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTenantTypeLabel = (type) => {
    switch (type) {
      case 'dedicated':
        return 'Dedicated Desk';
      case 'private':
        return 'Private Office';
      case 'virtual':
        return 'Virtual Office';
      default:
        return type;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '92vh',
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Edit Tenant Details
          </Typography>
          {(formData.company || formData.name) && (
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
              {formData.company && (
                <Typography variant="body2" color="text.secondary">{formData.company}</Typography>
              )}
              {formData.type && (
                <Chip
                  size="small"
                  variant="outlined"
                  color="primary"
                  label={getTenantTypeLabel(formData.type)}
                />
              )}
            </Stack>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {alert && (
        <Alert severity={alert.type} sx={{ mx: 2, mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <DialogContent dividers sx={{ bgcolor: 'grey.50' }}>
        <Box id="edit-tenant-form" component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Grid container spacing={3}>
            {/* Left Column: Forms */}
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                {/* Client Information */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InfoIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight={700}>Client Information</Typography>
                      </Stack>
                    }
                    sx={{ pb: 0.5 }}
                  />
                  <CardContent sx={{ pt: 1.5 }}>
                    <TableContainer>
                      <Table size="small" aria-label="client information table">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ width: 220, fontWeight: 600 }}>Company Name</TableCell>
                            <TableCell>
                              <TextField
                                placeholder="Enter company name"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                fullWidth
                                required
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Client Name</TableCell>
                            <TableCell>
                              <TextField
                                placeholder="Enter client name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell>
                              <TextField
                                placeholder="name@company.com"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                fullWidth
                                required
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell>
                              <TextField
                                placeholder="e.g., +63 900 000 0000"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ verticalAlign: 'top', pt: 1.5, fontWeight: 600 }}>Address</TableCell>
                            <TableCell>
                              <TextField
                                placeholder="Street, City, Country"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                                multiline
                                rows={2}
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>

                {/* Billing Details */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AttachMoneyIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight={700}>Billing Details</Typography>
                      </Stack>
                    }
                    sx={{ pb: 0.5 }}
                  />
                  <CardContent sx={{ pt: 1.5 }}>
                    <TableContainer>
                      <Table size="small" aria-label="billing details table">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ width: 220, fontWeight: 600 }}>Plan</TableCell>
                            <TableCell>
                              <TextField
                                placeholder="Plan name"
                                name="billing.plan"
                                value={formData.billing.plan}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                            <TableCell>
                              <TextField
                                placeholder={`0.00`}
                                name="billing.rate"
                                type="number"
                                value={formData.billing.rate}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>CUSA Fee</TableCell>
                            <TableCell>
                              <TextField
                                placeholder={`0.00`}
                                name="billing.cusaFee"
                                type="number"
                                value={formData.billing.cusaFee}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Parking Fee</TableCell>
                            <TableCell>
                              <TextField
                                placeholder={`0.00`}
                                name="billing.parkingFee"
                                type="number"
                                value={formData.billing.parkingFee}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <InputLabel id="currency-label">Currency</InputLabel>
                                <Select
                                  labelId="currency-label"
                                  id="currency"
                                  name="billing.currency"
                                  value={formData.billing.currency}
                                  label="Currency"
                                  onChange={handleChange}
                                >
                                  <MenuItem value="PHP">PHP (₱)</MenuItem>
                                  <MenuItem value="USD">USD ($)</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                            <TableCell>
                              <TextField
                                placeholder="e.g., Bank Transfer, GCash, Credit Card"
                                name="billing.paymentMethod"
                                value={formData.billing.paymentMethod}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Contract Start Date</TableCell>
                            <TableCell>
                              <TextField
                                name="billing.startDate"
                                type="date"
                                value={formData.billing.startDate}
                                onChange={handleChange}
                                fullWidth
                                required
                                variant="outlined"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Billing Start Date</TableCell>
                            <TableCell>
                              <TextField
                                name="billing.billingStartDate"
                                type="date"
                                value={formData.billing.billingStartDate}
                                onChange={handleChange}
                                fullWidth
                                required
                                variant="outlined"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Billing End Date</TableCell>
                            <TableCell>
                              <TextField
                                name="billing.billingEndDate"
                                type="date"
                                value={formData.billing.billingEndDate}
                                onChange={handleChange}
                                fullWidth
                                required
                                variant="outlined"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Months to Avail</TableCell>
                            <TableCell>
                              <TextField
                                name="billing.monthsToAvail"
                                type="number"
                                value={formData.billing.monthsToAvail}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                                inputProps={{ min: 0 }}
                                helperText="Optional: for prepaid durations"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ verticalAlign: 'top', pt: 1.5, fontWeight: 600 }}>Billing Address</TableCell>
                            <TableCell>
                              <TextField
                                name="billing.billingAddress"
                                value={formData.billing.billingAddress}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                size="small"
                                multiline
                                rows={2}
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>

                {/* Conditional Fields */}
                {formData.type === "dedicated" && (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardHeader
                      title={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <InfoIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight={700}>Dedicated Desk Details</Typography>
                        </Stack>
                      }
                      sx={{ pb: 0.5 }}
                    />
                    <CardContent sx={{ pt: 1.5 }}>
                      <TextField
                        label="Selected Seats (e.g., map1-A1, map2-B3)"
                        name="selectedSeats"
                        value={formData.selectedSeats.join(", ")}
                        onChange={handleSeatInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        helperText="Enter seat numbers separated by commas."
                      />
                      <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap">
                        {formData.selectedSeats.map((seat, index) => (
                          <Chip
                            key={index}
                            label={seat}
                            size="small"
                            onDelete={() => handleDeleteSeat(seat)}
                            sx={{ bgcolor: blue[50], color: blue[800], mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {formData.type === "private" && (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardHeader
                      title={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <InfoIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight={700}>Private Office Details</Typography>
                        </Stack>
                      }
                      sx={{ pb: 0.5 }}
                    />
                    <CardContent sx={{ pt: 1.5 }}>
                      <TextField
                        label="Selected Private Office(s) (e.g., PO1, PO2)"
                        name="selectedPO"
                        value={formData.selectedPO.join(", ")}
                        onChange={handlePOInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        helperText="Enter office numbers separated by commas."
                      />
                      <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap">
                        {formData.selectedPO.map((office, index) => (
                          <Chip
                            key={index}
                            label={office}
                            size="small"
                            onDelete={() => handleDeletePO(office)}
                            sx={{ bgcolor: blue[50], color: blue[800], mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {formData.type === "virtual" && (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardHeader
                      title={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <InfoIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight={700}>Virtual Office Details</Typography>
                        </Stack>
                      }
                      sx={{ pb: 0.5 }}
                    />
                    <CardContent sx={{ pt: 1.5 }}>
                      <TextField
                        label="Virtual Office Features (e.g., Mail Handling, Meeting Room Hours)"
                        name="virtualOfficeFeatures"
                        value={formData.virtualOfficeFeatures}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        multiline
                        rows={3}
                        helperText="Describe the virtual office services/features."
                      />
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Grid>

            {/* Right Column: Preview & History */}
            <Grid item xs={12} md={5}>
              <Stack spacing={3}>
                <Card variant="outlined" sx={{ borderRadius: 2, position: 'relative' }}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalculateIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight={700}>Billing Preview</Typography>
                      </Stack>
                    }
                    sx={{ pb: 0.5 }}
                  />
                  <CardContent sx={{ pt: 1.5 }}>
                    {isCalculating && (
                      <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                    {billingPreview ? (
                      <TableContainer>
                        <Table size="small" aria-label="billing preview table">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow hover>
                              <TableCell>Base Amount</TableCell>
                              <TableCell align="right">{formatPHP(billingPreview.baseAmount)}</TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>CUSA Fee</TableCell>
                              <TableCell align="right" sx={{ color: orange[600], fontWeight: 700 }}>{formatPHP(billingPreview.cusaFee)}</TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>Parking Fee</TableCell>
                              <TableCell align="right" sx={{ color: orange[600], fontWeight: 700 }}>{formatPHP(billingPreview.parkingFee)}</TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>Subtotal</TableCell>
                              <TableCell align="right" sx={{ color: blue[600], fontWeight: 700 }}>{formatPHP(billingPreview.subtotal)}</TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>VAT (12%)</TableCell>
                              <TableCell align="right" sx={{ color: red[600], fontWeight: 700 }}>{formatPHP(billingPreview.vat)}</TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                              <TableCell align="right" sx={{ color: green[600], fontWeight: 800 }}>{formatPHP(billingPreview.total)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Enter rate and fees to see a live billing preview.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                {client?.id && (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardHeader
                      title={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AttachMoneyIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight={700}>Billing History</Typography>
                        </Stack>
                      }
                      sx={{ pb: 0.5 }}
                    />
                    <CardContent sx={{ pt: 1.5 }}>
                      {loadingBillingHistory ? (
                        <Box display="flex" justifyContent="center" p={2}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : billingHistory.length > 0 ? (
                        <TableContainer>
                          <Table size="small" aria-label="billing history table">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {billingHistory.slice(0, 6).map((record, index) => (
                                <TableRow key={record.id || index} hover>
                                  <TableCell>{record.billingMonth}</TableCell>
                                  <TableCell>{new Date(record.dueDate).toLocaleDateString()}</TableCell>
                                  <TableCell align="right">{formatPHP(record.total)}</TableCell>
                                  <TableCell align="right">
                                    <Chip
                                      label={record.status.toUpperCase()}
                                      size="small"
                                      color={getStatusColor(record.status)}
                                      sx={{ fontSize: '0.7rem', height: 20 }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info">
                          No billing history found for this tenant.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: grey[700], borderColor: grey[300], '&:hover': { borderColor: grey[500] } }}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-tenant-form"
          variant="contained"
          disabled={isSaving || isFormInvalid}
          startIcon={isSaving ? <CircularProgress size={16} /> : null}
          sx={{ bgcolor: green[600], "&:hover": { bgcolor: green[700] } }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}