from typing import List
from .icm import compute_icm
from .state import State

def compute_fgs_ev(state: State, depth: int = 1) -> List[float]:
    """
    FGS (Future Game Simulation) ベースのEVを計算します。
    簡易版として、1ハンド先の状態（ブラインド徴収後）のICM値を返します。
    
    Args:
        state: 現在の状態
        depth: 先読みの深さ（現在は1のみサポート）
        
    Returns:
        各プレイヤーのFGS期待値リスト
    """
    if depth == 0:
        return compute_icm(state.stacks, state.payouts)
        
    # 次のハンドへ移行
    next_state = state.get_next_state()
    
    # 次のハンドが始まる際のブラインド徴収後のスタック
    blinded_stacks = next_state.collect_blinds_and_antes()
    
    # その状態でのICM
    fgs_evs = compute_icm(blinded_stacks, state.payouts)
    
    return fgs_evs
