const { pool } = require('../config/database');
const { scrapeByCurrency } = require('../scrapers');

// In-memory locks to prevent duplicate scrapes during concurrent requests
const activeFetches = new Map();

/**
 * Check if cached data is fresh (less than 60 seconds old)
 */
async function isCacheFresh(currency) {
  try {
    const [rows] = await pool.query(
      'SELECT MAX(fetched_at) as last_fetch FROM quotes WHERE currency = ?',
      [currency]
    );

    if (!rows[0] || !rows[0].last_fetch) {
      return false;
    }

    const lastFetch = new Date(rows[0].last_fetch);
    const now = new Date();
    const diffSeconds = (now - lastFetch) / 1000;

    return diffSeconds < 60;
  } catch (error) {
    console.error('Error checking cache freshness:', error.message);
    return false;
  }
}

/**
 * Get cached quotes from database
 */
async function getCachedQuotes(currency) {
  try {
    const [rows] = await pool.query(
      'SELECT buy_price, sell_price, source FROM quotes WHERE currency = ? ORDER BY fetched_at DESC, source ASC',
      [currency]
    );

    return rows.map(row => ({
      buy_price: parseFloat(row.buy_price),
      sell_price: parseFloat(row.sell_price),
      source: row.source
    }));
  } catch (error) {
    console.error('Error getting cached quotes:', error.message);
    return [];
  }
}

/**
 * Save quotes to database
 */
async function saveQuotes(currency, quotes) {
  try {
    // Clear old quotes for this currency
    await pool.query('DELETE FROM quotes WHERE currency = ?', [currency]);

    // Insert new quotes
    if (quotes.length > 0) {
      const values = quotes.map(q => [currency, q.buy_price, q.sell_price, q.source]);
      await pool.query(
        'INSERT INTO quotes (currency, buy_price, sell_price, source) VALUES ?',
        [values]
      );
    }
  } catch (error) {
    console.error('Error saving quotes:', error.message);
  }
}

/**
 * Get quotes with caching (60 second cache)
 */
async function getQuotesWithCache(currency) {
  // Check if cache is fresh
  const fresh = await isCacheFresh(currency);
  
  if (fresh) {
    console.log(`Returning cached ${currency} data`);
    return await getCachedQuotes(currency);
  }

  // Check if there's an active fetch for this currency
  if (activeFetches.has(currency)) {
    console.log(`Waiting for active fetch of ${currency}`);
    // Wait for the active fetch to complete
    return await activeFetches.get(currency);
  }

  // Create a promise for this fetch
  const fetchPromise = fetchAndCacheQuotes(currency);
  activeFetches.set(currency, fetchPromise);

  try {
    const quotes = await fetchPromise;
    return quotes;
  } finally {
    activeFetches.delete(currency);
  }
}

/**
 * Fetch quotes from scrapers and cache them
 */
async function fetchAndCacheQuotes(currency) {
  try {
    console.log(`Fetching fresh ${currency} data from scrapers`);
    const quotes = await scrapeByCurrency(currency);
    
    if (quotes.length === 0) {
      console.log(`No quotes found for ${currency}, returning cached data`);
      return await getCachedQuotes(currency);
    }

    await saveQuotes(currency, quotes);
    console.log(`Successfully cached ${quotes.length} quotes for ${currency}`);
    
    return quotes;
  } catch (error) {
    console.error(`Error fetching quotes for ${currency}:`, error.message);
    // Return cached data as fallback
    return await getCachedQuotes(currency);
  }
}

module.exports = {
  getQuotesWithCache,
  fetchAndCacheQuotes,
  isCacheFresh,
  getCachedQuotes
};

