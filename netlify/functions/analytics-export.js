/**
 * Netlify Function for Analytics Data Export
 * Handles export requests and scheduled reporting
 */

const { DataExporter } = require('../../src/services/analytics/DataExporter');

// Initialize data exporter
const dataExporter = new DataExporter({
  enabled: true,
  bufferSize: 100,
  flushInterval: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  respectDoNotTrack: true,
  anonymizeIp: true,
  consentRequired: true,
  dataRetentionDays: 365,
  samplingRate: 1.0,
  enableRealtime: true,
  batchSize: 50,
  compressionEnabled: true,
  collectorEndpoint: '/api/analytics/events',
  realtimeEndpoint: '/api/analytics/realtime',
  exportEndpoint: '/api/analytics/export',
  enableGeoTracking: true,
  enablePerformanceMonitoring: true,
  enableSecurityTracking: true,
  enableBusinessIntelligence: true,
  errorRateThreshold: 0.05,
  latencyThreshold: 2000,
  bufferHealthThreshold: 0.1,
  gdprCompliant: true,
  ccpaCompliant: true,
  coppaCompliant: true
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { path } = event;
    const method = event.httpMethod;

    // Route requests based on path and method
    if (path.includes('/export/request') && method === 'POST') {
      return await handleExportRequest(event);
    } else if (path.includes('/export/status') && method === 'GET') {
      return await handleExportStatus(event);
    } else if (path.includes('/export/download') && method === 'GET') {
      return await handleExportDownload(event);
    } else if (path.includes('/reports/schedule') && method === 'POST') {
      return await handleScheduleReport(event);
    } else if (path.includes('/reports/list') && method === 'GET') {
      return await handleListReports(event);
    } else if (path.includes('/reports/update') && method === 'PUT') {
      return await handleUpdateReport(event);
    } else if (path.includes('/reports/delete') && method === 'DELETE') {
      return await handleDeleteReport(event);
    } else if (path.includes('/formats') && method === 'GET') {
      return await handleGetFormats(event);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endpoint not found' })
      };
    }
  } catch (error) {
    console.error('Analytics export function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Handle export request
 */
async function handleExportRequest(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { type, format, filters, requestedBy } = body;

    // Validate required fields
    if (!type || !format || !filters || !requestedBy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: type, format, filters, requestedBy'
        })
      };
    }

    // Validate export type
    const validTypes = ['royalty_report', 'analytics_export', 'user_data', 'custom_report'];
    if (!validTypes.includes(type)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Invalid export type. Must be one of: ${validTypes.join(', ')}`
        })
      };
    }

    // Validate format
    const validFormats = ['csv', 'json', 'xml', 'pdf', 'excel'];
    if (!validFormats.includes(format)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Invalid format. Must be one of: ${validFormats.join(', ')}`
        })
      };
    }

    // Validate date range
    if (!filters.startDate || !filters.endDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Start date and end date are required in filters'
        })
      };
    }

    if (filters.startDate >= filters.endDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Start date must be before end date'
        })
      };
    }

    // Request export
    const exportId = await dataExporter.requestExport(type, format, filters, requestedBy);

    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({
        exportId,
        message: 'Export request submitted successfully',
        statusUrl: `/api/analytics/export/status/${exportId}`
      })
    };
  } catch (error) {
    console.error('Export request error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process export request',
        message: error.message
      })
    };
  }
}

/**
 * Handle export status check
 */
async function handleExportStatus(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const pathSegments = event.path.split('/');
    const exportId = pathSegments[pathSegments.length - 1];

    if (!exportId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Export ID is required' })
      };
    }

    const status = dataExporter.getExportStatus(exportId);

    if (!status) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Export not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(status)
    };
  } catch (error) {
    console.error('Export status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get export status',
        message: error.message
      })
    };
  }
}

/**
 * Handle export download
 */
async function handleExportDownload(event) {
  try {
    const pathSegments = event.path.split('/');
    const filename = pathSegments[pathSegments.length - 1];
    const exportId = filename.split('.')[0];

    if (!exportId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Export ID is required' })
      };
    }

    const status = dataExporter.getExportStatus(exportId);

    if (!status || status.status !== 'completed') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Export not found or not completed' })
      };
    }

    // In a real implementation, this would stream the file from storage
    // For now, return a mock response
    const mockContent = `Export ID: ${exportId}\nGenerated: ${new Date().toISOString()}\nType: ${status.type}\nFormat: ${status.format}`;

    const format = dataExporter.getSupportedFormats().find(f => f.type === status.format);
    const mimeType = format ? format.mimeType : 'text/plain';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(mockContent, 'utf8').toString()
      },
      body: mockContent
    };
  } catch (error) {
    console.error('Export download error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to download export',
        message: error.message
      })
    };
  }
}

/**
 * Handle schedule report
 */
async function handleScheduleReport(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { name, type, format, schedule, filters, recipients, createdBy } = body;

    // Validate required fields
    if (!name || !type || !format || !schedule || !filters || !recipients || !createdBy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: name, type, format, schedule, filters, recipients, createdBy'
        })
      };
    }

    // Validate schedule
    const validSchedules = ['daily', 'weekly', 'monthly', 'quarterly'];
    if (!validSchedules.includes(schedule)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Invalid schedule. Must be one of: ${validSchedules.join(', ')}`
        })
      };
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Recipients must be a non-empty array of email addresses'
        })
      };
    }

    const reportId = dataExporter.scheduleReport(
      name, type, format, schedule, filters, recipients, createdBy
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        reportId,
        message: 'Scheduled report created successfully'
      })
    };
  } catch (error) {
    console.error('Schedule report error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to schedule report',
        message: error.message
      })
    };
  }
}

/**
 * Handle list reports
 */
async function handleListReports(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const reports = dataExporter.getScheduledReports();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reports,
        count: reports.length
      })
    };
  } catch (error) {
    console.error('List reports error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to list reports',
        message: error.message
      })
    };
  }
}

/**
 * Handle update report
 */
async function handleUpdateReport(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const pathSegments = event.path.split('/');
    const reportId = pathSegments[pathSegments.length - 1];
    const updates = JSON.parse(event.body);

    if (!reportId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Report ID is required' })
      };
    }

    const success = dataExporter.updateScheduledReport(reportId, updates);

    if (!success) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Report not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Report updated successfully'
      })
    };
  } catch (error) {
    console.error('Update report error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update report',
        message: error.message
      })
    };
  }
}

/**
 * Handle delete report
 */
async function handleDeleteReport(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const pathSegments = event.path.split('/');
    const reportId = pathSegments[pathSegments.length - 1];

    if (!reportId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Report ID is required' })
      };
    }

    const success = dataExporter.deleteScheduledReport(reportId);

    if (!success) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Report not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Report deleted successfully'
      })
    };
  } catch (error) {
    console.error('Delete report error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to delete report',
        message: error.message
      })
    };
  }
}

/**
 * Handle get supported formats
 */
async function handleGetFormats(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const formats = dataExporter.getSupportedFormats();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        formats,
        count: formats.length
      })
    };
  } catch (error) {
    console.error('Get formats error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get supported formats',
        message: error.message
      })
    };
  }
}