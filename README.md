# API Pokémon

API REST en Express, TypeScript et PostgreSQL. Les modèles `Trainer`, `Pokemon` et
`Attack` portent les règles métier ; les usages et les points de vie sont persistés
dans PostgreSQL.

## Démarrage

1. Créer une base PostgreSQL nommée `pokemon`.
2. Copier `.env.example` vers `.env` et renseigner `DATABASE_URL`.
3. Installer puis lancer :

```sh
npm install
npm run dev
```

Le schéma est créé automatiquement au démarrage. `npm run build` compile l’API,
`npm test` exécute les tests métier et `npm start` lance la version compilée.

## Routes

- `GET /health` — contrôle PostgreSQL.
- `GET /api/trainers`, `POST /api/trainers` (`{ "name": "Sacha" }`).
- `GET /api/trainers/:id`.
- `POST /api/trainers/:id/pokemon` (`{ "name": "Pikachu", "lifePoint": 35 }`).
- `GET /api/pokemon/:id`.
- `POST /api/pokemon/:id/attacks` (`{ "name": "Éclair", "damage": 10, "usageLimit": 5 }`).
- `POST /api/pokemon/:id/heal` — restaure les PV et les usages d’attaques.
- `POST /api/trainers/:id/heal` — soin de tous les Pokémon à la taverne.
- `POST /api/pokemon/:id/attack/:targetId` — attaque aléatoire disponible.
- `POST /api/battles/random` — `{ "trainer1Id": 1, "trainer2Id": 2 }`.
- `POST /api/battles/deterministic` — duel sans soin, Pokémon au plus haut nombre de PV.
- `POST /api/arenas/1` — 100 duels aléatoires ; vainqueur final selon niveau puis expérience.
- `POST /api/arenas/2` — jusqu’à 100 duels déterministes, arrêt si un dresseur n’a plus
  de Pokémon en vie.

Les duels attribuent un point d’expérience au vainqueur. Une égalité n’en attribue
pas. Les niveaux progressent par tranche de 10 points d’expérience.
