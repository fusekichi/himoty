const express = require('express');

const router = express.Router();

router.post('/echo', (req, res) => {
  const { latitude, longitude } = req.body;

  if (!isNumber(latitude) || !isNumber(longitude)) {
    return res.status(400).json({ error: 'latitude / longitude を数値で送ってください' });
  }

  return res.json({
    ok: true,
    location: {
      latitude,
      longitude,
      updatedAt: new Date().toISOString()
    }
  });
});

function isNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value);
}

module.exports = router;
