import type { PoolClient } from "pg";
import { Attack } from "../domain/Attack.js";
import { Pokemon } from "../domain/Pokemon.js";
import { Trainer } from "../domain/Trainer.js";

type TrainerRow = { id: number; name: string; level: number; experience: number };
type PokemonRow = {
  id: number; trainer_id: number; name: string; life_point: number; max_life_point: number;
};
type AttackRow = {
  id: number; pokemon_id: number; name: string; damage: number; usage_limit: number; usage_count: number;
};

export async function loadTrainer(client: PoolClient, trainerId: number): Promise<Trainer | null> {
  const trainerResult = await client.query<TrainerRow>(
    "SELECT id, name, level, experience FROM trainers WHERE id = $1",
    [trainerId]
  );
  const row = trainerResult.rows[0];
  if (!row) return null;

  const pokemonResult = await client.query<PokemonRow>(
    "SELECT id, trainer_id, name, life_point, max_life_point FROM pokemon WHERE trainer_id = $1 ORDER BY id",
    [trainerId]
  );
  const pokemonIds = pokemonResult.rows.map((pokemon) => pokemon.id);
  const attackRows = pokemonIds.length === 0
    ? []
    : (await client.query<AttackRow>(
      "SELECT id, pokemon_id, name, damage, usage_limit, usage_count FROM attacks WHERE pokemon_id = ANY($1::int[]) ORDER BY id",
      [pokemonIds]
    )).rows;
  const attacksByPokemon = new Map<number, Attack[]>();
  for (const attack of attackRows) {
    const list = attacksByPokemon.get(attack.pokemon_id) ?? [];
    list.push(new Attack({
      id: attack.id,
      name: attack.name,
      damage: attack.damage,
      usageLimit: attack.usage_limit,
      usageCount: attack.usage_count
    }));
    attacksByPokemon.set(attack.pokemon_id, list);
  }
  const pokemon = pokemonResult.rows.map((item) => new Pokemon({
    id: item.id,
    trainerId: item.trainer_id,
    name: item.name,
    lifePoint: item.life_point,
    maxLifePoint: item.max_life_point,
    attacks: attacksByPokemon.get(item.id) ?? []
  }));
  return new Trainer({ ...row, pokemon });
}

export async function loadPokemon(client: PoolClient, pokemonId: number): Promise<Pokemon | null> {
  const result = await client.query<PokemonRow>(
    "SELECT id, trainer_id, name, life_point, max_life_point FROM pokemon WHERE id = $1",
    [pokemonId]
  );
  const row = result.rows[0];
  if (!row) return null;
  const attacks = await client.query<AttackRow>(
    "SELECT id, pokemon_id, name, damage, usage_limit, usage_count FROM attacks WHERE pokemon_id = $1 ORDER BY id",
    [pokemonId]
  );
  return new Pokemon({
    id: row.id,
    trainerId: row.trainer_id,
    name: row.name,
    lifePoint: row.life_point,
    maxLifePoint: row.max_life_point,
    attacks: attacks.rows.map((attack) => new Attack({
      id: attack.id,
      name: attack.name,
      damage: attack.damage,
      usageLimit: attack.usage_limit,
      usageCount: attack.usage_count
    }))
  });
}

export async function saveTrainer(client: PoolClient, trainer: Trainer): Promise<void> {
  await client.query("UPDATE trainers SET level = $2, experience = $3 WHERE id = $1", [
    trainer.id, trainer.level, trainer.experience
  ]);
  for (const pokemon of trainer.pokemon) {
    await client.query("UPDATE pokemon SET life_point = $2 WHERE id = $1", [pokemon.id, pokemon.lifePoint]);
    for (const attack of pokemon.attacks) {
      if (attack.id !== undefined) {
        await client.query("UPDATE attacks SET usage_count = $2 WHERE id = $1", [attack.id, attack.usageCount]);
      }
    }
  }
}

export function serializePokemon(pokemon: Pokemon) {
  return {
    id: pokemon.id,
    trainerId: pokemon.trainerId,
    name: pokemon.name,
    lifePoint: pokemon.lifePoint,
    maxLifePoint: pokemon.maxLifePoint,
    attacks: pokemon.attacks.map((attack) => ({
      id: attack.id,
      name: attack.name,
      damage: attack.damage,
      usageLimit: attack.usageLimit,
      usageCount: attack.usageCount,
      available: attack.isAvailable,
      information: attack.toString()
    }))
  };
}

export function serializeTrainer(trainer: Trainer) {
  return {
    id: trainer.id,
    name: trainer.name,
    level: trainer.level,
    experience: trainer.experience,
    pokemon: trainer.pokemon.map(serializePokemon)
  };
}
