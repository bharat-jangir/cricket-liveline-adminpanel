import axiosInstance, { ApiResponse } from '../lib/axios';
import { API_ENDPOINTS } from '../api/endpoints';
import { Umpire, CreateUmpireDto, UpdateUmpireDto, QueryUmpiresDto } from '../types/umpire';
import { IPaginatedData } from '../types/venue';

/**
 * Umpire Service
 * 
 * Handles all API calls related to umpires
 */

export const umpireService = {
  /**
   * Get list of umpires with pagination and search
   */
  async getUmpires(params: QueryUmpiresDto): Promise<ApiResponse<IPaginatedData<Umpire>>> {
    const response = await axiosInstance.get<ApiResponse<IPaginatedData<Umpire>>>(
      API_ENDPOINTS.UMPIRES.LIST,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single umpire by ID
   */
  async getUmpire(id: string): Promise<ApiResponse<{ result: Umpire }>> {
    const response = await axiosInstance.get<ApiResponse<{ result: Umpire }>>(
      API_ENDPOINTS.UMPIRES.GET(id)
    );
    return response.data;
  },

  /**
   * Create a new umpire
   */
  async createUmpire(data: CreateUmpireDto): Promise<ApiResponse<{ result: Umpire }>> {
    const response = await axiosInstance.post<ApiResponse<{ result: Umpire }>>(
      API_ENDPOINTS.UMPIRES.CREATE,
      data
    );
    return response.data;
  },

  /**
   * Update an existing umpire
   */
  async updateUmpire(id: string, data: UpdateUmpireDto): Promise<ApiResponse<{ result: Umpire }>> {
    const response = await axiosInstance.put<ApiResponse<{ result: Umpire }>>(
      API_ENDPOINTS.UMPIRES.UPDATE(id),
      data
    );
    return response.data;
  },

  /**
   * Delete an umpire
   */
  async deleteUmpire(id: string): Promise<ApiResponse<{ result: { deleted: boolean; umpire: Umpire } }>> {
    const response = await axiosInstance.delete<ApiResponse<{ result: { deleted: boolean; umpire: Umpire } }>>(
      API_ENDPOINTS.UMPIRES.DELETE(id)
    );
    return response.data;
  },
};

export default umpireService;

