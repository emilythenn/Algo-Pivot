// Node.js Express replacement for Deno Edge Function (ESM)
import express from 'express';
const router = express.Router();
import fetch from 'node-fetch';

router.post('/market-ai', async (req, res) => {
  const { symbol = "gold" } = req.body;
  try {
    const apiKey = process.env.API_NINJAS_KEY;
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

export default router;
