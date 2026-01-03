import { Player } from './player';
import { Team } from './team';
import { Match } from './match';

export interface FantasyStats {
  _id: string;
  seriesId: string | { _id: string; name?: string; shortName?: string };
  matchId: string | Match;
  playerId: string | Player;
  teamId?: string | Team;
  role: 'wicket-keeper' | 'batsman' | 'all-rounder' | 'bowler';
  points: number;
  credits: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  runs?: number;
  wickets?: number;
  catches?: number;
  stumpings?: number;
  fours?: number;
  sixes?: number;
  maidens?: number;
  economy?: number;
  isManOfTheMatch?: boolean;
  isPlaying?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateFantasyStatsDto {
  matchId: string;
  playerId: string;
  teamId?: string;
  role: 'wicket-keeper' | 'batsman' | 'all-rounder' | 'bowler';
  points?: number;
  credits?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  runs?: number;
  wickets?: number;
  catches?: number;
  stumpings?: number;
  fours?: number;
  sixes?: number;
  maidens?: number;
  economy?: number;
  isManOfTheMatch?: boolean;
  isPlaying?: boolean;
}

export interface UpdateFantasyStatsDto extends Partial<CreateFantasyStatsDto> {}

export interface QueryFantasyStatsDto {
  matchId?: string;
  playerId?: string;
  teamId?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BulkCreateFantasyStatsDto {
  stats: CreateFantasyStatsDto[];
}

export interface FantasyStatsResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: FantasyStats;
  };
}

export interface FantasyStatsListResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: FantasyStats[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

