// Node.js Express replacement for Deno Edge Function
const express = require('express');
const router = express.Router();


router.post('/market-ai', async (req, res) => {
  const { language = "en" } = req.body;
  try {
    // Always return mock data for market prices
    return res.json({
      commodities: [
        { crop: "Rice", price: 1200, trend: "up" },
        { crop: "Corn", price: 900, trend: "down" },
        { crop: "Palm Oil", price: 2500, trend: "stable" }
      ]
    });
  } catch (e) {
    console.error("market-ai error:", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
});

module.exports = router;
