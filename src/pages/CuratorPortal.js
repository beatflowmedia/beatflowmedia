import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CuratorMarketingLanding from '../components/CuratorMarketingLanding';
import CuratorSubmissionInbox from '../components/CuratorSubmissionInbox';
import CuratorRevenueDashboard from '../components/CuratorRevenueDashboard';
import OnboardStripe from '../components/OnboardStripe';
import { Box, Container, Tabs, Tab } from '@mui/material';

const CuratorPortal = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  // Redirect to signin if not authenticated, then back to curator portal
  useEffect(() => {
    if (!user) {
      // User not signed in - redirect to signin with return path
      navigate('/?signin=true&redirect=/curator-portal', { replace: true });
    }
  }, [user, navigate]);

  // Show marketing landing page for non-curators (but signed in users)
  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (role !== 'curator') {
    return <CuratorMarketingLanding />;
  }

  // Show curator dashboard for verified curators
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff', py: 4 }}>
      <Container maxWidth="xl">
        <h2 className="text-3xl font-bold mb-6">Curator Portal</h2>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: '#404040', mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: '#b3b3b3',
                fontWeight: 'bold',
                '&.Mui-selected': { color: '#1db954' }
              },
              '& .MuiTabs-indicator': { bgcolor: '#1db954' }
            }}
          >
            <Tab label="Submissions" />
            <Tab label="Revenue" />
            <Tab label="Payouts" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && <CuratorSubmissionInbox />}
        {activeTab === 1 && <CuratorRevenueDashboard />}
        {activeTab === 2 && (
          <Box>
            <OnboardStripe />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CuratorPortal;
