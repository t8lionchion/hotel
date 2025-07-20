require('dotenv').config();

const config = {
  database: {
    host: process.env.DB_HOST || 'fs101.coded2.fun',
    user: process.env.DB_USER || 'Bun',
    password: process.env.DB_PASSWORD || 'fs101',
    database: process.env.DB_NAME || 'shop1',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  server: {
    port: process.env.PORT || 3000
  }
};

module.exports = config; 