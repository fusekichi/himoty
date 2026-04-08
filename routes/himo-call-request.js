const express = require('express');

const router = express.Router();

router.post('/', express.json(), async (req, res) => {
  try {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminUserId = process.env.LINE_ADMIN_USER_ID;

    if (!channelAccessToken) {
      return res.status(500).json({
        ok: false,
        code: 'LINE_CHANNEL_ACCESS_TOKEN_MISSING',
        error: 'LINE_CHANNEL_ACCESS_TOKEN が設定されていません',
      });
    }

    if (!adminUserId) {
      return res.status(500).json({
        ok: false,
        code: 'LINE_ADMIN_USER_ID_MISSING',
        error: 'LINE_ADMIN_USER_ID が設定されていません',
      });
    }

    const {
      requestedAtLabel,
      userStation,
      roundTripFare,
      requesterDisplayName,
      requesterLineUserId,
    } = req.body || {};

    if (!requestedAtLabel || !userStation || !roundTripFare || !requesterLineUserId) {
      return res.status(400).json({
        ok: false,
        code: 'CALL_REQUEST_INVALID',
        error: 'requestedAtLabel, userStation, roundTripFare, requesterLineUserId は必須です',
      });
    }

    const yen = new Intl.NumberFormat('ja-JP', {
      maximumFractionDigits: 0,
    });

    const userMessageText = [
      '【ヒモ呼び出し受付】',
      `時間：${requestedAtLabel}`,
      `あなたの駅：${userStation}`,
      `往復交通費：${yen.format(Number(roundTripFare))}円`,
      '※ヒモからの連絡を待ってください',
    ].join('\\n');

    const adminMessageText = [
      '【ヒモ予約通知】',
      `${requesterDisplayName || 'ユーザー'}さんから予約が来ています`,
      `時間：${requestedAtLabel}`,
      `駅：${userStation}`,
      `往復交通費：${yen.format(Number(roundTripFare))}円`,
    ].join('\\n');

    async function pushMessage(to, text) {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({
          to,
          messages: [
            {
              type: 'text',
              text,
            },
          ],
        }),
      });

      const raw = await response.text();
      let result = null;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch (_) {
        result = raw;
      }

      if (!response.ok) {
        throw new Error(
          typeof result === 'object'
            ? (result?.message || result?.details?.[0]?.message || `LINE push failed: ${response.status}`)
            : `LINE push failed: ${response.status} ${raw}`
        );
      }

      return result;
    }

    await Promise.all([
      pushMessage(requesterLineUserId, userMessageText),
      pushMessage(adminUserId, adminMessageText),
    ]);

    return res.status(200).json({
      ok: true,
      message: '予約者本人と星野さんへLINE通知を送信しました',
    });
  } catch (error) {
    console.error('[HIMO CALL REQUEST ERROR]', error);

    return res.status(500).json({
      ok: false,
      code: 'HIMO_CALL_REQUEST_FAILED',
      error: 'ヒモ呼び出し通知の送信に失敗しました',
      detail: error.message,
    });
  }
});

module.exports = router;
