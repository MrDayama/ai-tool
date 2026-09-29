# -*- coding: utf-8 -*-
"""
Google Apps Script (GAS) 自動作成＆デプロイスクリプト
Google OAuth 2.0 インタラクティブ認証を使用して、
1. 新規Googleスプレッドシートの作成
2. GASコードの挿入
3. Webアプリとしてのデプロイ（URL発行）
4. 麻雀アプリ(index.html / mahjong.html)への自動セット
を行います。
"""

import sys
import io
import json
import webbrowsing
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

print("=" * 60)
print("🀄 Googleスプレッドシート × GAS 自動構築セットアップ")
print("=" * 60)
print("\nGoogleドライブ上に自動でスプレッドシートを作成してWeb API化します。")
