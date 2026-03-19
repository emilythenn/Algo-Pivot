const express = require('express');
const router = express.Router();
const WeatherModel = require('../models/WeatherModel');
const fetch = require('node-fetch');

// Weather endpoint (mock fallback)
router.post('/weather-ai', async (req, res) => {
  const { state, district } = req.body;
  // Always return mock weather data for demo
  const today = new Date();
  const forecast = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      temp_high: 32 + Math.floor(Math.random() * 4),
      temp_low: 24 + Math.floor(Math.random() * 3),
      rain_percent: Math.floor(Math.random() * 100),
      wind_kmh: 5 + Math.floor(Math.random() * 15),
      humidity: 60 + Math.floor(Math.random() * 30),
      condition: 'Partly cloudy',
      icon: '03d',
    };
  });
  res.json({ forecast });
});

// Market endpoint 
router.post('/market-ai', async (req, res) => {
  try {
    const apiKey = process.env.API_NINJAS_KEY;
    const symbol = req.body?.symbol || 'gold';
    const url = `https://api.api-ninjas.com/v1/commodityprice?symbol=${symbol}`;
    const response = await fetch(url, {
      headers: { 'X-Api-Key': apiKey }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch commodity price' });
    }
    const data = await response.json();
    res.json({ commodity: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crop advisory endpoint 
router.post('/crop-advisory', async (req, res) => {
  res.json({
    recommendations: [
      { crop: "Rice", recommendation: "Plant now", risk: "low" },
      { crop: "Corn", recommendation: "Delay planting", risk: "medium" },
      { crop: "Palm Oil", recommendation: "Monitor for pests", risk: "high" }
    ]
  });
});

// Add similar endpoints for market-ai and crop-advisory as needed

module.exports = router;
