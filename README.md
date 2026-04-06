# ヒモティー - ヒモを呼べるサービス 🛏️

## 概要
LINE公式アカウントを通じて「ヒモ」（星野さん）を呼べるネタ系サービス

## 機能
- ✅ ヒモを呼ぶ（日時選択 → 駅入力 → 予約リクエスト）
- ✅ ヒモの現在地確認（Google Location History連携）
- ✅ Googleカレンダー連携（前後30分バッファ）

## セットアップ

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.example`を`.env`にコピーして、必要な情報を入力

### 3. LINE Messaging API設定
1. [LINE Developers](https://developers.line.biz/)でアカウント作成
2. チャネル作成
3. Channel Access TokenとChannel Secretを`.env`に設定

### 4. Google API設定
1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
2. Google Calendar APIを有効化
3. OAuth 2.0クライアントIDを作成
4. 認証情報を`.env`に設定

### 5. 起動
```bash
npm run dev
```

## デプロイ
Vercel / Heroku / Google Cloud Runなどにデプロイ可能

## 次のステップ
- [ ] Google Location History API実装
- [ ] リッチメニュー設定
- [ ] より詳細なカレンダー空き時間ロジック
- [ ] エラーハンドリング強化
