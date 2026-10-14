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

**Entwickle mit KI und verstehe jeden Schritt in deinem Tempo.**

Eine adaptive Toolchain zur Programmierführung für Vibe Coding, bestehend aus Skill, lokalem MCP-Server und CLI.
Die Führung passt sich je Thema an und erhält den Projektkontext über Sitzungen und Projekte hinweg.

</div>

## Was ist VibeMind?

VibeMind integriert adaptive Programmierführung in die tägliche KI-gestützte Entwicklung. Der Skill nutzt Aufgabe und Projektcode, um die Unterstützung an deine Erfahrung mit jedem Thema anzupassen: Anforderungen klären, Ansätze vergleichen, neue Konzepte erklären und nur den ausdrücklich autorisierten Umfang umsetzen. Lokaler MCP-Server und CLI teilen einen SQLite-Erinnerungsgraphen für Projektübersichten, Wissenskarten, Entwurfsentscheidungen und projektübergreifende Konzepthistorie.

Du nutzt dein vorhandenes Werkzeug und Modell. MCP und CLI teilen `~/.vibemind/memory.sqlite`; im Projekt liegt nur `.vibemind/project.json` als Identität. Vorlieben und Erklärungshistorie gelten projektübergreifend. Zusätzliche Konten oder Modell-APIs sind nicht nötig, den stdio-Prozess verwaltet der Host.

Vor jeder Erklärung wird die genaue Konzept-ID oder ein ausdrücklich gebundener Alias geprüft. `alreadyExplained` bedeutet, dass Erklärungsverlauf vorhanden ist: Vergleiche `explanationSummaries.scope` und überspringe nur die bereits behandelten Inhalte. Noch nicht erklärte Grundlagen werden weiterhin erläutert; fehlende Anwendungsnachweise lösen keine Wiederholung aus. Bei gewünschter Wiederholung oder weiterem Unverständnis darf erneut erklärt werden. Ähnliche Treffer und übergeordnete Konzepte belegen keine Erklärung des aktuellen Konzepts.

## Adaptive Führung beim Entwickeln

Beginne mit einer konkreten Aufgabe und deinem aktuellen Ansatz. Der Skill gleicht beides mit dem vorhandenen Code und den Anforderungen ab, hilft dir, wichtige Abwägungen zu treffen, und setzt anschließend den autorisierten Umfang um.

