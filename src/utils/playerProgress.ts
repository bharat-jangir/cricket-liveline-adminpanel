import { Player } from '../types/player';

/**
 * Helper to check if a field is considered "filled" based on UI requirements
 */
function isFieldFilled(field: any): boolean {
  if (field === undefined || field === null) {
    return false;
  }
  if (typeof field === 'string') {
    return field.trim() !== '';
  }
  if (typeof field === 'number') {
    return !isNaN(field) && field > 0; // Jersey number should be > 0
  }
  if (typeof field === 'boolean') {
    return field !== undefined; // Booleans are always "filled" if present
  }
  // For objects like socialMedia, check if any sub-fields are filled
  if (typeof field === 'object' && field !== null) {
    return Object.values(field).some(value => isFieldFilled(value));
  }
  return true;
}

/**
 * Calculate player profile completion percentage based on UI fields only
 * This matches exactly the fields visible in PlayerDetailView.tsx (Basic Info tab)
 * 
 * UI Fields (31 total):
 * 1. Full Name * (required)
 * 2. Short Name * (required)
 * 3. Nick Name
 * 4. ICC Name
 * 5. Status (Active/Inactive) - not counted as it's always set
 * 6. Gender
 * 7. Twitter Handle
 * 8. Instagram Handle
 * 9. International Team * (required)
 * 10. Player Image
 * 11. Skin Tone
 * 12. Bio
 * 13. Date of Birth * (required)
 * 14. Date of Death
 * 15. Nationality * (required)
 * 16. Place of Birth
 * 17. Playing For
 * 18. Height
 * 19. Jersey Number
 * 20. Batting Style
 * 21. Middle Order Batsman (checkbox)
 * 22. Wicket Keeper (Yes/No) - derived from role, not counted separately
 * 23. Bowling Style
 * 24. Bowling Arm
 * 25. Playing Role * (required)
 * 26. Behaviour
 * 27. Signature Shot
 * 28. Website
 * 29. Fantasy Credits
 */
export function calculatePlayerProgress(player: Partial<Player>): number {
  // List of fields that are visible in the UI (Basic Info tab only)
  // Total: 29 fields (excluding Status and Wicket Keeper as they're derived)
  const uiFields = [
    // Required fields (marked with * in UI)
    player.fullName,        // 1. Full Name *
    player.shortName,       // 2. Short Name *
    player.intlTeam,        // 3. International Team *
    player.nationality,     // 4. Nationality *
    player.dob,            // 5. Date of Birth *
    player.role,            // 6. Playing Role *
    
    // Optional name fields
    player.nickName,        // 7. Nick Name
    player.iccName,         // 8. ICC Name
    
    // Personal info
    player.gender,         // 9. Gender
    player.dod,             // 10. Date of Death
    
    // Location and physical
    player.birthPlace,      // 11. Place of Birth
    player.playerFor,      // 12. Playing For
    player.height,          // 13. Height
    player.jerseyNumber,    // 14. Jersey Number
    
    // Cricketing details
    player.battingStyle,    // 15. Batting Style
    player.bowlingStyle,    // 16. Bowling Style
    player.bowlingArm,      // 17. Bowling Arm
    player.isMiddleOrder,   // 18. Middle Order Batsman
    
    // Bio and extras
    player.bio,             // 19. Bio
    player.behaviour,       // 20. Behaviour
    player.signatureShot,   // 21. Signature Shot
    player.website,         // 22. Website
    player.fantasyCredits,  // 23. Fantasy Credits
    
    // Social media
    player.socialMedia?.twitter,   // 24. Twitter Handle
    player.socialMedia?.instagram, // 25. Instagram Handle
    
    // Image and appearance
    player.image,          // 26. Player Image
    player.skinTone,       // 27. Skin Tone
  ];

  // Count filled fields
  const filledFields = uiFields.filter(field => isFieldFilled(field)).length;
  const totalFields = uiFields.length;
  const percentage = Math.round((filledFields / totalFields) * 100);
  return Math.min(percentage, 100); // Cap at 100%
}

