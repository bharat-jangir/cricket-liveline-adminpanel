import { Team } from './team';
import { Player } from './player';

export interface SquadPlayer {
  playerId: string;
  player?: Player; // populated
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
  isNotEligible: boolean;
  role: 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper';
  jerseyNumber?: number;
}

export interface SeriesTeam {
  _id: string;
  seriesId: string;
  teamId: string | Team; // Can be populated
  team?: Team; // populated
  format: 'ODI' | 'T20' | 'Test' | 'T10' | '100B';
  groupName?: string;
  isQualified?: boolean;
  qualifiedFor?: string;
  squadPlayers: SquadPlayer[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddTeamToSeriesDto {
  teamId: string;
  format: 'ODI' | 'T20' | 'Test' | 'T10' | '100B';
  groupName?: string;
  copyFromTeamRoster?: boolean;
}

export interface UpdateSquadDto {
  squadPlayers: SquadPlayer[];
}

export interface SeriesTeamsResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: SeriesTeam[];
  };
}

export interface SeriesTeamResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: SeriesTeam;
  };
}

