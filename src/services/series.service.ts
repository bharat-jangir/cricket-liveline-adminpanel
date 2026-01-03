import { axiosInstance } from '../lib/axios';
import { API_ENDPOINTS } from '../api/endpoints';
import type {
  Series,
  CreateSeriesDto,
  UpdateSeriesDto,
  SeriesQueryParams,
  SeriesListResponse,
  SeriesResponse,
} from '../types/series';

export class SeriesService {
  /**
   * Get list of series with pagination and filters
   */
  static async listSeries(params?: SeriesQueryParams): Promise<SeriesListResponse> {
    const response = await axiosInstance.get<SeriesListResponse>(API_ENDPOINTS.SERIES.LIST, {
      params,
    });
    return response.data;
  }

  /**
   * Get single series by ID
   */
  static async getSeries(id: string): Promise<SeriesResponse> {
    const response = await axiosInstance.get<SeriesResponse>(API_ENDPOINTS.SERIES.GET(id));
    return response.data;
  }

  /**
   * Create a new series
   */
  static async createSeries(data: CreateSeriesDto): Promise<SeriesResponse> {
    const response = await axiosInstance.post<SeriesResponse>(API_ENDPOINTS.SERIES.CREATE, data);
    return response.data;
  }

  /**
   * Update an existing series
   */
  static async updateSeries(id: string, data: UpdateSeriesDto): Promise<SeriesResponse> {
    const response = await axiosInstance.put<SeriesResponse>(API_ENDPOINTS.SERIES.UPDATE(id), data);
    return response.data;
  }

  /**
   * Delete a series
   */
  static async deleteSeries(id: string): Promise<SeriesResponse> {
    const response = await axiosInstance.delete<SeriesResponse>(API_ENDPOINTS.SERIES.DELETE(id));
    return response.data;
  }

  // Shorter aliases for convenience
  static list = this.listSeries;
  static get = this.getSeries;
  static create = this.createSeries;
  static update = this.updateSeries;
  static delete = this.deleteSeries;
}

export default SeriesService;

