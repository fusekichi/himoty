require('dotenv').config();
const path = require('path');
const express = require('express');
const { readHimoStation } = require('./lib/himo-station-store');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/google', require('./routes/google-maps'));
app.use('/api/yahoo', require('./routes/yahoo-fare'));
app.use('/api/himo', require('./routes/himo-station'));
app.use('/api/calendar', require('./routes/google-calendar'));

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'APIが見つかりません',
    path: req.originalUrl
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ヒモティー かんたん画面</title>
        <style>
          body {
            margin: 0;
            font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
            background: linear-gradient(180deg, #fefce8 0%, #fff7ed 100%);
            color: #3b2f2f;
          }
          .wrap {
            max-width: 860px;
            margin: 0 auto;
            padding: 24px 16px 48px;
          }
          .hero {
            background: linear-gradient(135deg, #fde68a, #fbcfe8);
            border-radius: 28px;
            padding: 22px;
          }
          .hero h1 { margin: 0 0 8px; font-size: 34px; }
          .hero p { margin: 0; line-height: 1.8; color: #6b5b4f; }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 16px;
          }
          .card {
            background: #fff;
            border: 2px solid #f3e2b7;
            border-radius: 24px;
            padding: 18px;
          }
          .card h2 { margin: 0 0 10px; }
          .card p { margin: 0 0 14px; line-height: 1.8; color: #6b625b; }
          .btn {
            display: inline-block;
            text-decoration: none;
            background: #fff7d6;
            color: #3b2f2f;
            border-radius: 999px;
            padding: 12px 16px;
            font-weight: 800;
          }
          code {
            background: #fff7d6;
            padding: 4px 8px;
            border-radius: 10px;
          }
          @media (max-width: 760px) {
            .grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <section class="hero">
            <h1>ヒモティー かんたん画面</h1>
            <p>ごちゃついてきたので、管理画面とユーザー画面をラフに作り直しました。必要なのは、ヒモの駅を更新することと、ユーザー側で現在地から電車賃を出すことだけです。</p>
          </section>
          <section class="grid">
            <article class="card">
              <h2>管理側画面</h2>
              <p>現在地を取って、最寄り駅を保存します。自由記述メモも一緒に残せます。</p>
              <a class="btn" href="/himo-station-admin.html">管理画面を開く</a>
            </article>
            <article class="card">
              <h2>ユーザー画面</h2>
              <p>開いた瞬間に、ヒモの駅・ユーザーの駅・往復電車賃までまとめて表示します。</p>
              <a class="btn" href="/fare-paypay-guide.html">ユーザー画面を開く</a>
            </article>
            <article class="card">
              <h2>呼べる / 呼べない画面</h2>
              <p>Googleカレンダーを見て、今から2時間空いているかを1画面で判定します。</p>
              <a class="btn" href="/himo-call-status.html">判定画面を開く</a>
            </article>
            <article class="card">
              <h2>Google API</h2>
              <p><code>POST /api/google/nearest-station</code><br /><code>GET /api/calendar/call-status</code></p>
            </article>
            <article class="card">
              <h2>Yahoo API</h2>
              <p><code>POST /api/yahoo/roundtrip-fare</code></p>
            </article>
          </section>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Admin screen: http://localhost:${PORT}/himo-station-admin.html`);
  console.log(`User screen: http://localhost:${PORT}/fare-paypay-guide.html`);
  console.log(`Call status screen: http://localhost:${PORT}/himo-call-status.html`);
});
