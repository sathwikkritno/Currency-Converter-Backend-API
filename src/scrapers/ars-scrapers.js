const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape Ambito.com for ARS/USD rate
 */
async function scrapeAmbito() {
  try {
    const url = 'https://www.ambito.com/contenidos/dolar.html';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    let buyPrice = null;
    let sellPrice = null;
    
    // Ambito usually displays buy and sell prices in specific divs
    // Look for common selectors used for dollar quotes
    const possibleSelectors = [
      '[class*="compra"]',
      '[class*="venta"]',
      '[class*="buy"]',
      '[class*="sell"]',
      '[data-compra]',
      '[data-venta]',
      '[data-buy]',
      '[data-sell]'
    ];
    
    for (const selector of possibleSelectors) {
      const elements = $(selector);
      elements.each((i, el) => {
        const text = $(el).text().trim();
        const match = text.match(/(\d+[\.,]\d{2,4})/);
        if (match) {
          const value = parseFloat(match[1].replace(',', '.'));
          if (value > 50 && value < 2000) {
            if (!buyPrice || selector.includes('compra') || selector.includes('buy') || selector.includes('data-compra') || selector.includes('data-buy')) {
              buyPrice = value;
            } else {
              sellPrice = value;
            }
          }
        }
      });
    }
    
    // Alternative method: look for specific ARS dollar section
    const dollarSection = $('[class*="dolar"], [id*="dolar"], section').first();
    if (dollarSection.length > 0) {
      const sectionText = dollarSection.text();
      const matches = sectionText.match(/(\d+[\.,]\d{2,4})/g);
      if (matches) {
        const values = matches.map(m => parseFloat(m.replace(',', '.'))).filter(v => v > 50 && v < 2000);
        if (values.length >= 1) {
          buyPrice = values[0];
        }
        if (values.length >= 2) {
          sellPrice = values[1];
        }
      }
    }
    
    if (!buyPrice) {
      throw new Error('Could not find ARS/USD rate on Ambito.com');
    }
    
    if (!sellPrice) {
      sellPrice = buyPrice * 1.03;
    }
    
    return {
      buy_price: buyPrice,
      sell_price: sellPrice,
      source: url
    };
  } catch (error) {
    console.error('Error scraping Ambito:', error.message);
    throw error;
  }
}

/**
 * Scrape DolarHoy.com for ARS/USD rate
 */
async function scrapeDolarHoy() {
  try {
    const url = 'https://www.dolarhoy.com';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    let buyPrice = null;
    let sellPrice = null;
    
    // DolarHoy has multiple dollar types, look for the main one
    const dollarCards = $('[class*="card"], [class*="tile"], [class*="quote"]');
    
    dollarCards.each((i, el) => {
      const cardText = $(el).text();
      
      // Look for buy and sell prices
      const buyMatch = cardText.match(/compra[\s:]*\$?\s*(\d+[\.,]\d{2,4})/i);
      const sellMatch = cardText.match(/venta[\s:]*\$?\s*(\d+[\.,]\d{2,4})/i);
      
      if (buyMatch) {
        const value = parseFloat(buyMatch[1].replace(',', '.'));
        if (value > 50 && value < 2000) {
          buyPrice = value;
        }
      }
      
      if (sellMatch) {
        const value = parseFloat(sellMatch[1].replace(',', '.'));
        if (value > 50 && value < 2000) {
          sellPrice = value;
        }
      }
    });
    
    // Fallback: search entire page
    if (!buyPrice || !sellPrice) {
      const pageText = $('body').text();
      const allMatches = pageText.match(/\$?\s*(\d{3,4}[\.,]\d{2,4})/g);
      if (allMatches) {
        const values = allMatches.map(m => parseFloat(m.replace(/[$,]/g, '').replace(',', '.')))
          .filter(v => v > 50 && v < 2000)
          .sort((a, b) => a - b);
        
        if (values.length >= 1) {
          buyPrice = values[0];
        }
        if (values.length >= 2) {
          sellPrice = values[values.length - 1];
        }
      }
    }
    
    if (!buyPrice) {
      throw new Error('Could not find ARS/USD rate on DolarHoy.com');
    }
    
    if (!sellPrice) {
      sellPrice = buyPrice * 1.03;
    }
    
    return {
      buy_price: buyPrice,
      sell_price: sellPrice,
      source: url
    };
  } catch (error) {
    console.error('Error scraping DolarHoy:', error.message);
    throw error;
  }
}

/**
 * Scrape Cronista.com for ARS/USD rate (blue dollar)
 */
async function scrapeCronista() {
  try {
    const url = 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    let buyPrice = null;
    let sellPrice = null;
    
    // Look for price elements
    const priceElements = $('[class*="price"], [class*="quote"], [class*="rate"]');
    
    priceElements.each((i, el) => {
      const text = $(el).text().trim();
      const match = text.match(/(\d+[\.,]\d{2,4})/);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        if (value > 50 && value < 2000) {
          if (!buyPrice) {
            buyPrice = value;
          } else if (!sellPrice) {
            sellPrice = value;
          }
        }
      }
    });
    
    // Alternative: look for table rows or cards
    $('tr, [class*="card"], [class*="row"]').each((i, el) => {
      const rowText = $(el).text();
      
      const buyMatch = rowText.match(/(\d{3,4}[\.,]\d{2,4})/);
      if (buyMatch) {
        const value = parseFloat(buyMatch[1].replace(',', '.'));
        if (value > 50 && value < 2000) {
          if (!buyPrice) {
            buyPrice = value;
          } else if (!sellPrice && value !== buyPrice) {
            sellPrice = value;
          }
        }
      }
    });
    
    // Last resort: parse all numbers and find the most common range
    if (!buyPrice || !sellPrice) {
      const bodyText = $('body').text();
      const numbers = bodyText.match(/\b(\d{3,4}[\.,]\d{2,4})\b/g);
      if (numbers) {
        const values = [...new Set(numbers.map(n => parseFloat(n.replace(',', '.'))))]
          .filter(v => v > 50 && v < 2000)
          .sort((a, b) => a - b);
        
        if (values.length >= 1) {
          buyPrice = values[0];
        }
        if (values.length >= 2) {
          sellPrice = values[values.length - 1];
        }
      }
    }
    
    if (!buyPrice) {
      throw new Error('Could not find ARS/USD rate on Cronista.com');
    }
    
    if (!sellPrice) {
      sellPrice = buyPrice * 1.03;
    }
    
    return {
      buy_price: buyPrice,
      sell_price: sellPrice,
      source: url
    };
  } catch (error) {
    console.error('Error scraping Cronista:', error.message);
    throw error;
  }
}

module.exports = {
  scrapeAmbito,
  scrapeDolarHoy,
  scrapeCronista
};

