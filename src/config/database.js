require('dotenv').config();
const sql = require('mssql');

const userDBConfig = {
  user: process.env.USER_DB_USER || 'testuser',
  password: process.env.USER_DB_PASSWORD || '1234',
  server: process.env.USER_DB_SERVER || 'localhost',
  database: process.env.USER_DB_NAME || 'UserDB',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const tenantDBConfig = {
  user: process.env.TENANT_DB_USER || 'testuser',
  password: process.env.TENANT_DB_PASSWORD || '1234',
  server: process.env.TENANT_DB_SERVER || 'localhost',
  database: process.env.TENANT_DB_NAME || 'TenantDB',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let userDBPool;
let tenantDBPool;

const initializeDatabase = async () => {
  try {
    userDBPool = new sql.ConnectionPool(userDBConfig);
    tenantDBPool = new sql.ConnectionPool(tenantDBConfig);
    await userDBPool.connect();
    await tenantDBPool.connect();
    console.log('Tenant Portal database pools initialized successfully');
    return { userDBPool, tenantDBPool };
  } catch (err) {
    console.error('Error initializing database pools:', err);
    process.exit(1);
  }
};

const getUserDBPool = () => {
  if (!userDBPool) {
    throw new Error('User Database not initialized. Call initializeDatabase first.');
  }
  return userDBPool;
};

const getTenantDBPool = () => {
  if (!tenantDBPool) {
    throw new Error('Tenant Database not initialized. Call initializeDatabase first.');
  }
  return tenantDBPool;
};

const closeDatabases = async () => {
  if (userDBPool) {
    await userDBPool.close();
    console.log('User database connection closed');
  }
  if (tenantDBPool) {
    await tenantDBPool.close();
    console.log('Tenant database connection closed');
  }
};

module.exports = {
  initializeDatabase,
  getUserDBPool,
  getTenantDBPool,
  closeDatabases,
  sql
};
