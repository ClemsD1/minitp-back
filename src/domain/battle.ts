import { Pokemon } from "./Pokemon.js";
import { Trainer } from "./Trainer.js";

export interface BattleResult {
  winner: Pokemon | null;
  turns: number;
}

export function selectRandomPokemon(trainer: Trainer, random: () => number = Math.random): Pokemon | null {
  const available = trainer.livingPokemon;
  if (available.length === 0) return null;
  const index = Math.min(Math.floor(random() * available.length), available.length - 1);
  return available[index];
}

export function selectStrongestPokemon(trainer: Trainer): Pokemon | null {
  return trainer.livingPokemon.reduce<Pokemon | null>(
    (strongest, pokemon) => (!strongest || pokemon.lifePoint > strongest.lifePoint ? pokemon : strongest),
    null
  );
}

export function fightPokemon(first: Pokemon, second: Pokemon, random: () => number = Math.random): BattleResult {
  let turns = 0;
  let current = first;
  let opponent = second;

  while (first.isAlive && second.isAlive) {
    if (current.availableAttacks.length > 0) {
      current.attack(opponent, random);
      turns += 1;
    }
    if (!opponent.isAlive) break;
    [current, opponent] = [opponent, current];
    if (first.availableAttacks.length === 0 && second.availableAttacks.length === 0) break;
  }

  const winner = first.lifePoint === second.lifePoint ? null : first.lifePoint > second.lifePoint
    ? first
    : second;
  return { winner, turns };
}

export function winnerOfBattle(result: BattleResult, first: Trainer, second: Trainer): Trainer | null {
  if (result.winner === null) return null;
  return result.winner.trainerId === first.id ? first : second;
}

export function compareTrainers(first: Trainer, second: Trainer): Trainer | null {
  if (first.level !== second.level) return first.level > second.level ? first : second;
  if (first.experience !== second.experience) return first.experience > second.experience ? first : second;
  return null;
}
