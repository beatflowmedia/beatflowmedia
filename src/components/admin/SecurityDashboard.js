/**
 * Security Dashboard Component
 *
 * Comprehensive admin dashboard for security monitoring and management
 * Includes user management, security alerts, audit trails, and access control
 */

import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tooltip
} from "@mui/material";
import {
  Security,
  Warning,
  Block,
  Verified,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Shield,
  Key,
  DeviceHub,
  Timeline,
  Search,
  Download
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext";
import { adminAnalytics } from "../../services/adminAnalytics";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";

const SecurityDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTokens, setActiveTokens] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [, setFilterDialog] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Security metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    blockedIPs: 0,
    activeTokens: 0
  });

  useEffect(() => {
    const loadData = async () => {
      await loadDashboardData();
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSecurityMetrics(),
        loadAuditLogs(),
        loadUsers(),
        loadActiveTokens(),
        loadSecurityAlerts(),
        loadDevices(),
      ]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityMetrics = async () => {
    try {
      // Fetch real counts from Firestore
      const [totalUsers, activeSessionsCount, failedLoginsCount, suspiciousCount] = await Promise.all([
        adminAnalytics.getCollectionCount('users'),
        adminAnalytics.getConditionalCount('analytics_events',
          where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
        ),
        adminAnalytics.getConditionalCount('analytics_events',
          where('eventType', '==', 'auth_failed'),
          where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
        ),
        adminAnalytics.getConditionalCount('security_alerts',
          where('severity', 'in', ['high', 'critical']),
          where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
        )
      ]);

      setMetrics({
        totalUsers,
        activeUsers: activeSessionsCount,
        failedLogins: failedLoginsCount,
        suspiciousActivity: suspiciousCount,
        blockedIPs: 0, // Not tracking this yet
        activeTokens: activeSessionsCount
      });
    } catch (error) {
      console.error("Failed to load security metrics:", error);
      // Set defaults on error
      setMetrics({
        totalUsers: 0,
        activeUsers: 0,
        failedLogins: 0,
        suspiciousActivity: 0,
        blockedIPs: 0,
        activeTokens: 0
      });
    }
  };

  const loadAuditLogs = async () => {
    try {
      // Fetch recent analytics events from Firestore
      const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
      const q = query(
        collection(db, 'analytics_events'),
        where('timestamp', '>=', oneDayAgo),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));

      setAuditLogs(logs);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      setAuditLogs([]);
    }
  };

  const loadUsers = async () => {
    try {
      // Fetch users from Firestore
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: doc.data().role || 'FREE',
        subscriptionTier: doc.data().subscriptionTier || 'FREE',
        status: doc.data().status || 'active',
        lastLogin: doc.data().lastLogin?.toDate?.() || new Date()
      }));

      setUsers(usersList);
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    }
  };

  const loadActiveTokens = async () => {
    try {
      // Fetch active sessions/tokens from Firestore
      const q = query(
        collection(db, 'user_sessions'),
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const tokens = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate?.() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }));

      setActiveTokens(tokens);
    } catch (error) {
      console.error("Failed to load active tokens:", error);
      setActiveTokens([]);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      // Fetch recent security alerts from Firestore
      const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days
      const q = query(
        collection(db, 'security_alerts'),
        where('timestamp', '>=', oneDayAgo),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));

      setSecurityAlerts(alerts);
    } catch (error) {
      console.error("Failed to load security alerts:", error);
      setSecurityAlerts([]);
    }
  };

  const loadDevices = async () => {
    try {
      // Fetch user devices from Firestore
      const q = query(
        collection(db, 'user_devices'),
        orderBy('lastAccess', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const devicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastAccess: doc.data().lastAccess?.toDate?.() || new Date()
      }));

      setDevices(devicesList);
    } catch (error) {
      console.error("Failed to load devices:", error);
      setDevices([]);
    }
  };

  const revokeToken = async (tokenId) => {
    try {
      const response = await fetch("/api/admin/security/revoke-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ tokenId })
      });

      if (response.ok) {
        await loadActiveTokens();
      }
    } catch (error) {
      console.error("Failed to revoke token:", error);
    }
  };

  const suspendUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error("Failed to suspend user:", error);
    }
  };

  const blockDevice = async (deviceId) => {
    try {
      const response = await fetch(`/api/admin/devices/${deviceId}/block`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        await loadDevices();
      }
    } catch (error) {
      console.error("Failed to block device:", error);
    }
  };

  // Security Metrics Cards Component
  const SecurityMetricsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {metrics.totalUsers.toLocaleString()}
                </Typography>
              </Box>
              <Shield color="primary" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active Users
                </Typography>
                <Typography variant="h4">
                  {metrics.activeUsers.toLocaleString()}
                </Typography>
              </Box>
              <Verified color="success" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Failed Logins
                </Typography>
                <Typography variant="h4" color="error">
                  {metrics.failedLogins.toLocaleString()}
                </Typography>
              </Box>
              <Warning color="error" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Suspicious Activity
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {metrics.suspiciousActivity.toLocaleString()}
                </Typography>
              </Box>
              <Security color="warning" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Blocked IPs
                </Typography>
                <Typography variant="h4">
                  {metrics.blockedIPs.toLocaleString()}
                </Typography>
              </Box>
              <Block color="error" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active Tokens
                </Typography>
                <Typography variant="h4">
                  {metrics.activeTokens.toLocaleString()}
                </Typography>
              </Box>
              <Key color="info" />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // User Management Tab
  const UserManagementTab = () => {
    const userColumns = [
      { field: "id", headerName: "ID", width: 100 },
      { field: "email", headerName: "Email", width: 250 },
      { field: "displayName", headerName: "Name", width: 200 },
      {
        field: "role",
        headerName: "Role",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={params.value === "ADMIN" ? "error" : "primary"}
            size="small"
          />
        )
      },
      {
        field: "subscriptionTier",
        headerName: "Tier",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={params.value === "FREE" ? "default" : "success"}
            size="small"
          />
        )
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={params.value === "active" ? "success" : "error"}
            size="small"
          />
        )
      },
      {
        field: "lastLogin",
        headerName: "Last Login",
        width: 180,
        renderCell: (params) => new Date(params.value).toLocaleString()
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 200,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <Tooltip title="View Details">
              <IconButton
                onClick={() => {
                  setSelectedUser(params.row);
                  setUserDialog(true);
                }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit User">
              <IconButton
                onClick={() => {
                  setSelectedUser(params.row);
                  setUserDialog(true);
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Suspend User">
              <IconButton
                color="error"
                onClick={() => suspendUser(params.row.id)}
              >
                <Block />
              </IconButton>
            </Tooltip>
          </Box>
        )
      },
    ];

    return (
      <Card>
        <CardHeader
          title="User Management"
          action={
            <Box>
              <Button
                startIcon={<Search />}
                onClick={() => setFilterDialog(true)}
              >
                Filter
              </Button>
              <Button startIcon={<Download />}>Export</Button>
            </Box>
          }
        />
        <CardContent>
          <DataGrid
            rows={users}
            columns={userColumns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            checkboxSelection
            disableSelectionOnClick
            autoHeight
          />
        </CardContent>
      </Card>
    );
  };

  // Security Alerts Tab
  const SecurityAlertsTab = () => (
    <Card>
      <CardHeader title="Security Alerts" />
      <CardContent>
        {securityAlerts.map((alert, index) => (
          <Alert
            key={index}
            severity={alert.severity}
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small">
                Investigate
              </Button>
            }
          >
            <Typography variant="subtitle2">{alert.title}</Typography>
            <Typography variant="body2">{alert.description}</Typography>
            <Typography variant="caption">
              {new Date(alert.timestamp).toLocaleString()}
            </Typography>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );

  // Active Tokens Tab
  const ActiveTokensTab = () => {
    const tokenColumns = [
      { field: "id", headerName: "Token ID", width: 200 },
      { field: "userId", headerName: "User ID", width: 200 },
      { field: "type", headerName: "Type", width: 120 },
      {
        field: "createdAt",
        headerName: "Created",
        width: 180,
        renderCell: (params) => new Date(params.value).toLocaleString()
      },
      {
        field: "expiresAt",
        headerName: "Expires",
        width: 180,
        renderCell: (params) => new Date(params.value).toLocaleString()
      },
      { field: "deviceId", headerName: "Device", width: 150 },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="Revoke Token">
            <IconButton
              color="error"
              onClick={() => revokeToken(params.row.id)}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        )
      },
    ];

    return (
      <Card>
        <CardHeader
          title="Active Tokens"
          subheader={`${activeTokens.length} tokens currently active`}
        />
        <CardContent>
          <DataGrid
            rows={activeTokens}
            columns={tokenColumns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            autoHeight
          />
        </CardContent>
      </Card>
    );
  };

  // Audit Log Tab
  const AuditLogTab = () => {
    const auditColumns = [
      {
        field: "timestamp",
        headerName: "Time",
        width: 180,
        renderCell: (params) => new Date(params.value).toLocaleString()
      },
      {
        field: "eventType",
        headerName: "Event Type",
        width: 200,
        valueGetter: (params) => params.row.eventType || params.row.type || 'Unknown'
      },
      { field: "userId", headerName: "User", width: 200 },
      {
        field: "ip",
        headerName: "IP Address",
        width: 150,
        valueGetter: (params) => params.row.ip || params.row.ipAddress || 'N/A'
      },
      {
        field: "userAgent",
        headerName: "User Agent",
        width: 300,
        valueGetter: (params) => params.row.userAgent || 'N/A'
      },
      {
        field: "details",
        headerName: "Details",
        width: 300,
        renderCell: (params) => (
          <Tooltip title={JSON.stringify(params.value || {}, null, 2)}>
            <Typography variant="body2" noWrap>
              {JSON.stringify(params.value || {})}
            </Typography>
          </Tooltip>
        )
      },
    ];

    return (
      <Card>
        <CardHeader
          title="Audit Log"
          action={<Button startIcon={<Download />}>Export Logs</Button>}
        />
        <CardContent>
          <DataGrid
            rows={auditLogs}
            columns={auditColumns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            autoHeight
          />
        </CardContent>
      </Card>
    );
  };

  // Device Management Tab
  const DeviceManagementTab = () => {
    const deviceColumns = [
      { field: "id", headerName: "Device ID", width: 200 },
      { field: "userId", headerName: "User", width: 200 },
      { field: "name", headerName: "Device Name", width: 200 },
      { field: "type", headerName: "Type", width: 120 },
      {
        field: "trusted",
        headerName: "Trusted",
        width: 100,
        renderCell: (params) => (
          <Chip
            label={params.value ? "Yes" : "No"}
            color={params.value ? "success" : "default"}
            size="small"
          />
        )
      },
      {
        field: "lastAccess",
        headerName: "Last Access",
        width: 180,
        renderCell: (params) => new Date(params.value).toLocaleString()
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="Block Device">
            <IconButton
              color="error"
              onClick={() => blockDevice(params.row.id)}
            >
              <Block />
            </IconButton>
          </Tooltip>
        )
      },
    ];

    return (
      <Card>
        <CardHeader title="Device Management" />
        <CardContent>
          <DataGrid
            rows={devices}
            columns={deviceColumns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            autoHeight
          />
        </CardContent>
      </Card>
    );
  };

  // User Details Dialog
  const UserDetailsDialog = () => (
    <Dialog
      open={userDialog}
      onClose={() => setUserDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>User Details</DialogTitle>
      <DialogContent>
        {selectedUser && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={selectedUser.email}
                margin="normal"
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={selectedUser.displayName}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select value={selectedUser.role}>
                  <MenuItem value="FREE">Free User</MenuItem>
                  <MenuItem value="PREMIUM">Premium User</MenuItem>
                  <MenuItem value="ARTIST">Artist</MenuItem>
                  <MenuItem value="CURATOR">Curator</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select value={selectedUser.status}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={selectedUser.emailVerified} />}
                label="Email Verified"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={selectedUser.mfaEnabled} />}
                label="MFA Enabled"
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUserDialog(false)}>Cancel</Button>
        <Button variant="contained">Save Changes</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Security Dashboard
        </Typography>
        <Button
          startIcon={<Refresh />}
          variant="outlined"
          onClick={loadDashboardData}
        >
          Refresh
        </Button>
      </Box>

      <SecurityMetricsCards />

      <Card>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Users" icon={<Shield />} />
          <Tab label="Security Alerts" icon={<Warning />} />
          <Tab label="Active Tokens" icon={<Key />} />
          <Tab label="Audit Log" icon={<Timeline />} />
          <Tab label="Devices" icon={<DeviceHub />} />
        </Tabs>

        <Box p={2}>
          {activeTab === 0 && <UserManagementTab />}
          {activeTab === 1 && <SecurityAlertsTab />}
          {activeTab === 2 && <ActiveTokensTab />}
          {activeTab === 3 && <AuditLogTab />}
          {activeTab === 4 && <DeviceManagementTab />}
        </Box>
      </Card>

      <UserDetailsDialog />
    </Box>
  );
};

export default SecurityDashboard;
