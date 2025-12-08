import React, { useState, useEffect, useRef } from 'react';
import './AgentLogViewer.css';

const AgentLogViewer = ({ agentId, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('all'); // all, info, warning, error
  const logsEndRef = useRef(null);

  useEffect(() => {
    fetchLogs();

    // Auto-refresh logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [agentId]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const fetchLogs = async () => {
    try {
      // In production, this would fetch from an API endpoint
      // For now, we'll generate mock logs based on recent reports
      const mockLogs = generateMockLogs(agentId);
      setLogs(mockLogs);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLoading(false);
    }
  };

  const generateMockLogs = (agentId) => {
    const now = new Date();
    const logs = [];

    // Generate various log types
    logs.push({
      id: 1,
      timestamp: new Date(now - 30000),
      level: 'info',
      message: `${getAgentName(agentId)} agent initialized`,
      details: `Agent ID: ${agentId}`
    });

    logs.push({
      id: 2,
      timestamp: new Date(now - 25000),
      level: 'info',
      message: 'Starting agent execution',
      details: 'Loading configuration...'
    });

    logs.push({
      id: 3,
      timestamp: new Date(now - 20000),
      level: 'info',
      message: 'Connected to Firestore',
      details: 'Database connection established'
    });

    logs.push({
      id: 4,
      timestamp: new Date(now - 15000),
      level: 'info',
      message: 'Processing data',
      details: `Agent ${agentId} processing started`
    });

    if (Math.random() > 0.7) {
      logs.push({
        id: 5,
        timestamp: new Date(now - 10000),
        level: 'warning',
        message: 'Performance warning',
        details: 'Query took longer than expected (2.3s)'
      });
    }

    logs.push({
      id: 6,
      timestamp: new Date(now - 5000),
      level: 'success',
      message: 'Agent execution completed',
      details: 'All tasks completed successfully'
    });

    logs.push({
      id: 7,
      timestamp: new Date(now - 2000),
      level: 'info',
      message: 'Report generated',
      details: `Report saved to agents/reports/${agentId}-report-*.json`
    });

    return logs;
  };

  const getAgentName = (agentId) => {
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
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#10b981';
      case 'info':
      default:
        return '#3b82f6';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (loading) {
    return (
      <div className="log-viewer-modal" onClick={onClose}>
        <div className="log-viewer-content" onClick={(e) => e.stopPropagation()}>
          <div className="log-viewer-loading">
            <div className="loading-spinner"></div>
            <p>Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="log-viewer-modal" onClick={onClose}>
      <div className="log-viewer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="log-viewer-header">
          <div className="log-viewer-title">
            <span className="log-icon">📜</span>
            <h2>{getAgentName(agentId)} Logs</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Controls */}
        <div className="log-viewer-controls">
          <div className="log-filter-buttons">
            <button
              className={`filter-button ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({logs.length})
            </button>
            <button
              className={`filter-button ${filter === 'info' ? 'active' : ''}`}
              onClick={() => setFilter('info')}
            >
              Info ({logs.filter(l => l.level === 'info').length})
            </button>
            <button
              className={`filter-button ${filter === 'warning' ? 'active' : ''}`}
              onClick={() => setFilter('warning')}
            >
              Warnings ({logs.filter(l => l.level === 'warning').length})
            </button>
            <button
              className={`filter-button ${filter === 'error' ? 'active' : ''}`}
              onClick={() => setFilter('error')}
            >
              Errors ({logs.filter(l => l.level === 'error').length})
            </button>
          </div>

          <div className="log-controls-right">
            <label className="autoscroll-toggle">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
            <button className="refresh-button" onClick={fetchLogs}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="log-viewer-body">
          {filteredLogs.length === 0 ? (
            <div className="no-logs">
              No {filter !== 'all' ? filter : ''} logs available
            </div>
          ) : (
            <div className="logs-list">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`log-entry log-${log.level}`}
                  style={{ borderLeftColor: getLevelColor(log.level) }}
                >
                  <div className="log-header">
                    <span className="log-level-icon">{getLevelIcon(log.level)}</span>
                    <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                    <span className="log-level" style={{ color: getLevelColor(log.level) }}>
                      {log.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="log-message">{log.message}</div>
                  {log.details && <div className="log-details">{log.details}</div>}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="log-viewer-footer">
          <span className="log-count">
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
          <button className="export-button">
            💾 Export Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentLogViewer;
