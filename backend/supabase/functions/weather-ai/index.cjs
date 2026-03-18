// Node.js Express replacement for Deno Edge Function
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch').default;
// Removed top-level await and debug log

router.post('/weather-ai', async (req, res) => {
  // Always return mock weather data for all states/districts
  const { date } = req.body || {};
  let startDate;
  if (date) {
    startDate = new Date(date);
    if (isNaN(startDate.getTime())) startDate = new Date();
  } else {
    startDate = new Date();
  }
  const forecast = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
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

module.exports = router;
