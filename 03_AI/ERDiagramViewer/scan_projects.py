import json
import sys
from pathlib import Path

def scan_workspace(root_dir):
    """ワークスペース内から *.json を探索し schema 項目を持つプロジェクトを収集"""
    projects = []
    
    # 除外するディレクトリ
    exclude_dirs = {".git", ".venv", "node_modules", ".obsidian", ".system_generated"}
    
    for json_path in root_dir.rglob("*.json"):
        if any(part in exclude_dirs for part in json_path.parts):
            continue
            
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            # schema ファイルとしての要件チェック (entities や system_info の有無)
            if isinstance(data, dict) and ("entities" in data or "system_info" in data):
                sys_info = data.get("system_info", {})
                project_id = json_path.stem
                project_name = sys_info.get("name", json_path.stem)
                description = sys_info.get("description", f"Path: {json_path.relative_to(root_dir)}")
                
                projects.append({
                    "id": project_id,
                    "name": project_name,
                    "description": description,
                    "file_path": str(json_path.resolve()),
                    "relative_path": str(json_path.relative_to(root_dir)),
                    "schema": data
                })
        except Exception:
            continue
            
    return projects

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    script_dir = Path(__file__).parent
    workspace_root = script_dir.parent.parent  # c:\work\ai\ai-tool
    
    projects = scan_workspace(workspace_root)
    
    catalog_path = script_dir / "projects_catalog.json"
    catalog_js_path = script_dir / "projects_catalog.js"
    
    catalog_data = {
        "total_projects": len(projects),
        "projects": projects
    }
    
    # JSONの出力
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog_data, f, ensure_ascii=False, indent=2)
        
    # JS変数の出力（file://プロトコル制限を回避）
    json_str = json.dumps(catalog_data, ensure_ascii=False, indent=2)
    with open(catalog_js_path, "w", encoding="utf-8") as f:
        f.write(f"window.PROJECTS_CATALOG = {json_str};\n")
        
    print(f"SUCCESS: Scanned {len(projects)} projects into {catalog_path} and {catalog_js_path}")

if __name__ == "__main__":
    main()
