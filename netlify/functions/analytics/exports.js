// netlify/functions/analytics/exports.js
// Data export and royalty reporting API for music industry compliance

const { EnhancedCollector } = require('../../../services/analytics/EnhancedCollector');

// Export formats and configurations
const ExportFormats = {
  CSV: 'csv',
  JSON: 'json',
  XML: 'xml',
  XLSX: 'xlsx',
  PDF: 'pdf'
};

const ReportTypes = {
  ROYALTY: 'royalty',
  PERFORMANCE: 'performance',
  ENGAGEMENT: 'engagement',
  REVENUE: 'revenue',
  COMPLIANCE: 'compliance',
  CUSTOM: 'custom'
};

/**
 * Main export handler
 */
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { path } = event;
    const method = event.httpMethod;

    // Route to appropriate handler
    if (path.includes('/royalty-report')) {
      return await handleRoyaltyReport(event, context);
    } else if (path.includes('/analytics-export')) {
      return await handleAnalyticsExport(event, context);
    } else if (path.includes('/compliance-report')) {
      return await handleComplianceReport(event, context);
    } else if (path.includes('/custom-export')) {
      return await handleCustomExport(event, context);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Export endpoint not found' })
    };

  } catch (error) {
    console.error('Export API error:', error);
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
 * Generate royalty reports for music industry compliance
 */
async function handleRoyaltyReport(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const { queryStringParameters } = event;
    const {
      artist_id,
      start_date,
      end_date,
      territory,
      format = 'json',
      include_details = 'true'
    } = queryStringParameters || {};

    // Validate required parameters
    if (!start_date || !end_date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'start_date and end_date are required'
        })
      };
    }

    // Generate royalty report
    const reportData = await generateRoyaltyReport({
      artistId: artist_id,
      startDate: start_date,
      endDate: end_date,
      territory,
      includeDetails: include_details === 'true'
    });

    // Format output based on requested format
    const formattedData = await formatExportData(reportData, format);

    // Set appropriate content type
    const contentType = getContentType(format);
    headers['Content-Type'] = contentType;

    // Add download filename
    const filename = `royalty-report-${start_date}-to-${end_date}.${format}`;
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;

    return {
      statusCode: 200,
      headers,
      body: formattedData
    };

  } catch (error) {
    console.error('Royalty report error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate royalty report',
        message: error.message
      })
    };
  }
}

/**
 * Generate analytics data export
 */
async function handleAnalyticsExport(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const { queryStringParameters } = event;
    const {
      type = 'performance',
      user_id,
      start_date,
      end_date,
      format = 'json',
      metrics,
      granularity = 'daily'
    } = queryStringParameters || {};

    // Generate analytics export
    const exportData = await generateAnalyticsExport({
      type,
      userId: user_id,
      startDate: start_date,
      endDate: end_date,
      metrics: metrics ? metrics.split(',') : null,
      granularity
    });

    // Format output
    const formattedData = await formatExportData(exportData, format);

    // Set headers
    const contentType = getContentType(format);
    headers['Content-Type'] = contentType;

    const filename = `analytics-${type}-${start_date || 'latest'}.${format}`;
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;

    return {
      statusCode: 200,
      headers,
      body: formattedData
    };

  } catch (error) {
    console.error('Analytics export error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate analytics export',
        message: error.message
      })
    };
  }
}

/**
 * Generate compliance reports for regulatory requirements
 */
async function handleComplianceReport(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const { queryStringParameters } = event;
    const {
      report_type = 'gdpr',
      start_date,
      end_date,
      territory,
      format = 'pdf'
    } = queryStringParameters || {};

    // Generate compliance report
    const reportData = await generateComplianceReport({
      reportType: report_type,
      startDate: start_date,
      endDate: end_date,
      territory
    });

    // Format output
    const formattedData = await formatExportData(reportData, format);

    // Set headers
    const contentType = getContentType(format);
    headers['Content-Type'] = contentType;

    const filename = `compliance-${report_type}-${new Date().toISOString().split('T')[0]}.${format}`;
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;

    return {
      statusCode: 200,
      headers,
      body: formattedData
    };

  } catch (error) {
    console.error('Compliance report error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate compliance report',
        message: error.message
      })
    };
  }
}

/**
 * Generate custom data exports
 */
async function handleCustomExport(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      query,
      filters,
      aggregations,
      format = 'json',
      limit = 10000
    } = body;

    // Generate custom export
    const exportData = await generateCustomExport({
      query,
      filters,
      aggregations,
      limit
    });

    // Format output
    const formattedData = await formatExportData(exportData, format);

    // Set headers
    const contentType = getContentType(format);
    headers['Content-Type'] = contentType;

    const filename = `custom-export-${Date.now()}.${format}`;
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;

    return {
      statusCode: 200,
      headers,
      body: formattedData
    };

  } catch (error) {
    console.error('Custom export error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate custom export',
        message: error.message
      })
    };
  }
}

/**
 * Generate royalty report with music industry compliance
 */
