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
  res.json({
    commodities: [
      { crop: "Rice", price: 1200, trend: "up" },
      { crop: "Corn", price: 900, trend: "down" },
      { crop: "Palm Oil", price: 2500, trend: "stable" }
    ]
  });
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
