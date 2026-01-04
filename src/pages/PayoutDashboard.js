import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Grid, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';

// Example: Replace with real API endpoint and Firestore summary fetch
const fetchPayoutData = async (stripeAccountId) => {
  try {
    const res = await fetch(`/.netlify/functions/api/stripe/payouts?stripeAccountId=${stripeAccountId}`);

    // Check if response is JSON before parsing
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Expected JSON but received:', contentType);
      throw new Error('Invalid response format from server');
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch Stripe payout data: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Payout fetch error:', error);
    // Return mock data if API fails (for development)
    return {
      balance: {
        available: [{ amount: 0 }]
      },
      payouts: [],
      ledger: []
    };
  }
};

const fetchPayoutSummary = async (userId) => {
  // Replace with Firestore fetch
  return {
    lastPayout: '2025-09-10',
    currentBalance: 1200.50,
    royaltyTotal: 8500.00,
  };
};

const PayoutDashboard = ({ userId, stripeAccountId }) => {
  const [payoutData, setPayoutData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayoutData(stripeAccountId).then(setPayoutData);
    fetchPayoutSummary(userId).then(setSummary);
  }, [userId, stripeAccountId]);

  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!payoutData || !summary) return <div className="text-white">Loading payout data...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Typography variant="h4" gutterBottom>Payout & Wallet Dashboard</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Wallet Balance</Typography>
              <Typography variant="h3" color="primary">${payoutData.balance.available[0].amount / 100}</Typography>
              <Typography variant="body2">Last Payout: {summary.lastPayout}</Typography>
              <Typography variant="body2">Total Royalties: ${summary.royaltyTotal}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6">Recent Payouts</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutData.payouts.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.arrival_date * 1000).toLocaleDateString()}</TableCell>
                      <TableCell>${p.amount / 100}</TableCell>
                      <TableCell>{p.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Ledger Transactions</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutData.ledger.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.created * 1000).toLocaleDateString()}</TableCell>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>${tx.amount / 100}</TableCell>
                      <TableCell>{tx.description || tx.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default PayoutDashboard;
