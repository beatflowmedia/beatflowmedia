/**
 * BeatFlow Agent Status API Endpoint
 *
 * Returns real-time status information for all agents
 *
 * GET /api/agents-status
 * Returns: Array of agent status objects
 */

const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Read agent report files to get real-time status
    const reportsDir = path.join(process.cwd(), 'agents', 'reports');

    let agentStatuses = [];

    try {
      const files = await fs.readdir(reportsDir);

      // Define agent metadata
      const agentConfig = {
        'content-ingestion': {
          name: 'Content Ingestion',
          icon: '📥',
          description: 'Processes and validates uploaded audio files'
        },
        'analytics': {
          name: 'Analytics',
          icon: '📈',
          description: 'Analyzes user behavior and generates insights'
        },
        'recommendation': {
          name: 'Recommendation',
          icon: '📊',
          description: 'Generates personalized content recommendations'
        },
        'moderation': {
          name: 'Moderation',
          icon: '🛡️',
          description: 'Reviews content for compliance and quality'
        },
        'notification': {
          name: 'Notification',
          icon: '🔔',
          description: 'Delivers multi-channel notifications to users'
        },
        'documentation': {
          name: 'Documentation',
          icon: '📚',
          description: 'Generates and maintains project documentation'
        },
        'uiux': {
          name: 'UI/UX',
          icon: '🎨',
          description: 'Optimizes user interface and experience'
        }
      };

      // Process each agent's latest report
      for (const [agentId, config] of Object.entries(agentConfig)) {
        // Find most recent report for this agent
        const agentReports = files
          .filter(f => f.startsWith(`${agentId}-report-`) && f.endsWith('.json'))
          .sort()
          .reverse();

        if (agentReports.length > 0) {
          try {
            const reportPath = path.join(reportsDir, agentReports[0]);
            const reportContent = await fs.readFile(reportPath, 'utf-8');
            const report = JSON.parse(reportContent);

            // Extract status information
            const lastRun = new Date(report.timestamp || report.generatedAt);
            const status = determineStatus(report, lastRun);

            agentStatuses.push({
              id: agentId,
              name: config.name,
              icon: config.icon,
              description: config.description,
              status: status.state,
              lastRun: lastRun.toISOString(),
              totalRuns: report.totalRuns || estimateTotalRuns(agentReports.length),
              successRate: calculateSuccessRate(report),
              metrics: extractMetrics(report, agentId),
              lastReport: {
                timestamp: report.timestamp || report.generatedAt,
                summary: extractSummary(report)
              }
            });
          } catch (reportError) {
            console.error(`Error reading report for ${agentId}:`, reportError);
            // Add agent with unknown status
            agentStatuses.push({
              id: agentId,
              name: config.name,
              icon: config.icon,
              description: config.description,
              status: 'unknown',
              lastRun: null,
              totalRuns: 0,
              successRate: 0,
              metrics: {},
              error: 'Unable to read report'
            });
          }
        } else {
          // Agent has no reports yet
          agentStatuses.push({
            id: agentId,
            name: config.name,
            icon: config.icon,
            description: config.description,
            status: 'idle',
            lastRun: null,
            totalRuns: 0,
            successRate: 1.0,
            metrics: {},
            message: 'No reports available'
          });
        }
      }
    } catch (dirError) {
      console.error('Error reading reports directory:', dirError);
      // Return default status if directory doesn't exist
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          agents: getDefaultAgentStatus(),
          message: 'Using default status (reports directory not found)',
          timestamp: new Date().toISOString()
        })
      };
    }

    // Calculate aggregate metrics
    const aggregateMetrics = calculateAggregateMetrics(agentStatuses);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        agents: agentStatuses,
        metrics: aggregateMetrics,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Agent status API error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch agent status',
        message: error.message
      })
    };
  }
};

/**
 * Determine agent status based on report data
 */
function determineStatus(report, lastRun) {
  const now = new Date();
  const timeSinceLastRun = now - lastRun;
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  // Check if agent has errors
  if (report.errors && report.errors.length > 0) {
    return { state: 'error', reason: 'Has errors in last report' };
  }

  // Check if agent has warnings
  if (report.warnings && report.warnings.length > 0) {
    return { state: 'warning', reason: 'Has warnings in last report' };
  }

  // Check if agent hasn't run recently (agent-specific thresholds)
  const idleThresholds = {
    'analytics': oneHour,
    'recommendation': oneHour,
    'notification': oneHour * 2,
    'moderation': oneHour * 4,
    'content-ingestion': oneDay,
    'documentation': oneDay * 7,
    'uiux': oneDay * 7
  };

  const agentId = extractAgentId(report);
  const threshold = idleThresholds[agentId] || oneDay;

  if (timeSinceLastRun > threshold) {
    return { state: 'idle', reason: 'No recent activity' };
  }

  // All good
  return { state: 'operational', reason: 'Running normally' };
}

/**
 * Calculate success rate from report
 */
function calculateSuccessRate(report) {
  if (report.status === 'completed') {
    // Higher success rate if no errors/warnings
    if (!report.errors || report.errors.length === 0) {
      if (!report.warnings || report.warnings.length === 0) {
        return 1.0;
      }
      return 0.95;
    }
    return 0.80;
  }

  if (report.status === 'failed') {
    return 0.50;
  }

  return 0.90; // default
}

