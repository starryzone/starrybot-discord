const path = require("path");
const dbPath = path.join(__dirname, '../src/db.js');
const { myConfig } = require(dbPath);

exports.up = async function(knex) {
  return knex.schema
    .createTable(myConfig.DB_TABLENAME_PUBLIC_STATS, function (table) {
      table.string('blockchain_prefix').notNullable()
      table.string('token_type').notNullable()
      table.string('network').notNullable()
      table.integer('total_native').defaultTo(0)
      table.integer('total_fungible').defaultTo(0)
      table.integer('total_nonfungible').defaultTo(0)
    })
};

exports.down = function(knex) {
  return knex.schema
    .dropTable(myConfig.DB_TABLENAME_PUBLIC_STATS)
};
