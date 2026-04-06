# ヒモティー セットアップガイド 🛏️

## ステップ1: LINE Messaging API の設定

### 1.1 LINE Developersアカウント作成
1. https://developers.line.biz/ にアクセス
2. LINEアカウントでログイン
3. 「プロバイダー」を作成（例: ヒモティー）

### 1.2 チャネル作成
1. 「Messaging API」チャネルを作成
2. チャネル名: `ヒモティー`
3. チャネル説明: `ヒモを呼べるサービス`
4. カテゴリ: `エンターテイメント`

### 1.3 必要な情報を取得
- **Channel Secret**: 「Basic settings」タブから取得
- **Channel Access Token**: 「Messaging API」タブで発行

### 1.4 Webhook設定
1. 「Messaging API」タブ
2. Webhook URL: `https://your-domain.com/webhook` (後で設定)
3. 「Use webhook」をONにする
4. 「Auto-reply messages」をOFFにする
5. 「Greeting messages」もOFFにする（任意）

---

## ステップ2: Google API の設定

### 2.1 Google Cloud Consoleでプロジェクト作成
1. https://console.cloud.google.com/ にアクセス
2. 新しいプロジェクトを作成（例: himoty）

### 2.2 必要なAPIを有効化
1. 「APIとサービス」→「ライブラリ」
2. 以下のAPIを検索して有効化:
   - **Google Calendar API**
   - **Google Maps Geolocation API** (位置情報用)

### 2.3 OAuth 2.0 認証情報を作成
1. 「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアントID」
3. アプリケーションの種類: 「ウェブアプリケーション」
4. 承認済みのリダイレクトURI: `http://localhost:3000/oauth2callback`
5. **クライアントID**と**クライアントシークレット**を保存

### 2.4 Refresh Tokenの取得（重要）
以下のスクリプトを実行してRefresh Tokenを取得します:

```bash
node get-refresh-token.js
```

※ このスクリプトは次のステップで作成します

### 2.5 カレンダーIDの確認
1. Google カレンダーを開く
2. 左側のカレンダーリストから使用するカレンダーを選択
3. 設定（⚙️）→「設定」→「カレンダーの統合」
4. **カレンダーID**をコピー（例: your-email@gmail.com）

---

## ステップ3: 環境変数の設定

`.env`ファイルを作成（`.env.example`をコピー）:

```bash
cp .env.example .env
```

以下の情報を入力:

```env
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=取得したChannel Access Token
LINE_CHANNEL_SECRET=取得したChannel Secret

# Google Calendar API
GOOGLE_CLIENT_ID=取得したクライアントID
GOOGLE_CLIENT_SECRET=取得したクライアントシークレット
GOOGLE_REFRESH_TOKEN=取得したRefresh Token

# カレンダーID（星野さんのGoogleカレンダー）
GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com

# ポート
PORT=3000
```

---

## ステップ4: ローカルで起動

```bash
npm run dev
```

http://localhost:3000 にアクセスして「ヒモティー Bot is running! 🛏️」が表示されればOK！

---

## ステップ5: ngrokでトンネル作成（開発用）

ローカル環境をインターネットに公開してLINEから接続:

```bash
# ngrokをインストール（未インストールの場合）
# https://ngrok.com/ からダウンロード

# トンネル作成
ngrok http 3000
```

表示されたURL（例: `https://xxxx.ngrok.io`）を LINE Developers の Webhook URL に設定:
- Webhook URL: `https://xxxx.ngrok.io/webhook`

---

## ステップ6: 動作確認

1. LINE Developers の「Messaging API」タブからQRコードで友だち追加
2. 「ヒモを呼ぶ」とメッセージ送信
3. 応答があればOK！🎉

---

## トラブルシューティング

### エラー: "Invalid signature"
→ `LINE_CHANNEL_SECRET`が間違っている可能性

### エラー: "The request failed with status code: 401"
→ Google認証情報が間違っている可能性

### Webhookが反応しない
→ ngrokのURLが正しく設定されているか確認

---

## 次のステップ
- リッチメニューの設定
- Google Location History APIの実装
- 本番環境へのデプロイ（Vercel推奨）
