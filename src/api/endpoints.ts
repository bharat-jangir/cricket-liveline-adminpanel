/**
 * API Endpoints Configuration
 * 
 * Centralized endpoint management for easy maintenance
 */

export const API_ENDPOINTS = {
  // Admin Venues
  VENUES: {
    LIST: '/admin/venues',
    CREATE: '/admin/venues',
    GET: (id: string) => `/admin/venues/${id}`,
    UPDATE: (id: string) => `/admin/venues/${id}`,
    DELETE: (id: string) => `/admin/venues/${id}`,
    STATS: {
      GET: (venueId: string) => `/admin/venues/${venueId}/stats`,
      UPSERT: (venueId: string) => `/admin/venues/${venueId}/stats`,
    },
  },

  // Admin Umpires
  UMPIRES: {
    LIST: '/admin/umpires',
    CREATE: '/admin/umpires',
    GET: (id: string) => `/admin/umpires/${id}`,
    UPDATE: (id: string) => `/admin/umpires/${id}`,
    DELETE: (id: string) => `/admin/umpires/${id}`,
  },

  // Admin Teams
  TEAMS: {
    LIST: '/admin/teams',
    CREATE: '/admin/teams',
    GET: (id: string) => `/admin/teams/${id}`,
    UPDATE: (id: string) => `/admin/teams/${id}`,
    DELETE: (id: string) => `/admin/teams/${id}`,
  },

  // Admin Series
  SERIES: {
    LIST: '/admin/series',
    CREATE: '/admin/series',
    GET: (id: string) => `/admin/series/${id}`,
    UPDATE: (id: string) => `/admin/series/${id}`,
    DELETE: (id: string) => `/admin/series/${id}`,
    TEAMS: {
      LIST: (seriesId: string) => `/admin/series/${seriesId}/teams`,
      ADD: (seriesId: string) => `/admin/series/${seriesId}/teams`,
      GET_SQUAD: (seriesId: string, teamId: string) => `/admin/series/${seriesId}/teams/${teamId}/squad`,
      UPDATE_SQUAD: (seriesId: string, teamId: string) => `/admin/series/${seriesId}/teams/${teamId}/squad`,
      REMOVE: (seriesId: string, teamId: string) => `/admin/series/${seriesId}/teams/${teamId}`,
    },
    VENUES: {
      LIST: (seriesId: string) => `/admin/series/${seriesId}/venues`,
      ADD: (seriesId: string) => `/admin/series/${seriesId}/venues`,
      UPDATE: (seriesId: string, venueId: string) => `/admin/series/${seriesId}/venues/${venueId}`,
      REMOVE: (seriesId: string, venueId: string) => `/admin/series/${seriesId}/venues/${venueId}`,
    },
  },

  // Admin Players
  PLAYERS: {
    LIST: '/admin/players',
    CREATE: '/admin/players',
    GET: (id: string) => `/admin/players/${id}`,
    UPDATE: (id: string) => `/admin/players/${id}`,
    DELETE: (id: string) => `/admin/players/${id}`,
  },

  // Admin Matches
  MATCHES: {
    LIST: '/admin/matches',
    CREATE: '/admin/matches',
    GET: (id: string) => `/admin/matches/${id}`,
    UPDATE: (id: string) => `/admin/matches/${id}`,
    DELETE: (id: string) => `/admin/matches/${id}`,
  },

  // Add more endpoints as needed
};

export default API_ENDPOINTS;

