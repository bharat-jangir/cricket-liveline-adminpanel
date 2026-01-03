import { axiosInstance } from '../lib/axios';
import type {
  FantasyStats,
  CreateFantasyStatsDto,
  UpdateFantasyStatsDto,
  QueryFantasyStatsDto,
  BulkCreateFantasyStatsDto,
  FantasyStatsResponse,
  FantasyStatsListResponse,
} from '../types/fantasy-stats';

export class FantasyStatsService {
  /**
   * Get all fantasy stats for a series
   */
  static async getFantasyStats(
    seriesId: string,
    params?: QueryFantasyStatsDto,
  ): Promise<FantasyStatsListResponse> {
    const response = await axiosInstance.get<FantasyStatsListResponse>(
      `/admin/series/${seriesId}/fantasy-stats`,
      { params },
    );
    return response.data;
  }

  /**
   * Get a single fantasy stat entry
   */
  static async getFantasyStat(
    seriesId: string,
    id: string,
  ): Promise<FantasyStatsResponse> {
    const response = await axiosInstance.get<FantasyStatsResponse>(
      `/admin/series/${seriesId}/fantasy-stats/${id}`,
    );
    return response.data;
  }

  /**
   * Create fantasy stats for a player in a match
   */
  static async createFantasyStats(
    seriesId: string,
    data: CreateFantasyStatsDto,
  ): Promise<FantasyStatsResponse> {
    const response = await axiosInstance.post<FantasyStatsResponse>(
      `/admin/series/${seriesId}/fantasy-stats`,
      data,
    );
    return response.data;
  }

  /**
   * Update fantasy stats
   */
  static async updateFantasyStats(
    seriesId: string,
    id: string,
    data: UpdateFantasyStatsDto,
  ): Promise<FantasyStatsResponse> {
    const response = await axiosInstance.put<FantasyStatsResponse>(
      `/admin/series/${seriesId}/fantasy-stats/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete fantasy stats
   */
  static async deleteFantasyStats(
    seriesId: string,
    id: string,
  ): Promise<FantasyStatsResponse> {
    const response = await axiosInstance.delete<FantasyStatsResponse>(
      `/admin/series/${seriesId}/fantasy-stats/${id}`,
    );
    return response.data;
  }

  /**
   * Bulk create fantasy stats
   */
  static async bulkCreateFantasyStats(
    seriesId: string,
    data: BulkCreateFantasyStatsDto,
  ): Promise<FantasyStatsResponse> {
    const response = await axiosInstance.post<FantasyStatsResponse>(
      `/admin/series/${seriesId}/fantasy-stats/bulk`,
      data,
    );
    return response.data;
  }
}

export default FantasyStatsService;

