const { sql } = require('./db');

async function readHimoStation() {
  const rows = await sql`
    select
      id,
      station_name,
      source_type,
      latitude,
      longitude,
      updated_by,
      updated_at
    from himo_station_current
    where id = 1
    limit 1
  `;

  const row = rows[0];

  if (!row) {
    throw new Error('himo_station_current row not found');
  }

  return {
    stationName: row.station_name,
    sourceType: row.source_type,
    latitude: row.latitude,
    longitude: row.longitude,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

async function writeHimoStation({
  stationName,
  sourceType = 'manual',
  latitude = null,
  longitude = null,
  updatedBy = 'admin',
}) {
  const trimmed = String(stationName || '').trim();

  if (!trimmed) {
    throw new Error('stationName is required');
  }

  const currentRows = await sql`
    update himo_station_current
    set
      station_name = ${trimmed},
      source_type = ${sourceType},
      latitude = ${latitude},
      longitude = ${longitude},
      updated_by = ${updatedBy},
      updated_at = now()
    where id = 1
    returning
      id,
      station_name,
      source_type,
      latitude,
      longitude,
      updated_by,
      updated_at
  `;

  await sql`
    insert into himo_station_update_logs (
      station_name,
      source_type,
      latitude,
      longitude,
      updated_by
    )
    values (
      ${trimmed},
      ${sourceType},
      ${latitude},
      ${longitude},
      ${updatedBy}
    )
  `;

  const row = currentRows[0];

  return {
    stationName: row.station_name,
    sourceType: row.source_type,
    latitude: row.latitude,
    longitude: row.longitude,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  readHimoStation,
  writeHimoStation,
};
