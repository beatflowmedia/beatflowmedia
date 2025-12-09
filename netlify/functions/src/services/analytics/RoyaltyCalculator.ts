/**
 * Royalty Calculator Service
 * Handles music industry royalty calculations with territorial compliance
 */

import {
  AnalyticsConfig,
  PlaybackEvent,
  RoyaltyCalculationConfig,
  DEFAULT_ROYALTY_CONFIG,
  ANALYTICS_EVENTS,
} from "./AnalyticsConfig";

export interface RoyaltyEvent {
  eventId: string;
  trackId: string;
  artistId: string;
  albumId?: string;
  userId?: string;
  playDuration: number;
  territory: string;
  streamType: "premium" | "free" | "download";
  royaltyAmount: number;
  timestamp: number;
  calculatedAt: number;
}

export interface RoyaltyReport {
  reportId: string;
  periodStart: number;
  periodEnd: number;
  artistId: string;
  trackId?: string;
  totalStreams: number;
  qualifyingStreams: number;
  totalRoyalties: number;
  territoryBreakdown: Record<string, RoyaltyTerritoryData>;
  calculatedAt: number;
}

export interface RoyaltyTerritoryData {
  territory: string;
  streams: number;
  royalties: number;
  rate: number;
}

export interface RoyaltyMetrics {
  totalRoyaltiesCalculated: number;
  qualifyingPlays: number;
  nonQualifyingPlays: number;
  averageRoyaltyPerPlay: number;
  territoryDistribution: Record<string, number>;
  lastCalculationTime: number;
}

export class RoyaltyCalculator {
  private config: AnalyticsConfig;
  private royaltyConfig: RoyaltyCalculationConfig;
  private calculationTimer: NodeJS.Timeout | null = null;
  private reportingTimer: NodeJS.Timeout | null = null;
  private pendingRoyalties: RoyaltyEvent[] = [];
  private metrics: RoyaltyMetrics;
  private isCalculating = false;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.royaltyConfig = DEFAULT_ROYALTY_CONFIG;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Start royalty calculation service
   */
  public startCalculation(): void {
    if (this.calculationTimer) return;

    this.calculationTimer = setInterval(() => {
      this.processRoyalties();
    }, this.royaltyConfig.calculationInterval);

    this.reportingTimer = setInterval(() => {
      this.generateReports();
    }, this.royaltyConfig.reportingInterval);

    console.log("Royalty calculation service started");
  }

  /**
   * Stop royalty calculation service
   */
  public stopCalculation(): void {
    if (this.calculationTimer) {
      clearInterval(this.calculationTimer);
      this.calculationTimer = null;
    }

    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = null;
    }

    // Process any remaining royalties
    this.processRoyalties();

