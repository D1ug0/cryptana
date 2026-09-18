import sequelize from "../db.js";
import { Algorithm } from "../models/models.js";

try {
  await sequelize.authenticate();
  await sequelize.sync();
  const [, created] = await Algorithm.findOrCreate({
    where: { id: 2 },
    defaults: { id: 2, status: false, name: "ожидание" },
  });
  await Algorithm.update({ status: false }, { where: { id: 2 } });

  console.log(
    `Database is ready. Algorithm state row ${created ? "created" : "already exists"}.`
  );
} catch (error) {
  console.error("Database initialization failed:", error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
