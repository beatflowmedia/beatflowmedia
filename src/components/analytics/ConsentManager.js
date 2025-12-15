// src/components/analytics/ConsentManager.js
// GDPR-compliant consent management component for privacy compliance

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Box,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Link
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Campaign as MarketingIcon,
  PersonOutline as PersonalizationIcon,
  Cookie as CookieIcon as DownloadIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { PrivacyManager } from "../../services/analytics/PrivacyManager";

const ConsentManager = ({ open, onClose, onConsentUpdate }) => {
  const [consents, setConsents] = useState({
    analytics: false,
    marketing: false,
    personalization: false,
    necessary: true, // Always required
  });
  const [showDetails, setShowDetails] = useState(false);
  const [privacyManager] = useState(new PrivacyManager());
  const [dataExportRequested, setDataExportRequested] = useState(false);
  const [dataDeletionRequested, setDataDeletionRequested] = useState(false);

  useEffect(() => {
    // Load existing consent status
    loadConsentStatus();
  }, []);

  const loadConsentStatus = () => {
    try {
      const stored = localStorage.getItem("privacy_consent");
      if (stored) {
        const storedConsents = JSON.parse(stored);
        setConsents((prev) => ({ ...prev, ...storedConsents }));
      }
    } catch (error) {
      console.warn("Failed to load consent status:", error);
    }
  };

  const handleConsentChange = (consentType) => (event) => {
    const newConsents = {
      ...consents,
      [consentType]: event.target.checked
    };
    setConsents(newConsents);
  };

  const handleSaveConsents = () => {
    // Update privacy manager
    privacyManager.updateConsent(consents);

    // Store locally
    localStorage.setItem("privacy_consent", JSON.stringify(consents));

    // Notify parent component
    if (onConsentUpdate) {
      onConsentUpdate(consents);
    }

    onClose();
  };

  const handleDataExport = async () => {
    try {
      setDataExportRequested(true);

      // Get user ID from context or auth
      const userId = "current_user_id"; // Replace with actual user ID

      // Generate data export
      const exportData = privacyManager.exportUserData(userId, "json");

      // Create download link
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString().split("T")[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);

      setTimeout(() => setDataExportRequested(false), 3000);
    } catch (error) {
      console.error("Data export failed:", error);
      setDataExportRequested(false);
    }
  };

  const handleDataDeletion = async () => {
    try {
      setDataDeletionRequested(true);

      // Get user ID from context or auth
      const userId = "current_user_id"; // Replace with actual user ID

      // Request data deletion
      const deletionRecord = privacyManager.deleteUserData(
        userId,
        "user_request",
      );

      console.log("Data deletion requested:", deletionRecord);

      // In a real implementation, this would trigger a backend process
      // and show confirmation to the user

      setTimeout(() => setDataDeletionRequested(false), 3000);
    } catch (error) {
      console.error("Data deletion failed:", error);
      setDataDeletionRequested(false);
    }
  };

  const consentDetails = {
    necessary: {
      icon: <SecurityIcon />,
      title: "Necessary Cookies",
      description:
        "Required for basic site functionality, security, and legal compliance.",
      examples: ["Authentication", "Security tokens", "Basic preferences"],
      required: true
    },
    analytics: {
      icon: <AnalyticsIcon />,
      title: "Analytics & Performance",
      description:
        "Help us understand how you use our platform to improve performance.",
      examples: [
        "Page views",
        "Click tracking",
        "Error reporting",
        "Performance metrics",
      ],
      required: false
    },
    marketing: {
      icon: <MarketingIcon />,
      title: "Marketing & Advertising",
      description:
        "Allow us to show you relevant content and measure advertising effectiveness.",
      examples: [
        "Ad targeting",
        "Campaign tracking",
        "Social media integration",
      ],
      required: false
    },
    personalization: {
      icon: <PersonalizationIcon />,
      title: "Personalization",
      description:
        "Customize your experience with personalized recommendations and content.",
      examples: [
        "Music recommendations",
        "Personalized playlists",
        "Content suggestions",
      ],
      required: false
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "60vh" }
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CookieIcon />
        <Typography variant="h6">Privacy & Cookie Settings</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            We respect your privacy. Choose which data processing activities
            you're comfortable with. You can change these settings at any time.
          </Alert>

          <Typography variant="body2" color="text.secondary" paragraph>
            BeatFlowMedia is committed to protecting your privacy and ensuring
            GDPR compliance. This panel allows you to control how we collect and
            use your data.
          </Typography>
        </Box>

        {/* Consent Controls */}
        <Box sx={{ mb: 3 }}>
          {Object.entries(consentDetails).map(([key, details]) => (
            <Card key={key} sx={{ mb: 2, opacity: details.required ? 0.8 : 1 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ color: "primary.main", mt: 0.5 }}>
                    {details.icon}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {details.title}
                        {details.required && (
                          <Chip label="Required" size="small" color="warning" />
                        )}
                      </Typography>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={consents[key]}
                            onChange={handleConsentChange(key)}
                            disabled={details.required}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      {details.description}
                    </Typography>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="caption">View Details</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Examples of data processing:
                        </Typography>
                        <List dense>
                          {details.examples.map((example, index) => (
                            <ListItem key={index} sx={{ py: 0 }}>
                              <ListItemText
                                primary={example}
                                primaryTypographyProps={{ variant: "body2" }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Data Rights Section */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Your Data Rights
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Under GDPR, you have the right to access, export, and delete your
              personal data.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDataExport}
                disabled={dataExportRequested}
                size="small"
              >
                {dataExportRequested ? "Exporting..." : "Export My Data"}
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDataDeletion}
                disabled={dataDeletionRequested}
                size="small"
              >
                {dataDeletionRequested ? "Processing..." : "Delete My Data"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Legal Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Legal Information & Data Processing Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Data Controller:</strong> BeatFlowMedia Inc.
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Legal Basis for Processing:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Necessary cookies: Legitimate interest for security and functionality"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Analytics: Your consent for service improvement"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Marketing: Your consent for promotional communications"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Personalization: Your consent for customized experience"
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            </List>

            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Data Retention:</strong> Analytics data is retained for 2
              years, marketing data for 1 year. Necessary data is retained as
              long as required for service provision and legal compliance.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              For more information, please read our{" "}
              <Link href="/privacy-policy" target="_blank">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/cookie-policy" target="_blank">
                Cookie Policy
              </Link>
              .
            </Typography>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleSaveConsents}
          variant="contained"
          color="primary"
        >
          Save Preferences
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsentManager;
