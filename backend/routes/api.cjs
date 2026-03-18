const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const malaysiaLatLon = require('../malaysiaLatLon');
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// ...existing code...
// Weather endpoint
router.post('/weather-ai', async (req, res) => {
  const { state, district, date } = req.body;
  console.log('[Weather API] Received:', { state, district, date });
  try {
    const coords = malaysiaLatLon[state]?.[district];
    if (!coords) {
      console.error('[Weather API] Invalid state or district:', { state, district });
      return res.status(400).json({ error: 'Invalid state or district', received: { state, district } });
    }

    // OpenWeather One Call API (7-day forecast)
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely,hourly,alerts&units=metric&appid=${OPENWEATHER_API_KEY}`;
    console.log('[Weather API] Fetching OpenWeather:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      console.error('[Weather API] OpenWeather API error:', response.status, errText);
      throw new Error('OpenWeather API error: ' + errText);
    }
    const data = await response.json();

    // Map OpenWeather 'current' to frontend expected keys
    let current = null;
    if (data.current) {
      current = {
        temperature: data.current.temp,
        feels_like: data.current.feels_like,
        rainfall_mm: data.current.rain || 0,
        condition: data.current.weather && data.current.weather[0] ? data.current.weather[0].description : '',
        wind_speed: data.current.wind_speed,
        wind_direction: data.current.wind_deg ? `${data.current.wind_deg}°` : '',
        humidity: data.current.humidity,
      };
    } else if (data.daily && data.daily.length > 0) {
      // fallback: use first forecast day as current
      const d = data.daily[0];
      current = {
        temperature: d.temp.day,
        feels_like: d.feels_like.day,
        rainfall_mm: d.rain || 0,
        condition: d.weather && d.weather[0] ? d.weather[0].description : '',
        wind_speed: d.wind_speed,
        wind_direction: d.wind_deg ? `${d.wind_deg}°` : '',
        humidity: d.humidity,
      };
    }

    // Optionally, filter/format the forecast to start from the selected date and limit to 7 days
    res.json({ current, forecast: data.daily.slice(0, 7) });
  } catch (e) {
    console.error('[Weather API] Exception:', e);
    res.status(500).json({ error: e.message });
  }
});
// Add similar endpoints for market-ai and crop-advisory as needed
// Market endpoint 
router.post('/market-ai', async (req, res) => {
  try {
    const apiKey = process.env.APRIFEAKS_API_KEY;
    // Example: Replace with your real market price API endpoint
    const url = `https://api.artifacts.market/v1/prices?apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Market price API error');
    const data = await response.json();
    // Assume data.commodities is the array needed by frontend, else map as needed
    res.json({ commodities: data.commodities || data });
  } catch (e) {
    // fallback to mock data if API fails
    res.json({
      commodities: [
        { crop: "Rice", price: 1200, trend: "up" },
        { crop: "Corn", price: 900, trend: "down" },
        { crop: "Palm Oil", price: 2500, trend: "stable" }
      ]
    });
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

module.exports = router;
