# -*- coding: utf-8 -*-
import sys
import io

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

def calculate_round_points(scores, rule):
    n = len(scores)
    oka_points = ((rule['returnPoint'] - rule['startPoint']) * n) / 1000.0

    indexed = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)

    points = [0.0] * n
    ranks = [0] * n

    i = 0
    while i < n:
        j = i
        while j < n and indexed[j][1] == indexed[i][1]:
            j += 1
        tie_count = j - i
        sum_uma = sum(rule['uma'][k] for k in range(i, j) if k < len(rule['uma']))
        avg_uma = sum_uma / float(tie_count)

        for k in range(i, j):
            p_idx = indexed[k][0]
            ranks[p_idx] = i + 1

            raw_pt = (indexed[k][1] - rule['returnPoint']) / 1000.0
            if i == 0:
                raw_pt += (oka_points / float(tie_count))
            points[p_idx] = round(raw_pt + avg_uma, 1)
        i = j

    total_pt = sum(points)
    if abs(total_pt) > 0.0001:
        top_idx = indexed[0][0]
        points[top_idx] = round(points[top_idx] - total_pt, 1)

    return points, ranks

# テスト1: 四人麻雀
rule_4p = {'startPoint': 25000, 'returnPoint': 30000, 'uma': [20, 10, -10, -20]}
scores_4p = [35000, 27000, 23000, 15000] # 合計100000
pts_4p, ranks_4p = calculate_round_points(scores_4p, rule_4p)
sum_4p = sum(pts_4p)

print("[テスト1: 四人麻雀]")
print(f"入力素点: {scores_4p}, 合計: {sum(scores_4p)}")
print(f"精算スコア(pt): {pts_4p}")
print(f"精算スコア合計: {sum_4p:.1f} pt")
assert abs(sum_4p) < 0.001, "四麻スコア合計が0になっていません"
print("✅ 四麻合格: スコア合計が厳密に 0.0 pt\n")

# テスト2: 三人麻雀
rule_3p = {'startPoint': 35000, 'returnPoint': 40000, 'uma': [30, 0, -30]}
scores_3p = [48000, 37000, 20000] # 合計105000
pts_3p, ranks_3p = calculate_round_points(scores_3p, rule_3p)
sum_3p = sum(pts_3p)

print("[テスト2: 三人麻雀]")
print(f"入力素点: {scores_3p}, 合計: {sum(scores_3p)}")
print(f"精算スコア(pt): {pts_3p}")
print(f"精算スコア合計: {sum_3p:.1f} pt")
assert abs(sum_3p) < 0.001, "三麻スコア合計が0になっていません"
print("✅ 三麻合格: スコア合計が厳密に 0.0 pt")
