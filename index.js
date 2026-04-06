require('dotenv').config();

const express = require('express');
const path = require('path');

const googleMapsRouter = require('./routes/google-maps');
const yahooFareRouter = require('./routes/yahoo-fare');
const himoStationRouter = require('./routes/himo-station');
const googleCalendarRouter = require('./routes/google-calendar');
const lineWebhookRouter = require('./routes/line-webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// 1) 静的ファイル
app.use(express.static(path.join(__dirname, 'public')));

// 2) LINE Webhook は raw body で先に受ける
app.use(
  '/api/line/webhook',
  express.raw({ type: 'application/json' }),
  lineWebhookRouter
);

// 3) それ以外は JSON として扱う
app.use(express.json());

// 4) 既存API
app.use('/api/google', googleMapsRouter);
app.use('/api/yahoo', yahooFareRouter);
app.use('/api/himo', himoStationRouter);
app.use('/api/calendar', googleCalendarRouter);

// 5) health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'himoty',
    timestamp: new Date().toISOString(),
  });
});

// 6) 404
app.use('/api', (_req, res) => {
  res.status(404).json({
    ok: false,
    error: 'API not found',
  });
});

// 7) ルート
app.get('/', (_req, res) => {
  res.send(`
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title>ヒモティー かんたん画面</title>
      </head>
      <body>
        <h1>ヒモティー かんたん画面</h1>
        <ul>
          <li><a href="/himo-station-admin.html">管理画面</a></li>
          <li><a href="/fare-paypay-guide.html">ユーザー画面</a></li>
          <li><a href="/himo-call-status.html">呼ぶ画面</a></li>
        </ul>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
