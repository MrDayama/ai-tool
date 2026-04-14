import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from state import State

def test_state_transition():
    print("Running State tests...")
    
    stacks = [1000.0, 1000.0, 1000.0]
    payouts = [100.0, 0.0, 0.0]
    # BTN=0, SB=1, BB=2
    state = State(stacks, payouts, btn_idx=0, sb=10, bb=20, ante=5)
    
    # Check current state
    assert state.btn_idx == 0
    assert state.n_players == 3
    
    # Check next state
    next_state = state.get_next_state()
    assert next_state.btn_idx == 1
    assert next_state.stacks == stacks # Stacks shouldn't change just by moving BTN
    
    # Check blind collection
    blinded_stacks = state.collect_blinds_and_antes()
    # P0: 1000 - 5 (ante) = 995
    # P1 (SB): 1000 - 5 (ante) - 10 (sb) = 985
    # P2 (BB): 1000 - 5 (ante) - 20 (bb) = 975
    assert blinded_stacks[0] == 995
    assert blinded_stacks[1] == 985
    assert blinded_stacks[2] == 975
    print("Blind collection passed.")

    # Check deepcopy
    state_copy = state.copy()
    state_copy.stacks[0] = 500
    assert state.stacks[0] == 1000, "Deepcopy failed: original stack modified"
    print("Deepcopy passed.")

    print("\nPhase 3 Tests: ALL PASSED")

if __name__ == "__main__":
    try:
        test_state_transition()
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)
