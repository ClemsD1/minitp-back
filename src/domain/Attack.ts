export interface AttackData {
  id?: number;
  name: string;
  damage: number;
  usageLimit: number;
  usageCount?: number;
}

export class Attack {
  readonly id?: number;
  readonly name: string;
  readonly damage: number;
  readonly usageLimit: number;
  usageCount: number;

  constructor(data: AttackData) {
    this.id = data.id;
    this.name = data.name;
    this.damage = data.damage;
    this.usageLimit = data.usageLimit;
    this.usageCount = data.usageCount ?? 0;
  }

  get isAvailable(): boolean {
    return this.usageCount < this.usageLimit;
  }

  use(): void {
    if (!this.isAvailable) {
      throw new Error(`L'attaque ${this.name} n'a plus d'utilisations disponibles.`);
    }
    this.usageCount += 1;
  }

  reset(): void {
    this.usageCount = 0;
  }

  toString(): string {
    return `${this.name} — dégâts : ${this.damage}, utilisations : ${this.usageCount}/${this.usageLimit}`;
  }
}
