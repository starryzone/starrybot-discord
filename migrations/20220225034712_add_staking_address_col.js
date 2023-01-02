const path = require('path');
const dbPath = path.join(__dirname, '../lib/starrybot/db.js');
const { myConfig } = require(dbPath);

exports.up = function (knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_ROLES, function (table) {
    table.string('staking_contract');
  });
};

exports.down = function (knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_ROLES, function (table) {
    table.dropColumn('staking_contract');
  });
};
