export interface FormatStats {
  matches?: number;
  winBatFirst?: number;
  winBowlFirst?: number;
  avg1stInn?: number;
  avg2ndInn?: number;
  avg3rdInn?: number;
  avg4thInn?: number;
  highestTotal?: string;
  highestTotalMatchId?: string;
  lowestTotal?: string;
  lowestTotalMatchId?: string;
  highestChased?: string;
  highestChasedMatchId?: string;
  lowestDefended?: string;
  lowestDefendedMatchId?: string;
}

export interface VenueStats {
  _id?: string;
  venueId: string;
  odi?: FormatStats;
  t20?: FormatStats;
  firstClass?: FormatStats;
  domesticT20?: FormatStats;
  ipl?: FormatStats;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertVenueStatsDto {
  odi?: FormatStats;
  t20?: FormatStats;
  firstClass?: FormatStats;
  domesticT20?: FormatStats;
  ipl?: FormatStats;
}

