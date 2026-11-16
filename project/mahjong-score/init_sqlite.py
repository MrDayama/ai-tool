import sqlite3
import json
import sys
import io
from pathlib import Path
from datetime import datetime

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DIR = Path(__file__).parent
SCHEMA_FILE = DIR / "schema.json"
DB_FILE = DIR / "mahjong_score.db"

def init_database():
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        schema = json.load(f)

    if DB_FILE.exists():
        DB_FILE.unlink()

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # DDL
    cursor.execute("""
    CREATE TABLE players (
        player_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE sessions (
        session_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE matches (
        match_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        round_number INTEGER NOT NULL,
        total_score_sum REAL NOT NULL,
        is_valid_zero INTEGER NOT NULL,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE match_scores (
        score_id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        score_point REAL NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches (match_id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players (player_id) ON DELETE CASCADE
    );
    """)

    # ビュー作成
    cursor.execute(schema["views"]["v_player_leaderboard"]["query"]
                   .replace("SELECT", "CREATE VIEW v_player_leaderboard AS SELECT"))

    cursor.execute(schema["views"]["v_match_details"]["query"]
                   .replace("SELECT", "CREATE VIEW v_match_details AS SELECT"))

    # サンプルプレイヤー登録
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sample_players = ["田中", "山田", "佐藤", "鈴木", "高橋"]
    player_id_map = {}
    for p in sample_players:
        cursor.execute("INSERT INTO players (name, created_at) VALUES (?, ?)", (p, now))
        player_id_map[p] = cursor.lastrowid

    # サンプルセッション
    cursor.execute("INSERT INTO sessions (session_name, rule_type, created_at) VALUES (?, ?, ?)",
                   ("2026-09-29 セット対局", "4p", now))
    session_id = cursor.lastrowid

    # 第1半荘: 田中+45.0, 山田+8.0, 佐藤-18.0, 鈴木-35.0 (合計0.0)
    cursor.execute("INSERT INTO matches (session_id, round_number, total_score_sum, is_valid_zero, recorded_at) VALUES (?, ?, ?, ?, ?)",
                   (session_id, 1, 0.0, 1, now))
    m_id_1 = cursor.lastrowid
    for name, pt in [("田中", 45.0), ("山田", 8.0), ("佐藤", -18.0), ("鈴木", -35.0)]:
        cursor.execute("INSERT INTO match_scores (match_id, player_id, score_point) VALUES (?, ?, ?)",
                       (m_id_1, player_id_map[name], pt))

    # 第2半荘: 鈴木交代で高橋参加: 田中-12.0, 山田+30.0, 佐藤+15.0, 高橋-33.0 (合計0.0)
    cursor.execute("INSERT INTO matches (session_id, round_number, total_score_sum, is_valid_zero, recorded_at) VALUES (?, ?, ?, ?, ?)",
                   (session_id, 2, 0.0, 1, now))
    m_id_2 = cursor.lastrowid
    for name, pt in [("田中", -12.0), ("山田", 30.0), ("佐藤", 15.0), ("高橋", -33.0)]:
        cursor.execute("INSERT INTO match_scores (match_id, player_id, score_point) VALUES (?, ?, ?)",
                       (m_id_2, player_id_map[name], pt))

    conn.commit()
    conn.close()
    print(f"✅ SQLiteデータベース初期化完了: {DB_FILE}")

if __name__ == "__main__":
    init_database()
