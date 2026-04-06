# ヒモティー開発環境構築（Ubuntu版）🛏️

## 前提条件
- Ubuntu 20.04 / 22.04 / 24.04
- インターネット接続

---

## ステップ1: Node.jsのインストール

### 推奨バージョン: Node.js v20.x（LTS）

```bash
# システムパッケージを更新
sudo apt update && sudo apt upgrade -y

# Node.js v20.xをインストール（NodeSourceリポジトリ使用）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# バージョン確認
node --version  # v20.x.x が表示されればOK
npm --version   # 10.x.x が表示されればOK
```

### 別の方法: nvmを使う（推奨）

```bash
# nvmをインストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# ターミナルを再起動、または以下を実行
source ~/.bashrc

# Node.js v20をインストール
nvm install 20
nvm use 20
nvm alias default 20

# 確認
node --version
npm --version
```

---

## ステップ2: プロジェクトのセットアップ

```bash
# プロジェクトディレクトリを作成
mkdir -p ~/projects
cd ~/projects

# Gitがインストールされていない場合
sudo apt install -y git

# プロジェクトをクローン（後でGitリポジトリ作成する場合）
# または、ファイルを直接配置
mkdir himoty
cd himoty

# 必要なファイルをコピー（このセクションは後で実行）
```

---

## ステップ3: 依存パッケージのインストール

```bash
cd ~/projects/himoty

# package.jsonがあることを確認
ls -la package.json

# 依存パッケージをインストール
npm install

# インストール確認
npm list --depth=0
```

---

## ステップ4: 開発ツールのインストール（オプション）

### VSCode（推奨エディタ）

```bash
# VSCodeをインストール
sudo snap install code --classic

# または、公式サイトからダウンロード
# https://code.visualstudio.com/
```

### ngrok（ローカル開発用トンネル）

```bash
# ngrokをインストール
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && \
  sudo apt install ngrok

# ngrokアカウント作成（https://ngrok.com/）
# 認証トークンを設定
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

---

## ステップ5: 環境変数の設定

```bash
cd ~/projects/himoty

# .envファイルを作成
cp .env.example .env

# エディタで編集
nano .env
# または
code .env
```

以下の情報を入力：

```env
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token

GOOGLE_CALENDAR_ID=your_calendar_id@gmail.com

PORT=3000
```

---

## ステップ6: Google Refresh Token取得

```bash
cd ~/projects/himoty

# .envにGOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETを設定済みであること

# スクリプト実行
node get-refresh-token.js

# 表示されるURLにアクセスして認証
# 取得したRefresh Tokenを.envに追加
```

---

## ステップ7: ローカルサーバー起動

```bash
cd ~/projects/himoty

# 開発サーバー起動
npm run dev

# 成功すると以下が表示される:
# Server is running on port 3000
```

別のターミナルで確認：

```bash
curl http://localhost:3000
# "ヒモティー Bot is running! 🛏️" が返ってくればOK
```

---

## ステップ8: ngrokでトンネル作成

```bash
# 別のターミナルで実行
ngrok http 3000

# 表示されるForwarding URLをコピー
# 例: https://xxxx-xx-xx-xx-xx.ngrok-free.app
```

このURLをLINE DevelopersのWebhook URLに設定：
```
https://xxxx-xx-xx-xx-xx.ngrok-free.app/webhook
```

---

## トラブルシューティング

### Node.jsのバージョンが古い場合

```bash
# nvmを使ってバージョン切り替え
nvm install 20
nvm use 20
```

### ポート3000が使用中の場合

```bash
# 使用中のプロセスを確認
sudo lsof -i :3000

# または別のポートを使用（.envのPORTを変更）
PORT=3001 npm run dev
```

### npm installでエラーが出る場合

```bash
# npmキャッシュをクリア
npm cache clean --force

# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

---

## 開発フロー

```bash
# 1. コード編集
code index.js

# 2. サーバー再起動（コード変更後）
# Ctrl+C で停止 → npm run dev で再起動

# 3. LINEで動作確認
# LINE Botに「ヒモを呼ぶ」と送信

# 4. ログ確認
# ターミナルにログが表示される
```

---

## 本番デプロイ（Vercel推奨）

```bash
# Vercel CLIをインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 環境変数を設定（Vercelダッシュボードで）
# または
vercel env add LINE_CHANNEL_ACCESS_TOKEN
vercel env add LINE_CHANNEL_SECRET
# ... 他の環境変数も同様に追加

# 本番デプロイ
vercel --prod
```

---

## 推奨VSCode拡張機能

- **ESLint** - コード品質チェック
- **Prettier** - コードフォーマット
- **GitLens** - Git統合
- **REST Client** - API テスト

---

## 次のステップ
- ✅ 開発環境構築完了
- □ LINE・Google API設定
- □ ローカルテスト
- □ リッチメニュー追加
- □ Google Location History実装
- □ 本番デプロイ
