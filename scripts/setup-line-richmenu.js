// scripts/setup-line-richmenu.js
const fs = require('fs');
const path = require('path');

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LIFF_ID_STATUS = process.env.LIFF_ID_STATUS;
const LIFF_ID_CALL = process.env.LIFF_ID_CALL;
const BOOKRUN_URL = process.env.BOOKRUN_URL;
const RICH_MENU_IMAGE_PATH =
  process.env.RICH_MENU_IMAGE_PATH ||
  path.join(__dirname, '../public/line-richmenu-2500x1686.png');

function required(name, value) {
  if (!value) {
    throw new Error(`${name} が未設定です`);
  }
}

function liffUrl(liffId) {
  return `https://liff.line.me/${liffId}`;
}

async function lineApi(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE API error ${res.status}: ${text}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

function buildRichMenuObject() {
  return {
    size: {
      width: 2500,
      height: 1686,
    },
    selected: false,
    name: 'himoty-main-richmenu-v2',
    chatBarText: 'ヒモティーをひらく',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 834, height: 843 },
        action: {
          type: 'uri',
          label: 'ヒモがヒマか確認',
          uri: liffUrl(LIFF_ID_STATUS),
        },
      },
      {
        bounds: { x: 834, y: 0, width: 833, height: 843 },
        action: {
          type: 'uri',
          label: 'すぐにヒモを呼ぶ',
          uri: liffUrl(LIFF_ID_CALL),
        },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: {
          type: 'uri',
          label: 'ヒモを予約する',
          uri: BOOKRUN_URL,
        },
      },
      {
        bounds: { x: 0, y: 843, width: 834, height: 843 },
        action: {
          type: 'postback',
          label: 'ヒモザップ',
          data: 'action=himozap_coming_soon',
          displayText: 'ヒモザップ',
        },
      },
      {
        bounds: { x: 834, y: 843, width: 833, height: 843 },
        action: {
          type: 'postback',
          label: 'ヒモに連絡を取る',
          data: 'action=contact_himo',
          displayText: 'ヒモに連絡を取る',
          inputOption: 'closeRichMenu',
        },
      },
      {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: {
          type: 'postback',
          label: 'ヒモティってなに？',
          data: 'action=about_himoty',
          displayText: 'ヒモティってなに？',
        },
      },
    ],
  };
}

async function createRichMenu(richMenuObject) {
  const result = await lineApi('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(richMenuObject),
  });

  return result.richMenuId;
}

async function uploadRichMenuImage(richMenuId, filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.jpg' || ext === '.jpeg'
    ? 'image/jpeg'
    : 'image/png';

  await lineApi(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
    },
    body: imageBuffer,
  });
}

async function setDefaultRichMenu(richMenuId) {
  await lineApi(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
  });
}

async function main() {
  required('LINE_CHANNEL_ACCESS_TOKEN', CHANNEL_ACCESS_TOKEN);
  required('LIFF_ID_CALL', LIFF_ID_CALL);

  if (!fs.existsSync(RICH_MENU_IMAGE_PATH)) {
    throw new Error(`画像ファイルが見つかりません: ${RICH_MENU_IMAGE_PATH}`);
  }

  const richMenuObject = buildRichMenuObject();
  const richMenuId = await createRichMenu(richMenuObject);
  await uploadRichMenuImage(richMenuId, RICH_MENU_IMAGE_PATH);
  await setDefaultRichMenu(richMenuId);

  console.log('✅ Rich menu 作成完了');
  console.log('richMenuId =', richMenuId);
}

main().catch((err) => {
  console.error('❌ Rich menu 作成失敗');
  console.error(err);
  process.exit(1);
});
