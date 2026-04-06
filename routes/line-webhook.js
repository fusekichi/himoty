const express = require('express');
const { verifyLineSignature } = require('../lib/line-signature');
const crypto = require('crypto');

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

router.post(
  '/api/line/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['x-line-signature'];
      const channelSecret = process.env.LINE_CHANNEL_SECRET;

      const expectedSignature = crypto
        .createHmac('sha256', channelSecret)
        .update(req.body)
        .digest('base64');

      if (signature !== expectedSignature) {
        return res.status(401).json({ ok: false, error: 'Invalid signature' });
      }

      const body = JSON.parse(req.body.toString('utf8'));
      const events = body.events || [];

      for (const event of events) {
        await handleLineEvent(event);
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error('LINE webhook error:', error);
      return res.status(500).json({ ok: false, error: 'LINE_WEBHOOK_FAILED' });
    }
  }
);

async function handleLineEvent(event) {
  if (event.type === 'postback') {
    return handlePostbackEvent(event);
  }

  if (event.type === 'message' && event.message?.type === 'text') {
    return handleTextMessage(event);
  }

  return null;
}

async function handlePostbackEvent(event) {
  const data = event.postback?.data || '';
  const params = new URLSearchParams(data);
  const action = params.get('action');

  switch (action) {
    case 'check_free_today':
      return replyMessage(event.replyToken, [
        {
          type: 'text',
          text: '今日の空き枠を確認します。少々お待ちください。',
        },
      ]);

    case 'about_himoty':
      return replyMessage(event.replyToken, [
        {
          type: 'text',
          text: 'ヒモティは、ヒマ確認から呼び出し、予約、連絡までをゆるく案内する、親しみやすいお助けマスコットです。',
        },
      ]);

    default:
      return null;
  }
}

async function handleTextMessage(event) {
  const text = (event.message.text || '').trim();

  if (text === '今日の空き' || text === 'ヒモがヒマか確認') {
    return replyMessage(event.replyToken, [
      {
        type: 'text',
        text: '今日の空き枠を確認します。少々お待ちください。',
      },
    ]);
  }

  return null;
}

async function replyMessage(replyToken, messages) {
  if (!replyToken || !messages?.length) return null;

  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reply failed: ${res.status} ${text}`);
  }

  return res.json().catch(() => null);
}

module.exports = router;
