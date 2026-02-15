// src/components/SubscriptionManager.js
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { Check, TrendingUp, TrendingDown } from '@mui/icons-material';
import { getActivePlans, formatPrice } from '../data/pricingPlans';

export default function SubscriptionManager({ currentTier, userId, onUpdate }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plans = getActivePlans();
  const currentPlan = plans.find(p => p.id === currentTier);

  const handlePlanSelect = (plan) => {
    if (plan.id === currentTier) return; // Can't switch to current plan
    setSelectedPlan(plan);
    setConfirmDialogOpen(true);
  };

  const handleConfirmChange = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPriceId: selectedPlan.stripePriceId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update subscription');
      }

      const result = await response.json();
      setConfirmDialogOpen(false);
      if (onUpdate) onUpdate(result.subscription);
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isUpgrade = (plan) => {
    if (!currentPlan) return false;
    return plan.price > currentPlan.price;
  };

  const isDowngrade = (plan) => {
    if (!currentPlan) return false;
    return plan.price < currentPlan.price;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, color: 'text.primary' }}>
        Change Subscription Plan
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const upgrade = isUpgrade(plan);
          const downgrade = isDowngrade(plan);

          return (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  border: isCurrent ? '2px solid #1DB954' : '1px solid',
                  borderColor: isCurrent ? '#1DB954' : 'divider',
                  bgcolor: isCurrent ? 'rgba(29, 185, 84, 0.05)' : 'background.paper',
                  cursor: isCurrent ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': !isCurrent ? {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  } : {}
                }}
                onClick={() => !isCurrent && handlePlanSelect(plan)}
              >
                <CardContent>
                  {plan.tag && (
                    <Chip
                      label={plan.tag}
                      size="small"
                      color={plan.tagColor === 'green' ? 'success' : 'default'}
                      sx={{ mb: 1 }}
                    />
                  )}

                  <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
                    {plan.title}
                  </Typography>

                  <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
                    {formatPrice(plan.price)}
                    <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                      /mo
                    </Typography>
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, minHeight: 40 }}>
                    {plan.description}
                  </Typography>

                  {isCurrent ? (
                    <Chip
                      icon={<Check />}
                      label="Current Plan"
                      color="success"
                      sx={{ width: '100%' }}
                    />
                  ) : upgrade ? (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<TrendingUp />}
                      sx={{
                        bgcolor: '#1DB954',
                        '&:hover': { bgcolor: '#1ed760' }
                      }}
                    >
                      Upgrade
                    </Button>
                  ) : downgrade ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingDown />}
                    >
                      Downgrade
                    </Button>
                  ) : (
                    <Button fullWidth variant="outlined">
                      Select
                    </Button>
                  )}

                  {/* Show discount percentage */}
                  {plan.perTrackDiscount > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 2,
                        color: '#1DB954',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      {Math.round(plan.perTrackDiscount * 100)}% off perpetual licenses
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !loading && setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedPlan && isUpgrade(selectedPlan) ? 'Upgrade' : 'Downgrade'} Subscription?
        </DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You are about to {isUpgrade(selectedPlan) ? 'upgrade' : 'downgrade'} from{' '}
                <strong>{currentPlan?.title}</strong> ({formatPrice(currentPlan?.price)}/mo) to{' '}
                <strong>{selectedPlan.title}</strong> ({formatPrice(selectedPlan.price)}/mo).
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                {isUpgrade(selectedPlan) ? (
                  <>
                    You'll be charged a prorated amount today and your billing cycle will continue as normal.
                    Your new benefits will be available immediately.
                  </>
                ) : (
                  <>
                    You'll receive a prorated credit and your new plan will take effect immediately.
                    You'll continue to have access to your current features until the end of your billing period.
                  </>
                )}
              </Alert>

              {selectedPlan.perTrackDiscount > currentPlan.perTrackDiscount && (
                <Alert severity="success">
                  Your discount on perpetual licenses will increase from{' '}
                  {Math.round(currentPlan.perTrackDiscount * 100)}% to{' '}
                  {Math.round(selectedPlan.perTrackDiscount * 100)}%!
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmChange}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#1DB954',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
