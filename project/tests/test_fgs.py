import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from state import State
from fgs import compute_fgs_ev
from icm import compute_icm

def test_fgs_basics():
    print("Running FGS tests...")
    
    # 3 players, equal stacks
    stacks = [1000.0, 1000.0, 1000.0]
    payouts = [100.0, 0.0, 0.0]
    # BTN=0, SB=1, BB=2. Next hand: BTN=1, SB=2, BB=0
    state = State(stacks, payouts, btn_idx=0, sb=100, bb=200, ante=0)
    
    # Static ICM
    icm_evs = compute_icm(stacks, payouts)
    assert all(abs(ev - 100/3) < 1e-9 for ev in icm_evs)
    
    # FGS EV (Depth 1)
    # Next hand: P0 is BB (pays 200), P1 is BTN (pays 0), P2 is SB (pays 100)
    # Stacks in next hand: [800, 1000, 900]
    fgs_evs = compute_fgs_ev(state, depth=1)
    
    print(f"ICM EV: {icm_evs}")
    print(f"FGS EV: {fgs_evs}")
    
    # P0 (BB in next hand) should have lower EV than P1 (BTN in next hand)
    assert fgs_evs[0] < fgs_evs[1], f"BB should have lower FGS EV than BTN: {fgs_evs}"
    assert fgs_evs[2] < fgs_evs[1], f"SB should have lower FGS EV than BTN: {fgs_evs}"
    
    # Total prize check
    assert abs(sum(fgs_evs) - sum(payouts)) < 1e-9, "Total prize mismatch in FGS"
    print("FGS prize total and ordering passed.")

    print("\nPhase 4 Tests: ALL PASSED")

if __name__ == "__main__":
    test_fgs_basics()