    console.log("Royalty calculation service stopped");
  }

  /**
   * Process a playback event for royalty calculation
   */
  public async processPlaybackEvent(event: PlaybackEvent): Promise<boolean> {
    try {
      // Check if play qualifies for royalty
      if (!this.isRoyaltyQualifying(event)) {
        this.metrics.nonQualifyingPlays++;
        return false;
      }

      // Calculate royalty amount
      const royaltyAmount = this.calculateRoyaltyAmount(event);

      // Create royalty event
      const royaltyEvent: RoyaltyEvent = {
        eventId: this.generateEventId(),
        trackId: event.trackId,
        artistId: event.artistId || "unknown",
        albumId: event.albumId,
        userId: event.userId,
        playDuration: event.position,
        territory: event.territory || this.getDefaultTerritory(),
        streamType: this.getStreamType(event),
        royaltyAmount,
        timestamp: event.timestamp,
        calculatedAt: Date.now(),
      };

      // Add to pending royalties
      this.pendingRoyalties.push(royaltyEvent);

      // Update metrics
      this.metrics.qualifyingPlays++;
      this.metrics.totalRoyaltiesCalculated += royaltyAmount;
      this.updateTerritoryDistribution(royaltyEvent.territory, royaltyAmount);

      return true;
    } catch (error) {
      console.error("Error processing royalty event:", error);
      return false;
    }
  }

  /**
   * Get royalty calculation metrics
   */
  public getMetrics(): RoyaltyMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate royalty report for artist
   */
  public async generateArtistReport(
    artistId: string,
    startDate: number,
    endDate: number,
  ): Promise<RoyaltyReport> {
    const artistRoyalties = this.pendingRoyalties.filter(
      (r) =>
        r.artistId === artistId &&
        r.timestamp >= startDate &&
        r.timestamp <= endDate,
    );

    const territoryBreakdown: Record<string, RoyaltyTerritoryData> = {};

    artistRoyalties.forEach((royalty) => {
      if (!territoryBreakdown[royalty.territory]) {
        territoryBreakdown[royalty.territory] = {
          territory: royalty.territory,
          streams: 0,
          royalties: 0,
          rate: this.getRoyaltyRate(royalty.streamType, royalty.territory),
        };
      }

      territoryBreakdown[royalty.territory].streams++;
      territoryBreakdown[royalty.territory].royalties += royalty.royaltyAmount;
    });

    const report: RoyaltyReport = {
      reportId: this.generateReportId(),
      periodStart: startDate,
      periodEnd: endDate,
      artistId,
      totalStreams: artistRoyalties.length,
      qualifyingStreams: artistRoyalties.length,
      totalRoyalties: artistRoyalties.reduce(
        (sum, r) => sum + r.royaltyAmount,
        0,
      ),
      territoryBreakdown,
      calculatedAt: Date.now(),
    };

    return report;
  }

  /**
   * Generate royalty report for track
   */
  public async generateTrackReport(
    trackId: string,
    startDate: number,
    endDate: number,
  ): Promise<RoyaltyReport> {
    const trackRoyalties = this.pendingRoyalties.filter(
      (r) =>
        r.trackId === trackId &&
        r.timestamp >= startDate &&
        r.timestamp <= endDate,
    );

    const territoryBreakdown: Record<string, RoyaltyTerritoryData> = {};

    trackRoyalties.forEach((royalty) => {
      if (!territoryBreakdown[royalty.territory]) {
        territoryBreakdown[royalty.territory] = {
          territory: royalty.territory,
          streams: 0,
          royalties: 0,
          rate: this.getRoyaltyRate(royalty.streamType, royalty.territory),
        };
      }

      territoryBreakdown[royalty.territory].streams++;
      territoryBreakdown[royalty.territory].royalties += royalty.royaltyAmount;
    });

    // Get artist ID from first royalty (assuming same track = same artist)
    const artistId =
      trackRoyalties.length > 0 ? trackRoyalties[0].artistId : "unknown";

    const report: RoyaltyReport = {
      reportId: this.generateReportId(),
      periodStart: startDate,
      periodEnd: endDate,
      artistId,
      trackId,
      totalStreams: trackRoyalties.length,
      qualifyingStreams: trackRoyalties.length,
      totalRoyalties: trackRoyalties.reduce(
        (sum, r) => sum + r.royaltyAmount,
        0,
      ),
      territoryBreakdown,
      calculatedAt: Date.now(),
    };

    return report;
  }

  /**
   * Get pending royalties count
   */
  public getPendingRoyaltiesCount(): number {
    return this.pendingRoyalties.length;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: AnalyticsConfig): void {
    this.config = config;
  }

  /**
   * Export royalty data for accounting systems
   */
  public exportRoyaltyData(format: "json" | "csv" = "json"): any {
    if (format === "csv") {
      return this.convertToCSV(this.pendingRoyalties);
    }
    return this.pendingRoyalties;
  }

  /**
   * Check if playback event qualifies for royalty payment
   */
  private isRoyaltyQualifying(event: PlaybackEvent): boolean {
    // Must have minimum play duration (30 seconds industry standard)
    if (event.position < this.royaltyConfig.minimumPlayDuration) {
      return false;
    }

    // Must have required track metadata
    if (!event.trackId || !event.artistId) {
      return false;
    }

    // Must be a complete play or track completion event
    if (
      ![ANALYTICS_EVENTS.TRACK_COMPLETE, ANALYTICS_EVENTS.PLAY_END].includes(
        event.eventType as any,
      )
    ) {
      return false;
    }

    // Must not be a test or preview
    if (event.quality === "preview" || event.quality === "test") {
      return false;
    }

    return true;
  }

  /**
   * Calculate royalty amount for event
   */
  private calculateRoyaltyAmount(event: PlaybackEvent): number {
    const streamType = this.getStreamType(event);
    const territory = event.territory || this.getDefaultTerritory();
    const baseRate = this.getRoyaltyRate(streamType, territory);
    const territoryMultiplier = this.getTerritoryMultiplier(territory);

    return baseRate * territoryMultiplier;
  }

  /**
   * Get stream type from event
   */
  private getStreamType(event: PlaybackEvent): "premium" | "free" | "download" {
    // Determine stream type based on event metadata
    if (event.eventType === ANALYTICS_EVENTS.DOWNLOAD_COMPLETE) {
      return "download";
    }

    // Check if user has premium subscription (would be in event metadata)
    const metadata = (event as any).metadata || {};
    if (metadata.subscriptionType === "premium") {
      return "premium";
    }

    return "free";
  }

  /**
   * Get royalty rate for stream type and territory
   */
  private getRoyaltyRate(
    streamType: "premium" | "free" | "download",
    territory: string,
  ): number {
    switch (streamType) {
      case "premium":
        return this.royaltyConfig.premiumStreamRate;
      case "free":
        return this.royaltyConfig.freeStreamRate;
      case "download":
        return this.royaltyConfig.downloadRate;
      default:
        return this.royaltyConfig.freeStreamRate;
    }
  }

  /**
   * Get territory multiplier
   */
  private getTerritoryMultiplier(territory: string): number {
    return (
      this.royaltyConfig.territoryMultipliers[territory] ||
      this.royaltyConfig.territoryMultipliers.default
    );
  }

  /**
   * Get default territory
   */
  private getDefaultTerritory(): string {
    // Try to detect territory from timezone or other indicators
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (
      timezone.includes("America/New_York") ||
      timezone.includes("America/Los_Angeles")
    ) {
      return "US";
    } else if (timezone.includes("Europe/London")) {
      return "UK";
    } else if (timezone.includes("Europe/Berlin")) {
      return "DE";
    } else if (timezone.includes("Europe/Paris")) {
      return "FR";
    }

    return "US"; // Default to US
  }

  /**
   * Process pending royalties
   */
  private async processRoyalties(): Promise<void> {
    if (this.isCalculating || this.pendingRoyalties.length === 0) return;

    this.isCalculating = true;

    try {
      // In a real implementation, this would send royalty data to accounting system
      console.log(
        `Processing ${this.pendingRoyalties.length} pending royalties`,
      );

      // Simulate sending to accounting system
      await this.sendToAccountingSystem(this.pendingRoyalties);

      // Clear processed royalties
      this.pendingRoyalties = [];
      this.metrics.lastCalculationTime = Date.now();
    } catch (error) {
      console.error("Error processing royalties:", error);
    } finally {
      this.isCalculating = false;
    }
  }

  /**
   * Generate periodic royalty reports
   */
  private async generateReports(): Promise<void> {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Get unique artists and tracks from recent royalties
    const recentRoyalties = this.pendingRoyalties.filter(
      (r) => r.timestamp >= oneDayAgo,
    );
    const uniqueArtists = [...new Set(recentRoyalties.map((r) => r.artistId))];
    const uniqueTracks = [...new Set(recentRoyalties.map((r) => r.trackId))];

    // Generate reports for active artists
    for (const artistId of uniqueArtists.slice(0, 10)) {
      // Limit for demo
      try {
        const report = await this.generateArtistReport(
          artistId,
          oneDayAgo,
          now,
        );
        console.log(
          `Generated royalty report for artist ${artistId}: $${report.totalRoyalties.toFixed(4)}`,
        );
      } catch (error) {
        console.error(`Error generating report for artist ${artistId}:`, error);
      }
    }
  }

  /**
   * Send royalties to accounting system
   */
  private async sendToAccountingSystem(
    royalties: RoyaltyEvent[],
  ): Promise<void> {
    // In a real implementation, this would call accounting/payment APIs
    console.log(`Sent ${royalties.length} royalty events to accounting system`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Update territory distribution metrics
   */
  private updateTerritoryDistribution(territory: string, amount: number): void {
    if (!this.metrics.territoryDistribution[territory]) {
      this.metrics.territoryDistribution[territory] = 0;
    }
    this.metrics.territoryDistribution[territory] += amount;
  }

  /**
   * Convert royalty data to CSV format
   */
  private convertToCSV(royalties: RoyaltyEvent[]): string {
    const headers = [
      "Event ID",
      "Track ID",
      "Artist ID",
      "Album ID",
      "User ID",
      "Play Duration",
      "Territory",
      "Stream Type",
      "Royalty Amount",
      "Timestamp",
      "Calculated At",
    ];

    const rows = royalties.map((r) => [
      r.eventId,
      r.trackId,
      r.artistId,
      r.albumId || "",
      r.userId || "",
      r.playDuration,
      r.territory,
      r.streamType,
      r.royaltyAmount,
      r.timestamp,
      r.calculatedAt,
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  /**
   * Initialize metrics object
   */
  private initializeMetrics(): RoyaltyMetrics {
    return {
      totalRoyaltiesCalculated: 0,
      qualifyingPlays: 0,
      nonQualifyingPlays: 0,
      averageRoyaltyPerPlay: 0,
      territoryDistribution: {},
      lastCalculationTime: 0,
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `royalty_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}
