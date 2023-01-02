const path = require('path');
const dbPath = path.join(__dirname, '../lib/starrybot/db.js');
const { myConfig } = require(dbPath);

exports.up = function (knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_ROLES, function (table) {
    table.string('network').defaultTo('mainnet');
    table.boolean('remove_in_cleanup');
  });
};

exports.down = function (knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_ROLES, function (table) {
    table.dropColumn('network');
    table.dropColumn('remove_in_cleanup');
  });
};
