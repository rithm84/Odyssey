/**
 * Generates a short, unique session ID for Discord button custom IDs
 * Returns an 8-character alphanumeric string to keep custom IDs under 100 chars
 */
export function generateShortSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Checks if a session ID already exists in the map to avoid collisions
 * Regenerates if collision detected (extremely rare with 8 chars = 2.8 trillion possibilities)
 */
export function generateUniqueSessionId(existingMap: Map<string, any>): string {
  let sessionId = generateShortSessionId();

  // Extremely unlikely, but check for collisions just in case
  while (existingMap.has(sessionId)) {
    sessionId = generateShortSessionId();
  }

  return sessionId;
}
