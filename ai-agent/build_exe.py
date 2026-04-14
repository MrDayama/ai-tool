import PyInstaller.__main__
import os
import sys

def build():
    print("=== AI Agent Executable Builder ===")
    
    # Ensure we are in the right directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    # PyInstaller arguments
    args = [
        'main.py',              # Entry point
        '--name=ai-agent',      # Executable name
        '--onefile',            # Bundle into a single executable
        '--console',            # Show console window
        '--clean',              # Clean cache before building
        # Add data files if necessary (e.g., config templates)
        '--add-data=.env.example;.',
        '--collect-all=rich',   # Ensure rich dependencies are collected
    ]

    print(f"Buidling with: {' '.join(args)}")
    
    try:
        PyInstaller.__main__.run(args)
        print("\n=== Build Complete ===")
        print(f"Executable can be found in: {os.path.join(base_dir, 'dist')}")
    except Exception as e:
        print(f"Build failed: {e}")

if __name__ == "__main__":
    build()
