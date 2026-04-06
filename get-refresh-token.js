/**
 * Google OAuth2 Refresh Token取得スクリプト
 * 
 * 使い方:
 * 1. .envファイルにGOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETを設定
 * 2. node get-refresh-token.js を実行
 * 3. 表示されるURLにアクセスして認証
 * 4. リダイレクトされたURLのcodeパラメータをコピー
 * 5. ターミナルに貼り付けてEnter
 * 6. 表示されたRefresh Tokenを.envに追加
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

// 必要なスコープ
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/location.readonly' // Location History用
];

// 認証URLを生成
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // 必ずrefresh_tokenを取得
});

console.log('🔐 Google認証を開始します\n');
console.log('1. 以下のURLにアクセスしてください:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(authUrl);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('2. Googleアカウントで認証してください');
console.log('3. リダイレクトされたURL全体をコピーしてください');
console.log('   (例: http://localhost:3000/oauth2callback?code=xxxx&scope=xxxx)\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('認証後のURL全体を貼り付けてください: ', async (url) => {
  try {
    // URLからcodeパラメータを抽出
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');

    if (!code) {
      console.error('❌ codeパラメータが見つかりません');
      rl.close();
      return;
    }

    console.log('\n🔄 Refresh Tokenを取得中...\n');

    // codeをトークンに交換
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('✅ 認証成功！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('以下のRefresh Tokenを.envファイルに追加してください:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!tokens.refresh_token) {
      console.log('⚠️  Refresh Tokenが取得できませんでした');
      console.log('もう一度スクリプトを実行してください');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }

  rl.close();
});
