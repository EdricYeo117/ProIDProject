// src/service/db.service.js
const oracledb = require('oracledb');

// Return CLOBs as strings instead of LOB streams
oracledb.fetchAsString = [oracledb.CLOB];

// Default outFormat for all connections
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

async function initPool() {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
    queueTimeout: 120000,
  });

  return pool;
}

async function execute(sql, binds = {}, options = {}) {
  if (!pool) await initPool();
  let conn;

  try {
    conn = await pool.getConnection();

    // Default: autoCommit ON for simple web-style operations.
    const execOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,        // <<< changed from false
      ...options,              // allow per-call override
    };

    return await conn.execute(sql, binds, execOptions);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // ignore close errors
      }
    }
  }
}

// For rare cases where you want manual transaction control:
async function getConnection() {
  if (!pool) await initPool();
  // You can do conn.execute(..., { autoCommit: false }) and commit/rollback manually.
  return pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(5);
    pool = null;
  }
}

module.exports = { initPool, execute, closePool, getConnection };
