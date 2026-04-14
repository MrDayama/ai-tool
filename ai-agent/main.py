import sys
import os

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.manager_agent import ManagerAgent
from utils.logger import log_info

def main():
    manager = ManagerAgent()
    
    # If a goal is provided as command line arguments
    if len(sys.argv) > 1:
        goal = " ".join(sys.argv[1:])
        manager.start_goal(goal)
    else:
        # Start interactive mode
        manager.run_cli()

if __name__ == "__main__":
    main()
