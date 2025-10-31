/**
 * Calculate average buy and sell prices from quotes
 */
function calculateAverage(quotes) {
  if (!quotes || quotes.length === 0) {
    return {
      average_buy_price: null,
      average_sell_price: null
    };
  }

  const validQuotes = quotes.filter(q => q.buy_price && q.sell_price);
  
  if (validQuotes.length === 0) {
    return {
      average_buy_price: null,
      average_sell_price: null
    };
  }

  const sumBuy = validQuotes.reduce((sum, q) => sum + q.buy_price, 0);
  const sumSell = validQuotes.reduce((sum, q) => sum + q.sell_price, 0);

  const avgBuy = sumBuy / validQuotes.length;
  const avgSell = sumSell / validQuotes.length;

  return {
    average_buy_price: parseFloat(avgBuy.toFixed(4)),
    average_sell_price: parseFloat(avgSell.toFixed(4))
  };
}

/**
 * Calculate slippage for each quote against the average
 */
function calculateSlippage(quotes) {
  if (!quotes || quotes.length === 0) {
    return [];
  }

  const averages = calculateAverage(quotes);
  
  if (averages.average_buy_price === null || averages.average_sell_price === null) {
    return [];
  }

  const slippageArray = quotes.map(quote => {
    const buySlippage = calculatePercentageDifference(
      quote.buy_price,
      averages.average_buy_price
    );
    
    const sellSlippage = calculatePercentageDifference(
      quote.sell_price,
      averages.average_sell_price
    );

    return {
      buy_price_slippage: parseFloat(buySlippage.toFixed(4)),
      sell_price_slippage: parseFloat(sellSlippage.toFixed(4)),
      source: quote.source
    };
  });

  return slippageArray;
}

/**
 * Calculate percentage difference: (value - average) / average
 */
function calculatePercentageDifference(value, average) {
  if (!average || average === 0) {
    return 0;
  }
  
  return ((value - average) / average) * 100;
}

module.exports = {
  calculateAverage,
  calculateSlippage
};

