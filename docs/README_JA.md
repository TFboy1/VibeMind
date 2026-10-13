<div align="center">

<img src="../assets/banner.png" alt="VibeMind — Build with AI. Understand what you build." width="100%" />

<br/>

[![简体中文](https://img.shields.io/badge/简体中文-README-blue?style=flat-square)](../README.md)
[![English](https://img.shields.io/badge/English-README-blue?style=flat-square)](README_EN.md)
[![日本語](https://img.shields.io/badge/日本語-Current-red?style=flat-square)](#)
[![Français](https://img.shields.io/badge/Français-README-blue?style=flat-square)](README_FR.md)
[![Deutsch](https://img.shields.io/badge/Deutsch-README-blue?style=flat-square)](README_DE.md)

<br/>

[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install%20Skill-00C853?style=for-the-badge&logo=hackthebox&logoColor=white)](#installation)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.20.0-3C873A?style=for-the-badge&logo=nodedotjs&logoColor=white)](#requirements)
[![License](https://img.shields.io/badge/License-MIT-60A5FA?style=for-the-badge)](../LICENSE)
[![爱发电](https://img.shields.io/badge/爱发电-Support%20Me-FF69B4?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.ifdian.net/item/1a20ed042f0711f1865a52540025c377)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.creem.io/payment/prod_1yc40mIhKwwrc7iqFOG9G2)

<br/>

**AI と開発しながら、自分のペースで設計とコードを理解する。**

Vibe Coding 向けの適応型プログラミング伴走ツールチェーン。Skill、ローカル MCP、CLI で構成。
話題ごとにガイドの深さを調整し、プロジェクトをまたいで設計や知識の文脈を引き継ぎます。

</div>

## VibeMind とは

VibeMind は、Vibe Coding の開発フローに適応型のプログラミングガイドを組み込むツールチェーンです。Skill は実際のタスクとコードを踏まえ、話題ごとの理解度に応じて支援の深さを調整します。要件整理、実装案の比較、未知の概念の説明を行い、明確に許可された範囲を実装します。ローカル MCP と CLI は SQLite の記憶グラフを共有し、プロジェクトマップ、知識カード、設計判断、プロジェクトをまたぐ概念の説明履歴を保存します。

現在の AI ツールとモデルをそのまま使えます。MCP と CLI は `~/.vibemind/memory.sqlite` を共有し、プロジェクトには `.vibemind/project.json` の識別情報だけを保存します。設定と説明履歴はプロジェクトをまたいで利用できます。追加のアカウントやモデル API は不要で、stdio プロセスは宿主が管理します。

説明前に正確な概念 ID または明示的な別名で履歴を確認します。`alreadyExplained` は説明履歴の存在を表します。`explanationSummaries.scope` と今回の要件を比較し、既に扱った範囲だけを省き、未説明の基礎は説明します。応用の証拠がなくても自動で再説明しません。復習や再説明を明示的に求められた場合は説明できます。類似候補や親概念の履歴は対象概念の説明済み判定に使いません。

## ガイドの進め方

実際の改修内容と自分の考え方から始めます。Skill は既存コードや制約に照らして案を検討し、重要な設計上の選択肢を整理してから、明確に許可された範囲を実装します。

話題ごとのガイド深度は会話や実作業から調整し、最初のレベル確認質問票は使いません。初めての概念はその場で説明し、慣れている話題は今回の用途や新しい差分に進みます。説明を受けた記録と、ユーザーが実際に応用した証拠は別々に扱います。提案を求める、説明を省く、直接実装を依頼するといった指定もできます。

<a id="requirements"></a>

## 必要な環境

- **Node.js 22.20.0 以上**。
- ファイルの読み取りとローカルコマンド実行ができる AI ツール。
- CLI は Node 標準ライブラリのみを使用します。skills.sh からのインストールには npx も必要です。

<a id="installation"></a>

## インストール

### 方法 1：Agent に一文で依頼する

使用中の Agent に、次の一文を送ってください。

```text
https://github.com/TFboy1/VibeMind の README を読み、現在の AI ツールで使うプログラミングガイド Skill として vibemind をインストールしてください。Node.js ≥22.20.0 を確認し、references・scripts・NOTICE をすべて保持し、既存の Skill や VibeMind の記録を上書きせず、グローバル設定を変更せずに、プロジェクトでの呼び出し方を教えてください。
```

Agent は skills CLI またはツールのインポート機能を使えます。インポートを自動で完了できない場合は、ユーザーが操作する必要のある箇所を正確に説明します。

### 方法 2：手動でインストールする

#### skills CLI を使う

VibeMind を使うプロジェクトでターミナルを開きます。

```sh
npx skills add TFboy1/VibeMind --skill vibemind --copy
```

ツールを明示する場合：

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

初期設定ではプロジェクト単位でインストールします。`--copy` は通常のファイルコピーを使うため、Windows でも扱いやすい方法です。[skills CLI の説明](https://github.com/vercel-labs/skills)

#### 完全な ZIP をインポートする

1. 現在の 0.4.0 ソースから完全な Skill ZIP を作成します。[メイン README](../README.md) を参照してください。0.1.0 の ZIP は旧 JSON 方式のため、新 MCP と使う前に更新が必要です。
2. WorkBuddy の「Skills → Skill の追加 → アップロード」から ZIP をインポートします。Qoder や TRAE の対応するインポート画面でも同じ ZIP を利用できます。
3. 対象プロジェクトで `vibemind` を選択して呼び出します。

ZIP のルートには `SKILL.md`、`NOTICE.md`、`references/`、`scripts/` が必要です。SKILL.md だけを取り出さず、すべて保持してください。GitHub のリポジトリ全体の ZIP では、Skill は `skills/vibemind/` に入っています。

現在の skills CLI に WorkBuddy 専用のターゲットはないため、WorkBuddy のインポート機能を使います。[WorkBuddy 公式説明](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)

ローカルのソースからインストールする場合：

```sh
git clone https://github.com/TFboy1/VibeMind.git
npx skills add /absolute/path/to/VibeMind --skill vibemind --agent qoder --copy
```

空白を含む Windows パスは引用符で囲んでください。

## VibeMind を使う

対象プロジェクトで、例えば次のように依頼します。

> このプロジェクトで VibeMind をプログラミングガイドとして使ってください。この Vue＋FastAPI プロジェクトに在庫予約を追加したいので、まず既存コードと制約を確認し、実装案を比較してください。

使える依頼の例：

- 「このプロジェクトのコードを使って、この概念を説明してください。」
- 「基本は分かっています。ここでの使い方に進んでください。」
- 「実装案を提案してから、その内容を実装してください。」
- 「説明を省いて、合意した設計を実装してください。」
- 「CORS の知識カードを振り返りたいです。」
- 「VibeMind のガイドを一時停止してください。」
- 「VibeMind を再開し、未完了の判断から続けてください。」

Skill のインストールだけでプロジェクトが自動初期化・有効化されることはありません。対象プロジェクトで VibeMind を明示的に呼び出してください。その後の通常の開発依頼も、話題とプロジェクトの文脈に合わせてガイドします。新しい会話や別ツールでは、VibeMind をもう一度呼び出して文脈を復元します。初版には自動 Hook は含まれません。

設計の確認は、説明された設計を記録する操作です。それだけで未提示の実装まで許可されたとは扱いません。同じ範囲に対する明確な許可は再利用し、同じ確認を繰り返しません。

## ローカル MCP：一度の設定でプロジェクト横断の文脈を共有

完全なリポジトリを固定の場所に置き、一度 `npm ci` を実行します。宿主の stdio MCP 設定に実際の絶対パスを指定します。

```json
{"mcpServers":{"vibemind":{"command":"node","args":["/absolute/path/to/VibeMind/scripts/mcp.mjs"]}}}
```

Windows では `D:/tools/VibeMind/scripts/mcp.mjs` などを指定します。HTTP ポートは不要です。保存先を変更する場合、すべての宿主で同じ絶対 `VIBEMIND_HOME` を使います。接続だけではプロジェクトを初期化せず、ガイドも開始しません。Skill ZIP の CLI は Node 標準ライブラリのみで動作し、MCP は SDK を含む完全なリポジトリから実行します。

configure --memory-home <絶対ローカルディレクトリ> で共有ユーザー設定を一度保存すれば、後からインストールする宿主も使えます。VIBEMIND_HOME が優先されます。宿主や MCP/CLI を切り替える時は doctor/status で実際の storeId、パス、版、プロジェクト ID を確認します。全宿主の事前インストールは不要です。同一学習者・同一 OS・信頼できるローカルファイルシステムが対象です。

## CLI

インストールされたスクリプトの完全なパスと、対象プロジェクトを指定します。

```sh
node skills/vibemind/scripts/vibemind.mjs --help
node skills/vibemind/scripts/vibemind.mjs init --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs status --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project --topic CORS
node skills/vibemind/scripts/vibemind.mjs pause --cwd /path/to/project < pause-request.json
node skills/vibemind/scripts/vibemind.mjs resume --cwd /path/to/project < resume-request.json
```

読み取りは記録を変更しません。`context` は通常 Markdown を出力し、`--json` を加えると JSON を返します。その他のコマンドは JSON を出力します。エラーは stderr に出力され、終了コードは 0 以外になります。

`record` は UTF-8 JSON を標準入力から読みます。pause/resume を含む全更新に、現在の `expectedStoreId`、`expectedProjectId`、`expectedRevision` と新しい UUID `operationId` が必要です。record-user の版は userRevision です。下の pause/resume 用ファイルには直前の状態から取得した制御項目を入れます。record には更新項目も必要です。カードは id/title/content、判断は追加で stage を持ちます。

| stage | 意味 |
|---|---|
| `reasoning` | ユーザーの考え方を待っている |
| `design` | 設計の確認を待っている |
| `implementation` | 実装の許可を待っている |
| `completed` | 今回の検討項目は終了した。コードの実装完了を意味するとは限らない |

カードと判断は ID ごとに更新され、提出していない記録は保持されます。profile と projectMap は各テキストを置き換えるため、有効な既存情報を統合してから保存します。[詳細な記録仕様](../skills/vibemind/references/records.md)

## 保存と障害対応

活動データはユーザー側の SQLite です。ユーザーとプロジェクトの revision は独立し、更新とスナップショットを同じトランザクションで保存します。DELETE ジャーナル、FULL 同期、最大 3 秒のロック待機を使用します。init は有効な旧 state.json を、元のバイト列、バックアップ、停止状態、未完了判断を保持したまま移行します。旧 profile はプロジェクトの観察として保持し、旧カードは説明の事実を確認してから explained 証拠を補います。

移動は ID で継続します。元の登録先が同じ ID を保持する複製だけを拒否し、無関係なディレクトリによる旧パスの再利用は復元を妨げません。明示的な init --new-project で独立した空の記録を作ります。ディレクトリ削除後も projects と context --project-id で履歴を読めます。user/record-user は共通設定で、更新には初期化済みの有効な出所プロジェクト（CLI の --cwd、MCP の projectPath）が必須です。knowledge は正確な説明履歴と最大 2 ホップの関連、backup --output は上書きしない SQLite オンラインバックアップです。[記録仕様](../skills/vibemind/references/records.md)

誤記の明示的な訂正には record.retractEvidence（出所プロジェクトの証拠 ID）または record.removeAliases（conceptId と alias）を使い、旧内容はスナップショットに保持します。短い要約を保存し、UTF-8 バイト数で新規文字列は 128 KiB、入力 JSON とプロジェクト状態は 512 KiB、MCP の結果は 2 MiB までです。上限超過の更新はコミット前にロールバックし、未完了判断は切り捨てません。旧大容量記録は CLI で読んで縮小できます。

Skill、CLI、MCP を **0.4.0** に更新し MCP を再起動します。migrate が schema 1 をオンラインバックアップして schema 2 に移行し、旧書き込み器を拒否します。init --cwd で同じプロジェクトをバインドし、履歴や停止状態を保ちます。既定 sharing=summary は説明範囲/要約のみ共有し、他のプロジェクト本文やコード位置は返しません。private はその出所を隠し、full は明示的に完全な例を共有します。要約に秘密を含めないでください。別名訂正には expectedGraphRevision が必要です。競合は再読して統合し、応答不明時は operation で確認、同一 ID/入力で再試行します。記録された応答は過去のコミットを示し、現在の状態ではありません。get は精確な記録、history はページング、correct は削除済み/停止出所の明示訂正、purge は確認した活動プロジェクトの削除（バックアップ/会話を除く）です。オフライン復元後は migrate --rotate-store-id --expected-store-id CURRENT_ID と init --rebind-store-id NEW_ID で旧要求を拒否してから書き込み器を再開します。[記録仕様](../skills/vibemind/references/records.md)

Git と worktree の境界を越えて別プロジェクトの状態を読まず、状態パスのシンボリックリンクも拒否します。長い記録の後ろにある未完了の判断もすべて復元します。

- 必要に応じて `.vibemind/` をプロジェクトの無視ルールに加えてください。CLI は自動編集しません。
- バージョン競合では、最新の記録を読み直し、内容を統合して再提出します。
- ロック競合は doctor で確認します。recover-lock --cwd ... --lock-token UUID はプロセス終了を確認できる一致したロックだけを消去します。稼働中/不明のロックは消しません。
- 壊れた記録や非対応の形式は保持して報告します。init で初期化し直しません。
- バックアップや書き込みの失敗では旧状態を保持します。ロック解放エラーでは、保存済みの可能性があるため先に status を確認します。

自動リセットやバックアップを書き戻すコマンドはありません。記録が宿主に読まれると、その既存モデルのコンテキストに入ります。VibeMind が別途アップロードすることはありません。

## 検証

```sh
node --check skills/vibemind/scripts/vibemind.mjs
node --check scripts/mcp.mjs
node --test
npx skills add . --list
```

Node 標準のテストランナーと一時プロジェクトを使用し、更新、読み取り専用の復元、一時停止、複数プロセスの競合、壊れたデータ、保存失敗、Unicode パス、プロジェクト分離を検証します。実際のガイド体験は宿主で確認してください。話題ごとに深度を調整すること、未完了の判断を保持すること、説明を聞いただけで応用済みとしないことが重要です。

## 出典と支援

Noah Kim 氏の [VibeWise](https://github.com/nykooi1/vibe-wise) から、ユーザー主体の設計、概念の直接説明、判断のチェックポイント、証拠に基づく記録、プロジェクトマップと未完了判断の再開という考え方を参考に、VibeMind のガイド手順として再構成しています。プロジェクト境界とバックアップの設計も原作を参考にしています。

VibeMind は適応型のプログラミングガイド、Node CLI、ローカル stdio MCP、ユーザー SQLite 図構造、プロジェクト ID、旧記録移行、トランザクション履歴とオンラインバックアップ、プロジェクト横断の説明履歴確認を追加しています。出典と両方の MIT ライセンスは [NOTICE.md](../skills/vibemind/NOTICE.md) に含まれます。

上の支援ボタンは、保守者の [Academic Paper Writer](https://github.com/TFboy1/academic-paper-writer) と同じリンクを使っています。
