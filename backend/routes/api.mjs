import express from 'express';
const router = express.Router();
import WeatherModel from '../models/WeatherModel.cjs';
import fetch from 'node-fetch';

// ...existing code...
// Weather endpoint
router.post('/weather-ai', async (req, res) => {
  const { state, district } = req.body;
  try {
    const apiKey = process.env.MET_TOKEN;
    const url = `https://api.data.gov.my/weather/forecast?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const data = await response.json();
    const weather = new WeatherModel({ state, district, forecast: data });
    res.json(weather);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// Add similar endpoints for market-ai and crop-advisory as needed
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

export default router;
