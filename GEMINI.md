# Antigravity ワークスペース設定 & 自動化開発ルール

## 1. 自動化＆パーミッション設定 (Automated Execution & Access Policies)
- **Tool Execution Policy**: `always-proceed`（確認ダイアログを出さずにツールを自動実行）
- **Non-Workspace File Access**: `allow`（`C:\Users\0pn32\.gemini\` や設定ファイルへのアクセスを常時許可）
- **Artifact Review Mode**: `always-proceed`（作成した実装計画書を右ペインに自動展開）

## 2. 対話・確認ルール (Japanese Interaction & Communication)
- チャットでの回答はすべて完全な日本語で行ってください。（Always respond in japanese）
- **【事前日本語確認】**: ツール実行やファイル修正を行う際は、システムの英語ポップアップを出さず、必ず**チャット上で事前に「【作業許可のお願い】〇〇を実行します」と実行目的・具体内容・影響範囲を日本語で明確に説明**してください。

## 3. 右ペイン計画＆タスク常時表示 (Right Pane Workflow)
- 作業開始時や変更時は、必ず右ペイン（Auxiliary Pane）に Implementation Plan (`implementation_plan.md`) および Task List (`task.md`) を作成・表示してください。
- **【計画記載の超詳細化】**: 単なる概要にとどめず、**全体作業の工程、対象ファイル・関数、具体的修正内容、前提条件、検証手順、および潜在リスクをステップバイステップで網羅して明記**してください。

## 4. 各モデル別 AIトークン消費量・残量の右ペインリアルタイム監視 (Token Monitoring)
- 右ペインのアーティファクト上部に、主要モデル（Gemini 3.6 Flash / Gemini 3.6 Pro / Gemini 3.5 Flash Lite）ごとの **最大コンテキスト枠・推定消費量・残量比較ダッシュボード** を常に設置・更新してください。

## 5. Obsidian Vault 運用権限 (Obsidian Authority Rules)
- `01_Imo/` (思考メモ) および `02_Read-only/` (静的ツール) は **読込専用 (保護)** とし、上書き・削除を行わないでください。
- AIの出力物や作業ログは `03_AI/` または各開発プロジェクトフォルダ (`ai-agent/`, `timebomb-game/`, `icm-calculator/` 等) に保存・更新してください。
