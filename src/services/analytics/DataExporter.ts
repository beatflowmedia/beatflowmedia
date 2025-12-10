/**
 * Data Export and Reporting Service
 * Handles automated royalty reports, custom analytics exports, and API integrations
 */

import axios, { AxiosInstance } from "axios";
import { AnalyticsConfig } from "./AnalyticsConfig";

export interface ExportFormat {
  type: "csv" | "json" | "xml" | "pdf" | "excel";
  mimeType: string;
  extension: string;
}

export interface ExportRequest {
  id: string;
  type: "royalty_report" | "analytics_export" | "user_data" | "custom_report";
  format: ExportFormat["type"];
  filters: ExportFilters;
  requestedBy: string;
  requestedAt: number;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  expiresAt?: number;
  fileSize?: number;
  recordCount?: number;
}

export interface ExportFilters {
  startDate: number;
  endDate: number;
  artistIds?: string[];
  trackIds?: string[];
  territories?: string[];
  eventTypes?: string[];
  userId?: string;
  minRoyaltyAmount?: number;
  includePersonalData?: boolean;
}

export interface RoyaltyReportData {
  artistId: string;
  artistName: string;
  trackId: string;
  trackTitle: string;
  plays: number;
  qualifyingPlays: number;
  totalRoyalties: number;
  territory: string;
  streamType: "premium" | "free" | "download";
  period: string;
}

export interface AnalyticsExportData {
  eventType: string;
  timestamp: number;
  userId?: string;
  trackId?: string;
  artistId?: string;
  territory?: string;
  metadata: Record<string, any>;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: ExportRequest["type"];
  format: ExportFormat["type"];
  schedule: "daily" | "weekly" | "monthly" | "quarterly";
  filters: ExportFilters;
  recipients: string[];
  enabled: boolean;
  lastRun?: number;
  nextRun: number;
  createdBy: string;
}

const EXPORT_FORMATS: Record<ExportFormat["type"], ExportFormat> = {
  csv: { type: "csv", mimeType: "text/csv", extension: ".csv" },
  json: { type: "json", mimeType: "application/json", extension: ".json" },
  xml: { type: "xml", mimeType: "application/xml", extension: ".xml" },
  pdf: { type: "pdf", mimeType: "application/pdf", extension: ".pdf" },
  excel: {
    type: "excel",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx",
  },
};

