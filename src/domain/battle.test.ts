import assert from "node:assert/strict";
import test from "node:test";
import { Attack } from "./Attack.js";
import { fightPokemon, selectStrongestPokemon } from "./battle.js";
import { Pokemon } from "./Pokemon.js";
import { Trainer } from "./Trainer.js";

test("a battle ends when both Pokémon run out of attack uses", () => {
  const first = new Pokemon({ id: 1, trainerId: 1, name: "Pikachu", lifePoint: 10, maxLifePoint: 10 });
  const second = new Pokemon({ id: 2, trainerId: 2, name: "Carapuce", lifePoint: 11, maxLifePoint: 11 });
  first.learnAttack(new Attack({ name: "Éclair", damage: 4, usageLimit: 2 }));
  second.learnAttack(new Attack({ name: "Pistolet à O", damage: 3, usageLimit: 2 }));

  const result = fightPokemon(first, second, () => 0);

  assert.equal(result.turns, 4);
  assert.equal(result.winner, first);
  assert.equal(first.lifePoint, 4);
  assert.equal(second.lifePoint, 3);
});

test("the deterministic selection chooses the living Pokémon with the most HP", () => {
  const trainer = new Trainer({
    id: 1,
    name: "Sacha",
    level: 1,
    experience: 0,
    pokemon: [
      new Pokemon({ id: 1, trainerId: 1, name: "KO", lifePoint: 0, maxLifePoint: 20 }),
      new Pokemon({ id: 2, trainerId: 1, name: "Pikachu", lifePoint: 12, maxLifePoint: 20 }),
      new Pokemon({ id: 3, trainerId: 1, name: "Bulbizarre", lifePoint: 15, maxLifePoint: 20 })
    ]
  });

  assert.equal(selectStrongestPokemon(trainer)?.name, "Bulbizarre");
});
