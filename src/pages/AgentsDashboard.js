import { useState, useEffect } from "react";
import './AgentsDashboard.css';
import AgentLogViewer from '../components/AgentLogViewer';
import { useModal } from '../hooks/useModal';

const AgentsDashboard = () => {
  const { showAlert } = useModal();
  const [agents, setAgents] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [logViewerAgentId, setLogViewerAgentId] = useState(null);

  useEffect(() => {
    fetchAgentStatus();
    fetchMetrics();
    fetchRecentReports();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAgentStatus();
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAgentStatus = async () => {
    try {
      // Fetch from API endpoint
      const response = await fetch('/.netlify/functions/api/agents-status');
      const data = await response.json();

      // Transform data for display
      const transformedAgents = data.agents.map(agent => ({
        ...agent,
        lastRun: agent.lastRun ? new Date(agent.lastRun) : null
      }));

      setAgents(transformedAgents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch agent status:', error);

      // Fallback to mock data if API fails
      setAgents([
        {
          id: 'content-ingestion',
          name: 'Content Ingestion',
          icon: '📥',
          status: 'operational',
          lastRun: new Date(Date.now() - 300000),
          totalRuns: 1234,
          successRate: 0.98
        },
        {
          id: 'analytics',
          name: 'Analytics',
          icon: '📈',
          status: 'operational',
          lastRun: new Date(Date.now() - 180000),
          totalRuns: 5678,
          successRate: 1.0
        },
        {
          id: 'recommendation',
          name: 'Recommendation',
          icon: '📊',
          status: 'operational',
          lastRun: new Date(Date.now() - 120000),
          totalRuns: 8901,
          successRate: 0.995
        },
        {
          id: 'moderation',
          name: 'Moderation',
          icon: '🛡️',
          status: 'operational',
          lastRun: new Date(Date.now() - 240000),
          totalRuns: 3456,
          successRate: 0.97
        },
        {
          id: 'notification',
          name: 'Notification',
          icon: '🔔',
          status: 'operational',
          lastRun: new Date(Date.now() - 60000),
          totalRuns: 12345,
          successRate: 0.99
        },
        {
          id: 'documentation',
          name: 'Documentation',
          icon: '📚',
          status: 'idle',
          lastRun: new Date(Date.now() - 7200000),
          totalRuns: 234,
          successRate: 1.0
        },
        {
          id: 'uiux',
          name: 'UI/UX',
          icon: '🎨',
          status: 'idle',
          lastRun: new Date(Date.now() - 3600000),
          totalRuns: 456,
          successRate: 0.985
        }
      ]);
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Fetch from API endpoint (metrics are included in agents-status response)
      const response = await fetch('/.netlify/functions/api/agents-status');
      const data = await response.json();

      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Fallback to mock metrics
      setMetrics({
        totalEvents: 15432,
        eventsToday: 1234,
        recommendationsGenerated: 8901,
        contentModerated: 345,
        notificationsSent: 2345,
        averageResponseTime: 234
      });
    }
  };

  const fetchRecentReports = async () => {
    try {
      // Mock recent reports
      setRecentReports([
        {
          id: 1,
          agent: 'Analytics',
          type: 'Daily Report',
          timestamp: new Date(Date.now() - 3600000),
          status: 'completed'
        },
        {
          id: 2,
          agent: 'Recommendation',
          type: 'User Recommendations',
          timestamp: new Date(Date.now() - 7200000),
          status: 'completed'
        },
        {
          id: 3,
          agent: 'Moderation',
          type: 'Content Review',
          timestamp: new Date(Date.now() - 10800000),
          status: 'flagged'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'idle':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getDefaultOptions = (agentId) => {
    const defaults = {
      'content-ingestion': {
        directory: './public/music'
      },
      'analytics': {
        source: 'mock',
        focus: 'all'
      },
      'recommendation': {
        userId: 'test-user',
        limit: 20,
        algorithm: 'hybrid'
      },
      'moderation': {
        contentId: 'pending'
      },
      'notification': {
        recipient: 'all',
        title: 'System Update',
        message: 'Agent execution completed',
        category: 'system'
      },
      'documentation': {
        type: 'changelog'
      },
      'uiux': {
        file: 'src/components'
      }
    };

    return defaults[agentId] || {};
  };

  const handleAgentAction = async (action, agentId) => {
    setActionInProgress(action);

    try {
      let result;

      switch (action) {
        case 'run':
          // Trigger agent run via API
          console.log(`Running ${agentId} agent...`);

          const runResponse = await fetch('/.netlify/functions/api/agents-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId,
              options: getDefaultOptions(agentId)
            })
          });

          const runData = await runResponse.json();

          if (runResponse.ok) {
            await showAlert('Success', `${runData.message}\n\nJob ID: ${runData.jobId}\n\nThe agent is now running. Refresh the dashboard in a few moments to see updated results.`, 'success');
          } else {
            throw new Error(runData.error || 'Failed to start agent');
          }
          break;

        case 'logs':
          // Open log viewer
          setLogViewerAgentId(agentId);
          setShowLogViewer(true);
          break;

        case 'reports':
          // View agent reports
          console.log(`Viewing reports for ${agentId}...`);
          // In production, navigate to reports page or open reports modal
          window.open(`/agents/reports/${agentId}`, '_blank');
          break;

        case 'config':
          // Edit agent configuration
          console.log(`Configuring ${agentId} agent...`);
          await showAlert('Info', `Configuration UI for ${agentId} agent would be displayed here.`, 'info');
          break;

        default:
          console.warn(`Unknown action: ${action}`);
      }

      // Refresh agent status after action
      setTimeout(() => {
        fetchAgentStatus();
        fetchMetrics();
      }, 1000);

    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      await showAlert('Error', `Failed to ${action}: ${error.message}`, 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="agents-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agents-dashboard">
      <div className="dashboard-header">
        <h1>🤖 Agent Control Center</h1>
        <p>Real-time monitoring and control for all BeatFlow agents</p>
      </div>

      {/* Metrics Overview */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>{metrics.totalEvents?.toLocaleString()}</h3>
            <p>Total Events</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>{metrics.eventsToday?.toLocaleString()}</h3>
            <p>Events Today</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">💡</div>
          <div className="metric-content">
            <h3>{metrics.recommendationsGenerated?.toLocaleString()}</h3>
            <p>Recommendations</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <h3>{metrics.averageResponseTime}ms</h3>
            <p>Avg Response Time</p>
          </div>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="agents-section">
        <h2>Agent Status</h2>
        <div className="agents-grid">
          {agents.map(agent => (
            <div
              key={agent.id}
              className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="agent-header">
                <span className="agent-icon">{agent.icon}</span>
                <div
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(agent.status) }}
                  title={agent.status}
                ></div>
              </div>
              <h3>{agent.name}</h3>
              <div className="agent-stats">
                <div className="stat">
                  <span className="stat-label">Last Run</span>
                  <span className="stat-value">{formatTimeAgo(agent.lastRun)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Success Rate</span>
                  <span className="stat-value">{(agent.successRate * 100).toFixed(1)}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Runs</span>
                  <span className="stat-value">{agent.totalRuns.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="reports-section">
        <h2>Recent Reports</h2>
        <div className="reports-list">
          {recentReports.map(report => (
            <div key={report.id} className="report-item">
              <div className="report-info">
                <h4>{report.agent}</h4>
                <p>{report.type}</p>
              </div>
              <div className="report-meta">
                <span className="report-time">{formatTimeAgo(report.timestamp)}</span>
                <span className={`report-status status-${report.status}`}>
                  {report.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div className="agent-details-modal" onClick={() => setSelectedAgent(null)}>
          <div className="agent-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <div>
                <span className="agent-icon-large">{selectedAgent.icon}</span>
                <h2>{selectedAgent.name} Agent</h2>
              </div>
              <button className="close-button" onClick={() => setSelectedAgent(null)}>
                ✕
              </button>
            </div>
            <div className="details-body">
              <div className="detail-section">
                <h3>Status</h3>
                <div className="status-badge" style={{ backgroundColor: getStatusColor(selectedAgent.status) }}>
                  {selectedAgent.status.toUpperCase()}
                </div>
              </div>
              <div className="detail-section">
                <h3>Performance</h3>
                <p>Success Rate: {(selectedAgent.successRate * 100).toFixed(2)}%</p>
                <p>Total Runs: {selectedAgent.totalRuns.toLocaleString()}</p>
                <p>Last Run: {formatTimeAgo(selectedAgent.lastRun)}</p>
              </div>
              <div className="detail-section">
                <h3>Actions</h3>
                <button
                  className="action-button"
                  onClick={() => handleAgentAction('logs', selectedAgent.id)}
                  disabled={actionInProgress === 'logs'}
                >
                  {actionInProgress === 'logs' ? 'Loading...' : 'View Logs'}
                </button>
                <button
                  className="action-button"
                  onClick={() => handleAgentAction('run', selectedAgent.id)}
                  disabled={actionInProgress === 'run'}
                >
                  {actionInProgress === 'run' ? 'Running...' : 'Run Now'}
                </button>
                <button
                  className="action-button"
                  onClick={() => handleAgentAction('reports', selectedAgent.id)}
                  disabled={actionInProgress === 'reports'}
                >
                  {actionInProgress === 'reports' ? 'Loading...' : 'View Reports'}
                </button>
                <button
                  className="action-button"
                  onClick={() => handleAgentAction('config', selectedAgent.id)}
                  disabled={actionInProgress === 'config'}
                >
                  {actionInProgress === 'config' ? 'Loading...' : 'Configure'}
                </button>
              </div>

              {selectedAgent.metrics && Object.keys(selectedAgent.metrics).length > 0 && (
                <div className="detail-section">
                  <h3>Metrics</h3>
                  {Object.entries(selectedAgent.metrics).map(([key, value]) => (
                    <p key={key}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                  ))}
                </div>
              )}

              {selectedAgent.description && (
                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{selectedAgent.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Viewer Modal */}
      {showLogViewer && logViewerAgentId && (
        <AgentLogViewer
          agentId={logViewerAgentId}
          onClose={() => {
            setShowLogViewer(false);
            setLogViewerAgentId(null);
          }}
        />
      )}
    </div>
  );
};

export default AgentsDashboard;
