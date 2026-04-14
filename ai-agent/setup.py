import os
import subprocess
import sys
import shutil

def run_command(command):
    print(f"Running: {command}")
    try:
        subprocess.check_call(command, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        return False
    return True

def setup():
    print("=== AI Agent Project Setup ===")
    
    # 1. Create Virtual Environment
    if not os.path.exists("venv"):
        print("Creating virtual environment...")
        run_command(f"{sys.executable} -m venv venv")
    else:
        print("Virtual environment already exists.")

    # 2. Install Dependencies
    pip_path = os.path.join("venv", "Scripts", "pip") if os.name == "nt" else os.path.join("venv", "bin", "pip")
    if os.path.exists("requirements.txt"):
        print("Installing dependencies...")
        run_command(f"{pip_path} install -r requirements.txt")

    # 3. Setup .env file
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            print("Creating .env from .env.example...")
            shutil.copy(".env.example", ".env")
            print("!!! ACTION REQUIRED: Please edit .env and add your OPENAI_API_KEY !!!")
        else:
            with open(".env", "w") as f:
                f.write("OPENAI_API_KEY=your_key_here\nMODEL_NAME=gpt-4-turbo-preview\n")
            print("Created new .env file.")

    # 4. Create necessary directories
    dirs = ["agents", "tools", "memory", "utils"]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        init_file = os.path.join(d, "__init__.py")
        if not os.path.exists(init_file):
            open(init_file, 'a').close()

    print("\n=== Setup Complete ===")
    print("To start the agent:")
    if os.name == "nt":
        print("1. .\\venv\\Scripts\\activate")
    else:
        print("1. source venv/bin/activate")
    print("2. python main.py")

if __name__ == "__main__":
    setup()
