export interface Venue {
  _id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  capacity: number;
  established: number;
  yearOfFirstMatch?: number;
  knownAs?: string;
  association?: string;
  image?: string | null;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  pitchType?: 'batting' | 'bowling' | 'balanced';
  avgFirstInningsScore?: {
    test?: number;
    odi?: number;
    t20?: number;
  };
  groundSize?: 'small' | 'medium' | 'large';
  groundDimensions?: {
    topEndName?: string;
    bottomEndName?: string;
    distances?: {
      top?: number;
      topRight?: number;
      right?: number;
      bottomRight?: number;
      bottom?: number;
      bottomLeft?: number;
      left?: number;
      topLeft?: number;
    };
  };
  pitchDescription?: {
    dusty?: string;
    green?: string;
    dead?: string;
  };
  suitedFor?: 'pace' | 'spin';
  bio?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVenueDto {
  name: string;
  city: string;
  state?: string;
  country: string;
  capacity: number;
  established: number;
  yearOfFirstMatch?: number;
  knownAs?: string;
  association?: string;
  image?: string | null;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  pitchType?: 'batting' | 'bowling' | 'balanced';
  avgFirstInningsScore?: {
    test?: number;
    odi?: number;
    t20?: number;
  };
  groundSize?: 'small' | 'medium' | 'large';
  groundDimensions?: {
    topEndName?: string;
    bottomEndName?: string;
    distances?: {
      top?: number;
      topRight?: number;
      right?: number;
      bottomRight?: number;
      bottom?: number;
      bottomLeft?: number;
      left?: number;
      topLeft?: number;
    };
  };
  pitchDescription?: {
    dusty?: string;
    green?: string;
    dead?: string;
  };
  suitedFor?: 'pace' | 'spin';
  bio?: string;
  isActive: boolean;
}

export interface UpdateVenueDto extends Partial<CreateVenueDto> {}

export interface VenueQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  isActive?: boolean;
}

