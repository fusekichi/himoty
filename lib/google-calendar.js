const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';

const TOKYO_TIME_ZONE = 'Asia/Tokyo';

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
    throw new Error(
      data.error_description || data.error || 'Googleアクセストークンの取得に失敗しました'
    );
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
      timeZone: TOKYO_TIME_ZONE,
      items: [{ id: config.calendarId }]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Google Calendar freeBusy の取得に失敗しました');
  }

  return data;
}

function getTokyoEndOfDay(baseDate = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TOKYO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(baseDate);

  const map = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  return new Date(`${map.year}-${map.month}-${map.day}T23:59:59.999+09:00`);
}

function mergeBusyIntervals(busy = []) {
  const normalized = busy
    .map((item) => ({
      start: new Date(item.start).getTime(),
      end: new Date(item.end).getTime()
    }))
    .filter((item) => !Number.isNaN(item.start) && !Number.isNaN(item.end))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const item of normalized) {
    if (!merged.length) {
      merged.push(item);
      continue;
    }

    const last = merged[merged.length - 1];
    if (item.start <= last.end) {
      last.end = Math.max(last.end, item.end);
    } else {
      merged.push(item);
    }
  }

  return merged;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function findNextAvailableStart({ busy = [], from, durationMinutes = 120, searchUntil }) {
  const slotMs = durationMinutes * 60 * 1000;
  const startAt = new Date(from).getTime();
  const endLimit = new Date(searchUntil).getTime();

  if (Number.isNaN(startAt) || Number.isNaN(endLimit) || endLimit <= startAt) {
    return null;
  }

  let cursor = startAt;

  for (const item of busy) {
    if (item.end <= cursor) continue;

    if (item.start - cursor >= slotMs) {
      return new Date(cursor);
    }

    if (item.start <= cursor) {
      cursor = Math.max(cursor, item.end);
    } else {
      cursor = item.end;
    }
  }

  if (endLimit - cursor >= slotMs) {
    return new Date(cursor);
  }

  return null;
}

function formatNextAvailableLabel(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: TOKYO_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  let hour = '0';
  let minute = '00';

  for (const part of parts) {
    if (part.type === 'hour') hour = part.value;
    if (part.type === 'minute') minute = part.value;
  }

  if (minute === '00') {
    return `${Number(hour)}時からヒマです`;
  }

  return `${Number(hour)}時${minute}分からヒマです`;
}

function serializeBusyIntervals(busy = []) {
  return busy.map((item) => ({
    start: new Date(item.start).toISOString(),
    end: new Date(item.end).toISOString()
  }));
}

async function checkHimoCallable({ durationMinutes = 120 } = {}) {
  const now = new Date();
  const immediateEnd = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const searchEnd = getTokyoEndOfDay(now);

  const data = await queryCalendarFreeBusy({
    timeMin: now.toISOString(),
    timeMax: searchEnd.toISOString()
  });

  const calendarId = ensureCalendarConfig().calendarId;
  const rawBusy =
    data?.calendars?.[calendarId]?.busy ||
    data?.calendars?.primary?.busy ||
    [];

  const mergedBusy = mergeBusyIntervals(rawBusy);

  const immediateBusy = mergedBusy.filter((item) =>
    rangesOverlap(item.start, item.end, now.getTime(), immediateEnd.getTime())
  );

  const available = immediateBusy.length === 0;

  const nextAvailableDate = available
    ? now
    : findNextAvailableStart({
        busy: mergedBusy,
        from: now,
        durationMinutes,
        searchUntil: searchEnd
      });

  return {
    available,
    durationMinutes,
    timeMin: now.toISOString(),
    timeMax: immediateEnd.toISOString(),
    checkedAt: new Date().toISOString(),
    calendarId,
    busy: serializeBusyIntervals(immediateBusy),
    nextAvailableAt: nextAvailableDate ? nextAvailableDate.toISOString() : null,
    nextAvailableLabel: available
      ? null
      : nextAvailableDate
        ? formatNextAvailableLabel(nextAvailableDate)
        : '今日はヒマな時間がなさそうです',
    searchTimeMax: searchEnd.toISOString()
  };
}

module.exports = {
  ensureCalendarConfig,
  checkHimoCallable
};
