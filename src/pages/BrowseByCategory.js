// src/pages/BrowseByCategory.js
// Browse music by different categories (mood, genre, platform, use case)
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import BrowseFilters from '../components/BrowseFilters';
import HomeStorefront from './HomeStorefront';
import { getBrowseCategory } from '../config/browseCategories';

const BrowseByCategory = () => {
  const { category } = useParams();
  const activeCategory = getBrowseCategory(category);
  const title = activeCategory?.title || 'Browse Music';
  const description = activeCategory?.description || 'Discover music for your content';

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3, height: '100%', overflow: 'hidden' }}>
      {/* Filters Sidebar */}
      <Box sx={{ flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
        <BrowseFilters />
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            {description}
          </Typography>
        </Box>

        {/* Reuse HomeStorefront component for track display, filtered by the active category */}
        <HomeStorefront hideHeader filter={activeCategory} />
      </Box>
    </Box>
  );
};

export default BrowseByCategory;
