import { axiosInstance } from '../lib/axios';
import { API_ENDPOINTS } from '../api/endpoints';
import type {
  Player,
  CreatePlayerDto,
  UpdatePlayerDto,
  QueryPlayersDto,
  PlayerListResponse,
  SinglePlayerResponse,
} from '../types/player';

export class PlayerService {
  static async getAllPlayers(params?: QueryPlayersDto): Promise<PlayerListResponse> {
    const response = await axiosInstance.get<PlayerListResponse>(
      API_ENDPOINTS.PLAYERS.LIST,
      { params }
    );
    return response.data;
  }

  static async getPlayer(id: string): Promise<SinglePlayerResponse> {
    const response = await axiosInstance.get<SinglePlayerResponse>(
      API_ENDPOINTS.PLAYERS.GET(id)
    );
    return response.data;
  }

  static async createPlayer(data: CreatePlayerDto): Promise<SinglePlayerResponse> {
    const response = await axiosInstance.post<SinglePlayerResponse>(
      API_ENDPOINTS.PLAYERS.CREATE,
      data
    );
    return response.data;
  }

  static async updatePlayer(id: string, data: UpdatePlayerDto): Promise<SinglePlayerResponse> {
    const response = await axiosInstance.put<SinglePlayerResponse>(
      API_ENDPOINTS.PLAYERS.UPDATE(id),
      data
    );
    return response.data;
  }

  static async deletePlayer(id: string): Promise<SinglePlayerResponse> {
    const response = await axiosInstance.delete<SinglePlayerResponse>(
      API_ENDPOINTS.PLAYERS.DELETE(id)
    );
    return response.data;
  }

  // Helper function to generate slug from name
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

