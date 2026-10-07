<div align="center">

<img src="../assets/banner.png" alt="VibeMind — Build with AI. Understand what you build." width="100%" />

<br/>

[![简体中文](https://img.shields.io/badge/简体中文-README-blue?style=flat-square)](../README.md)
[![English](https://img.shields.io/badge/English-README-blue?style=flat-square)](README_EN.md)
[![日本語](https://img.shields.io/badge/日本語-README-blue?style=flat-square)](README_JA.md)
[![Français](https://img.shields.io/badge/Français-Current-red?style=flat-square)](#)
[![Deutsch](https://img.shields.io/badge/Deutsch-README-blue?style=flat-square)](README_DE.md)

<br/>

[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install%20Skill-00C853?style=for-the-badge&logo=hackthebox&logoColor=white)](#installation)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.20.0-3C873A?style=for-the-badge&logo=nodedotjs&logoColor=white)](#requirements)
[![License](https://img.shields.io/badge/License-MIT-60A5FA?style=for-the-badge)](../LICENSE)
[![爱发电](https://img.shields.io/badge/爱发电-Support%20Me-FF69B4?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.ifdian.net/item/1a20ed042f0711f1865a52540025c377)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.creem.io/payment/prod_1yc40mIhKwwrc7iqFOG9G2)

<br/>

**Vous concevez. L’IA réalise. Comprenez le code que vous construisez.**

Un Skill d’apprentissage pour Qoder, WorkBuddy et TRAE, accompagné d’un CLI local léger.

</div>

## Qu’est-ce que VibeMind ?

VibeMind associe un Skill qui donne la priorité à l’apprentissage à un CLI chargé de conserver les données de manière fiable. Le Skill accompagne le raisonnement, explique les concepts et réalise les changements clairement autorisés. Le CLI conserve les observations, la carte du projet, les fiches de connaissances et les décisions en cours.

Vous utilisez votre outil et votre modèle habituels. Les données restent dans votre projet ; aucun compte supplémentaire, API de modèle ou service en arrière-plan n’est nécessaire.

## Apprendre en construisant

Présentez votre besoin et votre idée de réalisation. L’agent examine votre raisonnement à partir du code et des contraintes réelles, explique les concepts manquants, discute les compromis puis réalise le périmètre autorisé.

Votre familiarité est observée sujet par sujet pendant les échanges et le travail. Aucun questionnaire de niveau initial n’est imposé. Un concept expliqué par l’IA est distingué d’une capacité réellement démontrée. Vous pouvez demander des propositions, sauter un exercice ou solliciter une réalisation directe.

<a id="requirements"></a>

## Prérequis

- **Node.js 22.20.0 ou une version plus récente**.
- Un outil d’IA capable de lire les fichiers du projet et d’exécuter des commandes locales.
- Le CLI utilise uniquement la bibliothèque standard de Node. L’installation via skills.sh nécessite également npx.

<a id="installation"></a>

## Installation

### Méthode 1 : une phrase à votre agent

Copiez cette instruction dans votre agent :

```text
Lisez le README de https://github.com/TFboy1/VibeMind et installez vibemind comme Skill de projet pour mon outil d’IA actuel, vérifiez Node.js ≥22.20.0, conservez tous les fichiers references, scripts et NOTICE, préservez les Skills et données d’apprentissage existants, ne modifiez pas les paramètres globaux et expliquez comment activer l’apprentissage.
```

L’agent peut utiliser le CLI skills ou l’importation native de votre outil. S’il ne peut pas terminer l’importation lui-même, il doit préciser l’action qui reste à effectuer.

### Méthode 2 : installation manuelle

#### Avec le CLI skills

Ouvrez un terminal dans le projet concerné :

```sh
npx skills add TFboy1/VibeMind --skill vibemind --copy
```

Choisissez votre outil, ou précisez-le :

```sh
# Qoder
npx skills add TFboy1/VibeMind --skill vibemind --agent qoder --copy
# Qoder CN
npx skills add TFboy1/VibeMind --skill vibemind --agent qoder-cn --copy
# TRAE CN
npx skills add TFboy1/VibeMind --skill vibemind --agent trae-cn --copy
# TRAE
npx skills add TFboy1/VibeMind --skill vibemind --agent trae --copy
```

L’installation est limitée au projet par défaut. `--copy` copie des fichiers ordinaires, ce qui facilite l’utilisation sous Windows. [Documentation du CLI skills](https://github.com/vercel-labs/skills)

#### Importer le ZIP complet

1. [Téléchargez le ZIP du Skill VibeMind](https://github.com/TFboy1/VibeMind/releases/latest/download/vibemind-0.1.0.zip).
2. Dans WorkBuddy, ouvrez Skills → Ajouter un Skill → Importer un Skill et sélectionnez le ZIP. Qoder et TRAE peuvent employer le même paquet dans leur interface d’importation.
3. Sélectionnez `vibemind` dans le projet cible.

Le ZIP doit contenir directement `SKILL.md`, `NOTICE.md`, `references/` et `scripts/` à sa racine. Conservez le paquet entier. Dans le ZIP complet du dépôt GitHub, le Skill se trouve sous `skills/vibemind/`.

Le CLI skills n’a actuellement pas de cible WorkBuddy distincte ; utilisez son importation native. [Documentation WorkBuddy](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)

Pour installer depuis le code local :

```sh
git clone https://github.com/TFboy1/VibeMind.git
npx skills add /absolute/path/to/VibeMind --skill vibemind --agent qoder --copy
```

Entourez les chemins Windows contenant des espaces de guillemets.

## Commencer

Dans votre projet, demandez par exemple :

> Utilisez VibeMind pour m’aider à apprendre en développant. Je souhaite ajouter une réservation de stock à ce projet Vue + FastAPI. Examinez d’abord le code existant, puis discutez avec moi de mon approche.

Exemples de demandes :

- « Expliquez d’abord ce concept. »
- « Sautez cet exercice et réalisez la conception convenue. »
- « Revenons sur mes fiches concernant CORS. »
- « Mettez l’apprentissage en pause. »
- « Reprenez VibeMind et les décisions en cours. »

L’installation seule n’active pas l’apprentissage dans tous les projets. Une fois activées, les demandes ordinaires de développement conservent le parcours d’apprentissage. Une nouvelle conversation ou un changement d’outil nécessite de rappeler explicitement VibeMind ; les Hooks automatiques ne font pas partie de cette première version.

Confirmer une conception enregistre le choix présenté. Cela n’autorise pas implicitement d’autres changements. Une autorisation explicite déjà donnée pour le même périmètre est réutilisée.

## CLI

Utilisez le chemin complet du script installé et indiquez le projet :

```sh
node skills/vibemind/scripts/vibemind.mjs --help
node skills/vibemind/scripts/vibemind.mjs init --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs status --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project --topic CORS
node skills/vibemind/scripts/vibemind.mjs pause --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs resume --cwd /path/to/project
```

Les lectures ne modifient pas les données. `context` produit du Markdown ; `--json` demande du JSON. Les autres commandes renvoient du JSON. Les erreurs vont sur stderr avec un code de sortie non nul.

`record` lit du JSON sur l’entrée standard. Il exige la valeur actuelle de `expectedRevision` et au moins un champ parmi `profile`, `projectMap`, `cards` et `decisions`. Chaque fiche comprend un `id` stable, un `title` et un `content`. Une décision comprend aussi `stage`.

| stage | Signification |
|---|---|
| `reasoning` | En attente du raisonnement de l’utilisateur |
| `design` | En attente de confirmation de la conception |
| `implementation` | En attente d’autorisation de réalisation |
| `completed` | Le point discuté est terminé ; cela ne signifie pas automatiquement que le code a été réalisé |

Les fiches et décisions sont mises à jour par ID ; les éléments non soumis restent présents. Les textes profile et projectMap remplacent leurs champs respectifs : intégrez les observations encore valables avant de sauvegarder. [Spécification des données](../skills/vibemind/references/records.md)

## Données et récupération

`.vibemind/state.json` est l’unique source de données actives. Le Markdown est généré à la consultation. Chaque modification effective incrémente la révision, sauvegarde l’état précédent et remplace le fichier de manière atomique. Les verrous de projet et le contrôle de révision protègent contre les mises à jour concurrentes périmées.

La recherche respecte les limites Git et worktree et refuse les chemins d’état symboliques. Toutes les décisions non terminées sont restaurées, même après un long historique.

- Vous pouvez ignorer `.vibemind/` dans votre projet ; le CLI ne modifie pas les règles d’exclusion.
- En cas de conflit de révision, relisez les dernières données et intégrez-les avant de soumettre.
- En cas de verrou, vérifiez les autres écritures. Un verrou résiduel ne doit être retiré manuellement qu’après confirmation de l’arrêt de son processus.
- Les données corrompues ou non prises en charge sont conservées et signalées ; init ne les réinitialise pas.
- L’échec d’une sauvegarde ou d’une écriture conserve l’état précédent. Si la libération du verrou échoue, consultez status : l’opération a peut-être déjà été enregistrée.

Il n’existe pas de commande de réinitialisation automatique ou de restauration écrasante. Quand votre outil lit les données, elles entrent dans le contexte de son modèle habituel. VibeMind ne les transmet pas séparément.

## Vérification

```sh
node --check skills/vibemind/scripts/vibemind.mjs
node --test
npx skills add . --list
```

Les tests utilisent le moteur intégré de Node et des projets temporaires. Ils couvrent les mises à jour, les lectures seules, la pause, les processus concurrents, les données corrompues, les erreurs de sauvegarde, les chemins Unicode et l’isolation des projets. Vérifiez l’expérience pédagogique dans votre outil : explications directes, décisions préservées et distinction entre avoir entendu et savoir appliquer.

## Sources et soutien

VibeMind s’inspire de [VibeWise](https://github.com/nykooi1/vibe-wise), par Noah Kim, et adapte ses principes : conception dirigée par l’apprenant, explication directe, étapes de décision, preuves d’apprentissage, carte du projet et restauration des décisions. Les limites de projet et les sauvegardes s’appuient également sur cette référence.

VibeMind ajoute son CLI Node, les données JSON versionnées, les fiches à ID stable, la lecture par sujet et la distribution pour plusieurs outils. Les attributions et les deux licences MIT figurent dans [NOTICE.md](../skills/vibemind/NOTICE.md).

Les boutons de soutien utilisent les mêmes destinations que le projet [Academic Paper Writer](https://github.com/TFboy1/academic-paper-writer) du mainteneur.
