const postgres = require('postgres');

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'Postgres connection string is missing. Set POSTGRES_URL or POSTGRES_PRISMA_URL or DATABASE_URL.'
  );
}

const sql = postgres(connectionString, {
  ssl: 'require',
});

module.exports = { sql };
