import { axiosInstance } from '../lib/axios';
import { API_ENDPOINTS } from '../api/endpoints';
import type {
  Match,
  CreateMatchDto,
  UpdateMatchDto,
  QueryMatchesDto,
  MatchListResponse,
  SingleMatchResponse,
} from '../types/match';

export class MatchService {
  static async getAllMatches(params?: QueryMatchesDto): Promise<MatchListResponse> {
    const response = await axiosInstance.get<MatchListResponse>(
      API_ENDPOINTS.MATCHES.LIST,
      { params }
    );
    return response.data;
  }

  static async getMatch(id: string): Promise<SingleMatchResponse> {
    const response = await axiosInstance.get<SingleMatchResponse>(
      API_ENDPOINTS.MATCHES.GET(id)
    );
    return response.data;
  }

  static async createMatch(data: CreateMatchDto): Promise<SingleMatchResponse> {
    const response = await axiosInstance.post<SingleMatchResponse>(
      API_ENDPOINTS.MATCHES.CREATE,
      data
    );
    return response.data;
  }

  static async updateMatch(id: string, data: UpdateMatchDto): Promise<SingleMatchResponse> {
    const response = await axiosInstance.put<SingleMatchResponse>(
      API_ENDPOINTS.MATCHES.UPDATE(id),
      data
    );
    return response.data;
  }

  static async deleteMatch(id: string): Promise<SingleMatchResponse> {
    const response = await axiosInstance.delete<SingleMatchResponse>(
      API_ENDPOINTS.MATCHES.DELETE(id)
    );
    return response.data;
  }

  // Helper function to generate slug from title
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

