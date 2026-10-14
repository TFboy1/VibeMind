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

**Développez avec l’IA, comprenez chaque étape à votre rythme.**

Une chaîne d’outils de guidage adaptatif en programmation pour le Vibe Coding, composée d’un Skill, d’un serveur MCP local et d’un CLI.
Le guidage s’adapte à chaque sujet et conserve le contexte du projet entre les sessions et les projets.

</div>

## Qu’est-ce que VibeMind ?

VibeMind intègre un guidage adaptatif dans le développement assisté par IA. Le Skill s’appuie sur la tâche et le code du projet pour ajuster l’accompagnement à votre expérience sur chaque sujet : clarifier le besoin, comparer les options, expliquer les notions nouvelles et réaliser uniquement le périmètre autorisé. Le serveur MCP local et le CLI partagent un graphe mémoire SQLite qui conserve les cartes de projet, les fiches de connaissances, les décisions de conception et l’historique des concepts entre projets.

Vous utilisez votre outil et votre modèle habituels. MCP et CLI partagent `~/.vibemind/memory.sqlite` ; le projet ne conserve que son identité dans `.vibemind/project.json`. Les préférences et l’historique d’explication sont partagés entre projets. Aucun compte ni API de modèle supplémentaire : l’hôte gère le processus stdio.

Avant chaque explication, consultez l’ID exact du concept ou un alias explicite. `alreadyExplained` indique la présence d’un historique : comparez `explanationSummaries.scope` et ne sautez que les contenus déjà couverts. Les bases non expliquées doivent encore être présentées ; l’absence de preuve d’application ne déclenche pas une répétition. Une demande explicite de révision ou une incompréhension permet de réexpliquer. Les candidats similaires et les concepts parents ne valent pas explication du concept courant.

## Un guidage adaptatif au fil du développement

Partez d’un besoin réel et de votre première idée. Le Skill les confronte au code et aux contraintes existants, vous aide à comparer les choix importants, puis réalise le périmètre que vous avez autorisé.

