import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from icm import compute_icm

def test_icm_basic():
    print("Running basic ICM tests...")
    
    # Case 1: Equal stacks
    res = compute_icm([500.0, 500.0], [100.0, 0.0])
    assert res == [50.0, 50.0], f"Failed equal stacks: {res}"
    print("Case 1 passed.")
    
    # Case 2: Proportional to stacks for winner-take-all
    res = compute_icm([750.0, 250.0], [100.0, 0.0])
    assert res == [75.0, 25.0], f"Failed proportional: {res}"
    print("Case 2 passed.")
    
    # Case 3: 3 players, standard payouts
    stacks = [500.0, 300.0, 200.0]
    payouts = [50.0, 30.0, 0.0]
    res = compute_icm(stacks, payouts)
    assert abs(sum(res) - sum(payouts)) < 1e-9, f"Total EV mismatch: {sum(res)} != {sum(payouts)}"
    assert res[0] > res[1] > res[2], f"Ordering mismatch: {res}"
    print("Case 3 passed.")

    # Case 4: 4 players, 2 payouts
    stacks = [1000, 1000, 1000, 1000]
    payouts = [100, 50]
    res = compute_icm(stacks, payouts)
    assert abs(sum(res) - 150) < 1e-9, f"Total EV mismatch: {sum(res)}"
    assert all(abs(val - 37.5) < 1e-9 for val in res), f"Equal stacks should have equal EV: {res}"
    print("Case 4 passed.")

    print("\nPhase 1 Tests: ALL PASSED")

if __name__ == "__main__":
    try:
        test_icm_basic()
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)
