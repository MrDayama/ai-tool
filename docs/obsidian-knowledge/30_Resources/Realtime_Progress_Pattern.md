# 🧠 Obsidian Knowledge: 他フレームワーク・AIエージェント汎用「右サイドバー進捗ダッシュボード」設計パターン ＆ プロンプトテンプレート

あらゆる AI エージェント（LangChain, AutoGen, CrewAI, Cursor, Cline, Roo Code, Claude Code, Antigravity 等）において、**作業画面の右サイドバー（アーティファクト / 分割プレビュー / Markdown パネル）に進捗と作業予定を常時固定表示し、サブタスク項目が 1 つ完了するごとに即時リアルタイム更新させるための標準パターン＆プロンプト定義書**です。

---

## 📌 1. 概要と適用可能フレームワーク

### 目的
AI エージェントが作業を行う際、ユーザーが「現在どこまで進んでいるか」「次に何をするか」を迷わずに追跡できるよう、チャット本文とは別に**画面右側の専用パネル（Markdownプレビュー/サイドバー）に進捗ダッシュボードを表示・即時更新**させる仕組み。

### 適用可能環境・ツール
- **Cursor / Cline / Roo Code / VS Code (Split Preview)**: 右側の Markdown サイドプレビュー機能 (`Ctrl + K, V`) を活用
- **LangChain / LangGraph / CrewAI / AutoGen**: システムプロンプトおよびコールバック（Callback Handler）で進捗ドキュメント (`PROGRESS.md`) をリアルタイム上書き生成
- **Antigravity / Gemini / Claude Code**: 右側の Auxiliary Pane (Artifact) に即時反映

---

## 📜 2. 汎用システムプロンプト ＆ ルールテンプレート

以下のテキストを、他の AI エージェントの **System Prompt (指示書)** または **ルールファイル (`.clinerules`, `.cursorrules`, `SYSTEM_PROMPT.md`)** にコピー＆ペーストして使用してください。

```markdown
# 📜 汎用ルール: 画面右サイドバー進捗ダッシュボード「サブタスク項目ごと即時リアルタイム更新」ルール

あなたはタスクを実行するAIエージェントです。すべての作業（コード作成、修正、テスト、調査、ドキュメント作成等）において、以下の進行ルールを厳格に遵守してください。

---

### ⚡ 1. サイドバー進捗パネルの即時生成 ＆ 固定
- 作業開始時、直ちに画面右側サイドバー用の進捗管理ドキュメント (`PROGRESS.md` または指定アーティファクト) を作成すること。
- 右側の分割ウィンドウ/プレビューパネルで常時閲覧・ドッキング可能な状態を維持すること。

### ⚡ 2. 一括更新の禁止 ＆ サブタスク項目ごとの即時リアルタイム更新原則
- **一括更新の禁止**: 全作業が終了した最後の完了時のみにまとめて進捗を更新することを厳禁とする。
- **項目ごとの即時更新**: 全体タスクを構成する細かなサブタスク（Step 1, Step 2, Step 3...）が 1 つ完了・進展するたびに、即座に進捗ドキュメントを書き換え更新し、右側パネルにリアルタイムな進捗推移を表示させること。

---

### 📋 3. 進捗ドキュメント (`PROGRESS.md`) 標準レイアウト構造

```markdown
# 📊 [プロジェクト名 / 機能名] リアルタイム進捗ダッシュボード

> [!NOTE]
> **現在進行中ステータス**: [現在取り組んでいるサブタスク名]
> **全体進捗率**: `[████████████░░░░░░░░░░░░░░] XX% (Step N / Total N 完了)`

---

## 📋 1. サブタスク項目ごとのリアルタイム進捗

| 項目No. | サブタスク項目内容 | 期待される結果 / 仕様 | ステータス | 進捗 | 対象ファイル / 成果物 |
|:---:|:---|:---|:---:|:---:|:---|
| **Step 1** | [サブタスク 1 内容] | [詳細] | ✅ **完了** | 100% | `path/to/file1` |
| **Step 2** | [サブタスク 2 内容] | [詳細] | 🔄 **実行中** | 50% | `path/to/file2` |
| **Step 3** | [サブタスク 3 内容] | [詳細] | ⏳ **待機中** | 0% | `path/to/file3` |

---

## 🏢 2. メタデータ
- **プロジェクト名**: [Project ID]
- **更新日時**: [YYYY-MM-DD HH:mm]
```
```

---

## 🛠 3. 各フレームワーク別 実装ガイドライン

### A. Cursor / Cline / Roo Code (VS Code 拡張)
- プロジェクト直下に `.cursorrules` または `.clinerules` を作成し、上記ルールを記述。
- 作業開始時に `PROGRESS.md` を作成し、VS Code の `Markdown: Open Preview to the Side` (`Ctrl + K, V`) で画面右側に表示固定する。
- 1ステップ終わるごとに `PROGRESS.md` を上書き保存するよう指示。

### B. LangChain / LangGraph (Python)
- エージェントの各 Tool 実行後 (Post-tool execution) に、Callback Handler で `PROGRESS.md` を書き換える Custom Callback を組み込む。

```python
from langchain.callbacks.base import BaseCallbackHandler
import os

class RealtimeProgressSidebarCallback(BaseCallbackHandler):
    def on_tool_end(self, output: str, **kwargs):
        # ツール実行完了ごとに PROGRESS.md を自動更新
        progress_md = generate_updated_progress_md()
        with open("PROGRESS.md", "w", encoding="utf-8") as f:
            f.write(progress_md)
```

### C. AutoGen / CrewAI / Multi-Agent
- 進捗更新専用の「Monitor / Supervisor Agent」を1台配置し、他の Worker Agent が1項目完了して報告するたびに `PROGRESS.md` を更新させる。

---

## 💡 4. この設計パターンのメリット
1. **透明性の最大化**: ユーザーはエージェントが「今まさにどのサブタスクを実行中か」をリアルタイムで追跡できる。
2. **コンテキスト切れ防止**: 長時間のセッションでも右側の進捗パネルを参照することで、AI自身が目的を見失わずに完遂できる。
3. **完全なフレームワーク互換性**: 標準 Markdown 仕様に基づいているため、どんな AI ツール・IDE・エージェント基盤でも即座に導入可能。
