const path = require("path");
const dbPath = path.join(__dirname, '../src/db.js');
const { myConfig } = require(dbPath);

exports.up = function(knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_ROLES, function(table) {
    table.dropColumn('discord_role_id')
  })
};

exports.down = function(knex) {
  return knex.schema.table(myConfig.DB_TABLENAME_ROLES, function(table) {
    table.string('discord_role_id').notNullable()
  })
};
