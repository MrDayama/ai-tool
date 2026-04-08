import subprocess
import os

def run_shell(command: str) -> str:
    """Run a shell command and return the results."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60,
            encoding="utf-8",
            errors="replace"
        )
        
        stdout = result.stdout
        stderr = result.stderr
        
        if stdout:
            if stderr:
                return f"Output:\n{stdout}\n\nErrors/Warnings:\n{stderr}"
            return stdout
        
        if stderr:
            return f"Error executing command: {stderr}"
        
        return "Command executed successfully with no output."
    except Exception as e:
        return f"Shell command failed: {str(e)}"
