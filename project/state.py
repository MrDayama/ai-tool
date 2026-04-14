from typing import List, Dict
import copy

class State:
    def __init__(self, stacks: List[float], payouts: List[float], btn_idx: int, sb: float, bb: float, ante: float):
        """
        ゲームの状態を管理します。
        
        Args:
            stacks: 各プレイヤーのスタック
            payouts: 賞金設定
            btn_idx: BTNのインデックス
            sb: スモールブラインド額
            bb: ビッグブラインド額
            ante: アンティ額（各プレイヤーから徴収）
        """
        self.stacks = list(stacks)
        self.payouts = list(payouts)
        self.btn_idx = btn_idx
        self.sb = sb
        self.bb = bb
        self.ante = ante
        self.n_players = len(stacks)

    def copy(self):
        """状態のデープコピーを返します。"""
        return copy.deepcopy(self)

    def get_next_state(self):
        """
        次のハンドの状態を返します（BTNが1つ進む）。
        ブラインドの支払いは各ハンドの開始時に行われる想定です。
        """
        next_state = self.copy()
        next_state.btn_idx = (self.btn_idx + 1) % self.n_players
        return next_state

    def collect_blinds_and_antes(self) -> List[float]:
        """
        現在の状態でブラインドとアンティを徴収した後のスタックを計算します。
        実演上、スタックがマイナスにならないように処理します。
        """
        new_stacks = list(self.stacks)
        n = self.n_players
        
        # アンティ
        for i in range(n):
            cost = min(new_stacks[i], self.ante)
            new_stacks[i] -= cost
            
        # SB (BTNの次)
        sb_idx = (self.btn_idx + 1) % n
        cost_sb = min(new_stacks[sb_idx], self.sb)
        new_stacks[sb_idx] -= cost_sb
        
        # BB (BTNの次々)
        bb_idx = (self.btn_idx + 2) % n
        cost_bb = min(new_stacks[bb_idx], self.bb)
        new_stacks[bb_idx] -= cost_bb
        
        return new_stacks

    def calculate_m_ratio(self) -> List[float]:
        """
        M-Ratioを計算します (Stack / (SB + BB + Ante*N)).
        """
        orbit_cost = self.sb + self.bb + (self.ante * self.n_players)
        if orbit_cost <= 0: return [999.0] * self.n_players
        return [s / orbit_cost for s in self.stacks]

    def __repr__(self):
        return f"State(stacks={self.stacks}, btn={self.btn_idx})"
