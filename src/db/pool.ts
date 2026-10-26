import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/pokemon"
});

pool.on("error", (error) => {
  console.error("Erreur inattendue de la connexion PostgreSQL :", error);
});
