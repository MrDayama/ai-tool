# 📜 ルール: 他フレームワーク・AIエージェント汎用「右サイドバー進捗ダッシュボード」運用テンプレート

本ルールおよびナレッジ仕様書は、他プロジェクトや他の AI エージェント（LangChain, AutoGen, CrewAI, Cursor, Cline, Roo Code, Claude Code 等）でも全く同じように「画面右サイドバーで進捗をサブタスク項目ごとに即時更新・表示させる」ための標準設計ルールです。

---

## 📌 汎用プロンプト・ルール適用手順

1. **Obsidian ナレッジドキュメントの参照**:
   - `docs/obsidian-knowledge/Realtime_Progress_Sidebar_Pattern.md` を参照またはコピーする。

2. **他エージェント環境への組み込み方法**:
   - **Cursor / Cline / Roo Code**: ルールファイル (`.cursorrules` / `.clinerules`) に本文のプロンプト定義を追加する。
   - **LangChain / AutoGen / CrewAI**: システムプロンプトおよびコールバックハンドラー（Tool End Event）に `PROGRESS.md` の自動生成・更新ロジックを配置する。
   - **Antigravity / Gemini / Claude Code**: 右側の Auxiliary Pane / Artifact 機能と連動させる。

3. **項目ごとの即時リアルタイム更新原則**:
   - どんな開発・改修作業であっても、全作業終了時の一括更新を禁止し、細かなサブタスク（Step 1, Step 2, Step 3...）が 1 つ完了・進行するたびに即座に進捗ドキュメントを書き換えること。