/**
 * Calculate progress from form state (for PlayerDetailView)
 * Only counts fields that are visible in the UI and have actual values
 */
export function calculateProgressFromFormState(formState: {
  fullName?: string;
  shortName?: string;
  nickName?: string;
  iccName?: string;
  nationality?: string;
  role?: string;
  dob?: string;
  dod?: string;
  birthPlace?: string;
  height?: string;
  jerseyNumber?: number;
  battingStyle?: string;
  bowlingStyle?: string;
  bowlingArm?: string;
  isMiddleOrder?: boolean;
  bio?: string;
  behaviour?: string;
  signatureShot?: string;
  website?: string;
  fantasyCredits?: string | number;
  twitter?: string;
  instagram?: string;
  playerImage?: string;
  gender?: string;
  intlTeam?: string;
  playerFor?: string;
  skinTone?: string;
}): number {
  // Convert form state to Player-like object matching UI fields
  const playerData: Partial<Player> = {
    // Required fields
    fullName: formState.fullName && formState.fullName.trim() ? formState.fullName : undefined,
    shortName: formState.shortName && formState.shortName.trim() ? formState.shortName : undefined,
    intlTeam: formState.intlTeam && formState.intlTeam.trim() ? formState.intlTeam : undefined,
    nationality: formState.nationality && formState.nationality.trim() ? formState.nationality : undefined,
    dob: formState.dob ? new Date(formState.dob) : undefined,
    role: formState.role as any,
    
    // Optional name fields
    nickName: formState.nickName && formState.nickName.trim() ? formState.nickName : undefined,
    iccName: formState.iccName && formState.iccName.trim() ? formState.iccName : undefined,
    
    // Personal info
    gender: formState.gender as any,
    dod: formState.dod ? new Date(formState.dod) : undefined,
    
    // Location and physical
    birthPlace: formState.birthPlace && formState.birthPlace.trim() ? formState.birthPlace : undefined,
    playerFor: formState.playerFor && formState.playerFor.trim() ? formState.playerFor : undefined,
    height: formState.height && formState.height.trim() ? formState.height : undefined,
    jerseyNumber: formState.jerseyNumber,
    
    // Cricketing details
    battingStyle: formState.battingStyle === 'right' ? 'right-hand' : formState.battingStyle === 'left' ? 'left-hand' : undefined,
    bowlingStyle: formState.bowlingStyle && formState.bowlingStyle !== 'none' ? formState.bowlingStyle : undefined,
    bowlingArm: formState.bowlingArm as any,
    isMiddleOrder: formState.isMiddleOrder || undefined,
    
    // Bio and extras
    bio: formState.bio && formState.bio.trim() ? formState.bio : undefined,
    behaviour: formState.behaviour && formState.behaviour.trim() ? formState.behaviour : undefined,
    signatureShot: formState.signatureShot && formState.signatureShot.trim() ? formState.signatureShot : undefined,
    website: formState.website && formState.website.trim() ? formState.website : undefined,
    fantasyCredits: formState.fantasyCredits !== undefined && formState.fantasyCredits !== '' && formState.fantasyCredits !== 0 
      ? (typeof formState.fantasyCredits === 'string' ? parseFloat(formState.fantasyCredits) : formState.fantasyCredits)
      : undefined,
    
    // Social media
    socialMedia: (formState.twitter || formState.instagram) ? {
      twitter: formState.twitter && formState.twitter.trim() ? formState.twitter : undefined,
      instagram: formState.instagram && formState.instagram.trim() ? formState.instagram : undefined,
    } : undefined,
    
    // Image and appearance
    image: formState.playerImage && formState.playerImage.trim() ? formState.playerImage : undefined,
    skinTone: formState.skinTone && formState.skinTone.trim() ? formState.skinTone : undefined,
  };

  return calculatePlayerProgress(playerData);
}
