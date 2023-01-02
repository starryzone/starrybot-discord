const path = require('path');
const dbPath = path.join(__dirname, '../lib/starrybot/db.js');
const { myConfig } = require(dbPath);

exports.up = function (knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_MEMBERS, function (table) {
    table.string('cosmos_address');
  });
};

exports.down = function (knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_MEMBERS, function (table) {
    table.dropColumn('cosmos_address');
  });
};
