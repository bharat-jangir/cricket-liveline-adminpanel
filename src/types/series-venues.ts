import { Venue } from './venue';

export interface SeriesVenue {
  _id: string;
  seriesId: string | { _id: string; name?: string; shortName?: string };
  venueId: string | Venue; // Can be string (ID) or populated Venue object
  isActive: boolean;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddVenueToSeriesDto {
  venueId: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateSeriesVenueDto {
  isActive?: boolean;
  priority?: number;
}

export interface QuerySeriesVenuesDto {
  search?: string;
  isActive?: boolean;
  venueId?: string;
}

export interface SeriesVenuesResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: SeriesVenue[];
  };
}

export interface SeriesVenueResponse {
  logoId?: string;
  statusCode: number;
  status: boolean;
  userMessage: string;
  userMessageCode: string;
  developerMessage: string;
  data: {
    result: SeriesVenue;
  };
}

