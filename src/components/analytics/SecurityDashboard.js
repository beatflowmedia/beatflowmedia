// src/components/analytics/SecurityDashboard.js
// Security monitoring dashboard with DRM, fraud detection, and compliance tracking

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge
} from "@mui/material";
import {
import { Avatar } from '@mui/material/Avatar';
import { Tooltip } from '@mui/material/Tooltip';
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Shield as ShieldIcon as LockIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  Gavel as LegalIcon,
  Fingerprint as FingerprintIcon,
  VpnKey as KeyIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon as DownloadIcon
} from "@mui/icons-material";

// Security metric card
const SecurityMetric = ({
  title,
  value,
  unit,
  status,
  description,
  icon,
  alert
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "secure":
        return "success";
      case "warning":
        return "warning";
      case "threat":
        return "error";
      default:
        return "info";
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="body2" color="textSecondary">
            {title}
          </Typography>
          <Badge badgeContent={alert ? "!" : 0} color="error">
            <Avatar
              sx={{
                bgcolor: `${getStatusColor()}.light`,
                width: 32,
                height: 32
              }}
            >
              {icon}
            </Avatar>
          </Badge>
        </Box>

        <Typography
          variant="h4"
          color={`${getStatusColor()}.main`}
          gutterBottom
        >
          {typeof value === "number" ? value.toLocaleString() : value}
          {unit}
        </Typography>

        <Typography variant="body2" color="textSecondary">
          {description}
        </Typography>

        {alert && (
          <Alert
            severity={status === "threat" ? "error" : "warning"}
            sx={{ mt: 1 }}
          >
            {alert}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// DRM monitoring component
const DRMMonitoring = ({ data }) => {
  const drmData = {
    totalLicenseRequests: 145678,
    successfulLicenses: 143892,
    failedLicenses: 1786,
    successRate: 98.77,
    avgLicenseTime: 245,
    activeLicenses: 23456,
    expiredLicenses: 892,
    revokedLicenses: 23
  };

  const drmProviders = [
    { name: "Widevine", requests: 89234, success: 98.9, status: "secure" },
    { name: "PlayReady", requests: 34567, success: 98.5, status: "secure" },
    { name: "FairPlay", requests: 21877, success: 99.1, status: "secure" },
  ];

  return (
    <Card>
      <CardHeader
        title="DRM Monitoring"
        action={
          <Chip
            label="All Providers Active"
            color="success"
            size="small"
            icon={<ShieldIcon />}
          />
        }
      />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {drmData.successRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Success Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {drmData.avgLicenseTime}ms
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg License Time
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {drmData.activeLicenses.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Licenses
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main">
                {drmData.revokedLicenses}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Revoked (24h)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          DRM Provider Performance
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Provider</TableCell>
                <TableCell align="right">Requests</TableCell>
                <TableCell align="right">Success Rate</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drmProviders.map((provider) => (
                <TableRow key={provider.name}>
                  <TableCell>{provider.name}</TableCell>
                  <TableCell align="right">
                    {provider.requests.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">{provider.success}%</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={provider.status}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Fraud detection component
const FraudDetection = ({ data }) => {
  const fraudData = {
    suspiciousActivities: 23,
    blockedAttempts: 156,
    flaggedUsers: 8,
    riskyTransactions: 12,
    automatedBlocks: 89,
    manualReviews: 34
  };

  const recentEvents = [
    {
      id: 1,
      type: "Suspicious Login",
      description: "Multiple failed login attempts from IP 192.168.1.100",
      severity: "warning",
      timestamp: "5 minutes ago",
      action: "Auto-blocked"
    },
    {
      id: 2,
      type: "Payment Fraud",
      description: "Unusual payment pattern detected for user #12345",
      severity: "threat",
      timestamp: "12 minutes ago",
      action: "Under Review"
    },
    {
      id: 3,
      type: "Content Piracy",
      description: "Unauthorized streaming detected from suspicious domain",
      severity: "threat",
      timestamp: "25 minutes ago",
      action: "Legal Notice Sent"
    },
    {
      id: 4,
      type: "Bot Activity",
      description: "Automated playlist creation pattern detected",
      severity: "warning",
      timestamp: "45 minutes ago",
      action: "Rate Limited"
    },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "threat":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "default";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "threat":
        return <ErrorIcon />;
      case "warning":
        return <WarningIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  return (
    <Card>
      <CardHeader
        title="Fraud Detection"
        action={
          <Badge badgeContent={fraudData.suspiciousActivities} color="error">
            <SecurityIcon />
          </Badge>
        }
      />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {fraudData.suspiciousActivities}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Suspicious Activities
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main">
                {fraudData.blockedAttempts}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Blocked Attempts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {fraudData.flaggedUsers}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Flagged Users
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {fraudData.riskyTransactions}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Risky Transactions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {fraudData.automatedBlocks}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Auto Blocked
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {fraudData.manualReviews}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manual Reviews
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Recent Security Events
        </Typography>
        <List dense>
          {recentEvents.map((event, index) => (
            <React.Fragment key={event.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: `${getSeverityColor(event.severity)}.light`
                    }}
                  >
                    {getSeverityIcon(event.severity)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body1">{event.type}</Typography>
                      <Chip
                        label={event.action}
                        color={getSeverityColor(event.severity)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        {event.description}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {event.timestamp}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < recentEvents.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Authentication security
const AuthenticationSecurity = ({ data }) => {
  const authData = {
    totalLogins: 45678,
    successfulLogins: 44892,
    failedLogins: 786,
    suspiciousLogins: 23,
    mfaEnabled: 78.5,
    passwordStrength: 85.2,
    sessionTimeouts: 156,
    accountLockouts: 34
  };

  return (
    <Card>
      <CardHeader
        title="Authentication Security"
        action={
          <Chip
            label="MFA Adoption: 78.5%"
            color="warning"
            size="small"
            icon={<KeyIcon />}
          />
        }
      />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {(
                  (authData.successfulLogins / authData.totalLogins) *
                  100
                ).toFixed(1)}
                %
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Login Success Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {authData.suspiciousLogins}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Suspicious Logins
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {authData.mfaEnabled}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                MFA Enabled
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {authData.passwordStrength}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Strong Passwords
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Multi-Factor Authentication Adoption
          </Typography>
          <LinearProgress
            variant="determinate"
            value={authData.mfaEnabled}
            color={authData.mfaEnabled > 80 ? "success" : "warning"}
            sx={{ height: 8, borderRadius: 1, mb: 2 }}
          />

          <Typography variant="body2" color="textSecondary" gutterBottom>
            Password Strength Compliance
          </Typography>
          <LinearProgress
            variant="determinate"
            value={authData.passwordStrength}
            color={authData.passwordStrength > 80 ? "success" : "warning"}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            Failed logins: {authData.failedLogins} • Account lockouts:{" "}
            {authData.accountLockouts} • Session timeouts:{" "}
            {authData.sessionTimeouts}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Compliance monitoring
const ComplianceMonitoring = ({ data }) => {
  const complianceData = {
    gdprCompliance: 98.5,
    dataRetentionCompliance: 95.2,
    auditTrailIntegrity: 99.8,
    privacyPolicyCompliance: 97.1,
    territorialCompliance: 94.8,
    royaltyCompliance: 99.2
  };

  const complianceItems = [
    {
      name: "GDPR Compliance",
      value: complianceData.gdprCompliance,
      target: 95
    },
    {
      name: "Data Retention",
      value: complianceData.dataRetentionCompliance,
      target: 90
    },
    {
      name: "Audit Trail Integrity",
      value: complianceData.auditTrailIntegrity,
      target: 98
    },
    {
      name: "Privacy Policy",
      value: complianceData.privacyPolicyCompliance,
      target: 95
    },
    {
      name: "Territorial Rights",
      value: complianceData.territorialCompliance,
      target: 90
    },
    {
      name: "Royalty Calculations",
      value: complianceData.royaltyCompliance,
      target: 98
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Compliance Monitoring"
        action={
          <Chip
            label="Audit Ready"
            color="success"
            size="small"
            icon={<LegalIcon />}
          />
        }
      />
      <CardContent>
        {complianceItems.map((item, index) => (
          <Box key={index} mb={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {item.value}% (Target: {item.target}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={item.value}
              color={item.value >= item.target ? "success" : "warning"}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        ))}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Next compliance audit scheduled for Q2 2024. All systems are
            operating within regulatory requirements.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Main security dashboard component
const SecurityDashboard = ({ data, realtimeData, systemStatus }) => {
  const [timeRange, setTimeRange] = useState("24h");
  const [alertLevel, setAlertLevel] = useState("all");

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleAlertLevelChange = (event) => {
    setAlertLevel(event.target.value);
  };

  return (
    <Box>
      {/* Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">Security Dashboard</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Alert Level</InputLabel>
            <Select
              value={alertLevel}
              label="Alert Level"
              onChange={handleAlertLevelChange}
            >
              <MenuItem value="all">All Alerts</MenuItem>
              <MenuItem value="threat">Threats Only</MenuItem>
              <MenuItem value="warning">Warnings+</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Download Security Report">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Security overview metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <SecurityMetric
            title="Active Threats"
            value={2}
            unit=""
            status="warning"
            description="Suspicious activities detected"
            icon={<ErrorIcon />}
            alert="2 high-priority threats require attention"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SecurityMetric
            title="DRM Success Rate"
            value={98.7}
            unit="%"
            status="secure"
            description="License verification rate"
            icon={<ShieldIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SecurityMetric
            title="Blocked Attempts"
            value={156}
            unit=""
            status="secure"
            description="Malicious requests blocked"
            icon={<BlockIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SecurityMetric
            title="Compliance Score"
            value={97.2}
            unit="%"
            status="secure"
            description="Overall compliance rating"
            icon={<LegalIcon />}
          />
        </Grid>

        {/* DRM monitoring */}
        <Grid item xs={12} md={8}>
          <DRMMonitoring data={data} />
        </Grid>

        {/* Authentication security */}
        <Grid item xs={12} md={4}>
          <AuthenticationSecurity data={data} />
        </Grid>

        {/* Fraud detection */}
        <Grid item xs={12} md={8}>
          <FraudDetection data={data} />
        </Grid>

        {/* Compliance monitoring */}
        <Grid item xs={12} md={4}>
          <ComplianceMonitoring data={data} />
        </Grid>

        {/* Security summary alert */}
        <Grid item xs={12}>
          <Alert severity="warning" icon={<SecurityIcon />}>
            <Typography variant="body1" fontWeight="bold">
              Security Status Summary
            </Typography>
            <Typography variant="body2">
              2 high-priority security events require immediate attention. DRM
              systems are operating normally with 98.7% success rate. Fraud
              detection has blocked 156 suspicious attempts in the last 24
              hours. All compliance metrics are within acceptable ranges.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecurityDashboard;
