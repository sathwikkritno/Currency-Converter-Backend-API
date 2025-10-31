const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape Wise.com for BRL/USD rate
 */
async function scrapeWise() {
  try {
    const url = 'https://wise.com/us/currency-converter/brl-to-usd-rate';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Try to find the conversion rate in various possible locations
    let buyPrice = null;
    let sellPrice = null;
    
    // Method 1: Look for JSON-LD structured data
    const jsonLd = $('script[type="application/ld+json"]').text();
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        if (data['@type'] === 'WebPage' && data.mainEntity) {
          buyPrice = parseFloat(data.mainEntity.conversionRate);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    // Method 2: Look for elements with exchange rate data
    const rateElements = $('[data-amount], .exchange-rate, .rate-value, [class*="rate"]');
    rateElements.each((i, el) => {
      const text = $(el).text().trim();
      const match = text.match(/(\d+\.?\d*)/);
      if (match) {
        const value = parseFloat(match[1]);
        if (value > 1 && value < 10) {
          buyPrice = value;
        }
      }
    });
    
    // Method 3: Look for script tags with rate data
    $('script').each((i, el) => {
      const scriptContent = $(el).html();
      if (scriptContent) {
        const matches = scriptContent.match(/(\d+\.\d{4,6})/g);
        if (matches) {
          const values = matches.map(m => parseFloat(m));
          const candidate = values.find(v => v > 4 && v < 7);
          if (candidate) {
            buyPrice = candidate;
          }
        }
      }
    });
    
    if (!buyPrice) {
      throw new Error('Could not find BRL/USD rate on Wise.com');
    }
    
    // Estimate sell price as slightly higher than buy price (spread)
    sellPrice = buyPrice * 1.005;
    
    return {
      buy_price: buyPrice,
      sell_price: sellPrice,
      source: url
    };
  } catch (error) {
    console.error('Error scraping Wise:', error.message);
    throw error;
  }
}

/**
 * Scrape Nubank for BRL/USD rate
 */
async function scrapeNubank() {
  try {
    const url = 'https://nubank.com.br/taxas-conversao/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    let buyPrice = null;
    let sellPrice = null;
    
    // Look for conversion rate information
    const rateText = $('body').text();
    
    // Try to find USD rate in various formats
    const patterns = [
      /USD[\s:]*(\d+[\.,]\d{2,4})/i,
      /R\$\s*(\d+[\.,]\d{2,4})[\s]*USD/i,
      /(\d+[\.,]\d{4})[\s]*BRL/i
    ];
    
    for (const pattern of patterns) {
      const match = rateText.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        if (value > 4 && value < 7) {
          buyPrice = value;
          break;
        }
      }
    }
    
    // Look for structured data or specific elements
    $('[class*="rate"], [class*="conversion"], [class*="price"]').each((i, el) => {
      const text = $(el).text().trim();
      const match = text.match(/(\d+[\.,]\d{2,4})/);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        if (value > 4 && value < 7) {
          buyPrice = value;
          return false;
        }
      }
    });
    
    if (!buyPrice) {
      throw new Error('Could not find BRL/USD rate on Nubank');
    }
    
    sellPrice = buyPrice * 1.005;
    
    return {
      buy_price: buyPrice,
      sell_price: sellPrice,
      source: url
    };
  } catch (error) {
    console.error('Error scraping Nubank:', error.message);
    throw error;
  }
}

/**
 * Scrape Nomad for BRL/USD rate
 */
async function scrapeNomad() {
  try {
    const url = 'https://www.nomadglobal.com';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    let buyPrice = null;
    let sellPrice = null;
    
    // Look for currency conversion data
    const bodyText = $('body').text();
    
    // Try various patterns to find BRL/USD rate
    const patterns = [
      /BRL[\s:]*(\d+[\.,]\d{2,4})/i,
      /R\$\s*(\d+[\.,]\d{2,4})[\s]*USD/i,
      /USD[\s:]*(\d+[\.,]\d{4,6})/i
    ];
    
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        if (value > 4 && value < 7) {
          buyPrice = value;
          break;
        }
      }
    }
    
    // Look in script tags for embedded data
    $('script').each((i, el) => {
      const scriptContent = $(el).html();
      if (scriptContent && scriptContent.includes('BRL')) {
        const matches = scriptContent.match(/(\d+\.\d{4,6})/g);
        if (matches) {
          const values = matches.map(m => parseFloat(m));
          const candidate = values.find(v => v > 4 && v < 7);
          if (candidate) {
            buyPrice = candidate;
            return false;
          }
        }
      }
    });
    
    if (!buyPrice) {
      throw new Error('Could not find BRL/USD rate on Nomad');
    }
    
    sellPrice = buyPrice * 1.005;
    
    return {
      buy_price: buyPrice,
      sell_price: sellPrice,
      source: url
    };
  } catch (error) {
    console.error('Error scraping Nomad:', error.message);
    throw error;
  }
}

module.exports = {
  scrapeWise,
  scrapeNubank,
  scrapeNomad
};

