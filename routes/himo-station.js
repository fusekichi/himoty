const express = require('express');
const { STORE_FILE_PATH, readHimoStation, writeHimoStation } = require('../lib/himo-station-store');

const router = express.Router();

router.get('/station', async (req, res) => {
  try {
    const station = await readHimoStation();
    return res.json({
      ok: true,
      ...station,
      filePath: STORE_FILE_PATH
    });
  } catch (error) {
    console.error('Read himo station error:', error);
    return res.status(500).json({
      error: 'ヒモの最寄り駅の読み込みに失敗しました',
      detail: error.message
    });
  }
});

router.post('/station', async (req, res) => {
  try {
    const { stationName } = req.body;
    const normalized = String(stationName || '').trim();

    if (!normalized) {
      return res.status(400).json({ error: 'stationName を入力してください' });
    }

    const saved = await writeHimoStation(normalized);
    return res.json({
      ok: true,
      message: 'ヒモの最寄り駅を更新しました',
      ...saved,
      filePath: STORE_FILE_PATH
    });
  } catch (error) {
    console.error('Write himo station error:', error);
    return res.status(500).json({
      error: 'ヒモの最寄り駅の更新に失敗しました',
      detail: error.message
    });
  }
});

module.exports = router;
