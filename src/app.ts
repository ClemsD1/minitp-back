import express from "express";
import { pool } from "./db/pool.js";
import { loadPokemon, loadTrainer, saveTrainer, serializePokemon, serializeTrainer } from "./db/repositories.js";
import { ApiError, errorHandler } from "./http/errors.js";
import { nonEmptyString, positiveInteger } from "./http/validation.js";
import { Attack } from "./domain/Attack.js";
import { Pokemon } from "./domain/Pokemon.js";
import {
  compareTrainers,
  fightPokemon,
  selectRandomPokemon,
  selectStrongestPokemon,
  winnerOfBattle
} from "./domain/battle.js";

export const app = express();
app.use(express.json());

app.get("/health", async (_request, response) => {
  await pool.query("SELECT 1");
  response.json({ status: "ok" });
});

app.get("/api/trainers", async (_request, response) => {
  const result = await pool.query("SELECT id, name, level, experience FROM trainers ORDER BY id");
  response.json(result.rows);
});

app.post("/api/trainers", async (request, response) => {
  const name = nonEmptyString(request.body?.name, "name");
  const result = await pool.query(
    "INSERT INTO trainers (name) VALUES ($1) RETURNING id, name, level, experience",
    [name]
  );
  response.status(201).json({ ...result.rows[0], pokemon: [] });
});

app.get("/api/trainers/:id", async (request, response) => {
  const trainerId = positiveInteger(request.params.id, "id");
  const client = await pool.connect();
  try {
    const trainer = await loadTrainer(client, trainerId);
    if (!trainer) throw new ApiError(404, "Dresseur introuvable.");
    response.json(serializeTrainer(trainer));
  } finally {
    client.release();
  }
});

app.post("/api/trainers/:id/pokemon", async (request, response) => {
  const trainerId = positiveInteger(request.params.id, "id");
  const name = nonEmptyString(request.body?.name, "name");
  const lifePoint = positiveInteger(request.body?.lifePoint, "lifePoint");
  const trainer = await pool.query("SELECT id FROM trainers WHERE id = $1", [trainerId]);
  if (!trainer.rows[0]) throw new ApiError(404, "Dresseur introuvable.");
  const result = await pool.query(
    "INSERT INTO pokemon (trainer_id, name, life_point, max_life_point) VALUES ($1, $2, $3, $3) RETURNING id, trainer_id, name, life_point, max_life_point",
    [trainerId, name, lifePoint]
  );
  response.status(201).json(serializePokemon(new Pokemon({
    id: result.rows[0].id,
    trainerId: result.rows[0].trainer_id,
    name: result.rows[0].name,
    lifePoint: result.rows[0].life_point,
    maxLifePoint: result.rows[0].max_life_point,
    attacks: []
  })));
});

app.get("/api/pokemon/:id", async (request, response) => {
  const client = await pool.connect();
  try {
    const pokemon = await loadPokemon(client, positiveInteger(request.params.id, "id"));
    if (!pokemon) throw new ApiError(404, "Pokémon introuvable.");
    response.json(serializePokemon(pokemon));
  } finally {
    client.release();
  }
});

