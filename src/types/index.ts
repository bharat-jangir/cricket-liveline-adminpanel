// Core types for the cricket admin panel

export interface Venue {
    _id?: string;
    name: string;
    city: string;
    state?: string;
    country: string;
    capacity?: number;
    established?: number;
    knownAs?: string;
    image?: string;
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
    isActive: boolean;
    createdAt?: Date;
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

    // Jersey images
    jerseyLimited?: string;
    jerseyTest?: string;

    // Multi-language support
    translations?: {
        [languageCode: string]: {
            name: string;
            fantasyName?: string;
        };
    };

    // Existing fields
    logo?: string;
    coverImage?: string;
    primaryColor?: string;
    secondaryColor?: string;
    founded?: number;
    homeGround?: string;
    captainId?: string;
    coachName?: string;
    ranking?: {
        test?: number;
        odi?: number;
        t20i?: number;
    };
    socialMedia?: {
        twitter?: string;
        instagram?: string;
        facebook?: string;
    };
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Player {
    _id?: string;
    name: string;
    fullName?: string;
    slug?: string;
    image?: string;
    coverImage?: string;
    dob?: Date;
    birthPlace?: string;
    country: string;
    nationality?: string;
    role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
    battingStyle?: 'right-hand' | 'left-hand';
    bowlingStyle?: string;
    jerseyNumber?: number;
    height?: string;
    bio?: string;
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

export interface Tournament {
    _id?: string;
    name: string;
    shortName: string;
    slug?: string;
    code: string;
    type: 'international' | 'domestic' | 'league' | 'bilateral';
    format: 'test' | 'odi' | 't20' | 'mixed';
    season: string;
    startDate: Date;
    endDate: Date;
    hostCountry: string;
    logo?: string;
    banner?: string;
    coverImage?: string;
    description?: string;
    status: 'upcoming' | 'live' | 'completed' | 'cancelled';
    totalTeams?: number;
    totalMatches?: number;
    groupStage?: boolean;
    knockoutStage?: boolean;
    isFeatured: boolean;
    priority?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Match {
    _id?: string;
    matchNumber: string;
    title: string;
    shortTitle: string;
    subtitle?: string;
    slug?: string;
    tournamentId?: string;
    seriesId?: string;
    matchType: 'international' | 'domestic' | 'league';
    matchFormat: 'test' | 'odi' | 't20' | 't20i';
    teamAId: string;
    teamBId: string;
    venueId: string;
    matchDate: Date;
    matchTime?: string;
    localTime?: string;
    timezone?: string;
    status: 'scheduled' | 'live' | 'completed' | 'abandoned' | 'cancelled';
    matchState?: string;
    currentInning?: number;
    totalInnings?: number;
    dayNumber?: number;
    sessionNumber?: number;
    isFeatured: boolean;
    priority?: number;
    views?: number;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
