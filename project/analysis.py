from typing import List
from .bf import calculate_equity_metrics

def generate_risk_matrix(stacks: List[float], payouts: List[float]):
    """
    全プレイヤー間のリスクプレミアム・マトリクスを生成します。
    matrix[hero][villain] = risk_premium
    """
    n = len(stacks)
    matrix = []
    for hero in range(n):
        row = []
        for villain in range(n):
            if hero == villain:
                row.append(0.0)
            else:
                m = calculate_equity_metrics(stacks, payouts, hero, villain)
                row.append(m['risk_premium'])
        matrix.append(row)
    return matrix

def find_best_targets(hero_idx: int, risk_matrix: List[List[float]]):
    """
    ヒーローが最もプレッシャーをかけられる(Risk Premiumが高い)ヴィランを特定します。
    """
    targets = []
    row = risk_matrix[hero_idx]
    for villain_idx, premium in enumerate(row):
        if hero_idx == villain_idx: continue
        targets.append((villain_idx, premium))
    
    # リスクプレミアムが高い順にソート (自分に対してリスクを感じている順)
    # ただし、自分がカバーしている必要がある（本来は外部で判定するがここではプレミアムのみ）
    return sorted(targets, key=lambda x: x[1], reverse=True)