async function generateRoyaltyReport({ artistId, startDate, endDate, territory, includeDetails }) {
  const report = {
    metadata: {
      report_type: 'royalty',
      generated_at: new Date().toISOString(),
      period: {
        start: startDate,
        end: endDate
      },
      territory: territory || 'all',
      currency: 'USD',
      compliance_standard: 'MLC_2021'
    },
    summary: {
      total_plays: 0,
      qualifying_plays: 0,
      total_royalties: 0,
      average_per_play: 0,
      unique_tracks: 0,
      territories_count: 0
    },
    tracks: [],
    territories: {},
    royalty_calculations: [],
    compliance_notes: []
  };

  try {
    // Simulate data query (replace with actual data source)
    const royaltyData = await queryRoyaltyData({
      artistId,
      startDate,
      endDate,
      territory
    });

    // Calculate summary metrics
    report.summary.total_plays = royaltyData.reduce((sum, play) => sum + play.play_count, 0);
    report.summary.qualifying_plays = royaltyData.filter(play => play.is_qualifying).length;
    report.summary.total_royalties = royaltyData.reduce((sum, play) => sum + play.royalty_amount, 0);
    report.summary.average_per_play = report.summary.total_royalties / report.summary.qualifying_plays || 0;
    report.summary.unique_tracks = new Set(royaltyData.map(play => play.track_id)).size;

    // Group by tracks
    const trackGroups = groupBy(royaltyData, 'track_id');
    report.tracks = Object.entries(trackGroups).map(([trackId, plays]) => ({
      track_id: trackId,
      track_title: plays[0].track_title,
      artist_name: plays[0].artist_name,
      total_plays: plays.reduce((sum, play) => sum + play.play_count, 0),
      qualifying_plays: plays.filter(play => play.is_qualifying).length,
      total_royalties: plays.reduce((sum, play) => sum + play.royalty_amount, 0),
      territories: [...new Set(plays.map(play => play.territory))]
    }));

    // Group by territories
    const territoryGroups = groupBy(royaltyData, 'territory');
    report.territories = Object.fromEntries(
      Object.entries(territoryGroups).map(([territory, plays]) => [
        territory,
        {
          total_plays: plays.reduce((sum, play) => sum + play.play_count, 0),
          total_royalties: plays.reduce((sum, play) => sum + play.royalty_amount, 0),
          unique_tracks: new Set(plays.map(play => play.track_id)).size
        }
      ])
    );

    // Include detailed calculations if requested
    if (includeDetails) {
      report.royalty_calculations = royaltyData.map(play => ({
        track_id: play.track_id,
        play_date: play.play_date,
        territory: play.territory,
        user_tier: play.user_tier,
        play_duration: play.play_duration,
        completion_percentage: play.completion_percentage,
        is_qualifying: play.is_qualifying,
        royalty_rate: play.royalty_rate,
        royalty_amount: play.royalty_amount,
        calculation_method: play.calculation_method
      }));
    }

    // Add compliance notes
    report.compliance_notes = [
      'Calculations based on Music Licensing Collective (MLC) 2021 standards',
      'Minimum 30-second play duration required for royalty qualification',
      'Territorial rates applied according to local licensing agreements',
      'All amounts calculated in USD and may require currency conversion for payouts'
    ];

    return report;

  } catch (error) {
    throw new Error(`Failed to generate royalty report: ${error.message}`);
  }
}

/**
 * Generate analytics export
 */
async function generateAnalyticsExport({ type, userId, startDate, endDate, metrics, granularity }) {
  const exportData = {
    metadata: {
      export_type: type,
      generated_at: new Date().toISOString(),
      period: {
        start: startDate,
        end: endDate
      },
      granularity,
      user_id: userId
    },
    data: [],
    summary: {}
  };

  try {
    // Query analytics data based on type
    let analyticsData;
    switch (type) {
      case 'performance':
        analyticsData = await queryPerformanceData({ userId, startDate, endDate, granularity });
        break;
      case 'engagement':
        analyticsData = await queryEngagementData({ userId, startDate, endDate, granularity });
        break;
      case 'revenue':
        analyticsData = await queryRevenueData({ userId, startDate, endDate, granularity });
        break;
      default:
        throw new Error(`Unknown export type: ${type}`);
    }

    exportData.data = analyticsData;

    // Calculate summary statistics
    exportData.summary = calculateSummaryStats(analyticsData, type);

    return exportData;

  } catch (error) {
    throw new Error(`Failed to generate analytics export: ${error.message}`);
  }
}

/**
 * Generate compliance report
 */
async function generateComplianceReport({ reportType, startDate, endDate, territory }) {
  const report = {
    metadata: {
      report_type: reportType,
      generated_at: new Date().toISOString(),
      period: {
        start: startDate,
        end: endDate
      },
      territory: territory || 'all',
      compliance_framework: reportType.toUpperCase()
    },
    compliance_status: {},
    violations: [],
    recommendations: [],
    audit_trail: []
  };

  try {
    switch (reportType) {
      case 'gdpr':
        report.compliance_status = await generateGDPRCompliance();
        break;
      case 'territorial':
        report.compliance_status = await generateTerritorialCompliance(territory);
        break;
      case 'royalty':
        report.compliance_status = await generateRoyaltyCompliance();
        break;
      default:
        throw new Error(`Unknown compliance report type: ${reportType}`);
    }

    return report;

  } catch (error) {
    throw new Error(`Failed to generate compliance report: ${error.message}`);
  }
}