export class DataExporter {
  private config: AnalyticsConfig;
  private httpClient: AxiosInstance;
  private pendingExports: Map<string, ExportRequest> = new Map();
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private scheduleTimer: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "X-Analytics-Version": "2.0",
      },
    });

    this.startScheduler();
  }

  /**
   * Request a data export
   */
  public async requestExport(
    type: ExportRequest["type"],
    format: ExportFormat["type"],
    filters: ExportFilters,
    requestedBy: string,
  ): Promise<string> {
    const exportRequest: ExportRequest = {
      id: this.generateExportId(),
      type,
      format,
      filters,
      requestedBy,
      requestedAt: Date.now(),
      status: "pending",
    };

    this.pendingExports.set(exportRequest.id, exportRequest);

    // Start processing asynchronously
    this.processExport(exportRequest.id);

    return exportRequest.id;
  }

  /**
   * Get export status
   */
  public getExportStatus(exportId: string): ExportRequest | null {
    return this.pendingExports.get(exportId) || null;
  }

  /**
   * Generate royalty report
   */
  public async generateRoyaltyReport(
    filters: ExportFilters,
    format: ExportFormat["type"] = "csv",
  ): Promise<string> {
    try {
      const data = await this.fetchRoyaltyData(filters);

      switch (format) {
        case "csv":
          return this.convertRoyaltyToCsv(data);
        case "json":
          return JSON.stringify(data, null, 2);
        case "xml":
          return this.convertRoyaltyToXml(data);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error("Error generating royalty report:", error);
      throw error;
    }
  }

  /**
   * Generate analytics export
   */
  public async generateAnalyticsExport(
    filters: ExportFilters,
    format: ExportFormat["type"] = "json",
  ): Promise<string> {
    try {
      const data = await this.fetchAnalyticsData(filters);

      switch (format) {
        case "csv":
          return this.convertAnalyticsToCsv(data);
        case "json":
          return JSON.stringify(data, null, 2);
        case "xml":
          return this.convertAnalyticsToXml(data);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error("Error generating analytics export:", error);
      throw error;
    }
  }

  /**
   * Generate user data export (GDPR compliance)
   */
  public async generateUserDataExport(
    userId: string,
    format: ExportFormat["type"] = "json",
  ): Promise<string> {
    try {
      const filters: ExportFilters = {
        startDate: 0,
        endDate: Date.now(),
        userId,
        includePersonalData: true,
      };

      const data = await this.fetchUserData(filters);

      switch (format) {
        case "csv":
          return this.convertUserDataToCsv(data);
        case "json":
          return JSON.stringify(data, null, 2);
        default:
          throw new Error(`Unsupported format for user data: ${format}`);
      }
    } catch (error) {
      console.error("Error generating user data export:", error);
      throw error;
    }
  }

  /**
   * Schedule automated report
   */
  public scheduleReport(
    name: string,
    type: ExportRequest["type"],
    format: ExportFormat["type"],
    schedule: ScheduledReport["schedule"],
    filters: ExportFilters,
    recipients: string[],
    createdBy: string,
  ): string {
    const report: ScheduledReport = {
      id: this.generateReportId(),
      name,
      type,
      format,
      schedule,
      filters,
      recipients,
      enabled: true,
      nextRun: this.calculateNextRun(schedule),
      createdBy,
    };

    this.scheduledReports.set(report.id, report);
    return report.id;
  }

  /**
   * Get scheduled reports
   */
  public getScheduledReports(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values());
  }

  /**
   * Update scheduled report
   */
  public updateScheduledReport(
    reportId: string,
    updates: Partial<ScheduledReport>,
  ): boolean {
    const report = this.scheduledReports.get(reportId);
    if (!report) return false;

    const updatedReport = { ...report, ...updates };

    // Recalculate next run if schedule changed
    if (updates.schedule) {
      updatedReport.nextRun = this.calculateNextRun(updates.schedule);
    }

    this.scheduledReports.set(reportId, updatedReport);
    return true;
  }

  /**
   * Delete scheduled report
   */
  public deleteScheduledReport(reportId: string): boolean {
    return this.scheduledReports.delete(reportId);
  }

  /**
   * Get export formats
   */
  public getSupportedFormats(): ExportFormat[] {
    return Object.values(EXPORT_FORMATS);
  }

  /**
   * Clean up expired exports
   */
  public cleanupExpiredExports(): void {
    const now = Date.now();

    for (const [id, exportRequest] of this.pendingExports.entries()) {
      if (exportRequest.expiresAt && exportRequest.expiresAt < now) {
        this.pendingExports.delete(id);

        // Clean up file if exists
        if (exportRequest.downloadUrl) {
          this.cleanupFile(exportRequest.downloadUrl);
        }
      }
    }
  }

  /**
   * Stop scheduler
   */
  public destroy(): void {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  /**
   * Process export request
   */
  private async processExport(exportId: string): Promise<void> {
    const exportRequest = this.pendingExports.get(exportId);
    if (!exportRequest) return;

    try {
      exportRequest.status = "processing";
      this.pendingExports.set(exportId, exportRequest);

      let content: string;

      switch (exportRequest.type) {
        case "royalty_report":
          content = await this.generateRoyaltyReport(
            exportRequest.filters,
            exportRequest.format,
          );
          break;
        case "analytics_export":
          content = await this.generateAnalyticsExport(
            exportRequest.filters,
            exportRequest.format,
          );
          break;
        case "user_data":
          if (!exportRequest.filters.userId) {
            throw new Error("User ID required for user data export");
          }
          content = await this.generateUserDataExport(
            exportRequest.filters.userId,
            exportRequest.format,
          );
          break;
        default:
          throw new Error(`Unsupported export type: ${exportRequest.type}`);
      }

      // Save file and get download URL
      const downloadUrl = await this.saveExportFile(
        exportId,
        content,
        exportRequest.format,
      );

      exportRequest.status = "completed";
      exportRequest.downloadUrl = downloadUrl;
      exportRequest.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      exportRequest.fileSize = Buffer.byteLength(content, "utf8");
      exportRequest.recordCount = this.estimateRecordCount(
        content,
        exportRequest.format,
      );

      this.pendingExports.set(exportId, exportRequest);
    } catch (error) {
      console.error(`Export ${exportId} failed:`, error);

      exportRequest.status = "failed";
      this.pendingExports.set(exportId, exportRequest);
    }
  }

  /**
   * Fetch royalty data from analytics service
   */
  private async fetchRoyaltyData(
    filters: ExportFilters,
  ): Promise<RoyaltyReportData[]> {
    try {
      const response = await this.httpClient.post(
        "/api/analytics/royalty-report",
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
          artistIds: filters.artistIds,
          trackIds: filters.trackIds,
          territories: filters.territories,
          minRoyaltyAmount: filters.minRoyaltyAmount,
        },
      );

      return response.data.data || [];
    } catch (error) {
      // Mock data for demonstration
      return this.generateMockRoyaltyData(filters);
    }
  }

  /**
   * Fetch analytics data from analytics service
   */
  private async fetchAnalyticsData(
    filters: ExportFilters,
  ): Promise<AnalyticsExportData[]> {
    try {
      const response = await this.httpClient.post("/api/analytics/export", {
        startDate: filters.startDate,
        endDate: filters.endDate,
        eventTypes: filters.eventTypes,
        artistIds: filters.artistIds,
        trackIds: filters.trackIds,
        territories: filters.territories,
        includePersonalData: filters.includePersonalData,
      });

      return response.data.data || [];
    } catch (error) {
      // Mock data for demonstration
      return this.generateMockAnalyticsData(filters);
    }
  }

  /**
   * Fetch user data for GDPR export
   */
  private async fetchUserData(filters: ExportFilters): Promise<any> {
    try {
      const response = await this.httpClient.post("/api/analytics/user-data", {
        userId: filters.userId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        includePersonalData: filters.includePersonalData,
      });

      return response.data.data || {};
    } catch (error) {
      // Mock data for demonstration
      return this.generateMockUserData(filters);
    }
  }

  /**
   * Convert royalty data to CSV
   */
  private convertRoyaltyToCsv(data: RoyaltyReportData[]): string {
    const headers = [
      "Artist ID",
      "Artist Name",
      "Track ID",
      "Track Title",
      "Plays",
      "Qualifying Plays",
      "Total Royalties",
      "Territory",
      "Stream Type",
      "Period",
    ];

    const rows = data.map((item) => [
      item.artistId,
      item.artistName,
      item.trackId,
      item.trackTitle,
      item.plays,
      item.qualifyingPlays,
      item.totalRoyalties.toFixed(6),
      item.territory,
      item.streamType,
      item.period,
    ]);

    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
  }

  /**
   * Convert analytics data to CSV
   */
  private convertAnalyticsToCsv(data: AnalyticsExportData[]): string {
    const headers = [
      "Event Type",
      "Timestamp",
      "User ID",
      "Track ID",
      "Artist ID",
      "Territory",
      "Metadata",
    ];

    const rows = data.map((item) => [
      item.eventType,
      new Date(item.timestamp).toISOString(),
      item.userId || "",
      item.trackId || "",
      item.artistId || "",
      item.territory || "",
      JSON.stringify(item.metadata),
    ]);

    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
  }

  /**
   * Convert user data to CSV
   */
  private convertUserDataToCsv(data: any): string {
    const headers = ["Data Type", "Timestamp", "Value"];
    const rows: string[][] = [];

    // Flatten user data into rows
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item: any) => {
          rows.push([key, item.timestamp || "", JSON.stringify(item)]);
        });
      } else {
        rows.push([key, "", JSON.stringify(value)]);
      }
    });

    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
  }

  /**
   * Convert royalty data to XML
   */
  private convertRoyaltyToXml(data: RoyaltyReportData[]): string {
    const xmlItems = data
      .map(
        (item) => `
    <royalty>
      <artistId>${this.escapeXml(item.artistId)}</artistId>
      <artistName>${this.escapeXml(item.artistName)}</artistName>
      <trackId>${this.escapeXml(item.trackId)}</trackId>
      <trackTitle>${this.escapeXml(item.trackTitle)}</trackTitle>
      <plays>${item.plays}</plays>
      <qualifyingPlays>${item.qualifyingPlays}</qualifyingPlays>
      <totalRoyalties>${item.totalRoyalties}</totalRoyalties>
      <territory>${this.escapeXml(item.territory)}</territory>
      <streamType>${this.escapeXml(item.streamType)}</streamType>
      <period>${this.escapeXml(item.period)}</period>
    </royalty>`,
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<royaltyReport>
  <generatedAt>${new Date().toISOString()}</generatedAt>
  <recordCount>${data.length}</recordCount>
  <royalties>${xmlItems}
  </royalties>
</royaltyReport>`;
  }

  /**
   * Convert analytics data to XML
   */
  private convertAnalyticsToXml(data: AnalyticsExportData[]): string {
    const xmlItems = data
      .map(
        (item) => `
    <event>
      <eventType>${this.escapeXml(item.eventType)}</eventType>
      <timestamp>${item.timestamp}</timestamp>
      <userId>${this.escapeXml(item.userId || "")}</userId>
      <trackId>${this.escapeXml(item.trackId || "")}</trackId>
      <artistId>${this.escapeXml(item.artistId || "")}</artistId>
      <territory>${this.escapeXml(item.territory || "")}</territory>
      <metadata><![CDATA[${JSON.stringify(item.metadata)}]]></metadata>
    </event>`,
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<analyticsExport>
  <generatedAt>${new Date().toISOString()}</generatedAt>
  <recordCount>${data.length}</recordCount>
  <events>${xmlItems}
  </events>
</analyticsExport>`;
  }

  /**
   * Save export file and return download URL
   */
  private async saveExportFile(
    exportId: string,
    content: string,
    format: ExportFormat["type"],
  ): Promise<string> {
    // In a real implementation, this would upload to cloud storage
    // For now, return a mock URL
    const formatInfo = EXPORT_FORMATS[format];
    return `/api/analytics/downloads/${exportId}${formatInfo.extension}`;
  }

  /**
   * Start scheduler for automated reports
   */
  private startScheduler(): void {
    this.scheduleTimer = setInterval(() => {
      this.checkScheduledReports();
    }, 60000); // Check every minute
  }

  /**
   * Check for scheduled reports that need to run
   */
  private async checkScheduledReports(): Promise<void> {
    const now = Date.now();

    for (const [id, report] of this.scheduledReports.entries()) {
      if (report.enabled && report.nextRun <= now) {
        try {
          await this.executeScheduledReport(report);

          // Update next run time
          report.lastRun = now;
          report.nextRun = this.calculateNextRun(report.schedule, now);
          this.scheduledReports.set(id, report);
        } catch (error) {
          console.error(`Failed to execute scheduled report ${id}:`, error);
        }
      }
    }
  }

  /**
   * Execute a scheduled report
   */
  private async executeScheduledReport(report: ScheduledReport): Promise<void> {
    const exportId = await this.requestExport(
      report.type,
      report.format,
      report.filters,
      "system",
    );

    // Wait for export to complete
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (attempts < maxAttempts) {
      const status = this.getExportStatus(exportId);

      if (status?.status === "completed") {
        await this.sendReportToRecipients(report, status);
        break;
      } else if (status?.status === "failed") {
        throw new Error(`Scheduled report export failed: ${exportId}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error(`Scheduled report export timed out: ${exportId}`);
    }
  }

  /**
   * Send report to recipients
   */
  private async sendReportToRecipients(
    report: ScheduledReport,
    exportStatus: ExportRequest,
  ): Promise<void> {
    // In a real implementation, this would send emails with download links
    console.log(
      `Sending scheduled report "${report.name}" to ${report.recipients.length} recipients`,
    );
    console.log(`Download URL: ${exportStatus.downloadUrl}`);

    // Mock email sending
    for (const recipient of report.recipients) {
      console.log(`Email sent to ${recipient} with report download link`);
    }
  }

  /**
   * Calculate next run time for scheduled report
   */
  private calculateNextRun(
    schedule: ScheduledReport["schedule"],
    fromTime: number = Date.now(),
  ): number {
    const date = new Date(fromTime);

    switch (schedule) {
      case "daily":
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0); // 9 AM
        break;
      case "weekly":
        date.setDate(date.getDate() + (7 - date.getDay())); // Next Sunday
        date.setHours(9, 0, 0, 0);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1, 1); // First day of next month
        date.setHours(9, 0, 0, 0);
        break;
      case "quarterly":
        const currentQuarter = Math.floor(date.getMonth() / 3);
        const nextQuarter = (currentQuarter + 1) % 4;
        date.setMonth(nextQuarter * 3, 1);
        if (nextQuarter === 0) date.setFullYear(date.getFullYear() + 1);
        date.setHours(9, 0, 0, 0);
        break;
    }

    return date.getTime();
  }

  /**
   * Estimate record count from content
   */
  private estimateRecordCount(
    content: string,
    format: ExportFormat["type"],
  ): number {
    switch (format) {
      case "csv":
        return Math.max(0, content.split("\n").length - 1); // Subtract header
      case "json":
        try {
          const parsed = JSON.parse(content);
          return Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          return 0;
        }
      case "xml":
        const matches = content.match(/<(royalty|event)>/g);
        return matches ? matches.length : 0;
      default:
        return 0;
    }
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Clean up file from storage
   */
  private cleanupFile(url: string): void {
    // In a real implementation, this would delete the file from cloud storage
    console.log(`Cleaning up export file: ${url}`);
  }

  /**
   * Generate unique export ID
   */
  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate mock royalty data for testing
   */
  private generateMockRoyaltyData(filters: ExportFilters): RoyaltyReportData[] {
    const artists = ["artist1", "artist2", "artist3"];
    const tracks = ["track1", "track2", "track3", "track4"];
    const territories = ["US", "UK", "DE", "FR", "CA"];
    const streamTypes: Array<"premium" | "free" | "download"> = [
      "premium",
      "free",
      "download",
    ];

    const data: RoyaltyReportData[] = [];

    for (let i = 0; i < 50; i++) {
      const artistId = artists[Math.floor(Math.random() * artists.length)];
      const trackId = tracks[Math.floor(Math.random() * tracks.length)];
      const territory =
        territories[Math.floor(Math.random() * territories.length)];
      const streamType =
        streamTypes[Math.floor(Math.random() * streamTypes.length)];

      const plays = Math.floor(Math.random() * 10000) + 100;
      const qualifyingPlays = Math.floor(plays * (0.7 + Math.random() * 0.3));
      const royaltyRate =
        streamType === "premium" ? 0.004 : streamType === "free" ? 0.0015 : 0.7;
      const totalRoyalties = qualifyingPlays * royaltyRate;

      data.push({
        artistId,
        artistName: `Artist ${artistId.charAt(artistId.length - 1)}`,
        trackId,
        trackTitle: `Track ${trackId.charAt(trackId.length - 1)}`,
        plays,
        qualifyingPlays,
        totalRoyalties,
        territory,
        streamType,
        period: new Date(filters.startDate).toISOString().split("T")[0],
      });
    }

    return data;
  }

  /**
   * Generate mock analytics data for testing
   */
  private generateMockAnalyticsData(
    filters: ExportFilters,
  ): AnalyticsExportData[] {
    const eventTypes = ["play_start", "play_end", "track_like", "track_skip"];
    const data: AnalyticsExportData[] = [];

    for (let i = 0; i < 100; i++) {
      data.push({
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        timestamp:
          filters.startDate +
          Math.random() * (filters.endDate - filters.startDate),
        userId: filters.includePersonalData
          ? `user${Math.floor(Math.random() * 1000)}`
          : undefined,
        trackId: `track${Math.floor(Math.random() * 10)}`,
        artistId: `artist${Math.floor(Math.random() * 5)}`,
        territory: ["US", "UK", "DE"][Math.floor(Math.random() * 3)],
        metadata: {
          quality: "high",
          position: Math.floor(Math.random() * 180000),
          duration: 180000,
        },
      });
    }

    return data;
  }

  /**
   * Generate mock user data for testing
   */
  private generateMockUserData(filters: ExportFilters): any {
    return {
      userId: filters.userId,
      profile: {
        createdAt: Date.now() - 86400000 * 365,
        country: "US",
        preferences: {
          notifications: true,
          analytics: true,
        },
      },
      events: [
        {
          eventType: "play_start",
          timestamp: Date.now() - 86400000,
          trackId: "track123",
        },
        {
          eventType: "track_like",
          timestamp: Date.now() - 3600000,
          trackId: "track456",
        },
      ],
      royalties: [
        {
          trackId: "track789",
          amount: 0.004,
          timestamp: Date.now() - 86400000 * 7,
        },
      ],
    };
  }
}
