/**
 * Safely extracts a string ID from various player ID formats
 * (String, Mongoose ObjectId, or nested Object with _id)
 */
export const getPlayerIdString = (playerId: any): string => {
  if (!playerId) return '';
  if (typeof playerId === 'string') return playerId;
  if (typeof playerId === 'object') {
    if (playerId._id) return String(playerId._id);
    if (playerId.id) return String(playerId.id);
    return String(playerId);
  }
  return String(playerId);
};
