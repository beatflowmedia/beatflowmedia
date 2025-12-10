// netlify/functions/api/player/queue.js
const { getQueueForUser } = require("../../../../src/utils/PlaylistHelper");

// Handler for listing the current playback queue
exports.handler = async function(event, context) {
  try {
    // TODO: Extract user ID from event headers or authentication
    const userId = event.headers["x-user-id"] || null;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'User ID missing' }) };
    }
    const queue = await getQueueForUser(userId);
    return { statusCode: 200, body: JSON.stringify({ queue }) };
  } catch (err) {
    console.error("Error fetching queue:", err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
