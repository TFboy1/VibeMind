<div align="center">

<img src="../assets/banner.png" alt="VibeMind — Build with AI. Understand what you build." width="100%" />

<br/>

[![简体中文](https://img.shields.io/badge/简体中文-README-blue?style=flat-square)](../README.md)
[![English](https://img.shields.io/badge/English-README-blue?style=flat-square)](README_EN.md)
[![日本語](https://img.shields.io/badge/日本語-README-blue?style=flat-square)](README_JA.md)
[![Français](https://img.shields.io/badge/Français-README-blue?style=flat-square)](README_FR.md)
[![Deutsch](https://img.shields.io/badge/Deutsch-Current-red?style=flat-square)](#)

<br/>

[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install%20Skill-00C853?style=for-the-badge&logo=hackthebox&logoColor=white)](#installation)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.20.0-3C873A?style=for-the-badge&logo=nodedotjs&logoColor=white)](#requirements)
[![License](https://img.shields.io/badge/License-MIT-60A5FA?style=for-the-badge)](../LICENSE)
[![爱发电](https://img.shields.io/badge/爱发电-Support%20Me-FF69B4?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.ifdian.net/item/1a20ed042f0711f1865a52540025c377)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.creem.io/payment/prod_1yc40mIhKwwrc7iqFOG9G2)

<br/>

**Du entwirfst. Die KI setzt um. Verstehe den Code, den du entwickelst.**

Ein Lern-Skill für Qoder, WorkBuddy und TRAE mit einer schlanken lokalen CLI.

</div>

## Was ist VibeMind?

VibeMind verbindet einen Skill, der das Lernen in den Vordergrund stellt, mit einer zuverlässigen CLI zur Zustandsverwaltung. Der Skill begleitet deine Überlegungen, erklärt Konzepte und setzt klar autorisierte Entwürfe um. Die CLI speichert Lernbeobachtungen, eine Projektübersicht, Wissenskarten und offene Entscheidungen.

Du nutzt dein vorhandenes KI-Werkzeug und dessen Modell. Die Daten bleiben im Projekt; zusätzliche Konten, Modell-APIs und Hintergrunddienste sind nicht erforderlich.

## Lernen beim Entwickeln

Beschreibe dein Ziel und deinen Lösungsansatz. Die KI prüft ihn anhand des tatsächlichen Codes und der Anforderungen, erklärt fehlende Grundlagen, bespricht Abwägungen und setzt den autorisierten Umfang um.

Deine Kenntnisse werden je Thema aus Gesprächen und praktischer Arbeit abgeleitet. Es gibt keinen Einstufungsfragebogen zu Beginn. Eine Erklärung durch die KI wird von nachgewiesener eigener Anwendung unterschieden. Du kannst Vorschläge anfordern, eine Übung überspringen oder eine direkte Umsetzung verlangen.

<a id="requirements"></a>

## Voraussetzungen

- **Node.js 22.20.0 oder neuer**.
- Ein KI-Werkzeug mit Zugriff auf Projektdateien und lokale Befehle.
- Die CLI verwendet ausschließlich die Node-Standardbibliothek. Für skills.sh wird außerdem npx benötigt.

<a id="installation"></a>

## Installation

### Methode 1: ein Satz an deinen Agenten

Kopiere diese Anweisung in deinen aktuellen Agenten:

```text
Lies die README unter https://github.com/TFboy1/VibeMind und installiere vibemind als Projekt-Skill für mein aktuelles KI-Werkzeug, prüfe Node.js ≥22.20.0, behalte alle references-, scripts- und NOTICE-Dateien bei, überschreibe keine vorhandenen Skills oder Lerndaten, ändere keine globalen Einstellungen und erkläre mir, wie ich den Lernmodus starte.
```

Der Agent kann die skills-CLI oder den Import deines Werkzeugs verwenden. Kann er einen Import nicht selbst abschließen, soll er den noch erforderlichen manuellen Schritt deutlich benennen.

### Methode 2: manuelle Installation

#### Mit der skills-CLI

Öffne ein Terminal im gewünschten Projekt:

```sh
npx skills add TFboy1/VibeMind --skill vibemind --copy
```

Wähle dein Werkzeug oder gib es ausdrücklich an:

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

Standardmäßig wird nur im Projekt installiert. `--copy` verwendet normale Dateien und ist unter Windows praktisch. [Dokumentation der skills-CLI](https://github.com/vercel-labs/skills)

#### Das vollständige ZIP importieren

1. [Lade das VibeMind-Skill-ZIP herunter](https://github.com/TFboy1/VibeMind/releases/latest/download/vibemind-0.1.0.zip).
2. Öffne in WorkBuddy Skills → Skill hinzufügen → Skill hochladen und importiere das ZIP. Qoder und TRAE können dasselbe Paket über ihren Import verwenden.
3. Wähle `vibemind` im Zielprojekt aus und rufe den Skill auf.

Im ZIP müssen `SKILL.md`, `NOTICE.md`, `references/` und `scripts/` direkt auf der obersten Ebene liegen. Behalte das gesamte Paket. Im vollständigen GitHub-Repository-ZIP befindet sich der Skill unter `skills/vibemind/`.

Die skills-CLI hat derzeit kein eigenes WorkBuddy-Ziel. Nutze dessen Importfunktion. [Offizielle WorkBuddy-Dokumentation](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)

Für die Installation aus lokalen Quellen:

```sh
git clone https://github.com/TFboy1/VibeMind.git
npx skills add /absolute/path/to/VibeMind --skill vibemind --agent qoder --copy
```

Setze Windows-Pfade mit Leerzeichen in Anführungszeichen.

## Den Lernmodus starten

Bitte deinen Agenten beispielsweise:

> Nutze VibeMind, damit ich beim Entwickeln lerne. Ich möchte diesem Vue-und-FastAPI-Projekt eine Bestandsreservierung hinzufügen. Prüfe zuerst den vorhandenen Code und besprich dann meinen Lösungsansatz mit mir.

Weitere Anweisungen:

- „Erkläre zuerst dieses Konzept.“
- „Überspringe diese Übung und setze den vereinbarten Entwurf um.“
- „Gehe mit mir die Wissenskarten zu CORS durch.“
- „Pausiere den Lernmodus.“
- „Setze VibeMind fort und beginne mit den offenen Entscheidungen.“

Die Installation aktiviert den Lernmodus nicht in jedem Projekt. Nach der Aktivierung behalten normale Entwicklungsaufträge den Lernablauf bei. In einer neuen Unterhaltung oder einem anderen Werkzeug rufst du VibeMind ausdrücklich erneut auf. Automatische Hooks gehören nicht zur ersten Version.

Die Bestätigung eines Entwurfs hält die dargestellte Entscheidung fest. Sie autorisiert keine weiteren, unbesprochenen Implementierungen. Eine bereits ausdrücklich erteilte Autorisierung für denselben Umfang gilt weiter.

## CLI

Verwende den vollständigen Pfad zum installierten Skript und gib das Projekt an:

```sh
node skills/vibemind/scripts/vibemind.mjs --help
node skills/vibemind/scripts/vibemind.mjs init --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs status --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project --topic CORS
node skills/vibemind/scripts/vibemind.mjs pause --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs resume --cwd /path/to/project
```

Lesevorgänge ändern keine Daten. `context` liefert standardmäßig Markdown, mit `--json` stattdessen JSON. Andere Befehle geben JSON zurück. Fehler erscheinen auf stderr mit einem Exit-Code ungleich null.

`record` liest JSON von stdin. Erforderlich sind die aktuelle `expectedRevision` und mindestens eines der Felder `profile`, `projectMap`, `cards` oder `decisions`. Karten enthalten eine stabile `id`, einen `title` und `content`; Entscheidungen zusätzlich `stage`.

| stage | Bedeutung |
|---|---|
| `reasoning` | Die Überlegungen des Nutzers stehen aus |
| `design` | Die Bestätigung des Entwurfs steht aus |
| `implementation` | Die Autorisierung der Umsetzung steht aus |
| `completed` | Dieser Gesprächspunkt ist abgeschlossen; das allein bedeutet nicht, dass Code umgesetzt wurde |

Karten und Entscheidungen werden nach ID aktualisiert. Nicht übermittelte Einträge bleiben erhalten. profile und projectMap ersetzen ihren jeweiligen Text: Integriere weiterhin gültige Informationen vor dem Speichern. [Details zum Datenformat](../skills/vibemind/references/records.md)

## Speicherung und Fehlerbehandlung

`.vibemind/state.json` ist die einzige aktive Datenquelle. Markdown wird beim Anzeigen erzeugt. Jede tatsächliche Änderung erhöht die Revision, sichert den vorherigen Zustand und ersetzt die aktive Datei atomar. Projektsperren und Versionsprüfung schützen vor veralteten parallelen Schreibvorgängen.

Die Suche respektiert Git- und Worktree-Grenzen und lehnt symbolisch verknüpfte Zustandspfade ab. Alle offenen Entscheidungen werden wiederhergestellt, auch hinter langen Historien.

- Du kannst `.vibemind/` zu den Ignore-Regeln hinzufügen; die CLI ändert sie nicht.
- Bei einem Versionskonflikt liest du den aktuellen Zustand erneut und integrierst die neuen Daten.
- Bei einer Sperre prüfst du andere Schreibvorgänge. Eine zurückgelassene Sperrdatei darf erst nach Bestätigung des Prozessendes manuell entfernt werden.
- Beschädigte oder nicht unterstützte Daten bleiben erhalten. init setzt sie nicht zurück.
- Scheitert das Backup oder Schreiben, bleibt der alte Zustand erhalten. Scheitert die Freigabe der Sperre, prüfe zunächst status: Die Änderung könnte bereits gespeichert sein.

Es gibt keinen automatischen Reset oder Befehl zum Zurückspielen eines Backups. Wenn dein Werkzeug die Daten liest, gelangen sie in den Kontext seines vorhandenen Modells. VibeMind lädt sie nicht zusätzlich hoch.

## Prüfung

```sh
node --check skills/vibemind/scripts/vibemind.mjs
node --test
npx skills add . --list
```

Die Tests verwenden Nodes integrierten Test-Runner und temporäre Projekte. Geprüft werden Aktualisierungen, reine Lesevorgänge, Pausen, parallele Prozesse, beschädigte Daten, Backup- und Schreibfehler, Unicode-Pfade und Projektgrenzen. Den Lernablauf prüfst du in deinem Werkzeug: direkte Erklärungen, erhaltene offene Entscheidungen und eine klare Trennung zwischen gehörtem und angewendetem Wissen.

## Quellen und Unterstützung

VibeMind übernimmt und adaptiert Ideen aus [VibeWise](https://github.com/nykooi1/vibe-wise) von Noah Kim: vom Lernenden gestaltete Entwürfe, direkte Erklärungen, Entscheidungspunkte, belegbare Lernbeobachtungen, Projektübersichten und die Wiederaufnahme offener Entscheidungen. Auch Projektgrenzen und Backups orientieren sich am Original.

Dieses Projekt ergänzt eine Node-CLI, versionierte JSON-Daten, Wissenskarten mit stabilen IDs, themenbezogenes Lesen und die Verteilung an mehrere Werkzeuge. Herkunft und beide MIT-Lizenzen stehen in [NOTICE.md](../skills/vibemind/NOTICE.md).

Die Unterstützungsbuttons führen zu denselben Zielen wie beim [Academic Paper Writer](https://github.com/TFboy1/academic-paper-writer) des Maintainers.
