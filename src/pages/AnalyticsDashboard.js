import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import PlayerAnalyticsClass from '../services/analytics/PlayerAnalytics';

// Dummy fetch function for analytics data (replace with real API/service)
const fetchAnalyticsData = async () => {
  // Fetch playback metrics from Netlify playback-metrics API
  try {
    const res = await fetch('/.netlify/functions/api/admin/playback-metrics?range=24h');
    if (!res.ok) throw new Error('Failed to fetch playback metrics');
    const metrics = await res.json();
    // Map metrics to dashboard format
    return {
      playbackHealth: [metrics.playCount, metrics.pauseCount, metrics.seekCount, metrics.endCount, metrics.royaltyCount],
      engagement: {
        tracksPlayed: metrics.playCount,
        totalPlaytime: metrics.totalPlaytime,
        skipCount: metrics.pauseCount,
        seekCount: metrics.seekCount,
        errorCount: metrics.errorCount,
        completionRate: metrics.avgCompletion,
      },
      compliance: {
        royaltyQualifyingPlays: metrics.royaltyCount,
        nonQualifyingPlays: metrics.endCount - metrics.royaltyCount,
      },
      errors: [metrics.errorCount],
      timestamps: [metrics.timestamp],
      trackStats: metrics.trackStats,
    };
  } catch (err) {
    console.error('Playback analytics fetch error:', err);
    return null;
  }
};

const AnalyticsDashboard = () => {
  // Export handlers
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_export_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    // Flatten userStats for CSV
    const userRows = (data.userStats ? Object.entries(data.userStats) : []).map(([userId, stats]) => ({ userId, ...stats }));
    const csvHeader = ['User ID', 'Plays', 'Ends', 'Seeks', 'Errors'];
    const csvRows = userRows.map(u => [u.userId, u.plays, u.ends, u.seeks, u.errors]);
    let csv = `${csvHeader.join(',')}`;
    csv += '\n' + csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_export_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalyticsData().then(setData);
  }, []);

  if (!data) return <div className="text-white">Loading analytics...</div>;

  // Alert logic
  const showErrorAlert = data?.engagement?.errorCount > 0;
  const showComplianceAlert = data?.compliance?.nonQualifyingPlays > 0;
  
    // Prepare per-user leaderboard and chart data
    const userStatsArr = data.userStats ? Object.entries(data.userStats).map(([userId, stats]) => ({ userId, ...stats })) : [];
    // Sort by plays descending
    const topUsers = userStatsArr.sort((a, b) => b.plays - a.plays).slice(0, 10);
    const userLabels = topUsers.map(u => u.userId);
    const userPlays = topUsers.map(u => u.plays);
    const userEnds = topUsers.map(u => u.ends);
    const userSeeks = topUsers.map(u => u.seeks);
    const userErrors = topUsers.map(u => u.errors);

  return (
    <div className="min-h-screen bg-black text-white p-8">
        <div className="flex gap-4 mb-6">
          <button onClick={handleExportJSON} className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded">Export JSON</button>
          <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Export CSV</button>
        </div>
      <Typography variant="h4" gutterBottom>Playback Analytics Dashboard</Typography>
      {showErrorAlert && (
        <div className="bg-red-700 text-white p-4 mb-4 rounded">
          <strong>Alert:</strong> Playback errors detected! Check player health and logs.
        </div>
      )}
      {showComplianceAlert && (
        <div className="bg-yellow-600 text-black p-4 mb-4 rounded">
          <strong>Compliance Alert:</strong> Non-qualifying plays detected. Review royalty and licensing compliance.
        </div>
      )}
      <Grid container spacing={4}>
        {/* Playback Health Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Playback Health</Typography>
              <Line
                data={{
                  labels: data.timestamps,
                  datasets: [{
                    label: 'Health Score',
                    data: data.playbackHealth,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124,58,237,0.2)',
                  }],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        {/* Engagement Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Engagement Metrics</Typography>
              <Bar
                data={{
                  labels: ['Tracks Played', 'Playtime (min)', 'Skips', 'Seeks', 'Errors'],
                  datasets: [{
                    label: 'Engagement',
                    data: [
                      data.engagement.tracksPlayed,
                      Math.round(data.engagement.totalPlaytime / 60),
                      data.engagement.skipCount,
                      data.engagement.seekCount,
                      data.engagement.errorCount,
                    ],
                    backgroundColor: [
                      '#6366f1', '#10b981', '#f59e42', '#f43f5e', '#eab308',
                    ],
                  }],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
              <Typography variant="body2" className="mt-2">Completion Rate: {data.engagement.completionRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
          {/* Top Users Leaderboard */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Top Users Leaderboard</Typography>
                <table className="w-full text-white mt-2">
                  <thead>
                    <tr>
                      <th className="text-left">User ID</th>
                      <th>Plays</th>
                      <th>Ends</th>
                      <th>Seeks</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map(u => (
                      <tr key={u.userId} className="border-b border-gray-700">
                        <td className="text-left">{u.userId}</td>
                        <td>{u.plays}</td>
                        <td>{u.ends}</td>
                        <td>{u.seeks}</td>
                        <td>{u.errors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </Grid>
          {/* User Engagement Distribution Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">User Engagement Distribution</Typography>
                <Bar
                  data={{
                    labels: userLabels,
                    datasets: [
                      {
                        label: 'Plays',
                        data: userPlays,
                        backgroundColor: '#6366f1',
                      },
                      {
                        label: 'Ends',
                        data: userEnds,
                        backgroundColor: '#10b981',
                      },
                      {
                        label: 'Seeks',
                        data: userSeeks,
                        backgroundColor: '#f59e42',
                      },
                      {
                        label: 'Errors',
                        data: userErrors,
                        backgroundColor: '#f43f5e',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        {/* Compliance & Royalty Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Royalty Compliance</Typography>
              <Doughnut
                data={{
                  labels: ['Royalty Qualifying', 'Non-Qualifying'],
                  datasets: [{
                    data: [data.compliance.royaltyQualifyingPlays, data.compliance.nonQualifyingPlays],
                    backgroundColor: ['#10b981', '#f43f5e'],
                  }],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        {/* Error Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Playback Errors (Last 5 Days)</Typography>
              <Bar
                data={{
                  labels: data.timestamps,
                  datasets: [{
                    label: 'Errors',
                    data: data.errors,
                    backgroundColor: '#f43f5e',
                  }],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
              {data.errors.some(e => e > 3) && (
                <Typography variant="body2" color="error" className="mt-2">
                  Alert: High error rate detected!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default AnalyticsDashboard;
