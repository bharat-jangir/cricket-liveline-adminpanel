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
