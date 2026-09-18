import { Sequelize } from "sequelize";
import { appConfig } from "./config.js";

const sequelize = new Sequelize(
  appConfig.database.name,
  appConfig.database.user,
  appConfig.database.password,
  {
    dialect: "postgres",
    host: appConfig.database.host,
    port: appConfig.database.port,
    logging: false,
  }
);

export default sequelize;
