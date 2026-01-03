import axiosInstance, { ApiResponse, PaginatedData } from '../lib/axios';
import { API_ENDPOINTS } from '../api/endpoints';
import { Venue, CreateVenueDto, UpdateVenueDto, VenueQueryParams } from '../types/venue';

/**
 * Venue Service
 * 
 * Handles all API calls related to venues
 */

export const venueService = {
  /**
   * Get all venues with pagination and search
   */
  async getVenues(params?: VenueQueryParams): Promise<ApiResponse<PaginatedData<Venue>>> {
    const response = await axiosInstance.get<ApiResponse<PaginatedData<Venue>>>(
      API_ENDPOINTS.VENUES.LIST,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single venue by ID
   */
  async getVenue(id: string): Promise<ApiResponse<{ result: Venue }>> {
    const response = await axiosInstance.get<ApiResponse<{ result: Venue }>>(
      API_ENDPOINTS.VENUES.GET(id)
    );
    return response.data;
  },

  /**
   * Create a new venue
   */
  async createVenue(data: CreateVenueDto): Promise<ApiResponse<{ result: Venue }>> {
    const response = await axiosInstance.post<ApiResponse<{ result: Venue }>>(
      API_ENDPOINTS.VENUES.CREATE,
      data
    );
    return response.data;
  },

  /**
   * Update an existing venue
   */
  async updateVenue(id: string, data: UpdateVenueDto): Promise<ApiResponse<{ result: Venue }>> {
    const response = await axiosInstance.put<ApiResponse<{ result: Venue }>>(
      API_ENDPOINTS.VENUES.UPDATE(id),
      data
    );
    return response.data;
  },

  /**
   * Delete a venue
   */
  async deleteVenue(id: string): Promise<ApiResponse<{ result: null }>> {
    const response = await axiosInstance.delete<ApiResponse<{ result: null }>>(
      API_ENDPOINTS.VENUES.DELETE(id)
    );
    return response.data;
  },
};

export default venueService;

