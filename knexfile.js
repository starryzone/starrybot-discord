
const path = require("path");
const dbPath = path.join(__dirname, 'src/db.js');
const { myConfig } = require(dbPath);

const enableSSL = !['localhost', '127.0.0.1'].includes(myConfig.DB_HOSTIP);

// TODO: we can review the various environments below
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      user: myConfig.DB_USER,
      password: myConfig.DB_PASS,
      database: myConfig.DB_NAME,
      host: myConfig.DB_HOSTIP,
      port: myConfig.DB_HOSTPORT,
      ssl: enableSSL
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      user: myConfig.DB_USER,
      password: myConfig.DB_PASS,
      database: myConfig.DB_NAME,
      host: myConfig.DB_HOSTIP,
      port: myConfig.DB_HOSTPORT,
      ssl: enableSSL
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      user: myConfig.DB_USER,
      password: myConfig.DB_PASS,
      database: myConfig.DB_NAME,
      host: myConfig.DB_HOSTIP,
      port: myConfig.DB_HOSTPORT,
      ssl: enableSSL
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
