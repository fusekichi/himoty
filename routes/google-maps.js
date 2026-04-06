const express = require('express');

const router = express.Router();

router.post('/nearest-station', async (req, res) => {
  try {
    ensureGoogleMapsApiKey();

    const { latitude, longitude } = req.body;
    if (!isNumber(latitude) || !isNumber(longitude)) {
      return res.status(400).json({ error: 'latitude / longitude を数値で送ってください' });
    }

    const station = await findNearestStation(latitude, longitude);
    return res.json({ ok: true, station });
  } catch (error) {
    console.error('Google nearest station error:', error);
    return res.status(500).json({
      error: '最寄り駅の取得に失敗しました',
      detail: error.message
    });
  }
});

async function findNearestStation(latitude, longitude) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress'
    },
    body: JSON.stringify({
      includedTypes: ['train_station', 'subway_station', 'transit_station'],
      maxResultCount: 10,
      languageCode: 'ja',
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 3000
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Places API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const places = data.places || [];
  if (!places.length) {
    throw new Error('近くの駅が見つかりませんでした');
  }

  const stations = places
    .filter(place => place.location)
    .map(place => ({
      name: normalizeStationName(place.displayName?.text || '駅名不明'),
      address: place.formattedAddress || '',
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      distanceMeters: Math.round(
        haversineDistance(
          latitude,
          longitude,
          place.location.latitude,
          place.location.longitude
        )
      )
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return stations[0];
}

function normalizeStationName(name) {
  const value = String(name || '').trim();
  return value.endsWith('駅') ? value : `${value}駅`;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value);
}

function ensureGoogleMapsApiKey() {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY が未設定です');
  }
}

module.exports = router;
