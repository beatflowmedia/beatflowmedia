// src/pages/CategoryPage.js
// Generic page for displaying content by category (podcasts, audiobooks, etc.)
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';

export default function CategoryPage() {
  const { category, type } = useParams();
  const location = useLocation();

  // Get category from params or extract from pathname
  const getCategoryName = () => {
    if (category) return category;
    if (type) return type;

    // Extract from pathname (e.g., /made-for-you -> made-for-you)
    const pathname = location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'category';
  };

  // Format category for display
  const formatCategory = (categorySlug) => {
    if (!categorySlug) return 'Category';
    return categorySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const displayName = formatCategory(getCategoryName());

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 4 }}>
          {displayName}
        </Typography>

        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
            Coming Soon
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {displayName} content will be available soon.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
