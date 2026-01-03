export interface Umpire {
  _id: string;
  name: string;
  dob?: string;
  placeOfBirth?: string;
  height?: string;
  testMatches?: number;
  odiMatches?: number;
  t20Matches?: number;
  otherMatches?: number;
  careerStart?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUmpireDto {
  name: string;
  dob?: string;
  placeOfBirth?: string;
  height?: string;
  testMatches?: number;
  odiMatches?: number;
  t20Matches?: number;
  otherMatches?: number;
  careerStart?: string;
  image?: string;
  isActive?: boolean;
}

export interface UpdateUmpireDto extends Partial<CreateUmpireDto> {}

export interface QueryUmpiresDto {
  search?: string;
  page?: number;
  limit?: number;
}

