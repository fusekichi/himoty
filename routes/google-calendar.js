const express = require('express');
const { checkHimoCallable, ensureCalendarConfig } = require('../lib/google-calendar');

const router = express.Router();

router.get('/call-status', async (req, res) => {
  try {
    ensureCalendarConfig();

    const durationMinutes = Number(req.query.durationMinutes || 120);
    const result = await checkHimoCallable({ durationMinutes });

    return res.json({
      ok: true,
      canCall: result.available,
      message: result.available
        ? `今から${durationMinutes}分は空いているので、ヒモを呼べます。`
        : `今から${durationMinutes}分以内に予定があるので、いまはヒモを呼べません。`,
      ...result
    });
  } catch (error) {
    console.error('Google Calendar call status error:', error);
    return res.status(500).json({
      error: 'Googleカレンダーの空き確認に失敗しました',
      detail: error.message
    });
  }
});

module.exports = router;
