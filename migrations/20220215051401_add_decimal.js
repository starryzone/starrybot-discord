const path = require("path");
const dbPath = path.join(__dirname, '../src/db.js');
const { myConfig } = require(dbPath);

exports.up = function(knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_ROLES, function(table) {
    table.integer('decimals').defaultTo(6);
  });
};

exports.down = function(knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_ROLES, function(table) {
    table.dropColumn('decimals');
  });
};