Die Führung passt sich deiner Vertrautheit mit jedem Thema an, abgeleitet aus Gesprächen und praktischer Arbeit statt aus einem Einstufungsfragebogen. Neue Konzepte werden direkt erklärt; bekannte Themen führen zum aktuellen Anwendungsfall und zu neuen Details. Eine Erklärung und der Nachweis eigener Anwendung werden getrennt festgehalten. Du kannst Empfehlungen anfordern, einen Schritt überspringen oder eine direkte Umsetzung verlangen.

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
Lies die README unter https://github.com/TFboy1/VibeMind und installiere vibemind als Skill zur Programmierführung für mein aktuelles KI-Werkzeug. Prüfe Node.js ≥22.20.0, behalte alle references-, scripts- und NOTICE-Dateien bei, überschreibe keine vorhandenen Skills oder VibeMind-Daten, ändere keine globalen Einstellungen und erkläre mir, wie ich VibeMind in einem Projekt aufrufe.
```

Der Agent kann die skills-CLI oder den Import deines Werkzeugs verwenden. Kann er einen Import nicht selbst abschließen, soll er den noch erforderlichen manuellen Schritt deutlich benennen.

### Methode 2: manuelle Installation

#### Mit der skills-CLI

Öffne ein Terminal im Projekt, in dem du VibeMind einsetzen möchtest:

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

1. Erstelle das vollständige Skill-ZIP aus dem aktuellen 0.5.0-Quellcode, wie im [Haupt-README](../README.md) beschrieben. Das alte 0.1.0-ZIP schreibt Projekt-JSON und muss vor dem neuen MCP aktualisiert werden.
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

## VibeMind einsetzen

Bitte deinen Agenten beispielsweise:

> Nutze VibeMind als adaptive Programmierführung für dieses Projekt. Ich möchte diesem Vue-und-FastAPI-Projekt eine Bestandsreservierung hinzufügen. Prüfe den vorhandenen Code und die Anforderungen, und hilf mir dann, die Lösungsansätze zu vergleichen.

Weitere Anweisungen:

- „Erkläre dieses Konzept anhand des aktuellen Projekts.“
- „Die Grundlagen kenne ich; zeig mir die Anwendung hier.“
- „Empfiehl einen Ansatz und setze ihn anschließend um.“
- „Überspringe die Erklärung und setze den vereinbarten Entwurf um.“
- „Gehe mit mir die Wissenskarten zu CORS durch.“
- „Pausiere die VibeMind-Führung.“
- „Setze VibeMind fort und beginne mit den offenen Entscheidungen.“

Die Installation initialisiert oder aktiviert kein Projekt automatisch. Rufe VibeMind im gewünschten Projekt auf; danach werden auch gewöhnliche Entwicklungsaufträge passend zum Thema und Projektkontext begleitet. In einer neuen Unterhaltung oder einem anderen Werkzeug rufst du VibeMind erneut auf, um diesen Kontext wiederherzustellen. Automatische Hooks gehören nicht zur ersten Version.

Die Bestätigung eines Entwurfs hält die dargestellte Entscheidung fest. Sie autorisiert keine weiteren, unbesprochenen Implementierungen. Eine bereits ausdrücklich erteilte Autorisierung für denselben Umfang gilt weiter.

## Lokaler MCP: einmal einrichten, Kontext projektübergreifend nutzen

Bewahre das vollständige Repository in einem festen Verzeichnis auf und führe einmal `npm ci` aus. Trage den tatsächlichen absoluten Skriptpfad als stdio-Server beim Host ein:

```json
{"mcpServers":{"vibemind":{"command":"node","args":["/absolute/path/to/VibeMind/scripts/mcp.mjs"]}}}
```

Unter Windows etwa `D:/tools/VibeMind/scripts/mcp.mjs`. Der Host startet und beendet den Prozess ohne HTTP-Port. Für einen anderen Speicherort verwenden alle Hosts denselben absoluten `VIBEMIND_HOME`. Die Verbindung allein initialisiert kein Projekt und aktiviert keine Führung. Das ZIP enthält die CLI ohne Drittanbieter-Abhängigkeiten; MCP läuft mit dem SDK aus dem vollständigen Repository.

configure --memory-home <absolutes lokales Verzeichnis> speichert einmal die gemeinsame Benutzerkonfiguration für später installierte Hosts. VIBEMIND_HOME hat weiterhin Vorrang. Prüfe bei Host- oder MCP/CLI-Wechsel mit doctor/status die tatsächliche storeId, den Pfad, Versionen und Projekt-ID. Nicht alle Hosts müssen vorher installiert sein. Unterstützt werden ein Lernender, ein Betriebssystem und ein zuverlässiges lokales Dateisystem.

## CLI

Verwende den vollständigen Pfad zum installierten Skript und gib das Projekt an:

```sh
node skills/vibemind/scripts/vibemind.mjs --help
node skills/vibemind/scripts/vibemind.mjs init --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs status --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project --topic CORS
node skills/vibemind/scripts/vibemind.mjs pause --cwd /path/to/project < pause-request.json
node skills/vibemind/scripts/vibemind.mjs resume --cwd /path/to/project < resume-request.json
```

Lesevorgänge ändern keine Daten. `context` liefert standardmäßig Markdown, mit `--json` stattdessen JSON. Andere Befehle geben JSON zurück. Fehler erscheinen auf stderr mit einem Exit-Code ungleich null.

`record` liest UTF-8-JSON von stdin. Jede Änderung, einschließlich pause/resume, benötigt aktuelle `expectedStoreId`, `expectedProjectId`, `expectedRevision` und eine neue UUID `operationId`; record-user verwendet userRevision. Die unten verwendeten pause/resume-Dateien enthalten diese Felder aus dem aktuellen Status. record benötigt außerdem ein Update-Feld. Karten enthalten id/title/content, Entscheidungen zusätzlich stage.

| stage | Bedeutung |
|---|---|
| `reasoning` | Die Überlegungen des Nutzers stehen aus |
| `design` | Die Bestätigung des Entwurfs steht aus |
| `implementation` | Die Autorisierung der Umsetzung steht aus |
| `completed` | Dieser Gesprächspunkt ist abgeschlossen; das allein bedeutet nicht, dass Code umgesetzt wurde |

Karten und Entscheidungen werden nach ID aktualisiert. Nicht übermittelte Einträge bleiben erhalten. profile und projectMap ersetzen ihren jeweiligen Text: Integriere weiterhin gültige Informationen vor dem Speichern. [Details zum Datenformat](../skills/vibemind/references/records.md)

## Speicherung und Fehlerbehandlung

SQLite ist die aktive Datenquelle. Benutzer- und Projektrevisionen sind unabhängig; Änderungen und Snapshots werden in einer Transaktion gespeichert. DELETE-Journal, FULL-Synchronisierung, maximal drei Sekunden Wartezeit bei Sperren. init importiert gültiges altes state.json unter Erhalt der Bytes, Backups, Pause und offenen Entscheidungen. Das alte profile bleibt eine Projektbeobachtung; alte Karten werden vor explained-Nachweisen geprüft.

Beim Verschieben bleibt die ID erhalten. Eine Kopie wird abgelehnt, wenn der registrierte Ursprungsordner dieselbe Identität noch besitzt; eine unabhängige Wiederverwendung des alten Pfads blockiert die Wiederaufnahme nicht. init --new-project erstellt ausdrücklich leere, getrennte Projektdaten. projects/context --project-id lesen Historien nach dem Löschen des Ordners. user/record-user verwalten das gemeinsame Profil; Schreibvorgänge brauchen ein initialisiertes, aktives Quellprojekt (--cwd im CLI, projectPath in MCP). knowledge prüft den Erklärungsverlauf und bis zu zwei Beziehungsschritte, backup --output sichert online ohne Überschreiben. [Datenvertrag](../skills/vibemind/references/records.md)

Ausdrückliche Korrekturen verwenden record.retractEvidence (Nachweis-IDs des Quellprojekts) oder record.removeAliases (conceptId und alias); die alten Werte bleiben in Snapshots. Speichere kurze Zusammenfassungen: neue Strings maximal 128 KiB, Eingabe-JSON und Projektzustand maximal 512 KiB, MCP-Ergebnisse maximal 2 MiB, gemessen in UTF-8-Bytes. Zu große Schreibvorgänge werden vor dem Commit zurückgerollt; offene Entscheidungen werden nie still gekürzt. Alte große Datensätze bleiben per CLI lesbar und können verkleinert werden.

Aktualisiere Skill, CLI und MCP gemeinsam auf **0.5.0** und starte MCP neu. migrate sichert Schema 1/2 online und stellt auf Schema 3 um; alte Clients verweigern danach Schreibzugriffe. init --cwd bindet dasselbe Projekt und erhält Verlauf und Pause. sharing=summary teilt standardmäßig Lernbereiche/Zusammenfassungen ohne andere Projekttexte oder Codepfade; private verbirgt die Quelle, full erlaubt ausdrücklich vollständige Fälle. Zusammenfassungen dürfen keine privaten Details enthalten. Alias-Korrektur erfordert expectedGraphRevision. Bei Konflikten erneut lesen und integrieren; nach verlorener Antwort operation abfragen und dieselbe ID/Eingabe wiederholen. Ein Beleg beschreibt einen früheren Commit, nicht den aktuellen Modus. get liest exakte Datensätze, history paginiert, correct korrigiert ausdrücklich gelöschte/pausierte Quellen, purge löscht ein bestätigtes aktives Projekt samt Revisionen, ohne Backups/Host-Chats. Nach Offline-Wiederherstellung erst migrate --rotate-store-id --expected-store-id CURRENT_ID und init --rebind-store-id NEW_ID ausführen, dann Schreibprozesse starten. [Vollständiger Vertrag](../skills/vibemind/references/records.md)

Die Suche respektiert Git- und Worktree-Grenzen und lehnt symbolisch verknüpfte Zustandspfade ab. Alle offenen Entscheidungen werden wiederhergestellt, auch hinter langen Historien.

- Du kannst `.vibemind/` zu den Ignore-Regeln hinzufügen; die CLI ändert sie nicht.
- Bei einem Versionskonflikt liest du den aktuellen Zustand erneut und integrierst die neuen Daten.
- Prüfe Sperren mit doctor; recover-lock --cwd ... --lock-token UUID entfernt nur die passende Sperre nach bestätigt beendetem Prozess. Aktive oder unbekannte Sperren bleiben erhalten.
- Beschädigte oder nicht unterstützte Daten bleiben erhalten. init setzt sie nicht zurück.
- Scheitert das Backup oder Schreiben, bleibt der alte Zustand erhalten. Scheitert die Freigabe der Sperre, prüfe zunächst status: Die Änderung könnte bereits gespeichert sein.

Es gibt keinen automatischen Reset oder Befehl zum Zurückspielen eines Backups. Wenn dein Werkzeug die Daten liest, gelangen sie in den Kontext seines vorhandenen Modells. VibeMind lädt sie nicht zusätzlich hoch.

## Prüfung

```sh
node --check skills/vibemind/scripts/vibemind.mjs
node --check scripts/mcp.mjs
node --test
npx skills add . --list
```

Die Tests verwenden Nodes integrierten Test-Runner und temporäre Projekte. Geprüft werden Aktualisierungen, reine Lesevorgänge, Pausen, parallele Prozesse, beschädigte Daten, Backup- und Schreibfehler, Unicode-Pfade und Projektgrenzen. Prüfe die Führung in deinem Werkzeug: Sie sollte sich dem Kenntnisstand je Thema anpassen, offene Entscheidungen erhalten, Erklärungen standardmäßig nicht wiederholen und Erklärungen von nachgewiesener Anwendung unterscheiden.

## Quellen und Unterstützung

VibeMind übernimmt und adaptiert Ideen aus [VibeWise](https://github.com/nykooi1/vibe-wise) von Noah Kim: vom Lernenden gestaltete Entwürfe, direkte Erklärungen, Entscheidungspunkte, belegbare Lernbeobachtungen, Projektübersichten und die Wiederaufnahme offener Entscheidungen. Auch Projektgrenzen und Backups orientieren sich am Original.

Dieses Projekt ergänzt adaptive Programmierführung, Node-CLI, lokalen stdio-MCP, Benutzer-SQLite-Graph, Projektidentität, JSON-Migration, Transaktionssnapshots, Online-Backups und genaue projektübergreifende Erklärungskontrolle. Herkunft und beide MIT-Lizenzen stehen in [NOTICE.md](../skills/vibemind/NOTICE.md).

Die Unterstützungsbuttons führen zu denselben Zielen wie beim [Academic Paper Writer](https://github.com/TFboy1/academic-paper-writer) des Maintainers.

## 0.5.0: Wissensentdeckung über alle Roadmaps

Alle öffentlichen roadmap.sh-Roadmaps werden bei Bedarf online gelesen. Der Host-Agent wählt Fachgebiete, erweitert Suchbegriffe und beurteilt semantische Beziehungen. Lokales FTS5 und Lernhistorie wählen bis zu drei Chancen; unbekannte Fähigkeiten bleiben unknown.

Neue Befehle: discover (search/recommend), opportunities und extensions. record.growth speichert Kandidaten und tatsächliche Rückmeldungen; record-user.learningPreferences steuert off/normal und Roadmaps. explained und applied bleiben getrennt.

Aktive Projekte bieten nach Aufgabenabschluss höchstens eine Einladung pro identifizierbarer Sitzung. Ablehnung, Verschieben oder direkte Umsetzung stoppen weitere Einladungen dieser Sitzung. Annahme erteilt keine zusätzliche Implementierungserlaubnis.

Bei Ausfall offizieller Quellen folgen geeignete Mirrors. configure --roadmap-mirrors JSON erhält den Speicherpfad. Öffentliche Daten werden getrennt zwischengespeichert; Netzwerkfehler erzeugen keine Ersatzdatenbank.

Alle Hosts aktualisieren und Schema 1/2 ausdrücklich per migrate mit Online-Backup auf 3 bringen. Schema-2-Identität, Revisionen und Pause bleiben erhalten. Kein Vektormodell, vollständiger Tutorial-Download, automatischer Hook oder Frontend.

[Entdeckungsvertrag](../skills/vibemind/references/discovery.md) und [Quellen/Lizenzen](../skills/vibemind/NOTICE.md).
