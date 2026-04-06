const express = require('express');
const { verifyLineSignature } = require('../lib/line-signature');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const signature = req.get('x-line-signature');
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const rawBody = req.body; // express.raw() により Buffer が入る

    if (!channelSecret) {
      return res.status(500).json({
        ok: false,
        code: 'LINE_CHANNEL_SECRET_MISSING',
        error: 'LINE_CHANNEL_SECRET が設定されていません',
      });
    }

    if (!Buffer.isBuffer(rawBody)) {
      return res.status(500).json({
        ok: false,
        code: 'LINE_WEBHOOK_RAW_BODY_MISSING',
        error: 'Webhook の生データを取得できませんでした',
      });
    }

    const isValid = verifyLineSignature({
      channelSecret,
      rawBody,
      signature,
    });

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        code: 'LINE_SIGNATURE_INVALID',
        error: 'LINE署名の検証に失敗しました',
      });
    }

    const bodyText = rawBody.toString('utf8');
    const payload = JSON.parse(bodyText);
    const events = Array.isArray(payload.events) ? payload.events : [];

    for (const event of events) {
      console.log(
        '[LINE WEBHOOK EVENT]',
        JSON.stringify({
          type: event.type || null,
          userId: event.source?.userId || null,
          replyToken: event.replyToken || null,
          timestamp: event.timestamp || null,
        })
      );

      // 今は受信確認だけでOK
      // 今後ここに follow / message / postback / rich menu 導線処理を追加する
    }

    return res.status(200).json({
      ok: true,
      received: true,
      eventCount: events.length,
    });
  } catch (error) {
    console.error('[LINE WEBHOOK ERROR]', error);

    return res.status(500).json({
      ok: false,
      code: 'LINE_WEBHOOK_HANDLE_FAILED',
      error: 'LINE Webhook の処理に失敗しました',
      detail: error.message,
    });
  }
});

module.exports = router;
