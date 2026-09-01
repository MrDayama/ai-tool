---
title: 📊 Gitテスト結果自動同期 ＆ プロジェクト識別ルール
tags: [git, test-reports, rules, automation]
category: Areas
updated_at: 2026-09-01
---

# 📊 Gitテスト結果自動同期 ＆ プロジェクト識別ルール

今後すべてのプロジェクトにおいて、テスト結果およびエビデンス資料をコミット・デプロイする際の標準規格です。

---

## 📌 1. ファイル命名規則
- **Excel 報告書**: `[プロジェクト名]_[機能名]_Test_Report_[バージョン].xlsx`  
  *(例: `ai-tool_poker-memo_Test_Report_v20260901_30000.xlsx`)*
- **PDF 報告書**: `[プロジェクト名]_[機能名]_Test_Report_[バージョン].pdf`

---

## 📌 2. 配置・Git同期運用
- ディレクトリ: `docs/test-reports/[プロジェクトID]/[バージョン名]/`
- 同期範囲: `main`, `gh-pages`, `dev`, `ai-dev`, `deploy-timebomb` の全追跡ブランチへ強合同期プッシュ。
