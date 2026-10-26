import "dotenv/config";
import { app } from "./app.js";
import { initializeDatabase } from "./db/schema.js";
import { pool } from "./db/pool.js";

const port = Number(process.env.PORT ?? 3000);

initializeDatabase()
  .then(() => {
    app.listen(port, () => console.log(`API Pokémon disponible sur le port ${port}.`));
  })
  .catch(async (error: unknown) => {
    console.error("Impossible d'initialiser la base de données :", error);
    await pool.end();
    process.exitCode = 1;
  });
