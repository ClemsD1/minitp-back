import { Pokemon } from "./Pokemon.js";

export interface TrainerData {
  id: number;
  name: string;
  level: number;
  experience: number;
  pokemon?: Pokemon[];
}

export class Trainer {
  readonly id: number;
  readonly name: string;
  level: number;
  experience: number;
  readonly pokemon: Pokemon[];

  constructor(data: TrainerData) {
    this.id = data.id;
    this.name = data.name;
    this.level = data.level;
    this.experience = data.experience;
    this.pokemon = data.pokemon ?? [];
  }

  addPokemon(pokemon: Pokemon): void {
    if (pokemon.trainerId !== this.id) {
      throw new Error("Ce Pokémon appartient à un autre dresseur.");
    }
    this.pokemon.push(pokemon);
  }

  healAtTavern(): void {
    this.pokemon.forEach((pokemon) => pokemon.heal());
  }

  gainExperience(amount = 1): void {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error("Le gain d'expérience doit être un entier positif ou nul.");
    }
    this.experience += amount;
    while (this.experience >= 10) {
      this.experience -= 10;
      this.level += 1;
    }
  }

  get livingPokemon(): Pokemon[] {
    return this.pokemon.filter((pokemon) => pokemon.isAlive);
  }
}
