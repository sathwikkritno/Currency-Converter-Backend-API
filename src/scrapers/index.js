const { scrapeWise, scrapeNubank, scrapeNomad } = require('./brl-scrapers');
const { scrapeAmbito, scrapeDolarHoy, scrapeCronista } = require('./ars-scrapers');

/**
 * Scrape all BRL sources
 */
async function scrapeAllBRL() {
  const results = [];
  const scrapers = [
    { name: 'Wise', fn: scrapeWise },
    { name: 'Nubank', fn: scrapeNubank },
    { name: 'Nomad', fn: scrapeNomad }
  ];

  for (const scraper of scrapers) {
    try {
      const data = await scraper.fn();
      results.push(data);
      console.log(`Successfully scraped ${scraper.name}`);
    } catch (error) {
      console.error(`Failed to scrape ${scraper.name}:`, error.message);
    }
  }

  return results;
}

/**
 * Scrape all ARS sources
 */
async function scrapeAllARS() {
  const results = [];
  const scrapers = [
    { name: 'Ambito', fn: scrapeAmbito },
    { name: 'DolarHoy', fn: scrapeDolarHoy },
    { name: 'Cronista', fn: scrapeCronista }
  ];

  for (const scraper of scrapers) {
    try {
      const data = await scraper.fn();
      results.push(data);
      console.log(`Successfully scraped ${scraper.name}`);
    } catch (error) {
      console.error(`Failed to scrape ${scraper.name}:`, error.message);
    }
  }

  return results;
}

/**
 * Scrape all sources for a given currency
 */
async function scrapeByCurrency(currency) {
  if (currency === 'BRL') {
    return await scrapeAllBRL();
  } else if (currency === 'ARS') {
    return await scrapeAllARS();
  } else {
    throw new Error(`Unsupported currency: ${currency}`);
  }
}

module.exports = {
  scrapeAllBRL,
  scrapeAllARS,
  scrapeByCurrency
};

