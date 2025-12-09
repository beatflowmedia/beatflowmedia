/**
 * User Management Component
 *
 * Advanced user management interface for administrators
 * Includes user CRUD operations, role management, and security controls
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
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
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  IconButton,
  Menu,
  MenuList,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  InputAdornment
} from "@mui/material";
import {
  Edit,
  Delete,
  Block,
  Verified,
  Security,
  Key,
  PersonAdd,
  MoreVert,
  Email,
  Phone,
  Shield,
  Warning,
  CheckCircle,
  Cancel,
  Upload
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from '@mui/material/Avatar';
import { Tooltip } from '@mui/material/Tooltip';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDialog, setUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    subscription: "",
    verified: ""
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  // New user form state
  const [newUser, setNewUser] = useState({
    email: "",
    displayName: "",
    role: "FREE",
    sendWelcomeEmail: true,
    generatePassword: true,
    temporaryPassword: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      showNotification("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setCreateUserDialog(false);
        setNewUser({
          email: "",
          displayName: "",
          role: "FREE",
          sendWelcomeEmail: true,
          generatePassword: true,
          temporaryPassword: ""
        });
        await loadUsers();
        showNotification("User created successfully", "success");
      } else {
        const error = await response.json();
        showNotification(error.message || "Failed to create user", "error");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      showNotification("Failed to create user", "error");
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadUsers();
        showNotification("User updated successfully", "success");
      } else {
        const error = await response.json();
        showNotification(error.message || "Failed to update user", "error");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      showNotification("Failed to update user", "error");
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
        showNotification("User suspended", "success");
      }
    } catch (error) {
      console.error("Failed to suspend user:", error);
      showNotification("Failed to suspend user", "error");
    }
  };

  const reactivateUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        await loadUsers();
        showNotification("User reactivated", "success");
      }
    } catch (error) {
      console.error("Failed to reactivate user:", error);
      showNotification("Failed to reactivate user", "error");
    }
  };

  const resetPassword = async (userId) => {
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/reset-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`
          }
        },
      );

      if (response.ok) {
        showNotification("Password reset email sent", "success");
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
      showNotification("Failed to reset password", "error");
    }
  };

  const forceEmailVerification = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/verify-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        await loadUsers();
        showNotification("Email verification forced", "success");
      }
    } catch (error) {
      console.error("Failed to force email verification:", error);
      showNotification("Failed to force email verification", "error");
    }
  };

  const showNotification = (message, severity = "info") => {
    setNotification({ open: true, message, severity });
  };

  const handleActionMenuClick = (event, user) => {
    event.stopPropagation();
    setSelectedUser(user);
    setActionMenu(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenu(null);
    setSelectedUser(null);
  };

  const getRoleColor = (role) => {
    const colors = {
      FREE: "default",
      PREMIUM: "primary",
      ARTIST: "secondary",
      CURATOR: "info",
      ADMIN: "error"
    };
    return colors[role] || "default";
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "success",
      suspended: "warning",
      banned: "error",
      pending: "info"
    };
    return colors[status] || "default";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;
    const matchesSubscription =
      !filters.subscription || user.subscriptionTier === filters.subscription;
    const matchesVerified =
      !filters.verified || user.emailVerified.toString() === filters.verified;

    return (
      matchesSearch &&
      matchesRole &&
      matchesStatus &&
      matchesSubscription &&
      matchesVerified
    );
  });

  const columns = [
    {
      field: "avatar",
      headerName: "",
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Avatar
          src={params.row.photoURL}
          alt={params.row.displayName}
          sx={{ width: 32, height: 32 }}
        >
          {params.row.displayName?.[0] || params.row.email[0]}
        </Avatar>
      )
    },
    { field: "email", headerName: "Email", width: 250 },
    { field: "displayName", headerName: "Name", width: 200 },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getRoleColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: "subscriptionTier",
      headerName: "Subscription",
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
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: "emailVerified",
      headerName: "Verified",
      width: 100,
      renderCell: (params) =>
        params.value ? (
          <CheckCircle color="success" />
        ) : (
          <Cancel color="error" />
        )
    },
    {
      field: "mfaEnabled",
      headerName: "MFA",
      width: 80,
      renderCell: (params) =>
        params.value ? <Shield color="success" /> : <Shield color="disabled" />
    },
    {
      field: "lastLogin",
      headerName: "Last Login",
      width: 180,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : "Never"
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 180,
      renderCell: (params) => new Date(params.value).toLocaleString()
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Quick Actions">
            <IconButton
              onClick={(e) => handleActionMenuClick(e, params.row)}
              size="small"
            >
              <MoreVert />
            </IconButton>
          </Tooltip>
        </Box>
      )
    },
  ];

  // Create User Dialog
  const CreateUserDialog = () => (
    <Dialog
      open={createUserDialog}
      onClose={() => setCreateUserDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Create New User</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Display Name"
              value={newUser.displayName}
              onChange={(e) =>
                setNewUser({ ...newUser, displayName: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <MenuItem value="FREE">Free User</MenuItem>
                <MenuItem value="PREMIUM">Premium User</MenuItem>
                <MenuItem value="ARTIST">Artist</MenuItem>
                <MenuItem value="CURATOR">Curator</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={newUser.generatePassword}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      generatePassword: e.target.checked
                    })
                  }
                />
              }
              label="Generate temporary password"
            />
          </Grid>
          {!newUser.generatePassword && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Temporary Password"
                type="password"
                value={newUser.temporaryPassword}
                onChange={(e) =>
                  setNewUser({ ...newUser, temporaryPassword: e.target.value })
                }
                required
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={newUser.sendWelcomeEmail}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      sendWelcomeEmail: e.target.checked
                    })
                  }
                />
              }
              label="Send welcome email"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreateUserDialog(false)}>Cancel</Button>
        <Button variant="contained" onClick={createUser}>
          Create User
        </Button>
      </DialogActions>
    </Dialog>
  );

  // User Details Dialog
  const UserDetailsDialog = () => (
    <Dialog
      open={userDialog}
      onClose={() => setUserDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={selectedUser?.photoURL} sx={{ width: 40, height: 40 }}>
            {selectedUser?.displayName?.[0] || selectedUser?.email[0]}
          </Avatar>
          User Details
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedUser && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={selectedUser.email}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={selectedUser.displayName || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    displayName: e.target.value
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                >
                  <MenuItem value="FREE">Free User</MenuItem>
                  <MenuItem value="PREMIUM">Premium User</MenuItem>
                  <MenuItem value="ARTIST">Artist</MenuItem>
                  <MenuItem value="CURATOR">Curator</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedUser.status}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, status: e.target.value })
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedUser.emailVerified}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        emailVerified: e.target.checked
                      })
                    }
                  />
                }
                label="Email Verified"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={selectedUser.mfaEnabled} disabled />}
                label="MFA Enabled"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Usage Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Streams
                  </Typography>
                  <Typography variant="h6">
                    {selectedUser.usage?.totalStreams || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Monthly Streams
                  </Typography>
                  <Typography variant="h6">
                    {selectedUser.usage?.monthlyStreams || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUserDialog(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            updateUser(selectedUser.uid, selectedUser);
            setUserDialog(false);
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Action Menu
  const ActionMenu = () => (
    <Menu
      anchorEl={actionMenu}
      open={Boolean(actionMenu)}
      onClose={handleActionMenuClose}
    >
      <MuiMenuItem
        onClick={() => {
          setUserDialog(true);
          handleActionMenuClose();
        }}
      >
        <ListItemIcon>
          <Edit />
        </ListItemIcon>
        <ListItemText>Edit User</ListItemText>
      </MuiMenuItem>

      <MuiMenuItem
        onClick={() => {
          resetPassword(selectedUser.uid);
          handleActionMenuClose();
        }}
      >
        <ListItemIcon>
          <Key />
        </ListItemIcon>
        <ListItemText>Reset Password</ListItemText>
      </MuiMenuItem>

      {!selectedUser?.emailVerified && (
        <MuiMenuItem
          onClick={() => {
            forceEmailVerification(selectedUser.uid);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <Email />
          </ListItemIcon>
          <ListItemText>Force Email Verification</ListItemText>
        </MuiMenuItem>
      )}

      <Divider />

      {selectedUser?.status === "active" ? (
        <MuiMenuItem
          onClick={() => {
            suspendUser(selectedUser.uid);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <Block color="warning" />
          </ListItemIcon>
          <ListItemText>Suspend User</ListItemText>
        </MuiMenuItem>
      ) : (
        <MuiMenuItem
          onClick={() => {
            reactivateUser(selectedUser.uid);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <CheckCircle color="success" />
          </ListItemIcon>
          <ListItemText>Reactivate User</ListItemText>
        </MuiMenuItem>
      )}
    </Menu>
  );

  return (
    <Box p={3}>
      <Card>
        <CardHeader
          title="User Management"
          subheader={`${filteredUsers.length} users`}
          action={
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => {
                  /* Implement CSV import */
                }}
              >
                Import
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  /* Implement CSV export */
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setCreateUserDialog(true)}
              >
                Add User
              </Button>
            </Box>
          }
        />
        <CardContent>
          {/* Search and Filters */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 250 }}
            />

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                onChange={(e) =>
                  setFilters({ ...filters, role: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="FREE">Free</MenuItem>
                <MenuItem value="PREMIUM">Premium</MenuItem>
                <MenuItem value="ARTIST">Artist</MenuItem>
                <MenuItem value="CURATOR">Curator</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="banned">Banned</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Verified</InputLabel>
              <Select
                value={filters.verified}
                onChange={(e) =>
                  setFilters({ ...filters, verified: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Verified</MenuItem>
                <MenuItem value="false">Unverified</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Data Grid */}
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            checkboxSelection
            disableSelectionOnClick
            loading={loading}
            autoHeight
            getRowId={(row) => row.uid}
          />
        </CardContent>
      </Card>

      <CreateUserDialog />
      <UserDetailsDialog />
      <ActionMenu />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
