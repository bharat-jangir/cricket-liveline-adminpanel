export interface Player {
  _id?: string;
  name: string;
  fullName?: string;
  shortName?: string;
  nickName?: string;
  iccName?: string;
  slug: string;
  image?: string;
  coverImage?: string;
  dob?: Date;
  dod?: Date;
  birthPlace?: string;
  country: string;
  nationality?: string;
  gender?: 'male' | 'female';
  intlTeam?: string;
  playerFor?: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: 'right-hand' | 'left-hand';
  bowlingStyle?: string;
  bowlingArm?: 'right' | 'left';
  isMiddleOrder?: boolean;
  jerseyNumber?: number;
  height?: string;
  skinTone?: string;
  bio?: string;
  behaviour?: string;
  signatureShot?: string;
  website?: string;
  fantasyCredits?: number;
  debut?: {
    test?: Date;
    odi?: Date;
    t20i?: Date;
    t20?: Date;
  };
  currentTeamIds?: string[];
  retirementDate?: Date;
  isActive: boolean;
  isRetired: boolean;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
  };
  careerStats?: {
    batting?: Record<string, {
      matches?: number; innings?: number; notOuts?: number; runs?: number;
      highestScore?: string; average?: number; ballsFaced?: number; strikeRate?: number;
      hundreds?: number; twoHundreds?: number; fifties?: number; fours?: number;
      sixes?: number; catches?: number; stumpings?: number; debut?: string; debutMatch?: string;
    }>;
    bowling?: Record<string, {
      matches?: number; innings?: number; balls?: number; runs?: number;
      wickets?: number; bbi?: string; bbm?: string; economy?: number;
      average?: number; strikeRate?: number; fiveWickets?: number; tenWickets?: number;
      twoWickets?: number; maidens?: number; debut?: string; debutMatch?: string;
    }>;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePlayerDto {
  name: string;
  fullName?: string;
  shortName?: string;
  nickName?: string;
  iccName?: string;
  slug: string;
  image?: string;
  coverImage?: string;
  dob?: Date;
  dod?: Date;
  birthPlace?: string;
  country: string;
  nationality?: string;
  gender?: 'male' | 'female';
  intlTeam?: string;
  playerFor?: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: 'right-hand' | 'left-hand';
  bowlingStyle?: string;
  bowlingArm?: 'right' | 'left';
  isMiddleOrder?: boolean;
  jerseyNumber?: number;
  height?: string;
  skinTone?: string;
  bio?: string;
  behaviour?: string;
  signatureShot?: string;
  website?: string;
  fantasyCredits?: number;
  debut?: {
    test?: Date;
    odi?: Date;
    t20i?: Date;
    t20?: Date;
  };
  currentTeamIds?: string[];
  retirementDate?: Date;
  isActive?: boolean;
  isRetired?: boolean;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
  };
  careerStats?: any;
}

export interface UpdatePlayerDto extends Partial<CreatePlayerDto> {}

export interface QueryPlayersDto {
  search?: string;
  country?: string;
  role?: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: 'right-hand' | 'left-hand';
  teamId?: string;
  isActive?: boolean;
  isRetired?: boolean;
  page?: number;
  limit?: number;
}

export interface PlayerListResponse {
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: Player[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SinglePlayerResponse {
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: Player;
  };
}
