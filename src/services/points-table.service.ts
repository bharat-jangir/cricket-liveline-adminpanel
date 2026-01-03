import { axiosInstance } from '../lib/axios';

export interface PointsTableEntry {
  _id?: string;
  seriesId?: string;
  tournamentId?: string;
  teamId: string;
  team?: {
    _id: string;
    name: string;
    shortName?: string;
    code?: string;
    logo?: string;
  };
  matchFormat?: 'test' | 'odi' | 't20' | 't20i';
  groupName?: string;
  position: number;
  played: number;
  won: number;
  lost: number;
  tied: number;
  draw: number;
  noResult: number;
  points: number;
  netRunRate: number;
  for: string;
  against: string;
  qualify: boolean;
  teamFkey?: string;
  updateMode?: 'auto' | 'manual';
}

export interface PointsTableGroup {
  groupName: string;
  format: string;
  entries: PointsTableEntry[];
}

export interface CreatePointsTableEntryDto {
  teamId: string;
  matchFormat?: 'test' | 'odi' | 't20' | 't20i';
  groupName?: string;
  position: number;
  played?: number;
  won?: number;
  lost?: number;
  tied?: number;
  draw?: number;
  noResult?: number;
  points?: number;
  netRunRate?: number;
  for?: string;
  against?: string;
  qualify?: boolean;
  teamFkey?: string;
  updateMode?: 'auto' | 'manual';
}

export interface UpdatePointsTableEntryDto extends Partial<CreatePointsTableEntryDto> {
  _id?: string;
}

export interface CreatePointsTableGroupDto {
  groupName: string;
  formats: ('test' | 'odi' | 't20' | 't20i')[];
  teamIds: string[];
  updateMode?: 'auto' | 'manual';
}

export interface BulkUpdatePointsTableDto {
  entries: UpdatePointsTableEntryDto[];
}

export interface QueryPointsTableDto {
  seriesId?: string;
  matchFormat?: 'test' | 'odi' | 't20' | 't20i';
  groupName?: string;
  teamId?: string;
  page?: number;
  limit?: number;
}

export interface PointsTableListResponse {
  status: boolean;
  statusCode: number;
  userMessage: string;
  userMessageCode: string;
  data: {
    result: PointsTableEntry[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PointsTableResponse {
  status: boolean;
  statusCode: number;
  userMessage: string;
  userMessageCode: string;
  data: {
    result: PointsTableEntry | PointsTableEntry[];
  };
}

export interface GroupsResponse {
  status: boolean;
  statusCode: number;
  userMessage: string;
  userMessageCode: string;
  data: {
    result: string[];
  };
}

export class PointsTableService {
  /**
   * Get all points table entries for a series
   */
  static async getPointsTables(
    seriesId: string,
    params?: QueryPointsTableDto,
  ): Promise<PointsTableListResponse> {
    const response = await axiosInstance.get<PointsTableListResponse>(
      `/admin/series/${seriesId}/points-tables`,
      { params },
    );
    return response.data;
  }

  /**
   * Get single points table entry by ID
   */
  static async getPointsTableEntry(id: string): Promise<PointsTableResponse> {
    const response = await axiosInstance.get<PointsTableResponse>(
      `/admin/series/:seriesId/points-tables/${id}`,
    );
    return response.data;
  }

  /**
   * Create a new points table entry
   */
  static async createPointsTableEntry(
    seriesId: string,
    data: CreatePointsTableEntryDto,
  ): Promise<PointsTableResponse> {
    const response = await axiosInstance.post<PointsTableResponse>(
      `/admin/series/${seriesId}/points-tables`,
      data,
    );
    return response.data;
  }

  /**
   * Update a points table entry
   */
  static async updatePointsTableEntry(
    seriesId: string,
    id: string,
    data: UpdatePointsTableEntryDto,
  ): Promise<PointsTableResponse> {
    const response = await axiosInstance.put<PointsTableResponse>(
      `/admin/series/${seriesId}/points-tables/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Delete a points table entry
   */
  static async deletePointsTableEntry(
    seriesId: string,
    id: string,
  ): Promise<PointsTableResponse> {
    const response = await axiosInstance.delete<PointsTableResponse>(
      `/admin/series/${seriesId}/points-tables/${id}`,
    );
    return response.data;
  }

  /**
   * Create a points table group
   */
  static async createGroup(
    seriesId: string,
    data: CreatePointsTableGroupDto,
  ): Promise<PointsTableResponse> {
    const response = await axiosInstance.post<PointsTableResponse>(
      `/admin/series/${seriesId}/points-tables/groups`,
      data,
    );
    return response.data;
  }

  /**
   * Get all groups for a series
   */
  static async getGroups(
    seriesId: string,
    matchFormat?: string,
  ): Promise<GroupsResponse> {
    const response = await axiosInstance.get<GroupsResponse>(
      `/admin/series/${seriesId}/points-tables/groups`,
      { params: { matchFormat } },
    );
    return response.data;
  }

  /**
   * Delete a group
   */
  static async deleteGroup(
    seriesId: string,
    groupName: string,
    matchFormat?: string,
  ): Promise<PointsTableResponse> {
    const response = await axiosInstance.delete<PointsTableResponse>(
      `/admin/series/${seriesId}/points-tables/groups/${encodeURIComponent(groupName)}`,
      { params: { matchFormat } },
    );
    return response.data;
  }

  /**
   * Bulk update points table entries
   */
  static async bulkUpdate(
    seriesId: string,
    data: BulkUpdatePointsTableDto,
  ): Promise<PointsTableResponse> {
    const response = await axiosInstance.put<PointsTableResponse>(
      `/admin/series/${seriesId}/points-tables/bulk`,
      data,
    );
    return response.data;
  }
}

export default PointsTableService;

