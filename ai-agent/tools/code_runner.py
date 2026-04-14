import subprocess
import sys
import tempfile
import os

def run_python_code(code: str) -> str:
    """Execute Python code and return the output or errors."""
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(code)
        tmp_name = tmp.name
    
    try:
        result = subprocess.run(
            [sys.executable, tmp_name],
            capture_output=True,
            text=True,
            timeout=30,
            encoding="utf-8",
            errors="replace"
        )
        output = result.stdout
        error = result.stderr
        
        # Cleanup
        os.remove(tmp_name)
        
        if error:
            return f"Error occurred:\n{error}\n\nOutput if any:\n{output}"
        
        if not output:
            return "Execution successful, but no output returned."
        
        return output
    except Exception as e:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)
        return f"Error executing Python code: {str(e)}"
