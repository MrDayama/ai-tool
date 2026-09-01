# 📜 ルール: テスト結果の Git リポジトリ同期 ＆ Obsidian 連携ルール

今後、機能改修・改善・テスト検証を行った際は、以下の手順を**必ず自動的に**実行すること。

1. **テスト結果資料の自動生成**:
   - テスト仕様書 ＆ 結果レポート（Excel `.xlsx` および PDF `.pdf`）を生成する。
   - Playwright によるハイスピードキャプチャ撮影画像（`.jpg` / `.png`）を保存する。

2. **Git リポジトリ (`docs/test-reports/`) への保存とコミット**:
   - 生成されたテスト資料（Excel、PDF、画像ファイル、Markdown）をプロジェクト内の `docs/test-reports/` ディレクトリに配備する。
   - `git add docs/test-reports/` を行い、明確なコミットメッセージ（例: `docs: 🧪 テスト結果資料(PDF/Excel/キャプチャ)の追加`）でコミットする。

3. **全追跡ブランチ ＆ `gh-pages` への同期プッシュ**:
   - `main`, `gh-pages`, `dev`, `ai-dev`, `deploy-timebomb` の全ブランチへプッシュし、GitHub 上（GitHub Pages 含む）でいつでも誰でも確認可能な状態を維持すること。
