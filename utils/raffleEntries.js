/**
 * Utility functions for managing raffle entries with multiplier support
 */

/**
 * Add raffle entries for a user based on an event source
 * This function implements the multiplier logic: inserts N rows where N = entries_per_source[source]
 * 
 * @param {Object} db - Database connection pool
 * @param {Object} raffle - Raffle object
 * @param {string} userId - User ID
 * @param {string} source - Entry source ('daily_checkin', 'wheel', 'secret_code', 'manual')
 * @returns {Promise<void>}
 */
export async function addRaffleEntries(db, raffle, userId, source) {
  // Parse entry_sources if needed
  let entrySources = raffle.entry_sources;
  if (typeof entrySources === 'string') {
    try {
      entrySources = JSON.parse(entrySources || '[]');
    } catch (e) {
      entrySources = [];
    }
  }
  if (!Array.isArray(entrySources)) {
    entrySources = [];
  }

  const allowed = entrySources.includes(source);
  if (!allowed) return;

  // Parse entries_per_source if needed
  let entriesPerSource = raffle.entries_per_source;
  if (typeof entriesPerSource === 'string') {
    try {
      entriesPerSource = JSON.parse(entriesPerSource || '{}');
    } catch (e) {
      entriesPerSource = {};
    }
  }
  if (!entriesPerSource || typeof entriesPerSource !== 'object') {
    entriesPerSource = {};
  }

  const multiplier = entriesPerSource[source] || 0;
  if (multiplier <= 0) return;

  for (let i = 0; i < multiplier; i++) {
    await db.query(
      `INSERT INTO raffle_entries (raffle_id, user_id, source, created_at) VALUES ($1,$2,$3,CURRENT_TIMESTAMP)`,
      [raffle.id, userId, source]
    );
  }
}

/**
 * Add entries to all active raffles that accept a given source
 * Used for wheel spins, daily check-ins, etc.
 * 
 * @param {Object} db - Database connection pool
 * @param {string} userId - User ID
 * @param {string} source - Entry source
 * @returns {Promise<void>}
 */
export async function addEntriesToActiveRaffles(db, userId, source) {
  const { rows } = await db.query(
    `SELECT * FROM raffles WHERE active = TRUE`
  );
  for (const raffle of rows) {
    await addRaffleEntries(db, raffle, userId, source);
  }
}

/**
 * Get the primary endless raffle (manual type, active, not hidden)
 * This is used for wheel integration
 * 
 * @param {Object} db - Database connection pool
 * @returns {Promise<Object|null>} - Raffle object or null
 */
export async function getPrimaryEndlessRaffle(db) {
  const { rows } = await db.query(
    `SELECT * FROM raffles WHERE raffle_type='manual' AND hidden=FALSE AND active=TRUE ORDER BY id DESC LIMIT 1`
  );
  return rows[0] || null;
}
