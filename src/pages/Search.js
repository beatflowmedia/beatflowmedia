import { useState, useEffect , useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Tabs,
  Tab,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Skeleton,
  Paper,
  Autocomplete
} from "@mui/material";
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import Slide from '@mui/material/Slide';
import FilterList from '@mui/icons-material/FilterList';
import {
  Search as SearchIcon,
  Clear,
  PlayArrow,
  Favorite,
  FavoriteBorder,
  MoreVert,
  Share,
  QueueMusic,
  MusicNote,
  Person,
  Album,
  History,
  TrendingUp,
  ShoppingCart
} from "@mui/icons-material";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { useLikes } from '../context/LikesContext';
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { addDoc } from 'firebase/firestore';
import CircularProgress from '@mui/material/CircularProgress';
import Pause from '@mui/icons-material/Pause';
import Fade from '@mui/material/Fade';
import { useNavigate } from 'react-router-dom';
import { stripeService } from '../services/stripeService';

const SEARCH_CATEGORIES = [
  { label: "All", value: "all", icon: <SearchIcon /> },
  { label: "Songs", value: "songs", icon: <MusicNote /> },
  { label: "Artists", value: "artists", icon: <Person /> },
  { label: "Albums", value: "albums", icon: <Album /> },
  { label: "Playlists", value: "playlists", icon: <PlaylistAdd /> },
];

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Popularity", value: "popularity" },
  { label: "Date Added", value: "dateAdded" },
  { label: "Alphabetical", value: "alphabetical" },
];

const FILTER_OPTIONS = {
  genre: [
    "Pop",
    "Rock",
    "Hip Hop",
    "Electronic",
    "Jazz",
    "Classical",
    "Country",
    "R&B",
  ],
  mood: ["Happy", "Sad", "Energetic", "Calm", "Romantic", "Party", "Workout"],
  year: ["2024", "2023", "2022", "2021", "2020", "Older"],
  duration: ["Short (< 3 min)", "Medium (3-5 min)", "Long (> 5 min)"]
};

