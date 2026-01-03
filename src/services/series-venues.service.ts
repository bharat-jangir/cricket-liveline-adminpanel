import { axiosInstance } from '../lib/axios';
import type {
  SeriesVenue,
  AddVenueToSeriesDto,
  UpdateSeriesVenueDto,
  QuerySeriesVenuesDto,
  SeriesVenuesResponse,
  SeriesVenueResponse,
} from '../types/series-venues';

export class SeriesVenuesService {
  /**
   * Get all venues in a series
   */
  static async getSeriesVenues(
    seriesId: string,
    params?: QuerySeriesVenuesDto,
  ): Promise<SeriesVenuesResponse> {
    const response = await axiosInstance.get<SeriesVenuesResponse>(
      `/admin/series/${seriesId}/venues`,
      { params },
    );
    return response.data;
  }

  /**
   * Add a venue to a series
   */
  static async addVenueToSeries(
    seriesId: string,
    data: AddVenueToSeriesDto,
  ): Promise<SeriesVenueResponse> {
    const response = await axiosInstance.post<SeriesVenueResponse>(
      `/admin/series/${seriesId}/venues`,
      data,
    );
    return response.data;
  }

  /**
   * Update a venue in a series
   */
  static async updateSeriesVenue(
    seriesId: string,
    venueId: string,
    data: UpdateSeriesVenueDto,
  ): Promise<SeriesVenueResponse> {
    const response = await axiosInstance.put<SeriesVenueResponse>(
      `/admin/series/${seriesId}/venues/${venueId}`,
      data,
    );
    return response.data;
  }

  /**
   * Remove a venue from a series
   */
  static async removeVenueFromSeries(
    seriesId: string,
    venueId: string,
  ): Promise<SeriesVenueResponse> {
    const response = await axiosInstance.delete<SeriesVenueResponse>(
      `/admin/series/${seriesId}/venues/${venueId}`,
    );
    return response.data;
  }
}

export default SeriesVenuesService;

