import { axiosInstance } from '../lib/axios';
import { API_ENDPOINTS } from '../api/endpoints';
import type {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  TeamQueryParams,
  TeamListResponse,
  TeamResponse,
} from '../types/team';

export class TeamService {
  /**
   * Get list of teams with pagination and filters
   */
  static async listTeams(params?: TeamQueryParams): Promise<TeamListResponse> {
    const response = await axiosInstance.get<TeamListResponse>(API_ENDPOINTS.TEAMS.LIST, {
      params,
    });
    return response.data;
  }

  /**
   * Get single team by ID
   */
  static async getTeam(id: string): Promise<TeamResponse> {
    const response = await axiosInstance.get<TeamResponse>(API_ENDPOINTS.TEAMS.GET(id));
    return response.data;
  }

  /**
   * Create a new team
   */
  static async createTeam(data: CreateTeamDto): Promise<TeamResponse> {
    const response = await axiosInstance.post<TeamResponse>(API_ENDPOINTS.TEAMS.CREATE, data);
    return response.data;
  }

  /**
   * Update an existing team
   */
  static async updateTeam(id: string, data: UpdateTeamDto): Promise<TeamResponse> {
    const response = await axiosInstance.put<TeamResponse>(API_ENDPOINTS.TEAMS.UPDATE(id), data);
    return response.data;
  }

  /**
   * Delete a team
   */
  static async deleteTeam(id: string): Promise<TeamResponse> {
    const response = await axiosInstance.delete<TeamResponse>(API_ENDPOINTS.TEAMS.DELETE(id));
    return response.data;
  }
}

export default TeamService;

