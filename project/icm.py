from typing import List, Tuple

class ICMEngine:
    def __init__(self):
        self._memo = {}

    def compute_icm(self, stacks: List[float], payouts: List[float]) -> List[float]:
        """
        ICM (Independent Chip Model) を計算します。
        
        Args:
            stacks: 各プレイヤーのスタックサイズ
            payouts: 各順位の賞金
            
        Returns:
            各プレイヤーの賞金期待値(EV)
        """
        n_players = len(stacks)
        total_chips = sum(stacks)
        
        if total_chips <= 0:
            return [0.0] * n_players
            
        # 賞金リストをプレイヤー数に合わせる（不足分は0）
        full_payouts = list(payouts) + [0.0] * (n_players - len(payouts))
        full_payouts = tuple(full_payouts[:n_players])
        
        self._memo = {}
        return self._recursive_calculate(tuple(stacks), full_payouts)

    def _recursive_calculate(self, stacks: Tuple[float, ...], payouts: Tuple[float, ...]) -> List[float]:
        state = (stacks, payouts)
        if state in self._memo:
            return self._memo[state]
        
        n_players = len(stacks)
        n_payouts = len(payouts)
        
        # ベースケース: 賞金がもうない、または全てのプレイ可能なスタックを処理した
        if n_payouts == 0 or sum(stacks) <= 0:
            return [0.0] * n_players
        
        # 現在の順位の賞金
        current_payout = payouts[0]
        remaining_payouts = payouts[1:]
        
        total_chips = sum(stacks)
        evs = [0.0] * n_players
        
        for i in range(n_players):
            if stacks[i] <= 0:
                continue
            
            # プレイヤーiが現在の順位になる確率
            prob_i_wins = stacks[i] / total_chips
            
            # プレイヤーiがその順位を獲得した場合のEV加算
            evs[i] += prob_i_wins * current_payout
            
            # プレイヤーiを除いた残りのスタック
            remaining_stacks = list(stacks)
            remaining_stacks[i] = 0
            
            # 残りのプレイヤーでの再帰計算（次の順位）
            if any(s > 0 for s in remaining_stacks) and remaining_payouts:
                sub_evs = self._recursive_calculate(tuple(remaining_stacks), remaining_payouts)
                for j in range(n_players):
                    evs[j] += prob_i_wins * sub_evs[j]
                    
        self._memo[state] = evs
        return evs

def compute_icm(stacks: List[float], payouts: List[float]) -> List[float]:
    engine = ICMEngine()
    return engine.compute_icm(stacks, payouts)
