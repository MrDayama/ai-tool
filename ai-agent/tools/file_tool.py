import os
import shutil

def list_directory(path: str = ".") -> str:
    """List contents of a directory."""
    try:
        items = os.listdir(path)
        return "\n".join(items)
    except Exception as e:
        return f"Error listing directory: {str(e)}"

def read_file(path: str) -> str:
    """Read the content of a file."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file {path}: {str(e)}"

def write_file(path: str, content: str) -> str:
    """Write content to a file."""
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote to {path}"
    except Exception as e:
        return f"Error writing file {path}: {str(e)}"

def append_file(path: str, content: str) -> str:
    """Append content to a file."""
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully appended to {path}"
    except Exception as e:
        return f"Error appending file {path}: {str(e)}"
