const express = require('express');
const {
  readHimoStation,
  writeHimoStation,
} = require('../lib/himo-station-store');

const router = express.Router();

router.get('/station', async (req, res) => {
  try {
    const station = await readHimoStation();

    res.json({
      ok: true,
      station,
    });
  } catch (error) {
    console.error('GET /api/himo/station error:', error);
    res.status(500).json({
      ok: false,
      code: 'HIMO_STATION_READ_FAILED',
      message: 'ヒモの駅情報の取得に失敗しました。',
      detail: error.message,
    });
  }
});

router.post('/station', async (req, res) => {
  try {
    const stationName = String(req.body.stationName || '').trim();
    const latitude = req.body.latitude ?? null;
    const longitude = req.body.longitude ?? null;
    const sourceType = req.body.sourceType || 'manual';
    const updatedBy = req.body.updatedBy || 'admin';

    if (!stationName) {
      return res.status(400).json({
        ok: false,
        code: 'STATION_NAME_REQUIRED',
        message: '駅名を入力してください。',
      });
    }

    const station = await writeHimoStation({
      stationName,
      sourceType,
      latitude,
      longitude,
      updatedBy,
    });

    res.json({
      ok: true,
      message: '駅名を更新しました。',
      station,
    });
  } catch (error) {
    console.error('POST /api/himo/station error:', error);
    res.status(500).json({
      ok: false,
      code: 'HIMO_STATION_WRITE_FAILED',
      message: 'ヒモの駅情報の更新に失敗しました。',
      detail: error.message,
    });
  }
});

module.exports = router;
