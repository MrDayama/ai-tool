import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

vault_path = r"C:\Obsidian Vault"

def list_files(dir_path, indent=""):
    try:
        entries = os.listdir(dir_path)
    except Exception as e:
        print(f"{indent}Error reading: {e}")
        return

    for entry in sorted(entries):
        if entry.startswith(".") and entry != ".obsidian":
            continue
        full_path = os.path.join(dir_path, entry)
        if os.path.isdir(full_path):
            if entry in ["node_modules", "venv", ".venv", ".git"]:
                continue
            print(f"{indent}[Dir] {entry}/")
            list_files(full_path, indent + "  ")
        else:
            size_kb = os.path.getsize(full_path) / 1024
            print(f"{indent}[File] {entry} ({size_kb:.1f} KB)")

print("=== Obsidian Vault File Structure ===")
list_files(vault_path)
