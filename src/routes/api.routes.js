const express = require('express');
const router = express.Router();
const { getQuotesWithCache } = require('../services/cache.service');
const { calculateAverage, calculateSlippage } = require('../services/calculator.service');

/**
 * GET /quotes?currency=BRL or ?currency=ARS
 * Returns array of all quotes from 3 sources
 */
router.get('/quotes', async (req, res) => {
  try {
    const currency = req.query.currency?.toUpperCase();
    
    if (!currency || !['BRL', 'ARS'].includes(currency)) {
      return res.status(400).json({
        error: 'Invalid currency parameter. Must be BRL or ARS',
        usage: '/quotes?currency=BRL or /quotes?currency=ARS'
      });
    }

    const quotes = await getQuotesWithCache(currency);
    
    if (quotes.length === 0) {
      return res.status(404).json({
        error: `No quotes available for ${currency}`,
        message: 'Please try again later'
      });
    }

    res.json(quotes);
  } catch (error) {
    console.error('Error in /quotes endpoint:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch quotes'
    });
  }
});

/**
 * GET /average?currency=BRL or ?currency=ARS
 * Returns average buy and sell prices across all sources
 */
router.get('/average', async (req, res) => {
  try {
    const currency = req.query.currency?.toUpperCase();
    
    if (!currency || !['BRL', 'ARS'].includes(currency)) {
      return res.status(400).json({
        error: 'Invalid currency parameter. Must be BRL or ARS',
        usage: '/average?currency=BRL or /average?currency=ARS'
      });
    }

    const quotes = await getQuotesWithCache(currency);
    
    if (quotes.length === 0) {
      return res.status(404).json({
        error: `No quotes available for ${currency}`,
        message: 'Please try again later'
      });
    }

    const averages = calculateAverage(quotes);
    
    if (averages.average_buy_price === null || averages.average_sell_price === null) {
      return res.status(500).json({
        error: 'Failed to calculate averages',
        message: 'Invalid quote data'
      });
    }

    res.json(averages);
  } catch (error) {
    console.error('Error in /average endpoint:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate averages'
    });
  }
});

/**
 * GET /slippage?currency=BRL or ?currency=ARS
 * Returns slippage percentage for each source against the average
 */
router.get('/slippage', async (req, res) => {
  try {
    const currency = req.query.currency?.toUpperCase();
    
    if (!currency || !['BRL', 'ARS'].includes(currency)) {
      return res.status(400).json({
        error: 'Invalid currency parameter. Must be BRL or ARS',
        usage: '/slippage?currency=BRL or /slippage?currency=ARS'
      });
    }

    const quotes = await getQuotesWithCache(currency);
    
    if (quotes.length === 0) {
      return res.status(404).json({
        error: `No quotes available for ${currency}`,
        message: 'Please try again later'
      });
    }

    const slippage = calculateSlippage(quotes);
    
    if (slippage.length === 0) {
      return res.status(500).json({
        error: 'Failed to calculate slippage',
        message: 'Invalid quote data'
      });
    }

    res.json(slippage);
  } catch (error) {
    console.error('Error in /slippage endpoint:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate slippage'
    });
  }
});

module.exports = router;