Le guidage s’ajuste selon votre familiarité avec chaque sujet, déduite des échanges et du travail plutôt que d’un questionnaire initial. Les notions nouvelles sont expliquées directement ; les sujets déjà connus passent au cas concret et aux nouveaux détails. Une explication et une application démontrée sont enregistrées séparément. Vous pouvez demander une recommandation, passer une étape ou demander une réalisation directe.

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
Lisez le README de https://github.com/TFboy1/VibeMind et installez vibemind comme Skill de guidage du code pour mon outil d’IA actuel. Vérifiez Node.js ≥22.20.0, conservez tous les fichiers references, scripts et NOTICE, préservez les Skills et la mémoire VibeMind existants, ne modifiez pas les paramètres globaux et expliquez comment appeler VibeMind dans un projet.
```

L’agent peut utiliser le CLI skills ou l’importation native de votre outil. S’il ne peut pas terminer l’importation lui-même, il doit préciser l’action qui reste à effectuer.

### Méthode 2 : installation manuelle

#### Avec le CLI skills

Ouvrez un terminal dans le projet où vous utiliserez VibeMind :

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

1. Construisez le ZIP complet depuis les sources 0.5.0, selon le [README principal](../README.md). Le ZIP 0.1.0 utilise l’ancien JSON et doit être mis à jour avant d’utiliser le nouveau MCP.
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

## Utiliser VibeMind

Dans votre projet, demandez par exemple :

> Utilisez VibeMind comme guide de programmation adaptatif pour ce projet. Je souhaite ajouter une réservation de stock à ce projet Vue + FastAPI. Examinez le code et les contraintes, puis aidez-moi à comparer les options de réalisation.

Exemples de demandes :

- « Expliquez ce concept à partir du code de ce projet. »
- « Je connais les bases ; montrez-moi son application ici. »
- « Recommandez une approche, puis mettez-la en œuvre. »
- « Passez l’explication et réalisez la conception convenue. »
- « Revenons sur mes fiches concernant CORS. »
- « Mettez le guidage VibeMind en pause. »
- « Reprenez VibeMind et les décisions en cours. »

L’installation ne crée ni n’active automatiquement les projets. Appelez VibeMind dans le projet concerné ; les demandes de développement ordinaires seront ensuite guidées selon le sujet et le contexte du code. Dans une nouvelle conversation ou un autre outil, rappelez VibeMind pour retrouver ce contexte. Les Hooks automatiques ne font pas partie de cette première version.

Confirmer une conception enregistre le choix présenté. Cela n’autorise pas implicitement d’autres changements. Une autorisation explicite déjà donnée pour le même périmètre est réutilisée.

## MCP local : une configuration, un contexte partagé entre projets

Conservez le dépôt complet dans un répertoire fixe et exécutez `npm ci` une fois. Configurez un serveur stdio dans l’hôte avec le chemin absolu réel :

```json
{"mcpServers":{"vibemind":{"command":"node","args":["/absolute/path/to/VibeMind/scripts/mcp.mjs"]}}}
```

Sous Windows, utilisez par exemple `D:/tools/VibeMind/scripts/mcp.mjs`. L’hôte lance et ferme le processus, sans port HTTP. Pour changer le stockage, utilisez le même `VIBEMIND_HOME` absolu dans tous les hôtes. La connexion seule n’initialise aucun projet et n’active pas le guidage. Le ZIP contient le CLI sans dépendances tierces ; le MCP s’exécute depuis le dépôt complet avec son SDK.

Exécutez configure --memory-home <répertoire local absolu> une fois pour enregistrer la configuration utilisateur partagée avec les futurs hôtes. VIBEMIND_HOME reste prioritaire. Lors d’un changement d’hôte ou MCP/CLI, vérifiez storeId, chemin, versions et ID du projet via doctor/status. Tous les hôtes n’ont pas besoin d’être installés à l’avance. Le périmètre est un apprenant, un système et un stockage local fiable.

## CLI

Utilisez le chemin complet du script installé et indiquez le projet :

```sh
node skills/vibemind/scripts/vibemind.mjs --help
node skills/vibemind/scripts/vibemind.mjs init --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs status --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project --topic CORS
node skills/vibemind/scripts/vibemind.mjs pause --cwd /path/to/project < pause-request.json
node skills/vibemind/scripts/vibemind.mjs resume --cwd /path/to/project < resume-request.json
```

Les lectures ne modifient pas les données. `context` produit du Markdown ; `--json` demande du JSON. Les autres commandes renvoient du JSON. Les erreurs vont sur stderr avec un code de sortie non nul.

`record` lit du JSON UTF-8 depuis stdin. Toute écriture, y compris pause/resume, exige les valeurs actuelles `expectedStoreId`, `expectedProjectId`, `expectedRevision` et un nouvel UUID `operationId` ; record-user utilise userRevision. Les fichiers pause/resume ci-dessous contiennent ces champs issus de l’état actuel. record exige aussi un champ à modifier. Une fiche contient id/title/content, une décision ajoute stage.

| stage | Signification |
|---|---|
| `reasoning` | En attente du raisonnement de l’utilisateur |
| `design` | En attente de confirmation de la conception |
| `implementation` | En attente d’autorisation de réalisation |
| `completed` | Le point discuté est terminé ; cela ne signifie pas automatiquement que le code a été réalisé |

Les fiches et décisions sont mises à jour par ID ; les éléments non soumis restent présents. Les textes profile et projectMap remplacent leurs champs respectifs : intégrez les observations encore valables avant de sauvegarder. [Spécification des données](../skills/vibemind/references/records.md)

## Données et récupération

SQLite est la source active. Les révisions utilisateur/projet sont indépendantes ; modifications et instantanés sont enregistrés dans une transaction. Journal DELETE, synchronisation FULL et délai de verrou de 3 secondes. init importe le state.json valide en conservant les octets, sauvegardes, pause et décisions. L’ancien profile reste une observation du projet ; les anciennes fiches sont vérifiées avant d’ajouter une preuve explained.

Un déplacement conserve l’ID. Une copie est refusée si le répertoire d’origine conserve la même identité ; la réutilisation de l’ancien chemin par un dossier sans rapport ne bloque pas la reprise. init --new-project crée explicitement des données séparées et vides. projects/context --project-id lisent aussi l’historique après suppression du dossier. user/record-user gèrent le profil commun ; les écritures exigent un projet source initialisé et actif (--cwd dans le CLI, projectPath dans MCP). knowledge recherche l’historique exact et jusqu’à deux sauts ; backup --output sauvegarde en ligne sans écrasement. [Contrat détaillé](../skills/vibemind/references/records.md)

Pour corriger une erreur explicitement, utilisez record.retractEvidence (ID des preuves du projet source) ou record.removeAliases (conceptId et alias) ; les valeurs précédentes restent dans les instantanés. Conservez des résumés courts : 128 KiB par nouvelle chaîne, 512 KiB pour le JSON d’entrée et l’état du projet, 2 MiB pour un résultat MCP, mesurés en octets UTF-8. Une écriture trop volumineuse est annulée avant validation ; les décisions en attente ne sont jamais tronquées. Le CLI peut toujours lire et réduire les anciennes données volumineuses.

Mettez Skill, CLI et MCP à jour ensemble vers **0.5.0**, puis redémarrez MCP. migrate sauvegarde les schémas 1/2 en ligne avant de passer au schéma 3 ; les anciens clients refusent alors les écritures. init --cwd rattache le même projet en conservant historique et pause. sharing=summary partage par défaut les portées/résumés sans les contenus ni chemins de code des autres projets ; private masque cette source, full autorise explicitement les exemples complets. Les résumés doivent éviter les détails privés. Corriger un alias exige expectedGraphRevision. En conflit, relisez et intégrez ; si la réponse est perdue, consultez operation et réessayez avec le même ID et contenu. Un reçu décrit une validation passée, pas l’état actuel. get lit un élément exact, history pagine, correct corrige explicitement une source supprimée/en pause, purge supprime un projet confirmé et ses révisions actives, sans sauvegardes ni conversations. Après restauration hors ligne, utilisez migrate --rotate-store-id --expected-store-id CURRENT_ID puis init --rebind-store-id NEW_ID avant de relancer les écritures. [Contrat complet](../skills/vibemind/references/records.md)

La recherche respecte les limites Git et worktree et refuse les chemins d’état symboliques. Toutes les décisions non terminées sont restaurées, même après un long historique.

- Vous pouvez ignorer `.vibemind/` dans votre projet ; le CLI ne modifie pas les règles d’exclusion.
- En cas de conflit de révision, relisez les dernières données et intégrez-les avant de soumettre.
- Inspectez les verrous avec doctor ; recover-lock --cwd ... --lock-token UUID ne retire que le verrou correspondant dont le processus a quitté. Ne retirez pas un verrou actif ou inconnu.
- Les données corrompues ou non prises en charge sont conservées et signalées ; init ne les réinitialise pas.
- L’échec d’une sauvegarde ou d’une écriture conserve l’état précédent. Si la libération du verrou échoue, consultez status : l’opération a peut-être déjà été enregistrée.

Il n’existe pas de commande de réinitialisation automatique ou de restauration écrasante. Quand votre outil lit les données, elles entrent dans le contexte de son modèle habituel. VibeMind ne les transmet pas séparément.

## Vérification

```sh
node --check skills/vibemind/scripts/vibemind.mjs
node --check scripts/mcp.mjs
node --test
npx skills add . --list
```

Les tests utilisent le moteur intégré de Node et des projets temporaires. Ils couvrent les mises à jour, les lectures seules, la pause, les processus concurrents, les données corrompues, les erreurs de sauvegarde, les chemins Unicode et l’isolation des projets. Vérifiez le guidage dans votre outil : profondeur adaptée à chaque sujet, décisions conservées, explications non répétées par défaut et distinction entre une notion expliquée et une application démontrée.

## Sources et soutien

VibeMind s’inspire de [VibeWise](https://github.com/nykooi1/vibe-wise), par Noah Kim, et adapte ses principes : conception dirigée par l’apprenant, explication directe, étapes de décision, preuves d’apprentissage, carte du projet et restauration des décisions. Les limites de projet et les sauvegardes s’appuient également sur cette référence.

VibeMind ajoute son guidage adaptatif du code, son CLI Node, son MCP stdio local, son graphe SQLite utilisateur, les identités de projet, la migration JSON, les instantanés transactionnels, les sauvegardes en ligne et la vérification précise des explications entre projets. Les attributions et les deux licences MIT figurent dans [NOTICE.md](../skills/vibemind/NOTICE.md).

Les boutons de soutien utilisent les mêmes destinations que le projet [Academic Paper Writer](https://github.com/TFboy1/academic-paper-writer) du mainteneur.

## 0.5.0 : découverte sur toutes les roadmaps

Toutes les roadmaps publiques de roadmap.sh sont accessibles à la demande en ligne. L’Agent hôte choisit les domaines, développe les synonymes et juge les relations sémantiques ; FTS5 local et l’historique sélectionnent jusqu’à trois opportunités. Une capacité sans preuve reste unknown.

Nouvelles commandes : discover (search/recommend), opportunities et extensions. record.growth conserve les candidats et réactions réelles ; record-user.learningPreferences règle la fréquence off/normal et les parcours. explained et applied restent distincts.

Un projet actif propose au maximum une invitation après une tâche par session identifiable. Refus, report ou demande d’implémentation directe arrêtent les invitations de cette session. Accepter n’autorise aucune modification supplémentaire.

Après échec de la source officielle, des miroirs sont essayés selon leurs capacités. configure --roadmap-mirrors JSON préserve le chemin mémoire. Le cache public est séparé des apprentissages ; une panne ne crée pas de base de remplacement.

Mettez tous les hôtes à jour et migrez explicitement les schémas 1/2 vers 3 avec sauvegarde en ligne. L’identité du schéma 2, les révisions et la pause sont conservées. Aucun modèle vectoriel, synchronisation complète, Hook automatique ou frontend ajouté.

[Contrat de découverte](../skills/vibemind/references/discovery.md) et [sources/licences](../skills/vibemind/NOTICE.md).
