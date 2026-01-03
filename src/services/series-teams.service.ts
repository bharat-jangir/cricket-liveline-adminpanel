import { axiosInstance } from '../lib/axios';
import type {
  SeriesTeam,
  AddTeamToSeriesDto,
  UpdateSquadDto,
  SeriesTeamsResponse,
  SeriesTeamResponse,
} from '../types/series-teams';

export class SeriesTeamsService {
  /**
   * Get all teams in a series
   */
  static async getSeriesTeams(
    seriesId: string,
    format?: string,
    groupName?: string,
  ): Promise<SeriesTeamsResponse> {
    const params: any = {};
    if (format) params.format = format;
    if (groupName) params.groupName = groupName;

    const response = await axiosInstance.get<SeriesTeamsResponse>(
      `/admin/series/${seriesId}/teams`,
      { params },
    );
    return response.data;
  }

  /**
   * Add a team to a series
   */
  static async addTeamToSeries(
    seriesId: string,
    data: AddTeamToSeriesDto,
  ): Promise<SeriesTeamResponse> {
    const response = await axiosInstance.post<SeriesTeamResponse>(
      `/admin/series/${seriesId}/teams`,
      data,
    );
    return response.data;
  }

  /**
   * Get squad for a specific team in a series
   */
  static async getSquad(
    seriesId: string,
    teamId: string,
    format: string,
  ): Promise<SeriesTeamResponse> {
    const response = await axiosInstance.get<SeriesTeamResponse>(
      `/admin/series/${seriesId}/teams/${teamId}/squad`,
      { params: { format } },
    );
    return response.data;
  }

  /**
   * Update squad for a team in a series
   */
  static async updateSquad(
    seriesId: string,
    teamId: string,
    format: string,
    data: UpdateSquadDto,
  ): Promise<SeriesTeamResponse> {
    const response = await axiosInstance.put<SeriesTeamResponse>(
      `/admin/series/${seriesId}/teams/${teamId}/squad`,
      data,
      { params: { format } },
    );
    return response.data;
  }

  /**
   * Remove a team from a series
   */
  static async removeTeamFromSeries(
    seriesId: string,
    teamId: string,
    format: string,
  ): Promise<SeriesTeamResponse> {
    const response = await axiosInstance.delete<SeriesTeamResponse>(
      `/admin/series/${seriesId}/teams/${teamId}`,
      { params: { format } },
    );
    return response.data;
  }
}

export default SeriesTeamsService;

