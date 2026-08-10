---
type: research
tags: [AI/codex, AI/agent, AI/multi-agent]
date: 2026-07-07
status: active
source: https://x.com/jrpj2010/status/2071036419410362760
---

# Codex マルチエージェント活用研究ノート

> 出典: [佐藤勝彦 @jrpj2010](https://x.com/jrpj2010/status/2071036419410362760) / [Codex研究ラボ @Gencoin8](https://x.com/Gencoin8/status/2070679757478658485)

---

## Codexアプリの発見された機能

Codexアプリ内で**Claude Code**と**Gemini**を同時に使用可能。

### 役割分担モデル
| AI | 担当 |
|:---|:---|
| **Gemini** | チャット・対話 |
| **Claude** | 計画策定・チェック・レビュー |
| **Codex** | メイン作業（コード生成・実行） |

### 内蔵機能
- ターミナル
- ファイルエクスプローラー
- ビュワー
- 右上の小ボタンからアクセス

---

## 当プロジェクト（ai-agent）への応用検討

当Vaultの [[ai-agent]] は以下のマルチエージェント構造を持つ：
- Manager Agent（全体統括）
- Planner Agent（計画分解）
- Executor Agent（ツール実行）
- Critic Agent（結果評価）

### Codex方式との比較

| 観点 | 当ai-agent | Codex方式 |
|:---|:---|:---|
| エージェント数 | 4（Manager/Planner/Executor/Critic） | 3（Gemini/Claude/Codex） |
| 計画担当 | Planner Agent | Claude |
| 実行担当 | Executor Agent | Codex |
| 評価担当 | Critic Agent | Claude（チェック） |
| 対話担当 | Manager Agent | Gemini |

### 取り入れるべき要素
- [ ] **マルチLLM化**: 現在OpenAI一本 → Claude + Gemini併用を検討
- [ ] **役割の明確化**: 計画=Claude、実行=Codex的な分業をより明確に
- [ ] **チャットUI**: Geminiの対話能力をフロントエンドに活用

---

## 関連ノート
- [[03_AI/X_Tweet_Research_20260707]] — 元ツイート調査
- [[03_AI/MOC_AI_Tools]] — AI関連ツール地図
- [[Dashboard]] — ポータル
