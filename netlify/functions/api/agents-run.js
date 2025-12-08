/**
 * BeatFlow Agent Run API Endpoint
 *
 * Triggers agent execution via dashboard
 *
 * POST /api/agents-run
 * Body: { agentId: string, options?: object }
 * Returns: { status, jobId, message }
 */

const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { agentId, options = {} } = body;

    // Validate agentId
    const validAgents = [
      'content-ingestion',
      'analytics',
      'recommendation',
      'moderation',
      'notification',
      'documentation',
      'uiux'
    ];

    if (!agentId || !validAgents.includes(agentId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid agent ID',
          validAgents
        })
      };
    }

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Build CLI command based on agent type
    const command = buildAgentCommand(agentId, options);

    // Execute agent in background
    const result = await executeAgent(command, jobId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'started',
        jobId,
        agentId,
        message: `${getAgentName(agentId)} agent started successfully`,
        command: command.join(' '),
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Agent run API error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to start agent',
        message: error.message
      })
    };
  }
};

/**
 * Build CLI command for agent execution
 */
function buildAgentCommand(agentId, options) {
  const cliPath = path.join(process.cwd(), 'agents', 'cli.js');
  const command = ['node', cliPath];

  switch (agentId) {
    case 'content-ingestion':
      command.push('ingest', 'scan');
      if (options.directory) {
        command.push('--directory', options.directory);
      }
      break;

    case 'analytics':
      command.push('analytics', 'analyze');
      command.push('--source', options.source || 'mock');
      command.push('--focus', options.focus || 'all');
      break;

    case 'recommendation':
      command.push('recommend', 'generate');
      command.push('--user-id', options.userId || 'system');
      command.push('--limit', options.limit || '20');
      command.push('--algorithm', options.algorithm || 'hybrid');
      break;

    case 'moderation':
      command.push('moderate', 'review');
      command.push('--content-id', options.contentId || 'pending');
      if (options.strict) {
        command.push('--strict');
      }
      break;

    case 'notification':
      command.push('notify', 'send');
      command.push('--recipient', options.recipient || 'all');
      command.push('--title', options.title || 'System Notification');
      command.push('--message', options.message || 'Agent notification');
      command.push('--category', options.category || 'system');
      break;

    case 'documentation':
      command.push('docs', 'generate');
      command.push('--type', options.type || 'changelog');
      break;

    case 'uiux':
      command.push('uiux', 'analyze');
      if (options.file) {
        command.push('--file', options.file);
      }
      break;

    default:
      throw new Error(`Unknown agent: ${agentId}`);
  }

  return command;
}

/**
 * Execute agent command
 */
function executeAgent(command, jobId) {
  return new Promise((resolve, reject) => {
    try {
      // Spawn child process
      const [node, ...args] = command;
      const child = spawn(node, args, {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd()
      });

      // Detach child process to run independently
      child.unref();

      // Store job info (in production, use Redis or database)
      const jobInfo = {
        jobId,
        pid: child.pid,
        command: command.join(' '),
        startedAt: new Date().toISOString(),
        status: 'running'
      };

      console.log(`Agent started: ${JSON.stringify(jobInfo)}`);

      resolve({
        success: true,
        jobId,
        pid: child.pid
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get friendly agent name
 */
function getAgentName(agentId) {
  const names = {
    'content-ingestion': 'Content Ingestion',
    'analytics': 'Analytics',
    'recommendation': 'Recommendation',
    'moderation': 'Moderation',
    'notification': 'Notification',
    'documentation': 'Documentation',
    'uiux': 'UI/UX'
  };

  return names[agentId] || agentId;
}

/**
 * Get job status (for future use)
 */
async function getJobStatus(jobId) {
  // In production, retrieve from Redis/database
  // For now, return mock status
  return {
    jobId,
    status: 'completed',
    completedAt: new Date().toISOString()
  };
}
