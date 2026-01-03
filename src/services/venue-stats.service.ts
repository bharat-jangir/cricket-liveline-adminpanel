import axiosInstance, { ApiResponse } from '../lib/axios';
import { API_ENDPOINTS } from '../api/endpoints';
import { VenueStats, UpsertVenueStatsDto } from '../types/venue-stats';

/**
 * Venue Stats Service
 * 
 * Handles all API calls related to venue statistics
 */

export const venueStatsService = {
  /**
   * Get stats for a specific venue
   */
  async getStats(venueId: string): Promise<ApiResponse<{ result: VenueStats }>> {
    const response = await axiosInstance.get<ApiResponse<{ result: VenueStats }>>(
      API_ENDPOINTS.VENUES.STATS.GET(venueId)
    );
    return response.data;
  },

  /**
   * Create or update venue stats (upsert)
   */
  async upsertStats(venueId: string, data: UpsertVenueStatsDto): Promise<ApiResponse<{ result: VenueStats }>> {
    const response = await axiosInstance.put<ApiResponse<{ result: VenueStats }>>(
      API_ENDPOINTS.VENUES.STATS.UPSERT(venueId),
      data
    );
    return response.data;
  },
};

export default venueStatsService;