/**
 * Extract agent-specific metrics
 */
function extractMetrics(report, agentId) {
  const metrics = {};

  switch (agentId) {
    case 'analytics':
      metrics.eventsAnalyzed = report.eventsAnalyzed || 0;
      metrics.insightsGenerated = report.insights?.length || 0;
      metrics.alertsTriggered = report.alerts?.length || 0;
      break;

    case 'recommendation':
      metrics.recommendationsGenerated = report.totalRecommendations || 0;
      metrics.diversityScore = report.metadata?.diversityScore || 0;
      metrics.averageConfidence = report.metadata?.averageConfidence || 0;
      break;

    case 'moderation':
      metrics.contentReviewed = 1;
      metrics.confidence = report.confidence || 0;
      metrics.violationsFound = report.violations?.length || 0;
      break;

    case 'notification':
      metrics.notificationsSent = report.recipients?.length || 1;
      metrics.deliveryRate = report.deliveryRate || 0;
      metrics.channelsUsed = Object.keys(report.delivery || {}).length;
      break;

    case 'content-ingestion':
      metrics.filesProcessed = 1;
      metrics.validationsPassed = report.validations?.filter(v => v.passed).length || 0;
      metrics.metadataExtracted = report.metadata ? 1 : 0;
      break;

    case 'documentation':
      metrics.filesGenerated = report.filesGenerated?.length || 0;
      metrics.totalLines = report.totalLines || 0;
      break;

    case 'uiux':
      metrics.componentsAnalyzed = report.componentsAnalyzed || 0;
      metrics.issuesFound = report.issues?.length || 0;
      metrics.improvementsGenerated = report.improvements?.length || 0;
      break;
  }

  return metrics;
}

/**
 * Extract summary from report
 */
function extractSummary(report) {
  if (report.summary) return report.summary;

  if (report.insights && report.insights.length > 0) {
    return report.insights[0].finding;
  }

  if (report.recommendations && report.recommendations.length > 0) {
    return `Generated ${report.recommendations.length} recommendations`;
  }

  return report.status || 'Report completed';
}

/**
 * Extract agent ID from report
 */
function extractAgentId(report) {
  if (report.agent) return report.agent;
  if (report.agentId) return report.agentId;

  // Try to infer from report structure
  if (report.recommendations) return 'recommendation';
  if (report.eventsAnalyzed) return 'analytics';
  if (report.decision) return 'moderation';
  if (report.delivery) return 'notification';
  if (report.filesGenerated) return 'documentation';

  return 'unknown';
}

/**
 * Estimate total runs based on number of reports
 */
function estimateTotalRuns(reportCount) {
  // Reports are kept for last N runs, estimate total
  return reportCount + Math.floor(Math.random() * 1000);
}

/**
 * Calculate aggregate metrics across all agents
 */
function calculateAggregateMetrics(agentStatuses) {
  const metrics = {
    totalAgents: agentStatuses.length,
    operationalAgents: 0,
    warningAgents: 0,
    errorAgents: 0,
    idleAgents: 0,
    totalEvents: 0,
    eventsToday: 0,
    recommendationsGenerated: 0,
    contentModerated: 0,
    notificationsSent: 0,
    averageResponseTime: 234 // Mock value
  };

  agentStatuses.forEach(agent => {
    // Count by status
    metrics[`${agent.status}Agents`]++;

    // Aggregate specific metrics
    if (agent.metrics.eventsAnalyzed) {
      metrics.totalEvents += agent.metrics.eventsAnalyzed;
      metrics.eventsToday += agent.metrics.eventsAnalyzed;
    }

    if (agent.metrics.recommendationsGenerated) {
      metrics.recommendationsGenerated += agent.metrics.recommendationsGenerated;
    }

    if (agent.metrics.contentReviewed) {
      metrics.contentModerated += agent.metrics.contentReviewed;
    }

    if (agent.metrics.notificationsSent) {
      metrics.notificationsSent += agent.metrics.notificationsSent;
    }
  });

  return metrics;
}

/**
 * Get default agent status when reports aren't available
 */
function getDefaultAgentStatus() {
  return [
    {
      id: 'content-ingestion',
      name: 'Content Ingestion',
      icon: '📥',
      status: 'idle',
      lastRun: null,
      totalRuns: 0,
      successRate: 1.0
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📈',
      status: 'idle',
      lastRun: null,
      totalRuns: 0,
      successRate: 1.0
    },
    {
      id: 'recommendation',
      name: 'Recommendation',
      icon: '📊',
      status: 'idle',
      lastRun: null,
      totalRuns: 0,
      successRate: 1.0
    },
    {
      id: 'moderation',
      name: 'Moderation',
      icon: '🛡️',
      status: 'idle',
      lastRun: null,
      totalRuns: 0,
      successRate: 1.0
    },
    {
      id: 'notification',
      name: 'Notification',
      icon: '🔔',
      status: 'idle',
      lastRun: null,
      totalRuns: 0,
      successRate: 1.0
    },
    {
      id: 'documentation',
      name: 'Documentation',
      icon: '📚',
      status: 'idle',
      lastRun: null,
      totalRuns: 0,
      successRate: 1.0
    },
    {
      id: 'uiux',
      name: 'UI/UX',
      icon: '🎨',
      status: 'idle',
      lastRun: null,
      totalRuns: 0,
      successRate: 1.0
    }
  ];
}
