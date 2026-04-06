const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';

function getCalendarConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary'
  };
}

function ensureCalendarConfig() {
  const config = getCalendarConfig();
  const missing = [];

  if (!config.clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!config.clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!config.refreshToken) missing.push('GOOGLE_REFRESH_TOKEN');

  if (missing.length) {
    throw new Error(`Google Calendar設定が不足しています: ${missing.join(', ')}`);
  }

  return config;
}

async function refreshGoogleAccessToken() {
  const config = ensureCalendarConfig();

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token'
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Googleアクセストークンの取得に失敗しました');
  }

  return data.access_token;
}

async function queryCalendarFreeBusy({ timeMin, timeMax }) {
  const accessToken = await refreshGoogleAccessToken();
  const config = ensureCalendarConfig();

  const response = await fetch(GOOGLE_FREEBUSY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: 'Asia/Tokyo',
      items: [{ id: config.calendarId }]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Google Calendar freeBusy の取得に失敗しました');
  }

  return data;
}

async function checkHimoCallable({ durationMinutes = 120 } = {}) {
  const now = new Date();
  const end = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const timeMin = now.toISOString();
  const timeMax = end.toISOString();
  const data = await queryCalendarFreeBusy({ timeMin, timeMax });
  const calendarId = ensureCalendarConfig().calendarId;
  const busy = data?.calendars?.[calendarId]?.busy || data?.calendars?.primary?.busy || [];
  const available = busy.length === 0;

  return {
    available,
    durationMinutes,
    timeMin,
    timeMax,
    checkedAt: new Date().toISOString(),
    calendarId,
    busy
  };
}

module.exports = {
  ensureCalendarConfig,
  checkHimoCallable
};
