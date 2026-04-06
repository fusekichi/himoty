const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE_PATH = path.join(DATA_DIR, 'himo-station.json');

function getDefaultData() {
  return {
    stationName: process.env.HIMO_DESTINATION_STATION || '恵比寿駅',
    updatedAt: null
  };
}

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_FILE_PATH);
  } catch {
    await fs.writeFile(
      STORE_FILE_PATH,
      JSON.stringify(getDefaultData(), null, 2),
      'utf8'
    );
  }
}

async function readHimoStation() {
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(STORE_FILE_PATH, 'utf8');
    const data = JSON.parse(raw);
    const stationName = String(data.stationName || '').trim() || getDefaultData().stationName;

    return {
      stationName,
      updatedAt: data.updatedAt || null
    };
  } catch {
    const fallback = getDefaultData();
    await fs.writeFile(STORE_FILE_PATH, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

async function writeHimoStation(stationName) {
  await ensureStoreFile();

  const next = {
    stationName: String(stationName || '').trim(),
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(STORE_FILE_PATH, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

module.exports = {
  STORE_FILE_PATH,
  readHimoStation,
  writeHimoStation
};