app.post("/api/pokemon/:id/attacks", async (request, response) => {
  const pokemonId = positiveInteger(request.params.id, "id");
  const name = nonEmptyString(request.body?.name, "name");
  const damage = positiveInteger(request.body?.damage, "damage");
  const usageLimit = positiveInteger(request.body?.usageLimit, "usageLimit");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM pokemon WHERE id = $1 FOR UPDATE", [pokemonId]);
    const pokemon = await loadPokemon(client, pokemonId);
    if (!pokemon) throw new ApiError(404, "Pokémon introuvable.");
    const attack = new Attack({ name, damage, usageLimit });
    pokemon.learnAttack(attack);
    const inserted = await client.query(
      "INSERT INTO attacks (pokemon_id, name, damage, usage_limit) VALUES ($1, $2, $3, $4) RETURNING id",
      [pokemonId, name, damage, usageLimit]
    );
    await client.query("COMMIT");
    response.status(201).json({
      id: inserted.rows[0].id, name, damage, usageLimit, usageCount: 0, available: true,
      information: attack.toString()
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

app.post("/api/pokemon/:id/heal", async (request, response) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pokemonId = positiveInteger(request.params.id, "id");
    await client.query("SELECT id FROM pokemon WHERE id = $1 FOR UPDATE", [pokemonId]);
    const pokemon = await loadPokemon(client, pokemonId);
    if (!pokemon) throw new ApiError(404, "Pokémon introuvable.");
    pokemon.heal();
    await client.query("UPDATE pokemon SET life_point = $2 WHERE id = $1", [pokemon.id, pokemon.lifePoint]);
    await client.query("UPDATE attacks SET usage_count = 0 WHERE pokemon_id = $1", [pokemon.id]);
    await client.query("COMMIT");
    response.json(serializePokemon(pokemon));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

app.post("/api/trainers/:id/heal", async (request, response) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const trainerId = positiveInteger(request.params.id, "id");
    await client.query("SELECT id FROM trainers WHERE id = $1 FOR UPDATE", [trainerId]);
    const trainer = await loadTrainer(client, trainerId);
    if (!trainer) throw new ApiError(404, "Dresseur introuvable.");
    trainer.healAtTavern();
    await saveTrainer(client, trainer);
    await client.query("COMMIT");
    response.json(serializeTrainer(trainer));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

app.post("/api/pokemon/:id/attack/:targetId", async (request, response) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const attackerId = positiveInteger(request.params.id, "id");
    const targetId = positiveInteger(request.params.targetId, "targetId");
    if (attackerId === targetId) throw new ApiError(400, "Un Pokémon ne peut pas s'attaquer lui-même.");
    await client.query("SELECT id FROM pokemon WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE", [
      [attackerId, targetId].sort((first, second) => first - second)
    ]);
    const attacker = await loadPokemon(client, attackerId);
    const target = await loadPokemon(client, targetId);
    if (!attacker || !target) throw new ApiError(404, "Pokémon attaquant ou cible introuvable.");
    const attack = attacker.attack(target);
    if (!attack) throw new ApiError(409, "Aucune attaque disponible ou Pokémon déjà KO.");
    await client.query("UPDATE pokemon SET life_point = $2 WHERE id = $1", [target.id, target.lifePoint]);
    await client.query("UPDATE attacks SET usage_count = $2 WHERE id = $1", [attack.id, attack.usageCount]);
    await client.query("COMMIT");
    response.json({ attack: attack.toString(), attacker: serializePokemon(attacker), target: serializePokemon(target) });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

async function runBattle(request: express.Request, response: express.Response, deterministic: boolean, arena: boolean) {
  const firstId = positiveInteger(request.body?.trainer1Id, "trainer1Id");
  const secondId = positiveInteger(request.body?.trainer2Id, "trainer2Id");
  if (firstId === secondId) throw new ApiError(400, "Les deux dresseurs doivent être différents.");
  const battleCount = arena ? 100 : 1;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM trainers WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE", [
      [firstId, secondId].sort((first, second) => first - second)
    ]);
    const first = await loadTrainer(client, firstId);
    const second = await loadTrainer(client, secondId);
    if (!first || !second) throw new ApiError(404, "Un ou plusieurs dresseurs sont introuvables.");
    const results: Array<{ winnerId: number | null; turns: number }> = [];

    if (!deterministic) {
      for (let index = 0; index < battleCount; index += 1) {
        first.healAtTavern();
        second.healAtTavern();
        const firstPokemon = selectRandomPokemon(first);
        const secondPokemon = selectRandomPokemon(second);
        if (!firstPokemon || !secondPokemon) break;
        const battle = fightPokemon(firstPokemon, secondPokemon);
        const winner = winnerOfBattle(battle, first, second);
        winner?.gainExperience();
        results.push({ winnerId: winner?.id ?? null, turns: battle.turns });
      }
    } else {
      for (let index = 0; index < battleCount; index += 1) {
        const firstPokemon = selectStrongestPokemon(first);
        const secondPokemon = selectStrongestPokemon(second);
        if (!firstPokemon || !secondPokemon) break;
        const battle = fightPokemon(firstPokemon, secondPokemon);
        const winner = winnerOfBattle(battle, first, second);
        winner?.gainExperience();
        results.push({ winnerId: winner?.id ?? null, turns: battle.turns });
      }
    }

    await saveTrainer(client, first);
    await saveTrainer(client, second);
    await client.query("COMMIT");
    const winner = arena && !deterministic ? compareTrainers(first, second) : null;
    response.json({
      mode: arena ? (deterministic ? "arena-2" : "arena-1") : (deterministic ? "deterministic" : "random"),
      battles: results.length,
      results,
      arenaWinnerId: winner?.id ?? null,
      trainers: [serializeTrainer(first), serializeTrainer(second)]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

app.post("/api/battles/random", (request, response) => runBattle(request, response, false, false));
app.post("/api/battles/deterministic", (request, response) => runBattle(request, response, true, false));
app.post("/api/arenas/1", (request, response) => runBattle(request, response, false, true));
app.post("/api/arenas/2", (request, response) => runBattle(request, response, true, true));

app.use((_request, _response, next) => next(new ApiError(404, "Route introuvable.")));
app.use(errorHandler);
