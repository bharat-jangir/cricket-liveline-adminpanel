export interface Formats {
  t20?: boolean;
  odi?: boolean;
  test?: boolean;
  t10?: boolean;
  hundred?: boolean;
}

export interface Series {
  _id?: string;
  
  // Core Fields
  name: string;
  shortName: string;
  fantasyName?: string;
  fantasyShortName?: string;
  key: string; // Firebase key - unique
  
  // Dates
  startDate: string | Date;
  endDate: string | Date;
  
  // Images
  seriesImage?: string;
  featuredImage?: string;
  
  // Classification
  seriesType: 'International' | 'Domestic' | 'League' | 'Women';
  gender: 'Male' | 'Female';
  activeFormat: 'ODI' | 'T20' | 'Test' | 'T10' | '100B';
  formats?: Formats;
  
  // Tournament Configuration
  tournamentType?: string; // knockout | league | bilateral
  bracketType?: string;
  drsSystem?: number; // 0-2
  
  // Configuration Flags
  dontShowOnApp?: boolean;
  toursOnlyTwoTeams?: boolean; // IS TOUR - only two teams
  isFeatured?: boolean;
  onHome?: boolean; // Show on OneCricket Home
  allowSquadMultiple?: boolean; // Allow player in multiple teams
  
  // Associations (MongoDB ObjectIds)
  defaultNotification?: string;
  broadcaster?: string;
  hostTeam?: string;
  
  // Status
  status?: 'Running' | 'Finished' | 'Upcoming' | 'Scheduled';
  
  // Auto-calculated
  year?: number;
  category?: 'International' | 'Domestic' | 'League';
  
  // Notification Flags
  oddsNotification?: boolean;
  perNotification?: boolean;
  
  // Stats
  totalTeams?: number;
  totalMatches?: number;
  
  // Feature flags for UI
  hasSquad?: boolean;
  hasFixtures?: boolean;
  hasPoints?: boolean;
  recentlyOpened?: boolean;
  
  // Active status
  isActive?: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSeriesDto extends Omit<Series, '_id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateSeriesDto extends Partial<CreateSeriesDto> {}

export interface SeriesQueryParams {
  search?: string;
  seriesType?: 'International' | 'Domestic' | 'League' | 'Women';
  category?: 'International' | 'Domestic' | 'League';
  format?: 'ODI' | 'T20' | 'Test' | 'T10' | '100B';
  gender?: 'Male' | 'Female';
  status?: 'Running' | 'Finished' | 'Upcoming' | 'Scheduled';
  year?: number;
  isFeatured?: boolean;
  onHome?: boolean;
  team?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  page?: number;
  limit?: number;
}

export interface SeriesListResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: Series[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SeriesResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: Series;
  };
}

