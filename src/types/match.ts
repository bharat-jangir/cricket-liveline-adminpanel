import { Team } from './team';
import { Venue } from './venue';
import { Series } from './series';

export interface Match {
  _id?: string;
  matchNumber: string;
  title: string;
  shortTitle: string;
  subtitle?: string;
  slug: string;
  tournamentId?: string;
  seriesId?: string | Series;
  series?: Series; // populated
  matchType: 'international' | 'domestic' | 'league';
  matchFormat: 'test' | 'odi' | 't20' | 't20i' | 't10' | 'hundred';
  teamAId: string;
  teamA?: Team; // populated
  teamBId: string;
  teamB?: Team; // populated
  venueId?: string;
  venue?: Venue; // populated
  matchDate: Date | string;
  matchTime?: Date | string; // Timestamp for match time
  localTime?: string;
  timezone?: string;
  status: 'scheduled' | 'live' | 'completed' | 'abandoned' | 'cancelled';
  matchState?: 'toss_pending' | 'innings_break' | 'tea' | 'lunch' | 'stumps' | 'rain_delay' | 'normal';
  currentInning?: number;
  totalInnings?: number;
  dayNumber?: number;
  sessionNumber?: number;
  isFeatured?: boolean;
  priority?: number;
  views?: number;
  toss?: string | {
    tossText: string;
    winnerId: any;
    elected: 'bat' | 'bowl';
    tossTime?: Date | string;
  };
  ballsPerOver?: number;
  oversPerInning?: number;
  maxBowlerLimit?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMatchDto {
  matchNumber: string;
  title: string;
  shortTitle: string;
  subtitle?: string;
  slug: string;
  tournamentId?: string;
  seriesId?: string;
  matchType: 'international' | 'domestic' | 'league';
  matchFormat: 'test' | 'odi' | 't20' | 't20i' | 't10' | 'hundred';
  teamAId: string;
  teamBId: string;
  venueId?: string;
  matchDate: Date | string;
  matchTime?: Date | string; // Timestamp for match time
  localTime?: string;
  timezone?: string;
  status?: 'scheduled' | 'live' | 'completed' | 'abandoned' | 'cancelled';
  matchState?: 'toss_pending' | 'innings_break' | 'tea' | 'lunch' | 'stumps' | 'rain_delay' | 'normal';
  currentInning?: number;
  totalInnings?: number;
  dayNumber?: number;
  sessionNumber?: number;
  ballsPerOver?: number;
  oversPerInning?: number;
  maxBowlerLimit?: number;
  isFeatured?: boolean;
  priority?: number;
  views?: number;
}

export interface UpdateMatchDto extends Partial<CreateMatchDto> { }

export interface QueryMatchesDto {
  search?: string;
  seriesId?: string;
  tournamentId?: string;
  teamId?: string;
  venueId?: string;
  status?: 'scheduled' | 'live' | 'completed' | 'abandoned' | 'cancelled';
  matchFormat?: 'test' | 'odi' | 't20' | 't20i' | 't10' | 'hundred';
  matchType?: 'international' | 'domestic' | 'league';
  page?: number;
  limit?: number;
}

export interface MatchListResponse {
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: Match[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SingleMatchResponse {
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: Match;
  };
}

