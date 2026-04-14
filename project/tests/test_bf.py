import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bf import compute_bubble_factor

def test_bf_basic():
    print("Running basic BF tests...")
    
    # Case 1: Winner-take-all (2 players). BF should be 1.0
    stacks = [1000.0, 1000.0]
    payouts = [100.0, 0.0]
    bf = compute_bubble_factor(stacks, payouts, 0, 1)
    assert abs(bf - 1.0) < 1e-9, f"Failed winner-take-all: {bf}"
    print("Case 1 passed.")
    
    # Case 2: Standard tournament (3 players, 2 payouts)
    # 1000, 1000, 10 (Short stack exists). Big stacks clashing should have high BF
    stacks = [1000.0, 1000.0, 10.0]
    payouts = [70.0, 30.0, 0.0]
    bf = compute_bubble_factor(stacks, payouts, 0, 1)
    # In this case, losing would be devastating because 3rd gets 0 while 2nd gets 30
    assert bf > 1.0, f"BF should be > 1.0 in tournament: {bf}"
    print(f"Case 2 BF: {bf:.4f}")
    print("Case 2 passed.")

    # Case 3: Hero vs Short stack
    stacks = [1000.0, 1000.0, 10.0]
    payouts = [70.0, 30.0, 0.0]
    bf_hero_vs_short = compute_bubble_factor(stacks, payouts, 0, 2)
    # Risks are lower when effective stack is small relative to total
    # But BF is about the *ratio* of EV change, so even with small stack it should be > 1
    assert bf_hero_vs_short > 1.0, f"BF should be > 1.0: {bf_hero_vs_short}"
    print(f"Case 3 (Hero vs Short) BF: {bf_hero_vs_short:.4f}")
    assert bf_hero_vs_short < bf, "BF against short stack should be lower than against big stack"
    print("Case 3 passed.")

    print("\nPhase 2 Tests: ALL PASSED")

if __name__ == "__main__":
    try:
        test_bf_basic()
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)
