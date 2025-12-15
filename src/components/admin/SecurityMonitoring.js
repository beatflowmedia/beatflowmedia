/**
 * Security Monitoring Component
 *
 * Real-time security monitoring interface for detecting and responding to threats
 * Includes threat intelligence, anomaly detection, and incident response tools
 */

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  LinearProgress
} from "@mui/material";
import {
  Security,
  Warning,
  Error,
  Shield,
  Block,
  Visibility,
  VisibilityOff,
  Refresh,
  NotificationImportant,
  TrendingUp,
  TrendingDown,
  LocationOn,
  Computer,
  PhoneAndroid,
  TabletMac,
  DesktopMac,
  PlayArrow,
  Stop,
  Settings,
  Share
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { CircularProgress } from '@mui/material/CircularProgress';
import { Pause } from '@mui/icons-material/Pause';
import { PlayArrow } from '@mui/icons-material/PlayArrow';
import { Tooltip } from '@mui/material/Tooltip';

const SecurityMonitoring = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState({});
  const [threats, setThreats] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [monitoring, setMonitoring] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [threatDialog, setThreatDialog] = useState(false);
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [filters, setFilters] = useState({
    severity: "all",
    type: "all",
    timeRange: "1h",
    status: "all"
  });

  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    initializeSecurityMonitoring();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (monitoring) {
      startRealTimeMonitoring();
    } else {
      stopRealTimeMonitoring();
    }
  }, [monitoring]);

  const initializeSecurityMonitoring = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSecurityThreats(),
        loadAnomalies(),
        loadIncidents(),
        loadRealTimeData(),
      ]);
    } catch (error) {
      console.error("Failed to initialize security monitoring:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityThreats = async () => {
    try {
      const response = await fetch("/api/admin/security/threats", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      setThreats(data.threats || []);
    } catch (error) {
      console.error("Failed to load security threats:", error);
    }
  };

  const loadAnomalies = async () => {
    try {
      const response = await fetch("/api/admin/security/anomalies", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      setAnomalies(data.anomalies || []);
    } catch (error) {
      console.error("Failed to load anomalies:", error);
    }
  };

  const loadIncidents = async () => {
    try {
      const response = await fetch("/api/admin/security/incidents", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      setIncidents(data.incidents || []);
    } catch (error) {
      console.error("Failed to load incidents:", error);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const response = await fetch("/api/admin/security/realtime", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      setRealTimeData(data);
    } catch (error) {
      console.error("Failed to load real-time data:", error);
    }
  };

  const startRealTimeMonitoring = () => {
    // Start WebSocket connection for real-time updates
    try {
      wsRef.current = new WebSocket(`wss://api.beatflowmedia.com/ws/security`);

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealTimeUpdate(data);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Fallback to polling
        startPolling();
      };
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      // Fallback to polling
      startPolling();
    }
  };

  const startPolling = () => {
    intervalRef.current = setInterval(() => {
      loadRealTimeData();
    }, 5000); // Poll every 5 seconds
  };

  const stopRealTimeMonitoring = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleRealTimeUpdate = (data) => {
    switch (data.type) {
      case "threat":
        setThreats((prev) => [data.payload, ...prev.slice(0, 99)]); // Keep last 100
        break;
      case "anomaly":
        setAnomalies((prev) => [data.payload, ...prev.slice(0, 49)]); // Keep last 50
        break;
      case "incident":
        setIncidents((prev) => [data.payload, ...prev.slice(0, 19)]); // Keep last 20
        break;
      case "metrics":
        setRealTimeData((prev) => ({ ...prev, ...data.payload }));
        break;
      default:
        console.log("Unknown real-time update type:", data.type);
    }
  };

  const blockThreat = async (threatId, ipAddress) => {
    try {
      const response = await fetch("/api/admin/security/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          threatId,
          ipAddress,
          action: "block"
        })
      });

      if (response.ok) {
        // Update threat status locally
        setThreats((prev) =>
          prev.map((threat) =>
            threat.id === threatId
              ? {
                  ...threat,
                  status: "blocked",
                  blockedAt: new Date().toISOString()
                }
              : threat,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to block threat:", error);
    }
  };

  const createIncident = async (threatId, severity = "medium") => {
    try {
      const response = await fetch("/api/admin/security/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          threatId,
          severity,
          status: "open",
          assignedTo: "security-team"
        })
      });

      if (response.ok) {
        const newIncident = await response.json();
        setIncidents((prev) => [newIncident, ...prev]);
        setIncidentDialog(false);
      }
    } catch (error) {
      console.error("Failed to create incident:", error);
    }
  };

  const cleanup = () => {
    stopRealTimeMonitoring();
  };

  // Real-time Metrics Cards
  const MetricsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: "error.dark", color: "error.contrastText" }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="body2" gutterBottom>
                  Active Threats
                </Typography>
                <Typography variant="h4">
                  {realTimeData.activeThreats || 0}
                </Typography>
              </Box>
              <Warning />
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp fontSize="small" />
              <Typography variant="caption" ml={1}>
                +{realTimeData.threatIncrease || 0}% from last hour
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: "warning.dark", color: "warning.contrastText" }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="body2" gutterBottom>
                  Anomalies Detected
                </Typography>
                <Typography variant="h4">
                  {realTimeData.anomalies || 0}
                </Typography>
              </Box>
              <NotificationImportant />
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingDown fontSize="small" />
              <Typography variant="caption" ml={1}>
                -{realTimeData.anomalyDecrease || 0}% from yesterday
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: "info.dark", color: "info.contrastText" }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="body2" gutterBottom>
                  Blocked IPs
                </Typography>
                <Typography variant="h4">
                  {realTimeData.blockedIPs || 0}
                </Typography>
              </Box>
              <Block />
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              <Typography variant="caption">
                Last update: {realTimeData.lastUpdate || "N/A"}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: "success.dark", color: "success.contrastText" }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="body2" gutterBottom>
                  Security Score
                </Typography>
                <Typography variant="h4">
                  {realTimeData.securityScore || 0}%
                </Typography>
              </Box>
              <Shield />
            </Box>
            <LinearProgress
              variant="determinate"
              value={realTimeData.securityScore || 0}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Threat Intelligence Panel
  const ThreatIntelligencePanel = () => (
    <Card>
      <CardHeader
        title="Threat Intelligence"
        action={
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={monitoring}
                  onChange={(e) => setMonitoring(e.target.checked)}
                />
              }
              label="Real-time Monitoring"
            />
            <IconButton onClick={loadSecurityThreats}>
              <Refresh />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        <List>
          {threats.slice(0, 10).map((threat) => (
            <ListItem key={threat.id} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={threat.severity}
                      color={
                        threat.severity === "critical"
                          ? "error"
                          : threat.severity === "high"
                            ? "warning"
                            : "default"
                      }
                      size="small"
                    />
                    <Typography variant="subtitle2">{threat.type}</Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {threat.description}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <LocationOn fontSize="small" />
                      <Typography variant="caption">
                        {threat.source} •{" "}
                        {new Date(threat.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="View Details">
                  <IconButton
                    onClick={() => {
                      setSelectedThreat(threat);
                      setThreatDialog(true);
                    }}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                {threat.status !== "blocked" && (
                  <Tooltip title="Block Threat">
                    <IconButton
                      color="error"
                      onClick={() => blockThreat(threat.id, threat.source)}
                    >
                      <Block />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  // Anomaly Detection Panel
  const AnomalyDetectionPanel = () => (
    <Card>
      <CardHeader title="Anomaly Detection" />
      <CardContent>
        {anomalies.length === 0 ? (
          <Typography color="textSecondary" textAlign="center">
            No anomalies detected
          </Typography>
        ) : (
          <List>
            {anomalies.slice(0, 5).map((anomaly) => (
              <ListItem key={anomaly.id} divider>
                <ListItemText
                  primary={anomaly.pattern}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Confidence: {(anomaly.confidence * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Detected:{" "}
                        {new Date(anomaly.detectedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => createIncident(anomaly.id, "low")}
                  >
                    Create Incident
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  // Active Incidents Panel
  const ActiveIncidentsPanel = () => (
    <Card>
      <CardHeader
        title="Active Incidents"
        action={
          <Button
            variant="outlined"
            size="small"
            onClick={() => setIncidentDialog(true)}
          >
            Create Incident
          </Button>
        }
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.slice(0, 10).map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>#{incident.id.slice(-6)}</TableCell>
                  <TableCell>
                    <Chip
                      label={incident.severity}
                      color={
                        incident.severity === "critical"
                          ? "error"
                          : incident.severity === "high"
                            ? "warning"
                            : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{incident.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status}
                      color={incident.status === "open" ? "warning" : "success"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Threat Details Dialog
  const ThreatDetailsDialog = () => (
    <Dialog
      open={threatDialog}
      onClose={() => setThreatDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Threat Details</DialogTitle>
      <DialogContent>
        {selectedThreat && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert
                severity={
                  selectedThreat.severity === "critical"
                    ? "error"
                    : selectedThreat.severity === "high"
                      ? "warning"
                      : "info"
                }
              >
                <AlertTitle>{selectedThreat.type}</AlertTitle>
                {selectedThreat.description}
              </Alert>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Source IP"
                value={selectedThreat.source}
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Severity"
                value={selectedThreat.severity}
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Seen"
                value={new Date(selectedThreat.firstSeen).toLocaleString()}
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Seen"
                value={new Date(selectedThreat.lastSeen).toLocaleString()}
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Mitigation Recommendations"
                value={selectedThreat.recommendations}
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setThreatDialog(false)}>Close</Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            blockThreat(selectedThreat.id, selectedThreat.source);
            setThreatDialog(false);
          }}
        >
          Block Threat
        </Button>
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
        <Typography variant="h4">Security Monitoring</Typography>
        <Box display="flex" gap={1}>
          <Badge color={monitoring ? "success" : "default"} variant="dot">
            <Button
              variant={monitoring ? "contained" : "outlined"}
              startIcon={monitoring ? <Pause /> : <PlayArrow />}
              onClick={() => setMonitoring(!monitoring)}
            >
              {monitoring ? "Monitoring" : "Start Monitoring"}
            </Button>
          </Badge>
        </Box>
      </Box>

      <MetricsCards />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ThreatIntelligencePanel />
        </Grid>
        <Grid item xs={12} md={6}>
          <AnomalyDetectionPanel />
        </Grid>
        <Grid item xs={12}>
          <ActiveIncidentsPanel />
        </Grid>
      </Grid>

      <ThreatDetailsDialog />
    </Box>
  );
};

export default SecurityMonitoring;
