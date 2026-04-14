import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from state import State
from bf import compute_bubble_factor, compute_fgs_bf

def test_fgs_bf():
    print("Running FGS-BF comparison tests...")
    
    # 3 players, standard tournament bubble
    stacks = [1000.0, 1000.0, 100.0]
    payouts = [70.0, 30.0, 0.0]
    # BTN=0, SB=1, BB=2. Currently P1 is SB, P2 is BB
    state = State(stacks, payouts, btn_idx=0, sb=10, bb=20, ante=0)
    
    # Standard ICM-BF (Hero=0, Villain=1)
    icm_bf = compute_bubble_factor(stacks, payouts, 0, 1)
    
    # FGS-BF (Depth 1)
    fgs_bf = compute_fgs_bf(state, 0, 1)
    
    print(f"ICM BF: {icm_bf:.4f}")
    print(f"FGS BF: {fgs_bf:.4f}")
    
    # In this state, BTN=0 will be BB in the next hand (if depth=1).
    # Being BB next is bad, so losing now might be relatively less catastrophic 
    # if it means avoiding a future BB (though usually losing is always worse).
    # FGS-BF should at least be computable and return a logical value.
    assert fgs_bf > 0, "FGS-BF should be positive"
    
    print("\nPhase 5 Tests: ALL PASSED")

if __name__ == "__main__":
    try:
        test_fgs_bf()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
