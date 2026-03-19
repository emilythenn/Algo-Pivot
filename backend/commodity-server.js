const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 4001;

// Example: API Ninjas commodity endpoint (requires free API key)
require('dotenv').config();
const API_NINJAS_KEY = process.env.API_NINJAS_KEY || 'YOUR_API_NINJAS_KEY';

app.use(express.json());

app.get('/api/commodity', async (req, res) => {
  const { symbol = 'gold' } = req.query;
  try {
    const url = `https://api.api-ninjas.com/v1/commodityprice?symbol=${symbol}`;
    const response = await fetch(url, {
      headers: { 'X-Api-Key': API_NINJAS_KEY }
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

app.listen(PORT, () => {
  console.log(`Commodity backend running on http://localhost:${PORT}`);
});
