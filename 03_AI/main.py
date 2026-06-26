from project.icm import compute_icm
from project.bf import calculate_equity_metrics
from project.state import State
from project.analysis import generate_risk_matrix, find_best_targets

def main():
    print("="*70)
    print("       POKER EV ENGINE: STRATEGIC TABLE REPORT V3")
    print("="*70)
    
    # バブル期のスタック状況
    stacks = [5000.0, 3000.0, 2000.0, 800.0]
    payouts = [500.0, 300.0, 200.0]
    sb, bb, ante = 100.0, 200.0, 20.0
    
    state = State(stacks, payouts, btn_idx=0, sb=sb, bb=bb, ante=ante)
    m_ratios = state.calculate_m_ratio()
    
    print(f"Stacks: {stacks}")
    print(f"M-Ratios: {[round(m,1) for m in m_ratios]}")
    print("-" * 70)
    
    # テーブル全体のリスク分析
    risk_matrix = generate_risk_matrix(stacks, payouts)
    
    # ヒーロー P0 (Chip Leader) の視点
    hero_idx = 0
    targets = find_best_targets(hero_idx, risk_matrix)
    
    print(f"[Leader Analysis] Hero: Player {hero_idx} (Stack: {stacks[hero_idx]})")
    print(f"Strategic Targets (Highest Risk Premium against Hero):")
    for target_idx, premium in targets:
        print(f"  - Target Player {target_idx}: {premium*100:.2f}% Risk Premium")
    
    # ヒーロー P2 (Middle Stack) の視点
    hero_idx = 2
    print(f"\n[Survival Analysis] Hero: Player {hero_idx} (Stack: {stacks[hero_idx]})")
    print(f"  M-Ratio: {m_ratios[hero_idx]:.1f} orbits left.")
    victim_of = find_best_targets(2, risk_matrix) # 実際は他者から見た自分だが、プレミアムで代用
    
    # P0が自分(P2)に対して持っているプレミアムを確認
    premium_v_leader = risk_matrix[2][0]
    print(f"  Risk Premium against Leader(P0): {premium_v_leader*100:.2f}%")
    
    if premium_v_leader > 0.15:
        print("  >> ADVICE: You are under extreme pressure from the leader. Avoid any confrontation.")
    
    print("="*70)

if __name__ == "__main__":
    main()
