// Node.js Express replacement for Deno Edge Function
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch').default;
// Removed top-level await and debug log

router.post('/weather-ai', async (req, res) => {
  const { state = "Putrajaya", district = "237" } = req.body || {};
  const MET_TOKEN = process.env.MET_TOKEN;
  console.log('[weather-ai] state:', state, 'district:', district, 'MET_TOKEN:', MET_TOKEN);
  try {
    if (!MET_TOKEN) throw new Error("MET_TOKEN is not configured");
    // Use Malaysia state/district to lat/lon mapping
    const latLonMap = require('../../malaysiaLatLon');
    let lat, lon;
    if (
      latLonMap[state] &&
      latLonMap[state][district]
    ) {
      lat = latLonMap[state][district].lat;
      lon = latLonMap[state][district].lon;
    } else {
      // fallback: Kuala Lumpur
      lat = 3.139;
      lon = 101.6869;
    }
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${MET_TOKEN}`;
    console.log('[weather-ai] OpenWeather URL:', url);
    const response = await fetch(url);
    const weatherData = await response.json();
    console.log('[weather-ai] OpenWeather response:', JSON.stringify(weatherData).slice(0, 500));
    if (!response.ok) {
      return res.status(response.status).json({ error: weatherData.message || 'Weather service unavailable' });
    }
    // Map OpenWeather daily forecast to frontend format (7 days)
    const forecast = (weatherData.daily || []).slice(0, 7).map(day => ({
      date: new Date(day.dt * 1000).toISOString().split('T')[0],
      temp_high: day.temp.max,
      temp_low: day.temp.min,
      rain_percent: day.pop ? Math.round(day.pop * 100) : 0,
      wind_kmh: day.wind_speed,
      humidity: day.humidity,
      condition: day.weather && day.weather[0] ? day.weather[0].description : '',
      icon: day.weather && day.weather[0] ? day.weather[0].icon : '',
    }));
    res.json({ forecast });
  } catch (e) {
    console.error("weather-ai error:", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
});

module.exports = router;
