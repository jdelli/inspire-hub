"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  HomeWork as HomeWorkIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../script/firebaseConfig";

export default function TenantAnalytics({ clients, privateOfficeClients, virtualOfficeClients }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate analytics data
  useEffect(() => {
    if (clients && privateOfficeClients && virtualOfficeClients) {
      const allClients = [...clients, ...privateOfficeClients, ...virtualOfficeClients];
      
      // Basic statistics
      const totalTenants = allClients.length;
      const dedicatedDesks = clients.length;
      const privateOffices = privateOfficeClients.length;
      const virtualOffices = virtualOfficeClients.length;
      
      // Revenue calculations
      const totalRevenue = allClients.reduce((sum, client) => {
        return sum + (parseFloat(client.billing?.rate) || 0);
      }, 0);
      
      // Occupancy rates
      const totalSeats = 50; // Assuming 50 total seats
      const occupiedSeats = clients.reduce((sum, client) => {
        return sum + (client.selectedSeats?.length || 0);
      }, 0);
      const occupancyRate = (occupiedSeats / totalSeats) * 100;
      
      // Contract analysis
      const activeContracts = allClients.filter(client => client.status === 'active').length;
      const expiringSoon = allClients.filter(client => {
        if (!client.billing?.billingEndDate) return false;
        const daysLeft = Math.ceil((new Date(client.billing.billingEndDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 30;
      }).length;
      
      // Tenant type distribution
      const typeDistribution = {
        'Dedicated Desk': dedicatedDesks,
        'Private Office': privateOffices,
        'Virtual Office': virtualOffices
      };
      
      // Monthly trends (simulated)
      const monthlyTrends = [
        { month: 'Jan', tenants: 45, revenue: 150000 },
        { month: 'Feb', tenants: 48, revenue: 165000 },
        { month: 'Mar', tenants: 52, revenue: 180000 },
        { month: 'Apr', tenants: 55, revenue: 195000 },
        { month: 'May', tenants: 58, revenue: 210000 },
        { month: 'Jun', tenants: 62, revenue: 225000 },
      ];
      
      setAnalyticsData({
        totalTenants,
        dedicatedDesks,
        privateOffices,
        virtualOffices,
        totalRevenue,
        occupancyRate,
        activeContracts,
        expiringSoon,
        typeDistribution,
        monthlyTrends
      });
      setIsLoading(false);
    }
  }, [clients, privateOfficeClients, virtualOfficeClients]);

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'expiring': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Tenant Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into your tenant management
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {/* Export functionality */}}
          >
            Export Report
          </Button>
        </Stack>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Total Tenants
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {analyticsData?.totalTenants || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Active contracts
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <PeopleIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {formatCurrency(analyticsData?.totalRevenue || 0)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Gross revenue
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <AttachMoneyIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Occupancy Rate
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {Math.round(analyticsData?.occupancyRate || 0)}%
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Space utilization
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <AssessmentIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Expiring Soon
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {analyticsData?.expiringSoon || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Next 30 days
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <WarningIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different analytics views */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Tenant Distribution" />
          <Tab label="Revenue Trends" />
          <Tab label="Performance Metrics" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Tenant Type Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tenant Type Distribution</Typography>
                <Stack spacing={2}>
                  {Object.entries(analyticsData?.typeDistribution || {}).map(([type, count]) => (
                    <Box key={type}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">{type}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {count} ({Math.round((count / analyticsData.totalTenants) * 100)}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / analyticsData.totalTenants) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    fullWidth
                    onClick={() => {/* Navigate to add tenant */}}
                  >
                    Add New Tenant
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CalendarIcon />}
                    fullWidth
                    onClick={() => {/* Navigate to billing */}}
                  >
                    Generate Billing
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    fullWidth
                    onClick={() => {/* Navigate to reports */}}
                  >
                    View Reports
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<WarningIcon />}
                    fullWidth
                    onClick={() => {/* Navigate to expiring contracts */}}
                  >
                    Expiring Contracts
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Detailed Tenant Distribution</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Average Revenue</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(analyticsData?.typeDistribution || {}).map(([type, count]) => (
                    <TableRow key={type}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {type === 'Dedicated Desk' && <PeopleIcon />}
                          {type === 'Private Office' && <BusinessIcon />}
                          {type === 'Virtual Office' && <HomeWorkIcon />}
                          {type}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{count}</TableCell>
                      <TableCell align="right">
                        {Math.round((count / analyticsData.totalTenants) * 100)}%
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(analyticsData.totalRevenue / analyticsData.totalTenants)}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Revenue Trends (Last 6 Months)</Typography>
            <Box height={300} display="flex" alignItems="center" justifyContent="center">
              <Typography color="text.secondary">
                Chart visualization would go here
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Tenants</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Growth</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData?.monthlyTrends.map((trend, index) => (
                    <TableRow key={trend.month}>
                      <TableCell>{trend.month}</TableCell>
                      <TableCell align="right">{trend.tenants}</TableCell>
                      <TableCell align="right">{formatCurrency(trend.revenue)}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                          {index > 0 && (
                            <>
                              {trend.tenants > analyticsData.monthlyTrends[index - 1].tenants ? (
                                <TrendingUpIcon color="success" fontSize="small" />
                              ) : (
                                <TrendingDownIcon color="error" fontSize="small" />
                              )}
                              <Typography variant="body2" color={trend.tenants > analyticsData.monthlyTrends[index - 1].tenants ? 'success.main' : 'error.main'}>
                                {Math.abs(trend.tenants - analyticsData.monthlyTrends[index - 1].tenants)}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <Stack spacing={3}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Occupancy Rate</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {Math.round(analyticsData?.occupancyRate || 0)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={analyticsData?.occupancyRate || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Contract Renewal Rate</Typography>
                      <Typography variant="body2" fontWeight={600}>85%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={85}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Customer Satisfaction</Typography>
                      <Typography variant="body2" fontWeight={600}>4.2/5</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={84}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Alerts & Notifications</Typography>
                <Stack spacing={2}>
                  {analyticsData?.expiringSoon > 0 && (
                    <Alert severity="warning" icon={<WarningIcon />}>
                      {analyticsData.expiringSoon} contracts expiring in the next 30 days
                    </Alert>
                  )}
                  
                  {analyticsData?.occupancyRate < 80 && (
                    <Alert severity="info" icon={<AssessmentIcon />}>
                      Occupancy rate below target (80%). Consider marketing initiatives.
                    </Alert>
                  )}
                  
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    All systems operational. No critical issues detected.
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
