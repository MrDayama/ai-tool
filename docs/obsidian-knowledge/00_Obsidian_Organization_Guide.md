---
title: 🧠 Obsidian ナレッジ整理ガイドライン ＆ ベストプラクティス
tags: [obsidian, knowledge-management, para-method, moc]
category: Guide
updated_at: 2026-09-01
---

# 🧠 Obsidian ナレッジ整理ガイドライン ＆ ベストプラクティス

開発効率化およびチーム・AI エージェント間での知見共有を最大化するための、Obsidian ノート整理手法・ディレクトリ設計ガイドラインです。

---

## 📌 1. P.A.R.A メソッドに基づくディレクトリ構造

Obsidian のフォルダ構造には、Tiago Forte 氏が提唱する世界的標準手法 **P.A.R.A メソッド** を採用します。

```text
docs/obsidian-knowledge/
├── 00_INDEX_MOC.md                    # 🗺️ 全体の目次・マップノート (Map of Content)
├── 00_Obsidian_Organization_Guide.md  # 🧠 本整理ガイドライン
│
├── 10_Projects/                        # 🚀 進行中の具体的プロジェクト・タスク
│   └── PokerMemo_V3_Refactor.md
│
├── 20_Areas/                           # 🛡️ 長期的に維持・運用する開発ルール・品質基準
│   ├── Git_Test_Reports_Rule.md       # Gitテスト結果同期・ファイル命名ルール
│   └── Always_Update_Progress_Rule.md # 右サイドバー進捗リアルタイム更新ルール
│
├── 30_Resources/                       # 💡 再利用可能な開発効率化資料・プロンプト・手法
│   ├── Realtime_Progress_Pattern.md   # 他エージェント/フレームワーク汎用右サイドバーパターン
│   ├── Playwright_Auto_Testing.md     # エビデンス自動撮影・テストスクリプト構築ノウハウ
│   ├── Excel_PDF_Report_Generator.md  # 高度構造化Excel・PDF自動生成ノウハウ
│   └── Widescreen_UI_Layout_Guide.md  # 3カラム＆レスポンシブUIレイアウトガイド
│
└── 40_Archives/                        # 📦 過去の履歴・旧バージョン資料
    └── Legacy_Test_Reports/
```

---

## 🗺️ 2. MOC (Map of Content: 目次ノート) の活用

検索性を高めるため、すべてのフォルダのハブとなる **`00_INDEX_MOC.md`** を設置します。
新しいナレッジノートを作成した際は、必ず MOC にリンクを追加してください。

---

## 🏷️ 3. YAML フロントマター (Frontmatter) の標準規格

すべての Markdown ノートの最上部に、以下のメタデータを付与します：

```yaml
---
title: ノートのタイトル
tags: [dev-efficiency, testing, prompt, git]
category: Resources  # Projects, Areas, Resources, Archives のいずれか
updated_at: YYYY-MM-DD
---
```

---

## 🚀 4. 開発効率化への活用ポイント

1. **AI エージェントとの共有**:
   - `.agents/rules/` やプロンプトから `docs/obsidian-knowledge/` 内のノートを直接参照させることで、エージェントの行動精度が大幅に向上します。
2. **Git バージョン管理**:
   - すべてのナレッジを Markdown 形式で Git にコミット・同調プッシュすることにより、どの環境からでも最新の知見にアクセス可能です。
