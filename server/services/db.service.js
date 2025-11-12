// src/service/db.service.js
const oracledb = require('oracledb');
// Return CLOBs as strings instead of LOB streams
oracledb.fetchAsString = [ oracledb.CLOB ];
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
let pool;

async function initPool() {
  if (pool) return pool;

  // return rows as objects
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
    queueTimeout: 120000
  });

  return pool;
}

async function execute(sql, binds = {}, options = {}) {
  if (!pool) await initPool();
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: false,
      ...options
    });
  } finally {
    try { if (conn) await conn.close(); } catch {}
  }
}

async function getConnection() {
  if (!pool) await initPool();
  return pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(5);
    pool = null;
  }
}

module.exports = { initPool, execute, closePool, getConnection };