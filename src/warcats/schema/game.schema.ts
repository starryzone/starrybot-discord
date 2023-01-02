import { Schema } from 'mongoose';
import { Building, Game as GameBase, GameEntity, Unit } from 'warcats-common';

export interface IPlayer {
  wallet: string;
  team: string;
}

const mapPositionSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

const playerSchema = new Schema({
  wallet: { type: String, required: true },
  team: { type: String, required: true },
  warcatTokenId: { type: Number, required: true },
  gold: { type: Number, required: true },
});

const buildingSchema = new Schema({
  health: {
    type: Number,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  position: {
    type: mapPositionSchema,
    required: true,
  },
  didSpawn: {
    type: Boolean,
    required: true,
  },
});

buildingSchema.loadClass(Building);

const unitSchema = new Schema({
  path: {
    type: String,
    required: true,
  },
  position: {
    type: mapPositionSchema,
    required: true,
  },
  didMove: {
    type: Boolean,
    required: true,
  },
  fuel: {
    type: Number,
    required: true,
  },
  health: {
    type: Number,
    required: true,
  },
});

unitSchema.loadClass(Unit);
unitSchema.loadClass(GameEntity);

export const gameSchema = new Schema({
  gameOver: { type: Boolean, required: true },
  turn: { type: String, required: true },
  player1: { type: playerSchema, required: true },
  player2: { type: playerSchema, required: true },
  units: { type: [unitSchema], required: true },
  buildings: { type: [buildingSchema], required: true },
});

gameSchema.loadClass(GameBase);