/**
 * Format export data based on requested format
 */
async function formatExportData(data, format) {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(data, null, 2);

    case 'csv':
      return convertToCSV(data);

    case 'xml':
      return convertToXML(data);

    case 'xlsx':
      return await convertToXLSX(data);

    case 'pdf':
      return await convertToPDF(data);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Get content type for format
 */
function getContentType(format) {
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    xml: 'application/xml',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf'
  };

  return contentTypes[format.toLowerCase()] || 'application/octet-stream';
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid data structure for CSV conversion');
  }

  const rows = data.data;
  if (rows.length === 0) {
    return '';
  }

  // Get headers from first row
  const headers = Object.keys(rows[0]);

  // Create CSV content
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * Convert data to XML format
 */
function convertToXML(data) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<export>\n';

  // Add metadata
  if (data.metadata) {
    xml += '  <metadata>\n';
    for (const [key, value] of Object.entries(data.metadata)) {
      xml += `    <${key}>${escapeXML(value)}</${key}>\n`;
    }
    xml += '  </metadata>\n';
  }

  // Add data
  if (data.data && Array.isArray(data.data)) {
    xml += '  <data>\n';
    data.data.forEach(item => {
      xml += '    <record>\n';
      for (const [key, value] of Object.entries(item)) {
        xml += `      <${key}>${escapeXML(value)}</${key}>\n`;
      }
      xml += '    </record>\n';
    });
    xml += '  </data>\n';
  }

  xml += '</export>';
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXML(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert data to XLSX format (simplified)
 */
async function convertToXLSX(data) {
  // This would require a library like xlsx or exceljs
  // For now, return a placeholder
  throw new Error('XLSX export not implemented yet');
}

/**
 * Convert data to PDF format (simplified)
 */
async function convertToPDF(data) {
  // This would require a library like puppeteer or pdfkit
  // For now, return a placeholder
  throw new Error('PDF export not implemented yet');
}

/**
 * Utility functions for data querying (placeholders)
 */
async function queryRoyaltyData({ artistId, startDate, endDate, territory }) {
  // Placeholder implementation
  return [
    {
      track_id: 'track_001',
      track_title: 'Sample Track',
      artist_name: 'Sample Artist',
      play_count: 1000,
      play_date: '2024-01-15',
      territory: 'US',
      user_tier: 'premium',
      play_duration: 180,
      completion_percentage: 85,
      is_qualifying: true,
      royalty_rate: 0.01,
      royalty_amount: 10.00,
      calculation_method: 'standard'
    }
  ];
}

async function queryPerformanceData({ userId, startDate, endDate, granularity }) {
  // Placeholder implementation
  return [
    {
      date: '2024-01-15',
      plays: 1000,
      unique_listeners: 750,
      completion_rate: 78.5,
      skip_rate: 12.3
    }
  ];
}

async function queryEngagementData({ userId, startDate, endDate, granularity }) {
  // Placeholder implementation
  return [
    {
      date: '2024-01-15',
      likes: 45,
      shares: 12,
      playlist_adds: 23,
      follows: 8
    }
  ];
}

async function queryRevenueData({ userId, startDate, endDate, granularity }) {
  // Placeholder implementation
  return [
    {
      date: '2024-01-15',
      revenue: 245.67,
      royalties: 189.23,
      subscriptions: 56.44
    }
  ];
}

async function generateGDPRCompliance() {
  return {
    data_processing_lawful: true,
    consent_management: true,
    data_minimization: true,
    user_rights_implemented: true,
    breach_procedures: true,
    overall_score: 98.5
  };
}

async function generateTerritorialCompliance(territory) {
  return {
    licensing_agreements: true,
    content_restrictions: true,
    revenue_reporting: true,
    local_regulations: true,
    overall_score: 95.2
  };
}

async function generateRoyaltyCompliance() {
  return {
    calculation_accuracy: true,
    reporting_timeliness: true,
    audit_trail_complete: true,
    industry_standards: true,
    overall_score: 99.1
  };
}

function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

function calculateSummaryStats(data, type) {
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }

  const summary = {
    total_records: data.length,
    date_range: {
      start: data[0].date,
      end: data[data.length - 1].date
    }
  };

  // Calculate type-specific summaries
  switch (type) {
    case 'performance':
      summary.total_plays = data.reduce((sum, item) => sum + (item.plays || 0), 0);
      summary.avg_completion_rate = data.reduce((sum, item) => sum + (item.completion_rate || 0), 0) / data.length;
      break;
    case 'engagement':
      summary.total_likes = data.reduce((sum, item) => sum + (item.likes || 0), 0);
      summary.total_shares = data.reduce((sum, item) => sum + (item.shares || 0), 0);
      break;
    case 'revenue':
      summary.total_revenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
      summary.avg_daily_revenue = summary.total_revenue / data.length;
      break;
  }

  return summary;
}