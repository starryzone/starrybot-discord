
const path = require("path");
const dbPath = path.join(__dirname, 'src/db.js');
const { myConfig } = require(dbPath);

const enableSSL = !['localhost', '127.0.0.1'].includes(myConfig.DB_HOSTIP);

// TODO: we can review the various environments below
module.exports = {

  production: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
