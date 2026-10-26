import { Attack } from "./Attack.js";

export interface PokemonData {
  id: number;
  trainerId: number;
  name: string;
  lifePoint: number;
  maxLifePoint: number;
  attacks?: Attack[];
}

export class Pokemon {
  readonly id: number;
  readonly trainerId: number;
  readonly name: string;
  readonly maxLifePoint: number;
  lifePoint: number;
  readonly attacks: Attack[];

  constructor(data: PokemonData) {
    this.id = data.id;
    this.trainerId = data.trainerId;
    this.name = data.name;
    this.lifePoint = data.lifePoint;
    this.maxLifePoint = data.maxLifePoint;
    this.attacks = data.attacks ?? [];
  }

  learnAttack(attack: Attack): void {
    if (this.attacks.length >= 4) {
      throw new Error("Un Pokémon ne peut pas apprendre plus de 4 attaques.");
    }
    if (this.attacks.some((knownAttack) => knownAttack.name.toLowerCase() === attack.name.toLowerCase())) {
      throw new Error("Ce Pokémon connaît déjà cette attaque.");
    }
    this.attacks.push(attack);
  }

  heal(): void {
    this.lifePoint = this.maxLifePoint;
    this.attacks.forEach((attack) => attack.reset());
  }

  get isAlive(): boolean {
    return this.lifePoint > 0;
  }

  get availableAttacks(): Attack[] {
    return this.attacks.filter((attack) => attack.isAvailable);
  }

  attack(target: Pokemon, random: () => number = Math.random): Attack | null {
    const available = this.availableAttacks;
    if (!this.isAlive || !target.isAlive || available.length === 0) {
      return null;
    }
    const index = Math.min(Math.floor(random() * available.length), available.length - 1);
    const selectedAttack = available[index];
    selectedAttack.use();
    target.takeDamage(selectedAttack.damage);
    return selectedAttack;
  }

  takeDamage(damage: number): void {
    this.lifePoint = Math.max(0, this.lifePoint - damage);
  }
}
