import { DataTypes } from "sequelize";
import sequelize from "../db.js";

export const Ticker = sequelize.define("ticker", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  contract: { type: DataTypes.STRING, primaryKey: true },
  timestamp: { type: DataTypes.DATE },
  released: { type: DataTypes.DATE },
  whales: { type: DataTypes.INTEGER },
});

export const Whale = sequelize.define("whale", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  address: { type: DataTypes.STRING },
  timestamp: { type: DataTypes.DATE },
  winRate: { type: DataTypes.FLOAT, defaultValue: 0 },
});

export const Algorithm = sequelize.define("algorithm", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status: { type: DataTypes.BOOLEAN },
  name: { type: DataTypes.STRING },
  tokens: { type: DataTypes.INTEGER },
  checkedTokens: { type: DataTypes.INTEGER },
  checkedGoodX: { type: DataTypes.INTEGER },
  goodX: { type: DataTypes.INTEGER },
  contract: { type: DataTypes.STRING },
  symbol: { type: DataTypes.STRING },
  good: { type: DataTypes.INTEGER },
  newGood: { type: DataTypes.INTEGER },
  newGoodAddresses: { type: DataTypes.TEXT },
  deleted: { type: DataTypes.INTEGER },
});

export const ApiKey = sequelize.define("keys", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  key: { type: DataTypes.STRING },
  status: { type: DataTypes.BOOLEAN },
});