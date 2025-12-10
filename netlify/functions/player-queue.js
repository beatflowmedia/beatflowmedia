// netlify/functions/player-queue.js
// Stub function returning an empty queue to avoid ES module import issues
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queue: [] }),
  };
};
