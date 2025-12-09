/**
 * Admin Playback Metrics API
 * Aggregates playback events from Firestore for dashboard analytics
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  try {
    const timeRange = event.queryStringParameters?.range || '24h';
    const now = new Date();
    let startTime;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000); break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Query playbackEvents from Firestore
    const eventsSnapshot = await db.collection('playbackEvents')
      .where('ts', '>=', startTime.getTime())
      .get();

    // Aggregate metrics
    let playCount = 0, pauseCount = 0, seekCount = 0, endCount = 0, royaltyCount = 0;
    let totalPlaytime = 0, completionRates = [], errorCount = 0;
    const trackStats = {};
      // Per-user stats
      const userStats = {};
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      switch (data.eventType) {
        case 'play_start': playCount++; break;
        case 'play_pause': pauseCount++; break;
        case 'seek': seekCount++; break;
        case 'play_end': endCount++;
          if (data.options?.completion_percentage) completionRates.push(data.options.completion_percentage);
          break;
        case 'track_load':
          if (data.options?.duration) totalPlaytime += data.options.duration;
          break;
        case 'royalty': royaltyCount++; break;
        case 'error': errorCount++; break;
      }
      // Per-track stats
      const trackId = data.track?.id;
      if (trackId) {
        if (!trackStats[trackId]) trackStats[trackId] = { plays: 0, ends: 0 };
        if (data.eventType === 'play_start') trackStats[trackId].plays++;
        if (data.eventType === 'play_end') trackStats[trackId].ends++;
      }
        // Per-user stats
        const userId = data.user?.id || data.userId;
        if (userId) {
          if (!userStats[userId]) userStats[userId] = { plays: 0, ends: 0, seeks: 0, errors: 0 };
          if (data.eventType === 'play_start') userStats[userId].plays++;
          if (data.eventType === 'play_end') userStats[userId].ends++;
          if (data.eventType === 'seek') userStats[userId].seeks++;
          if (data.eventType === 'error') userStats[userId].errors++;
        }
    });

    const avgCompletion = completionRates.length > 0 ?
      (completionRates.reduce((a, b) => a + b, 0) / completionRates.length) : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        playCount,
        pauseCount,
        seekCount,
        endCount,
        royaltyCount,
        totalPlaytime,
        avgCompletion,
        errorCount,
        trackStats,
          userStats,
        eventCount: eventsSnapshot.size,
        timeRange,
        timestamp: now.toISOString()
      })
    };
  } catch (error) {
    console.error('Playback metrics error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve playback metrics', message: error.message })
    };
  }
};
