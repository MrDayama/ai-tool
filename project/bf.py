from typing import List
from .icm import compute_icm
from .fgs import compute_fgs_ev
from .state import State

def compute_bubble_factor(stacks: List[float], payouts: List[float], hero_idx: int, villain_idx: int) -> float:
    """
    バブルファクターを計算します。
    BF = (EV_now - EV_lose) / (EV_win - EV_now)
    
    Args:
        stacks: 各プレイヤーのスタックサイズ
        payouts: 各順位の賞金
        hero_idx: ヒーローのインデックス
        villain_idx: ヴィランのインデックス
        
    Returns:
        バブルファクター (float)
    """
    if hero_idx == villain_idx:
        return 1.0
        
    # 現在のEV
    ev_now_list = compute_icm(stacks, payouts)
    ev_now = ev_now_list[hero_idx]
    
    # 有効スタック
    effective_stack = min(stacks[hero_idx], stacks[villain_idx])
    
    # ヒーローが勝利した場合のスタック
    stacks_win = list(stacks)
    stacks_win[hero_idx] += effective_stack
    stacks_win[villain_idx] -= effective_stack
    
    ev_win_list = compute_icm(stacks_win, payouts)
    ev_win = ev_win_list[hero_idx]
    
    # ヒーローが敗北した場合のスタック
    stacks_lose = list(stacks)
    stacks_lose[hero_idx] -= effective_stack
    stacks_lose[villain_idx] += effective_stack
    
    ev_lose_list = compute_icm(stacks_lose, payouts)
    ev_lose = ev_lose_list[hero_idx]
    
    # BFの計算
    denominator = ev_win - ev_now
    if denominator <= 0:
        # すでに1位確定などでEVが増えない場合などは例外的に回避
        return 1.0
        
    bf = (ev_now - ev_lose) / denominator
    return bf

def compute_fgs_bf(state: State, hero_idx: int, villain_idx: int) -> float:
    """
    FGSベースのバブルファクターを計算します。
    
    Args:
        state: 現在の状態
        hero_idx: ヒーローのインデックス
        villain_idx: ヴィランのインデックス
        
    Returns:
        FGSバブルファクター
    """
    if hero_idx == villain_idx:
        return 1.0
        
    # 現在のFGS EV
    ev_now_list = compute_fgs_ev(state)
    ev_now = ev_now_list[hero_idx]
    
    # 有効スタック
    effective_stack = min(state.stacks[hero_idx], state.stacks[villain_idx])
    
    # ヒーローが勝利した場合の状態
    state_win = state.copy()
    state_win.stacks[hero_idx] += effective_stack
    state_win.stacks[villain_idx] -= effective_stack
    
    ev_win_list = compute_fgs_ev(state_win)
    ev_win = ev_win_list[hero_idx]
    
    # ヒーローが敗北した場合の状態
    state_lose = state.copy()
    state_lose.stacks[hero_idx] -= effective_stack
    state_lose.stacks[villain_idx] += effective_stack
    
    ev_lose_list = compute_fgs_ev(state_lose)
    ev_lose = ev_lose_list[hero_idx]
    
    # BFの計算
    denominator = ev_win - ev_now
    if denominator <= 0:
        return 1.0
        
    bf = (ev_now - ev_lose) / denominator
    return bf

def calculate_equity_metrics(stacks: List[float], payouts: List[float], hero_idx: int, villain_idx: int):
    """
    実戦的な勝率メトリクスを計算します。
    """
    bf = compute_bubble_factor(stacks, payouts, hero_idx, villain_idx)
    
    # 1. 必要勝率 (ICMベース)
    req_equity = bf / (bf + 1)
    
    # 2. チップ上の必要勝率 (Chip EVベース)
    # 本来はポットサイズに依存するが、ここでは有効スタック同士の衝突(1:1)を仮定
    chip_ev_req = 0.5 
    
    # 3. リスクプレミアム
    risk_premium = req_equity - chip_ev_req
    
    return {
        "bubble_factor": bf,
        "required_equity": req_equity,
        "risk_premium": max(0, risk_premium)
    }
