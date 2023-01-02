const path = require('path');
const dbPath = path.join(__dirname, '../lib/starrybot/db.js');
const { myConfig } = require(dbPath);

exports.up = function (knex) {
  return knex.schema
    .createTable(myConfig.DB_TABLENAME_SYNC, function (table) {
      table.string('discord_guild_id').notNullable();
      table.primary(['discord_guild_id']);
      table.timestamp('began_update');
      table.timestamp('finished_update');
      table.bigInteger('times_updated').defaultTo(0);
    })
    .createTable(myConfig.DB_TABLENAME_SYNC_LOGS, function (table) {
      table.increments('lid');
      table.string('discord_guild_id').notNullable();
      table.integer('members_updated').notNullable();
      table.timestamp('completed_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(myConfig.DB_TABLENAME_SYNC);
};
