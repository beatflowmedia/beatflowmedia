import { useState, useEffect , useCallback } from "react";
import { usePlayer } from "../context/PlayerContext";
import { Box, Grid, Typography, Card, CardContent, Button, Stepper, Step, StepLabel, TextField, Chip, Slider, FormControlLabel, Checkbox, FormGroup, Dialog, DialogTitle, DialogContent, DialogActions, Paper, LinearProgress, Alert, Autocomplete, IconButton, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Campaign, TrendingUp, People, AttachMoney, Schedule, MusicNote, Analytics, Share, PlayArrow, CheckCircle } from '@mui/icons-material';
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import { collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { toast } from "react-toastify";
import { addDoc } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';

const CAMPAIGN_TYPES = [
  {
    id: "conversion_ads",
    title: "Conversion Ads (Meta/TikTok)",
    description: "Direct-to-platform ads with smart links and conversion tracking",
    icon: <TrendingUp />,
    basePrice: 200,
    features: [
      "Meta & TikTok Pixel tracking",
      "Smart link generation",
      "Conversion optimization",
      "Real-time metrics",
      "A/B testing"
    ],
    isNew: true,
    recommended: true
  },
  {
    id: "playlist_placement",
    title: "Playlist Placement",
    description: "Get your music featured in curated playlists",
    icon: <MusicNote />,
    basePrice: 50,
    features: ["Curator review", "Playlist consideration", "Feedback provided"]
  },
  {
    id: "social_promotion",
    title: "Social Media Promotion",
    description: "Boost your tracks across social platforms",
    icon: <Share />,
    basePrice: 100,
    features: [
      "Cross-platform posting",
      "Audience targeting",
      "Analytics dashboard",
    ]
  },
  {
    id: "radio_submission",
    title: "Radio Submission",
    description: "Submit to online and terrestrial radio stations",
    icon: <PlayArrow />,
    basePrice: 75,
    features: ["Radio station network", "Genre targeting", "Play reporting"]
  },
  {
    id: "influencer_outreach",
    title: "Influencer Outreach",
    description: "Connect with music influencers and content creators",
    icon: <People />,
    basePrice: 150,
    features: [
      "Influencer matching",
      "Content creation",
      "Performance tracking",
    ]
  },
];

const GENRE_OPTIONS = [
  "Pop",
  "Rock",
  "Hip Hop",
  "Electronic",
  "Jazz",
  "Classical",
  "Country",
  "R&B",
  "Reggae",
  "Blues",
  "Folk",
  "Indie",
  "Metal",
  "Punk",
  "Alternative",
  "Funk",
];

const MOOD_OPTIONS = [
  "Happy",
  "Sad",
  "Energetic",
  "Calm",
  "Romantic",
  "Party",
  "Workout",
  "Chill",
  "Aggressive",
  "Nostalgic",
  "Uplifting",
  "Dark",
  "Dreamy",
  "Intense",
];

const TARGET_DEMOGRAPHICS = [
  { label: "13-17", value: "13-17" },
  { label: "18-24", value: "18-24" },
  { label: "25-34", value: "25-34" },
  { label: "35-44", value: "35-44" },
  { label: "45-54", value: "45-54" },
  { label: "55+", value: "55+" },
];

const CAMPAIGN_STEPS = [
  "Campaign Type",
  "Track Selection",
  "Targeting",
  "Budget & Timeline",
  "Review & Submit",
];

export default function CampaignWizard() {
  const { user } = useAuth();
  const { dispatch, actions } = usePlayer();

  // Play track function
  const handlePlayTrack = useCallback(
    (track) => {
      dispatch({ type: actions.PLAY_SONG, payload: track });
    },
    [dispatch, actions],
  );

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});

  // Campaign form state
  const [campaignData, setCampaignData] = useState({
    type: "",
    title: "",
    description: "",
    selectedTracks: [],
    targetGenres: [],
    targetMoods: [],
    targetDemographics: [],
    targetLocations: [],
    budget: 100,
    duration: 7,
    startDate: null,
    goals: {
      streams: 1000,
      playlistAdds: 10,
      followers: 50
    },
    additionalNotes: ""
  });

  // UI state
  const [artistTracks, setArtistTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [estimatedReach, setEstimatedReach] = useState(null);
  const [campaignPreview, setCampaignPreview] = useState(null);

  // Load artist's tracks
  useEffect(() => {
    if (!user) return;

    const loadArtistTracks = async () => {
      try {
        const tracksQuery = query(
          collection(db, "songs"),
          where("artistId", "==", user.uid),
        );

        const snapshot = await getDocs(tracksQuery);
        const tracks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setArtistTracks(tracks);
      } catch (error) {
        console.error("Error loading tracks:", error);
        toast.error("Failed to load your tracks");
      }
    };

    loadArtistTracks();
  }, [user]);

  // Calculate estimated reach based on targeting
  useEffect(() => {
    const calculateReach = () => {
      let baseReach = 1000;

      // Adjust based on campaign type
      const campaignType = CAMPAIGN_TYPES.find(
        (type) => type.id === campaignData.type,
      );
      if (campaignType) {
        baseReach *= campaignType.basePrice / 50; // Normalize to base
      }

      // Adjust based on budget
      const budgetMultiplier = Math.log10(campaignData.budget / 50 + 1) + 1;
      baseReach *= budgetMultiplier;

      // Adjust based on targeting specificity
      const targetingFactors = [
        campaignData.targetGenres.length,
        campaignData.targetMoods.length,
        campaignData.targetDemographics.length,
        campaignData.targetLocations.length,
      ];

      const averageTargeting =
        targetingFactors.reduce((sum, factor) => sum + factor, 0) / 4;
      const targetingMultiplier = Math.max(0.5, 1 - averageTargeting * 0.1);
      baseReach *= targetingMultiplier;

      // Duration impact
      const durationMultiplier = Math.sqrt(campaignData.duration / 7);
      baseReach *= durationMultiplier;

      setEstimatedReach(Math.round(baseReach));
    };

    if (campaignData.type && campaignData.budget) {
      calculateReach();
    }
  }, [campaignData]);

  // Handle step navigation
  const handleNext = useCallback(() => {
    const newActiveStep = activeStep + 1;
    setActiveStep(newActiveStep);
    setCompleted((prev) => ({ ...prev, [activeStep]: true }));
  }, [activeStep]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  const handleStep = useCallback((step) => {
    setActiveStep(step);
  }, []);

  // Validate current step
  const isStepValid = useCallback(() => {
    switch (activeStep) {
      case 0: // Campaign Type
        return campaignData.type !== "";
      case 1: // Track Selection
        return (
          campaignData.selectedTracks.length > 0 &&
          campaignData.title.trim() !== ""
        );
      case 2: // Targeting
        return campaignData.targetGenres.length > 0;
      case 3: // Budget & Timeline
        return campaignData.budget >= 50 && campaignData.duration >= 1;
      case 4: // Review
        return true;
      default:
        return false;
    }
  }, [activeStep, campaignData]);

  // Handle form changes
  const handleFormChange = useCallback((field, value) => {
    setCampaignData((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleGoalChange = useCallback((goal, value) => {
    setCampaignData((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        [goal]: value
      }
    }));
  }, []);

  // Submit campaign
  const handleSubmitCampaign = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to create campaigns");
      return;
    }

    setLoading(true);
    try {
      const campaignDoc = {
        ...campaignData,
        artistId: user.uid,
        artistName: user.displayName,
        artistEmail: user.email,
        status: "pending_review",
        estimatedReach,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "campaigns"), campaignDoc);

      toast.success(
        "Campaign submitted successfully! We'll review it within 24 hours.",
      );

      // Reset form
      setCampaignData({
        type: "",
        title: "",
        description: "",
        selectedTracks: [],
        targetGenres: [],
        targetMoods: [],
        targetDemographics: [],
        targetLocations: [],
        budget: 100,
        duration: 7,
        startDate: null,
        goals: {
          streams: 1000,
          playlistAdds: 10,
          followers: 50
        },
        additionalNotes: ""
      });
      setActiveStep(0);
      setCompleted({});
    } catch (error) {
      console.error("Error submitting campaign:", error);
      toast.error("Failed to submit campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, campaignData, estimatedReach]);

  // Generate campaign preview
  const generatePreview = useCallback(() => {
    const selectedType = CAMPAIGN_TYPES.find(
      (type) => type.id === campaignData.type,
    );
    const preview = {
      type: selectedType,
      tracks: campaignData.selectedTracks
        .map((trackId) => artistTracks.find((track) => track.id === trackId))
        .filter(Boolean),
      targeting: {
        genres: campaignData.targetGenres,
        moods: campaignData.targetMoods,
        demographics: campaignData.targetDemographics,
        locations: campaignData.targetLocations
      },
      budget: campaignData.budget,
      duration: campaignData.duration,
      estimatedReach,
      goals: campaignData.goals
    };

    setCampaignPreview(preview);
    setPreviewDialogOpen(true);
  }, [campaignData, artistTracks, estimatedReach]);

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
              Choose Your Campaign Type
            </Typography>
            <Grid container spacing={3}>
              {CAMPAIGN_TYPES.map((type) => (
                <Grid item xs={12} md={6} key={type.id}>
                  <Card
                    sx={{
                      bgcolor:
                        campaignData.type === type.id
                          ? "rgba(29, 185, 84, 0.2)"
                          : "grey.800",
                      border: "2px solid",
                      borderColor:
                        campaignData.type === type.id ? "#1DB954" : "grey.700",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: "#1DB954",
                        transform: "translateY(-2px)"
                      }
                    }}
                    onClick={() => handleFormChange("type", type.id)}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Avatar sx={{ bgcolor: "#1DB954", mr: 2 }}>
                          {type.icon}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            {type.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "#1DB954", fontWeight: "bold" }}
                          >
                            From ${type.basePrice}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "grey.300", mb: 2 }}
                      >
                        {type.description}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {type.features.map((feature, index) => (
                          <Chip
                            key={index}
                            label={feature}
                            size="small"
                            sx={{ bgcolor: "grey.700", color: "white" }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
              Campaign Details & Track Selection
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Title"
                  value={campaignData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "grey.600" },
                      "&:hover fieldset": { borderColor: "grey.500" },
                      "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                    },
                    "& .MuiInputLabel-root": { color: "grey.400" }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Description"
                  value={campaignData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  multiline
                  rows={3}
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "grey.600" },
                      "&:hover fieldset": { borderColor: "grey.500" },
                      "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                    },
                    "& .MuiInputLabel-root": { color: "grey.400" }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ color: "white", mb: 2 }}>
                  Select Tracks to Promote
                </Typography>
                {artistTracks.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No tracks found. Please upload some tracks first to create a
                    campaign.
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {artistTracks.map((track) => (
                      <Grid item xs={12} sm={6} md={4} key={track.id}>
                        <Card
                          sx={{
                            bgcolor: campaignData.selectedTracks.includes(
                              track.id,
                            )
                              ? "rgba(29, 185, 84, 0.2)"
                              : "grey.800",
                            border: "1px solid",
                            borderColor: campaignData.selectedTracks.includes(
                              track.id,
                            )
                              ? "#1DB954"
                              : "grey.700",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onClick={() => {
                            const selected =
                              campaignData.selectedTracks.includes(track.id)
                                ? campaignData.selectedTracks.filter(
                                    (id) => id !== track.id,
                                  )
                                : [...campaignData.selectedTracks, track.id];
                            handleFormChange("selectedTracks", selected);
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2
                              }}
                            >
                              <Box
                                component="img"
                                src={
                                  track.coverUrl || "/default-song-cover.jpg"
                                }
                                alt={track.title}
                                sx={{ width: 40, height: 40, borderRadius: 1 }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "white",
                                    fontWeight: "bold",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {track.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "grey.400" }}
                                >
                                  {track.genre}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayTrack(track);
                                  }}
                                  sx={{ color: "#1DB954" }}
                                >
                                  <PlayArrow />
                                </IconButton>
                                {campaignData.selectedTracks.includes(
                                  track.id,
                                ) && <CheckCircle sx={{ color: "#1DB954" }} />}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
              Target Audience
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: "white", mb: 2 }}>
                  Genres
                </Typography>
                <Autocomplete
                  multiple
                  options={GENRE_OPTIONS}
                  value={campaignData.targetGenres}
                  onChange={(event, newValue) =>
                    handleFormChange("targetGenres", newValue)
                  }
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                        sx={{ color: "white", borderColor: "grey.500" }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select genres"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "white",
                          "& fieldset": { borderColor: "grey.600" },
                          "&:hover fieldset": { borderColor: "grey.500" },
                          "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: "white", mb: 2 }}>
                  Moods
                </Typography>
                <Autocomplete
                  multiple
                  options={MOOD_OPTIONS}
                  value={campaignData.targetMoods}
                  onChange={(event, newValue) =>
                    handleFormChange("targetMoods", newValue)
                  }
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                        sx={{ color: "white", borderColor: "grey.500" }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select moods"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "white",
                          "& fieldset": { borderColor: "grey.600" },
                          "&:hover fieldset": { borderColor: "grey.500" },
                          "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: "white", mb: 2 }}>
                  Age Groups
                </Typography>
                <FormGroup>
                  {TARGET_DEMOGRAPHICS.map((demo) => (
                    <FormControlLabel
                      key={demo.value}
                      control={
                        <Checkbox
                          checked={campaignData.targetDemographics.includes(
                            demo.value,
                          )}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newDemographics = checked
                              ? [...campaignData.targetDemographics, demo.value]
                              : campaignData.targetDemographics.filter(
                                  (d) => d !== demo.value,
                                );
                            handleFormChange(
                              "targetDemographics",
                              newDemographics,
                            );
                          }}
                          sx={{
                            color: "grey.400",
                            "&.Mui-checked": { color: "#1DB954" }
                          }}
                        />
                      }
                      label={demo.label}
                      sx={{ color: "white" }}
                    />
                  ))}
                </FormGroup>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: "white", mb: 2 }}>
                  Geographic Targeting
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter locations (e.g., United States, California, Los Angeles)"
                  value={campaignData.targetLocations.join(", ")}
                  onChange={(e) => {
                    const locations = e.target.value
                      .split(",")
                      .map((loc) => loc.trim())
                      .filter(Boolean);
                    handleFormChange("targetLocations", locations);
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "grey.600" },
                      "&:hover fieldset": { borderColor: "grey.500" },
                      "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
              Budget & Timeline
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: "white", mb: 2 }}>
                  Campaign Budget: ${campaignData.budget}
                </Typography>
                <Slider
                  value={campaignData.budget}
                  onChange={(event, newValue) =>
                    handleFormChange("budget", newValue)
                  }
                  min={50}
                  max={2000}
                  step={25}
                  marks={[
                    { value: 50, label: "$50" },
                    { value: 500, label: "$500" },
                    { value: 1000, label: "$1K" },
                    { value: 2000, label: "$2K" },
                  ]}
                  sx={{
                    color: "#1DB954",
                    "& .MuiSlider-thumb": { bgcolor: "#1DB954" },
                    "& .MuiSlider-track": { bgcolor: "#1DB954" },
                    "& .MuiSlider-markLabel": { color: "grey.400" }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ color: "white", mb: 2 }}>
                  Campaign Duration: {campaignData.duration} days
                </Typography>
                <Slider
                  value={campaignData.duration}
                  onChange={(event, newValue) =>
                    handleFormChange("duration", newValue)
                  }
                  min={1}
                  max={30}
                  step={1}
                  marks={[
                    { value: 1, label: "1d" },
                    { value: 7, label: "1w" },
                    { value: 14, label: "2w" },
                    { value: 30, label: "1m" },
                  ]}
                  sx={{
                    color: "#1DB954",
                    "& .MuiSlider-thumb": { bgcolor: "#1DB954" },
                    "& .MuiSlider-track": { bgcolor: "#1DB954" },
                    "& .MuiSlider-markLabel": { color: "grey.400" }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ color: "white", mb: 2 }}>
                  Campaign Goals
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Target Streams"
                      type="number"
                      value={campaignData.goals.streams}
                      onChange={(e) =>
                        handleGoalChange(
                          "streams",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "white",
                          "& fieldset": { borderColor: "grey.600" },
                          "&:hover fieldset": { borderColor: "grey.500" },
                          "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                        },
                        "& .MuiInputLabel-root": { color: "grey.400" }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Playlist Additions"
                      type="number"
                      value={campaignData.goals.playlistAdds}
                      onChange={(e) =>
                        handleGoalChange(
                          "playlistAdds",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "white",
                          "& fieldset": { borderColor: "grey.600" },
                          "&:hover fieldset": { borderColor: "grey.500" },
                          "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                        },
                        "& .MuiInputLabel-root": { color: "grey.400" }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="New Followers"
                      type="number"
                      value={campaignData.goals.followers}
                      onChange={(e) =>
                        handleGoalChange(
                          "followers",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "white",
                          "& fieldset": { borderColor: "grey.600" },
                          "&:hover fieldset": { borderColor: "grey.500" },
                          "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                        },
                        "& .MuiInputLabel-root": { color: "grey.400" }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {estimatedReach && (
                <Grid item xs={12}>
                  <Card
                    sx={{
                      bgcolor: "rgba(29, 185, 84, 0.1)",
                      border: "1px solid #1DB954"
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Analytics sx={{ color: "#1DB954" }} />
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ color: "#1DB954", fontWeight: "bold" }}
                          >
                            Estimated Reach: {estimatedReach.toLocaleString()}{" "}
                            people
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "grey.300" }}
                          >
                            Based on your targeting and budget selection
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
              Review Your Campaign
            </Typography>

            <Card sx={{ bgcolor: "grey.800", mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                      Campaign Overview
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Campaign sx={{ color: "#1DB954" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Campaign Type"
                          secondary={
                            CAMPAIGN_TYPES.find(
                              (t) => t.id === campaignData.type,
                            )?.title
                          }
                          primaryTypographyProps={{ color: "white" }}
                          secondaryTypographyProps={{ color: "grey.400" }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <MusicNote sx={{ color: "#1DB954" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Selected Tracks"
                          secondary={`${campaignData.selectedTracks.length} track(s)`}
                          primaryTypographyProps={{ color: "white" }}
                          secondaryTypographyProps={{ color: "grey.400" }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AttachMoney sx={{ color: "#1DB954" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Budget"
                          secondary={`$${campaignData.budget}`}
                          primaryTypographyProps={{ color: "white" }}
                          secondaryTypographyProps={{ color: "grey.400" }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Schedule sx={{ color: "#1DB954" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Duration"
                          secondary={`${campaignData.duration} days`}
                          primaryTypographyProps={{ color: "white" }}
                          secondaryTypographyProps={{ color: "grey.400" }}
                        />
                      </ListItem>
                    </List>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                      Targeting Summary
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "grey.400", mb: 1 }}
                      >
                        Genres ({campaignData.targetGenres.length})
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {campaignData.targetGenres.map((genre) => (
                          <Chip
                            key={genre}
                            label={genre}
                            size="small"
                            sx={{ bgcolor: "grey.700", color: "white" }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {campaignData.targetMoods.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "grey.400", mb: 1 }}
                        >
                          Moods ({campaignData.targetMoods.length})
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {campaignData.targetMoods.map((mood) => (
                            <Chip
                              key={mood}
                              label={mood}
                              size="small"
                              sx={{ bgcolor: "grey.700", color: "white" }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {estimatedReach && (
                      <Box sx={{ mt: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{ color: "#1DB954", fontWeight: "bold" }}
                        >
                          Estimated Reach: {estimatedReach.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <TextField
              fullWidth
              label="Additional Notes (Optional)"
              value={campaignData.additionalNotes}
              onChange={(e) =>
                handleFormChange("additionalNotes", e.target.value)
              }
              multiline
              rows={3}
              placeholder="Any specific requirements or notes for your campaign..."
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "grey.600" },
                  "&:hover fieldset": { borderColor: "grey.500" },
                  "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                },
                "& .MuiInputLabel-root": { color: "grey.400" }
              }}
            />

            <Alert severity="info" sx={{ mb: 3 }}>
              Your campaign will be reviewed by our team within 24 hours. You'll
              receive an email confirmation once approved.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.900", color: "white", p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: "bold",
            mb: 1,
            background: "linear-gradient(45deg, #1DB954, #1ed760)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Campaign Wizard
        </Typography>
        <Typography variant="body1" sx={{ color: "grey.400" }}>
          Create targeted music promotion campaigns to grow your audience
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ bgcolor: "grey.800", mb: 4, p: 3 }}>
        <Stepper activeStep={activeStep} orientation="horizontal">
          {CAMPAIGN_STEPS.map((label, index) => (
            <Step key={label} completed={completed[index]}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": {
                    color: activeStep === index ? "#1DB954" : "grey.400"
                  },
                  "& .MuiStepIcon-root": {
                    color: activeStep === index ? "#1DB954" : "grey.600",
                    "&.Mui-completed": { color: "#1DB954" }
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Paper sx={{ bgcolor: "grey.800", mb: 4, p: 3 }}>
        {renderStepContent(activeStep)}
      </Paper>

      {/* Navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ color: "grey.400" }}
        >
          Back
        </Button>

        <Box sx={{ display: "flex", gap: 2 }}>
          {activeStep === CAMPAIGN_STEPS.length - 1 && (
            <Button
              variant="outlined"
              onClick={generatePreview}
              sx={{
                borderColor: "#1DB954",
                color: "#1DB954",
                "&:hover": { borderColor: "#1ed760", color: "#1ed760" }
              }}
            >
              Preview Campaign
            </Button>
          )}

          <Button
            variant="contained"
            onClick={
              activeStep === CAMPAIGN_STEPS.length - 1
                ? handleSubmitCampaign
                : handleNext
            }
            disabled={!isStepValid() || loading}
            sx={{
              bgcolor: "#1DB954",
              "&:hover": { bgcolor: "#1ed760" },
              "&:disabled": { bgcolor: "grey.600" }
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinearProgress size={20} sx={{ color: "white" }} />
                Submitting...
              </Box>
            ) : activeStep === CAMPAIGN_STEPS.length - 1 ? (
              "Submit Campaign"
            ) : (
              "Next"
            )}
          </Button>
        </Box>
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "grey.800", color: "white" }
        }}
      >
        <DialogTitle>Campaign Preview</DialogTitle>
        <DialogContent>
          {campaignPreview && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {campaignData.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "grey.400", mb: 3 }}>
                {campaignData.description}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 2 }}
                  >
                    Campaign Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Type"
                        secondary={campaignPreview.type.title}
                        primaryTypographyProps={{ color: "white" }}
                        secondaryTypographyProps={{ color: "grey.400" }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Budget"
                        secondary={`$${campaignPreview.budget}`}
                        primaryTypographyProps={{ color: "white" }}
                        secondaryTypographyProps={{ color: "grey.400" }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Duration"
                        secondary={`${campaignPreview.duration} days`}
                        primaryTypographyProps={{ color: "white" }}
                        secondaryTypographyProps={{ color: "grey.400" }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Estimated Reach"
                        secondary={`${campaignPreview.estimatedReach?.toLocaleString()} people`}
                        primaryTypographyProps={{ color: "white" }}
                        secondaryTypographyProps={{ color: "#1DB954" }}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 2 }}
                  >
                    Selected Tracks
                  </Typography>
                  {campaignPreview.tracks.map((track) => (
                    <Box
                      key={track.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2
                      }}
                    >
                      <Box
                        component="img"
                        src={track.coverUrl || "/default-song-cover.jpg"}
                        alt={track.title}
                        sx={{ width: 40, height: 40, borderRadius: 1 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "white", fontWeight: "bold" }}
                        >
                          {track.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "grey.400" }}
                        >
                          {track.genre}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handlePlayTrack(track)}
                        sx={{ color: "#1DB954" }}
                      >
                        <PlayArrow />
                      </IconButton>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ color: "grey.400" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
