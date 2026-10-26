import assert from "node:assert/strict";
import test from "node:test";
import { Attack } from "./Attack.js";
import { Pokemon } from "./Pokemon.js";
import { Trainer } from "./Trainer.js";

test("a Pokémon can learn at most four unique attacks", () => {
  const pokemon = new Pokemon({ id: 1, trainerId: 1, name: "Pikachu", lifePoint: 20, maxLifePoint: 20 });
  for (let index = 1; index <= 4; index += 1) {
    pokemon.learnAttack(new Attack({ name: `Attaque ${index}`, damage: 5, usageLimit: 2 }));
  }
  assert.throws(() => pokemon.learnAttack(new Attack({ name: "Attaque 5", damage: 5, usageLimit: 2 })));
  assert.throws(() => pokemon.learnAttack(new Attack({ name: "attaque 1", damage: 5, usageLimit: 2 })));
});

test("attacking consumes an attack use and healing restores HP and uses", () => {
  const attacker = new Pokemon({ id: 1, trainerId: 1, name: "Pikachu", lifePoint: 20, maxLifePoint: 20 });
  const defender = new Pokemon({ id: 2, trainerId: 2, name: "Salamèche", lifePoint: 30, maxLifePoint: 30 });
  const attack = new Attack({ name: "Éclair", damage: 7, usageLimit: 1 });
  attacker.learnAttack(attack);

  attacker.attack(defender, () => 0);
  assert.equal(defender.lifePoint, 23);
  assert.equal(attack.usageCount, 1);
  defender.takeDamage(50);
  attacker.heal();
  assert.equal(attacker.lifePoint, 20);
  assert.equal(attack.usageCount, 0);
});

test("trainers level up for every ten experience points", () => {
  const trainer = new Trainer({ id: 1, name: "Sacha", level: 1, experience: 8 });
  trainer.gainExperience(23);
  assert.equal(trainer.level, 4);
  assert.equal(trainer.experience, 1);
});
