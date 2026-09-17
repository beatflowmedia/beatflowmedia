// src/components/BrowseFilters.js
// Filter panel for music licensing marketplace
import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Slider,
  Chip,
  Button
} from '@mui/material';
import { ExpandMore, FilterList } from '@mui/icons-material';

const BrowseFilters = ({ onFilterChange, onClearFilters }) => {
  const [filters, setFilters] = useState({
    duration: [0, 300], // 0-5 minutes in seconds
    bpm: [60, 180],
    genres: [],
    moods: [],
    explicit: null, // null = both, true = explicit only, false = clean only
    loopable: null
  });

  const durations = [
    { label: '< 15s (TikTok)', min: 0, max: 15 },
    { label: '15-30s (Reels)', min: 15, max: 30 },
    { label: '30-60s', min: 30, max: 60 },
    { label: '1-3 min', min: 60, max: 180 },
    { label: '3-5 min', min: 180, max: 300 },
    { label: '5+ min', min: 300, max: 600 }
  ];

  const genres = [
    'Hip-Hop', 'Electronic', 'Pop', 'Rock', 'R&B',
    'Jazz', 'Classical', 'Country', 'Latin', 'Reggae'
  ];

  const moods = [
    'Uplifting', 'Chill', 'Energetic', 'Dramatic', 'Dark',
    'Happy', 'Sad', 'Motivational', 'Relaxing', 'Intense'
  ];

  const handleDurationChange = (event, newValue) => {
    const updated = { ...filters, duration: newValue };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleBPMChange = (event, newValue) => {
    const updated = { ...filters, bpm: newValue };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleGenreToggle = (genre) => {
    const updated = {
      ...filters,
      genres: filters.genres.includes(genre)
        ? filters.genres.filter(g => g !== genre)
        : [...filters.genres, genre]
    };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleMoodToggle = (mood) => {
    const updated = {
      ...filters,
      moods: filters.moods.includes(mood)
        ? filters.moods.filter(m => m !== mood)
        : [...filters.moods, mood]
    };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleClearAll = () => {
    const cleared = {
      duration: [0, 300],
      bpm: [60, 180],
      genres: [],
      moods: [],
      explicit: null,
      loopable: null
    };
    setFilters(cleared);
    onClearFilters?.();
    onFilterChange?.(cleared);
  };

  const activeFilterCount =
    filters.genres.length +
    filters.moods.length +
    (filters.explicit !== null ? 1 : 0) +
    (filters.loopable !== null ? 1 : 0);

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 280 },
        bgcolor: 'rgba(255,255,255,0.03)',
        borderRadius: 2,
        p: 2,
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList sx={{ color: 'white' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              sx={{ bgcolor: '#1DB954', color: 'white', fontWeight: 'bold' }}
            />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={handleClearAll}
            sx={{ color: 'grey.400', minWidth: 'auto' }}
          >
            Clear
          </Button>
        )}
      </Box>

      {/* Duration Filter */}
      <Accordion
        defaultExpanded
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: 'white' }} />}
          sx={{ color: 'white', px: 0 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Duration
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>
          <Slider
            value={filters.duration}
            onChange={handleDurationChange}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`}
            min={0}
            max={300}
            sx={{ color: '#1DB954', mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {durations.map((d) => (
              <Chip
                key={d.label}
                label={d.label}
                size="small"
                onClick={() => setFilters({ ...filters, duration: [d.min, d.max] })}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(29,185,84,0.3)' }
                }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* BPM Filter */}
      <Accordion
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: 'white' }} />}
          sx={{ color: 'white', px: 0 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            BPM
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>
          <Slider
            value={filters.bpm}
            onChange={handleBPMChange}
            valueLabelDisplay="auto"
            min={60}
            max={180}
            sx={{ color: '#1DB954' }}
          />
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            {filters.bpm[0]} - {filters.bpm[1]} BPM
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Genre Filter */}
      <Accordion
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: 'white' }} />}
          sx={{ color: 'white', px: 0 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Genre
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {genres.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                size="small"
                onClick={() => handleGenreToggle(genre)}
                sx={{
                  bgcolor: filters.genres.includes(genre) ? '#1DB954' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: filters.genres.includes(genre) ? '#1ed760' : 'rgba(255,255,255,0.2)'
                  }
                }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Mood Filter */}
      <Accordion
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: 'white' }} />}
          sx={{ color: 'white', px: 0 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Mood
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {moods.map((mood) => (
              <Chip
                key={mood}
                label={mood}
                size="small"
                onClick={() => handleMoodToggle(mood)}
                sx={{
                  bgcolor: filters.moods.includes(mood) ? '#1DB954' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: filters.moods.includes(mood) ? '#1ed760' : 'rgba(255,255,255,0.2)'
                  }
                }}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Content Type Filter */}
      <Accordion
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: 'white' }} />}
          sx={{ color: 'white', px: 0 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Content Type
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.explicit === false}
                  onChange={() => setFilters({ ...filters, explicit: filters.explicit === false ? null : false })}
                  sx={{ color: 'grey.400', '&.Mui-checked': { color: '#1DB954' } }}
                />
              }
              label="Clean Only"
              sx={{ color: 'white' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.loopable === true}
                  onChange={() => setFilters({ ...filters, loopable: filters.loopable === true ? null : true })}
                  sx={{ color: 'grey.400', '&.Mui-checked': { color: '#1DB954' } }}
                />
              }
              label="Loopable"
              sx={{ color: 'white' }}
            />
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default BrowseFilters;