function Search() {
  const { state, dispatch, actions } = usePlayer();
  const { user } = useAuth();
  const { addLike, removeLike, isLiked: checkIsLiked } = useLikes();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchResults, setSearchResults] = useState({
    songs: [],
    artists: [],
    albums: [],
    playlists: []
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // UI state
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState({
    genre: [],
    mood: [],
    year: [],
    duration: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load search history and trending searches on mount
  useEffect(() => {
    const loadData = async () => {
      await loadSearchHistory();
      await loadTrendingSearches();
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    const debouncedFn = debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setSearchResults({ songs: [], artists: [], albums: [], playlists: [] });
        setHasSearched(false);
        return;
      }

      setLoading(true);
      try {
        const results = await performSearch(searchQuery);
        setSearchResults(results);
        setHasSearched(true);

        // Save to search history
        if (user) {
          await saveSearchToHistory(searchQuery);
        }
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 300);

    debouncedFn(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Perform search across all collections
  const performSearch = async (query) => {
    const searchTerm = query.toLowerCase();
    const results = { songs: [], artists: [], albums: [], playlists: [] };

    try {
      // Search songs
      const songsQuery = query(
        collection(db, "songs"),
        where("searchTerms", "array-contains", searchTerm),
        orderBy("playCount", "desc"),
        limit(20),
      );
      const songsSnapshot = await getDocs(songsQuery);
      results.songs = songsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "song"
      }));

      // Search artists
      const artistsQuery = query(
        collection(db, "artists"),
        where("searchTerms", "array-contains", searchTerm),
        orderBy("followers", "desc"),
        limit(10),
      );
      const artistsSnapshot = await getDocs(artistsQuery);
      results.artists = artistsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "artist"
      }));

      // Search albums
      const albumsQuery = query(
        collection(db, "albums"),
        where("searchTerms", "array-contains", searchTerm),
        orderBy("releaseDate", "desc"),
        limit(15),
      );
      const albumsSnapshot = await getDocs(albumsQuery);
      results.albums = albumsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "album"
      }));

      // Search playlists
      const playlistsQuery = query(
        collection(db, "playlists"),
        where("searchTerms", "array-contains", searchTerm),
        where("public", "==", true),
        orderBy("followers", "desc"),
        limit(10),
      );
      const playlistsSnapshot = await getDocs(playlistsQuery);
      results.playlists = playlistsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "playlist"
      }));

      // Apply filters if any
      if (Object.values(filters).some((f) => f.length > 0)) {
        results.songs = applyFilters(results.songs);
      }

      // Apply sorting
      Object.keys(results).forEach((key) => {
        results[key] = applySorting(results[key], sortBy);
      });
    } catch (error) {
      console.error("Search error:", error);
    }

    return results;
  };

  // Apply filters to search results
  const applyFilters = (songs) => {
    return songs.filter((song) => {
      // Genre filter
      if (filters.genre.length > 0 && !filters.genre.includes(song.genre)) {
        return false;
      }

      // Mood filter
      if (
        filters.mood.length > 0 &&
        !filters.mood.some((mood) => song.moods?.includes(mood))
      ) {
        return false;
      }

      // Year filter
      if (filters.year.length > 0) {
        const songYear = new Date(song.releaseDate).getFullYear().toString();
        if (
          !filters.year.includes(songYear) &&
          !(filters.year.includes("Older") && parseInt(songYear) < 2020)
        ) {
          return false;
        }
      }

      // Duration filter
      if (filters.duration.length > 0) {
        const duration = song.duration || 0;
        const durationMinutes = duration / 60;

        const matchesDuration = filters.duration.some((filter) => {
          switch (filter) {
            case "Short (< 3 min)":
              return durationMinutes < 3;
            case "Medium (3-5 min)":
              return durationMinutes >= 3 && durationMinutes <= 5;
            case "Long (> 5 min)":
              return durationMinutes > 5;
            default:
              return true;
          }
        });

        if (!matchesDuration) return false;
      }

      return true;
    });
  };

  // Apply sorting to results
  const applySorting = (items, sortType) => {
    switch (sortType) {
      case "popularity":
        return [...items].sort(
          (a, b) => (b.playCount || 0) - (a.playCount || 0),
        );
      case "dateAdded":
        return [...items].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
      case "alphabetical":
        return [...items].sort((a, b) =>
          (a.title || a.name || "").localeCompare(b.title || b.name || ""),
        );
      default: // relevance
        return items; // Already sorted by relevance from Firestore
    }
  };

  // Load user's search history
  const loadSearchHistory = async () => {
    if (!user) return;

    try {
      const historyQuery = query(
        collection(db, "searchHistory"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(10),
      );
      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map((doc) => doc.data().query);
      setSearchHistory([...new Set(history)]); // Remove duplicates
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  // Load trending searches
  const loadTrendingSearches = async () => {
    try {
      // This would typically come from analytics
      const trending = [
        "pop music",
        "new releases",
        "indie rock",
        "electronic",
        "hip hop",
        "acoustic",
        "jazz",
        "classical",
      ];
      setSuggestions(trending);
    } catch (error) {
      console.error("Error loading trending searches:", error);
    }
  };

  // Save search to history
  const saveSearchToHistory = async (query) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "searchHistory"), {
        userId: user.uid,
        query,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  // Event handlers
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults({ songs: [], artists: [], albums: [], playlists: [] });
    setHasSearched(false);
  };

  const handleCategoryChange = (event, newValue) => {
    setActiveCategory(newValue);
  };

  const handlePlaySong = useCallback(
    (song) => {
      dispatch({ type: actions.PLAY_SONG, payload: song });
    },
    [dispatch, actions],
  );

  const handleToggleLike = useCallback(
    async (song) => {
      if (!user) {
        toast.error("Please sign in to like songs");
        return;
      }

      try {
        const isLiked = user.likes?.includes(song.id);
        if (isLiked) {
          await removeLike(song.id);
          toast.success("Removed from liked songs");
        } else {
          await addLike(song.id);
          toast.success("Added to liked songs");
        }
      } catch (err) {
        toast.error("Failed to update likes");
      }
    },
    [user, addLike, removeLike],
  );

  const handleMenuOpen = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handlePurchase = async (item) => {
    handleMenuClose();
    if (!user) {
      toast.error('Please sign in to purchase music');
      return;
    }

    if (item.type !== 'song') {
      toast.error('Only songs can be purchased individually');
      return;
    }

    try {
      const hasPurchased = await stripeService.hasPurchasedSong(user.uid, item.id);
      if (hasPurchased) {
        toast.info('You already own this song! Redirecting to downloads...');
        navigate('/downloads');
        return;
      }

      await stripeService.createSongCheckout(user.uid, item.id, user.email);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(`Failed to initiate purchase: ${error.message}`);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((v) => v !== value)
        : [...prev[filterType], value]
    }));
  };

  // Get filtered results for current category
  const getFilteredResults = () => {
    if (activeCategory === "all") {
      return [
        ...searchResults.songs.slice(0, 6),
        ...searchResults.artists.slice(0, 4),
        ...searchResults.albums.slice(0, 4),
        ...searchResults.playlists.slice(0, 4),
      ];
    }
    return searchResults[activeCategory] || [];
  };

  const filteredResults = getFilteredResults();

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "auto", bgcolor: "grey.900" }}>
      {/* Search Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: "white",
            fontWeight: "bold",
            mb: 2,
            background: "linear-gradient(45deg, #1DB954, #1ed760)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Search Music
        </Typography>

        {/* Search Input */}
        <Paper
          component="form"
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            bgcolor: "grey.800",
            border: "1px solid",
            borderColor: searchQuery ? "#1DB954" : "grey.700",
            transition: "border-color 0.2s"
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          <SearchIcon sx={{ p: "10px", color: "grey.400" }} />
          <TextField
            fullWidth
            placeholder="Search songs, artists, albums, playlists..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                color: "white",
                "& input::placeholder": {
                  color: "grey.400",
                  opacity: 1
                }
              }
            }}
          />
          {searchQuery && (
            <IconButton
              onClick={handleClearSearch}
              sx={{ p: "10px", color: "grey.400" }}
            >
              <Clear />
            </IconButton>
          )}
          {loading && (
            <CircularProgress size={20} sx={{ p: "10px", color: "#1DB954" }} />
          )}
        </Paper>
      </Box>

      {/* Search suggestions and history when not searching */}
      {!hasSearched && !loading && (
        <Fade in timeout={300}>
          <Box>
            {/* Search History */}
            {searchHistory.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <History /> Recent Searches
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {searchHistory.map((query, index) => (
                    <Chip
                      key={index}
                      label={query}
                      onClick={() => {
                        setSearchQuery(query);
                        debouncedSearch(query);
                      }}
                      sx={{
                        bgcolor: "grey.800",
                        color: "white",
                        "&:hover": { bgcolor: "grey.700" }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Trending Searches */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <TrendingUp /> Trending Searches
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      debouncedSearch(suggestion);
                    }}
                    sx={{
                      bgcolor: "grey.800",
                      color: "white",
                      "&:hover": { bgcolor: "grey.700" }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Search Results */}
      {hasSearched && (
        <Slide direction="up" in timeout={300}>
          <Box>
            {/* Category Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "grey.700", mb: 3 }}>
              <Tabs
                value={activeCategory}
                onChange={handleCategoryChange}
                sx={{
                  "& .MuiTab-root": {
                    color: "grey.400",
                    "&.Mui-selected": { color: "#1DB954" }
                  },
                  "& .MuiTabs-indicator": { backgroundColor: "#1DB954" }
                }}
              >
                {SEARCH_CATEGORIES.map((category) => (
                  <Tab
                    key={category.value}
                    value={category.value}
                    icon={category.icon}
                    label={`${category.label} ${searchResults[category.value]?.length || ""}`}
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </Box>

            {/* Filters and Sort */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3
              }}
            >
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ color: "white" }}
                >
                  Filters
                </Button>
                <Autocomplete
                  value={sortBy}
                  onChange={(event, newValue) => setSortBy(newValue)}
                  options={SORT_OPTIONS.map((option) => option.value)}
                  getOptionLabel={(option) =>
                    SORT_OPTIONS.find((o) => o.value === option)?.label ||
                    option
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Sort by"
                      size="small"
                      sx={{
                        width: 150,
                        "& .MuiOutlinedInput-root": {
                          color: "white",
                          "& fieldset": { borderColor: "grey.600" },
                          "&:hover fieldset": { borderColor: "grey.500" },
                          "&.Mui-focused fieldset": { borderColor: "#1DB954" }
                        }
                      }}
                    />
                  )}
                  sx={{ minWidth: 150 }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: "grey.400" }}>
                {filteredResults.length} results for "{searchQuery}"
              </Typography>
            </Box>

            {/* Filters Panel */}
            {showFilters && (
              <Fade in timeout={200}>
                <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.800" }}>
                  <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                    Filters
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(FILTER_OPTIONS).map(
                      ([filterType, options]) => (
                        <Grid item xs={12} sm={6} md={3} key={filterType}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: "white",
                              mb: 1,
                              textTransform: "capitalize"
                            }}
                          >
                            {filterType}
                          </Typography>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {options.map((option) => (
                              <Chip
                                key={option}
                                label={option}
                                onClick={() =>
                                  handleFilterChange(filterType, option)
                                }
                                variant={
                                  filters[filterType].includes(option)
                                    ? "filled"
                                    : "outlined"
                                }
                                size="small"
                                sx={{
                                  color: filters[filterType].includes(option)
                                    ? "white"
                                    : "grey.400",
                                  bgcolor: filters[filterType].includes(option)
                                    ? "#1DB954"
                                    : "transparent",
                                  borderColor: "grey.600",
                                  "&:hover": {
                                    bgcolor: filters[filterType].includes(
                                      option,
                                    )
                                      ? "#1ed760"
                                      : "grey.700"
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Grid>
                      ),
                    )}
                  </Grid>
                </Paper>
              </Fade>
            )}

            {/* Results Grid */}
            {loading ? (
              <Grid container spacing={2}>
                {[...Array(8)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Card sx={{ bgcolor: "grey.800" }}>
                      <Skeleton variant="rectangular" height={200} />
                      <CardContent>
                        <Skeleton variant="text" />
                        <Skeleton variant="text" width="60%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : filteredResults.length > 0 ? (
              <Grid container spacing={2}>
                {filteredResults.map((item) => {
                  const isCurrentSong =
                    state.queue[state.currentIndex]?.id === item.id;
                  const isLiked = user?.likes?.includes(item.id) || false;

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      key={`${item.type}-${item.id}`}
                    >
                      <Card
                        sx={{
                          bgcolor: "grey.800",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            bgcolor: "grey.700",
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
                          }
                        }}
                      >
                        <Box sx={{ position: "relative" }}>
                          <CardMedia
                            component="img"
                            height="200"
                            image={
                              item.coverUrl ||
                              item.imageUrl ||
                              item.cover ||
                              "/default-cover.jpg"
                            }
                            alt={item.title || item.name}
                            sx={{ cursor: "pointer" }}
                            onClick={() =>
                              item.type === "song" && handlePlaySong(item)
                            }
                          />

                          {/* Type Badge */}
                          <Chip
                            label={item.type}
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "rgba(0,0,0,0.7)",
                              color: "white",
                              textTransform: "capitalize"
                            }}
                          />

                          {/* Play Overlay for Songs */}
                          {item.type === "song" && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgcolor: "rgba(0,0,0,0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: 0,
                                transition: "opacity 0.3s",
                                cursor: "pointer",
                                "&:hover": { opacity: 1 }
                              }}
                              onClick={() => handlePlaySong(item)}
                            >
                              <IconButton
                                size="large"
                                sx={{
                                  bgcolor: "#1DB954",
                                  color: "white",
                                  "&:hover": {
                                    bgcolor: "#1ed760",
                                    transform: "scale(1.1)"
                                  }
                                }}
                              >
                                {isCurrentSong && state.isPlaying ? (
                                  <Pause />
                                ) : (
                                  <PlayArrow />
                                )}
                              </IconButton>
                            </Box>
                          )}
                        </Box>

                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: "white",
                              fontWeight: "bold",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {item.title || item.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: "grey.400",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {item.artist || item.creator || "Unknown"}
                          </Typography>

                          {item.genre && (
                            <Chip
                              label={item.genre}
                              size="small"
                              sx={{
                                mt: 1,
                                bgcolor: "grey.700",
                                color: "white",
                                fontSize: "0.7rem"
                              }}
                            />
                          )}

                          {/* Action Buttons */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mt: 2
                            }}
                          >
                            {item.type === "song" && (
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleLike(item)}
                                  sx={{
                                    color: isLiked ? "#e91e63" : "grey.400",
                                    "&:hover": {
                                      color: isLiked ? "#ad1457" : "#e91e63"
                                    }
                                  }}
                                >
                                  {isLiked ? <Favorite /> : <FavoriteBorder />}
                                </IconButton>

                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    dispatch({
                                      type: actions.ENQUEUE,
                                      payload: { item }
                                    })
                                  }
                                  sx={{
                                    color: "grey.400",
                                    "&:hover": { color: "#1DB954" }
                                  }}
                                >
                                  <PlaylistAdd />
                                </IconButton>
                              </Box>
                            )}

                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, item)}
                              sx={{
                                color: "grey.400",
                                "&:hover": { color: "white" }
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <SearchIcon sx={{ fontSize: 64, color: "grey.600", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "grey.400", mb: 1 }}>
                  No results found for "{searchQuery}"
                </Typography>
                <Typography variant="body2" sx={{ color: "grey.500" }}>
                  Try different keywords or check your spelling
                </Typography>
              </Box>
            )}
          </Box>
        </Slide>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: "grey.800",
            border: "1px solid",
            borderColor: "grey.700"
          }
        }}
      >
        {selectedItem?.type === "song" && (
          <>
            <MenuItem
              onClick={() => handlePlaySong(selectedItem)}
              sx={{ color: "white" }}
            >
              <ListItemIcon>
                <PlayArrow sx={{ color: "#1DB954" }} />
              </ListItemIcon>
              <ListItemText>Play Now</ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() =>
                dispatch({
                  type: actions.ENQUEUE,
                  payload: { item: selectedItem }
                })
              }
              sx={{ color: "white" }}
            >
              <ListItemIcon>
                <QueueMusic sx={{ color: "grey.400" }} />
              </ListItemIcon>
              <ListItemText>Add to Queue</ListItemText>
            </MenuItem>

            <Divider sx={{ bgcolor: "grey.700" }} />
          </>
        )}

        <MenuItem onClick={handleMenuClose} sx={{ color: "white" }}>
          <ListItemIcon>
            <Share sx={{ color: "grey.400" }} />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>

        {selectedItem?.type === "song" && (
          <>
            <Divider sx={{ bgcolor: "grey.700" }} />
            <MenuItem onClick={() => handlePurchase(selectedItem)} sx={{ color: "white" }}>
              <ListItemIcon>
                <ShoppingCart sx={{ color: "#1DB954" }} />
              </ListItemIcon>
              <ListItemText>Purchase ($0.99)</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
}

export default Search;
