# DevFlow API

DevFlow API est une API REST de gestion de projets et de tâches. Le projet démontre la conception de routes, la validation des entrées, les réponses d’erreur, la pagination, les tests automatisés et la documentation OpenAPI.

## Fonctionnalités

- Vérification de santé avec `GET /api/health`.
- CRUD de tâches.
- Création et consultation de projets.
- Association de tâches à un projet.
- Statuts `todo`, `in_progress`, `done`.
- Priorités `low`, `medium`, `high`.
- Validation des données avec réponses `422`.
- Pagination avec `page` et `limit`.
- CORS activé pour les prototypes frontend.
- Documentation dans `openapi.json`.
- Tests natifs avec `node:test`.

## Installation et lancement

Le projet n’a aucune dépendance externe pour sa première version. Il nécessite Node.js 18 ou plus récent.

```bash
npm start
```

L’API démarre sur `http://localhost:3000` ou sur le port défini par la variable `PORT`.

```bash
PORT=4000 npm start
```

## Tester

```bash
npm test
```

Vérifier la santé du service :

```bash
curl http://localhost:3000/api/health
```

Lister les projets :

```bash
curl "http://localhost:3000/api/projects?page=1&limit=10"
```

Créer un projet :

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Mon application","description":"Projet de portfolio"}'
```

Créer une tâche dans le projet `p-portfolio` :

```bash
curl -X POST http://localhost:3000/api/projects/p-portfolio/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Ajouter une documentation","priority":"high","status":"todo"}'
```

Modifier une tâche :

```bash
curl -X PUT http://localhost:3000/api/tasks/t-1 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

## Architecture

```text
server.js       # serveur HTTP, routes et validation
openapi.json    # contrat API OpenAPI 3
 test-api.js    # tests d’intégration Node.js
package.json    # scripts de lancement et test
README.md       # documentation développeur
TODO.md         # prochaines étapes
```

## Limites connues

Les données sont actuellement conservées en mémoire et sont réinitialisées au redémarrage. Il n’y a pas encore d’authentification, de base de données ni de contrôle d’accès. Cette limite est volontairement documentée pour distinguer le MVP pédagogique d’une API de production.

## Prochaines étapes

1. Remplacer le stockage mémoire par PostgreSQL.
2. Ajouter migrations et variables d’environnement.
3. Ajouter authentification et autorisation.
4. Ajouter logs structurés et gestion centralisée des erreurs.
5. Déployer l’API sur un hébergeur backend.

## Auteur

Projet portfolio d’Amirague Hounka.
