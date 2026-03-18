// Node.js Express replacement for Deno Edge Function
const express = require('express');
const router = express.Router();


router.post('/crop-advisory', async (req, res) => {
  const { district = "Kedah", season = "current", language = "en" } = req.body;
  try {
    // Always return mock data for crop advisory
    return res.json({
      recommendations: [
        { crop: "Rice", recommendation: "Plant now", risk: "low" },
        { crop: "Corn", recommendation: "Delay planting", risk: "medium" },
        { crop: "Palm Oil", recommendation: "Monitor for pests", risk: "high" }
      ]
    });
  } catch (e) {
    console.error("crop-advisory error:", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }

});

module.exports = router;
