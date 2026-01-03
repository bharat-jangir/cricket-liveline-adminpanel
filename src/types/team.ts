export interface Translation {
  name: string;
  fantasyName?: string;
}

export interface Formats {
  t20?: boolean;
  odi?: boolean;
  test?: boolean;
  t10?: boolean;
  hundred?: boolean;
}

export interface Captains {
  odi?: string;
  t20?: string;
  t10?: string;
  test?: string;
  hundred?: string;
}

export interface Ranking {
  test?: number;
  odi?: number;
  t20i?: number;
}

export interface SocialMedia {
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

export interface Team {
  _id?: string;
  name: string;
  shortName: string;
  code: string;
  type: 'international' | 'franchise' | 'domestic' | 'associate';
  format?: 'men' | 'women';
  country: string;
  
  // Fantasy and display names
  fantasyName?: string;
  fantasyShortName?: string;
  
  // Colors and theme
  colorCode?: string;
  upColor?: string;
  brightTheme?: boolean;
  
  // Images
  logo?: string;
  coverImage?: string;
  jerseyLimited?: string;
  jerseyTest?: string;
  
  // Multi-language support
  translations?: Record<string, Translation>;
  
  // Team Bio
  bio?: string;
  
  // Formats supported
  formats?: Formats;
  
  // Team Type (same as type field, but for UI specific purposes)
  teamType?: 'international' | 'domestic' | 'league';
  
  // Gender (same as format)
  gender?: 'men' | 'women';
  
  // Series Type
  seriesType?: string;
  
  // Captains for different formats
  captains?: Captains;
  
  // Owner and Board
  owner?: string;
  board?: string;
  
  // Active Period
  activeFrom?: string | Date;
  activeTo?: string | Date;
  
  // Tournaments
  tournamentsWon?: string;
  tournamentsCaptains?: string;
  
  // Existing legacy fields
  founded?: number;
  homeGround?: string;
  captainId?: string;
  coachName?: string;
  ranking?: Ranking;
  socialMedia?: SocialMedia;
  
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTeamDto extends Omit<Team, '_id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateTeamDto extends Partial<CreateTeamDto> {}

export interface TeamQueryParams {
  search?: string;
  type?: 'international' | 'franchise' | 'domestic' | 'associate';
  format?: 'men' | 'women';
  country?: string;
  page?: number;
  limit?: number;
}

export interface TeamListResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: Team[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface TeamResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: Team;
  };
}

