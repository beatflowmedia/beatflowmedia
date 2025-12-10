// services/analytics/collector.js
// Enhanced Analytics Collector with production-grade features

const { EnhancedCollector } = require('./EnhancedCollector');

// Create singleton instance
const collectorInstance = new EnhancedCollector();

// Legacy API compatibility
function collectEvent(event) {
  return collectorInstance.collectEvent(event);
}

// Enhanced API
function getCollector() {
  return collectorInstance;
}

function getMetrics() {
  return collectorInstance.getMetrics();
}

function flushBuffers() {
  return collectorInstance.flushAllBuffers();
}

module.exports = {
  collectEvent,
  getCollector,
  getMetrics,
  flushBuffers
};
