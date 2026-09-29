import json
import sys
from pathlib import Path

def generate_er_diagram(entities):
    """ER図 (Mermaid erDiagram) を生成"""
    lines = ["```mermaid", "erDiagram"]
    
    # 1. エンティティとフィールドの定義
    for entity in entities:
        lines.append(f"    {entity['name']} {{")
        for field in entity.get("fields", []):
            field_type = field.get("type", "string")
            field_name = field.get("name")
            key_info = ""
            if field.get("primaryKey"):
                key_info = " PK"
            elif field.get("foreignKey"):
                key_info = " FK"
            lines.append(f"        {field_type} {field_name}{key_info}")
        lines.append("    }")
    
    lines.append("")
    
    # 2. リレーションシップの定義
    for entity in entities:
        source_name = entity["name"]
        for rel in entity.get("relations", []):
            target_name = rel["target"]
            rel_type = rel.get("type", "one_to_many")
            label = rel.get("label", "relates")
            
            if rel_type == "one_to_many":
                cardinality = "||--|{"
            elif rel_type == "one_to_one":
                cardinality = "||--||"
            elif rel_type == "many_to_many":
                cardinality = "}|--|{"
            else:
                cardinality = "--"
                
            lines.append(f'    {source_name} {cardinality} {target_name} : "{label}"')
            
    lines.append("```")
    return "\n".join(lines)

def generate_concept_diagram(concepts):
    """概念・アーキテクチャ依存図 (Mermaid graph TD) を生成"""
    lines = ["```mermaid", "graph TD"]
    
    layers = {}
    for concept in concepts:
        layer = concept.get("layer", "Default Layer")
        layers.setdefault(layer, []).append(concept)
        
    # サブグラフのグループ化
    for idx, (layer_name, item_list) in enumerate(layers.items()):
        sub_id = f"sub_{idx}"
        lines.append(f'    subgraph {sub_id} ["{layer_name}"]')
        for item in item_list:
            lines.append(f'        node_{item["name"]}["{item["name"]}"]')
        lines.append("    end")
        
    lines.append("")
    
    # 依存関係リンク
    for concept in concepts:
        source_id = f'node_{concept["name"]}'
        for dep in concept.get("depends_on", []):
            target_id = f'node_{dep}'
            lines.append(f"    {source_id} --> {target_id}")
            
    lines.append("```")
    return "\n".join(lines)

def generate_workflow_diagram(workflows):
    """業務フロー図 (Mermaid flowchart TD) を生成"""
    lines = ["```mermaid", "flowchart TD"]
    
    for wf in workflows:
        lines.append(f'    subgraph wf_{wf["id"]} ["{wf["name"]} (Actor: {wf.get("actor", "User")})"]')
        for step in wf.get("steps", []):
            s_id = step["id"]
            action = step["action"]
            
            if step.get("condition"):
                # 分岐条件ノード
                lines.append(f'        {s_id}{{"{action}"}}')
                if step.get("on_success"):
                    lines.append(f'        {s_id} -- 成功 / YES --> {step["on_success"]}')
                if step.get("on_failure"):
                    lines.append(f'        {s_id} -- 失敗 / NO --> {step["on_failure"]}')
            else:
                lines.append(f'        {s_id}["{action}"]')
                if step.get("next") and step["next"] != "end":
                    lines.append(f'        {s_id} --> {step["next"]}')
                elif step.get("next") == "end":
                    lines.append(f'        {s_id} --> end_node_{wf["id"]}(([終了]))')
                    
        lines.append("    end")
        
    lines.append("```")
    return "\n".join(lines)

def generate_ui_structure(ui_screens):
    """UI画面構造のツリー表現"""
    output = []
    for screen in ui_screens:
        output.append(f"### 🖥️ 画面: {screen['name']} (`{screen.get('path', '/')}`)")
        if screen.get("entities_used"):
            output.append(f"- **使用データエンティティ**: {', '.join(screen['entities_used'])}")
        output.append("- **コンポーネント構成**:")
        for comp in screen.get("components", []):
            output.append(f"  - **`<{comp['name']} />`** (`{comp.get('type', 'Component')}`): {comp.get('description', '')}")
        output.append("")
    return "\n".join(output)

def generate_typescript_types(entities):
    """TypeScriptインターフェース型定義の自動出力"""
    lines = ["```typescript"]
    type_mapping = {
        "string": "string",
        "number": "number",
        "boolean": "boolean",
        "datetime": "string // ISO Date string",
        "date": "string",
        "text": "string",
        "enum": "string"
    }
    
    for entity in entities:
        lines.append(f"// {entity.get('description', '')}")
        lines.append(f"export interface {entity['name']} {{")
        for field in entity.get("fields", []):
            field_name = field["name"]
            is_optional = not field.get("required", False) and not field.get("primaryKey", False)
            opt_mark = "?" if is_optional else ""
            
            f_type = field.get("type", "string")
            if f_type == "enum" and field.get("options"):
                ts_type = " | ".join([f'"{opt}"' for opt in field["options"]])
            else:
                ts_type = type_mapping.get(f_type, "any")
                
            comment = f" // {field['description']}" if field.get("description") else ""
            lines.append(f"  {field_name}{opt_mark}: {ts_type};{comment}")
        lines.append("}")
        lines.append("")
        
    lines.append("```")
    return "\n".join(lines)

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    
    script_dir = Path(__file__).parent
    input_file = script_dir / "example_schema.json"
    
    if len(sys.argv) > 1:
        input_file = Path(sys.argv[1])
        
    if not input_file.exists():
        print(f"エラー: 指定されたスキーマファイルが見つかりません: {input_file}")
        sys.exit(1)
        
    with open(input_file, "r", encoding="utf-8") as f:
        schema = json.load(f)
        
    sys_info = schema.get("system_info", {})
    output_md = []
    output_md.append(f"# 📘 【自動生成】{sys_info.get('name', 'システム設計ドキュメント')}")
    output_md.append(f"> **概要**: {sys_info.get('description', '')} (Ver: {sys_info.get('version', '1.0.0')})")
    output_md.append("> *注: 本ドキュメントは単一の `schema.json` から全自動一括生成されています。*\n")
    
    output_md.append("---")
    output_md.append("## 1. 🗄️ データベース ER図 (Entity-Relationship Diagram)")
    output_md.append(generate_er_diagram(schema.get("entities", [])))
    output_md.append("")
    
    output_md.append("---")
    output_md.append("## 2. 🏗️ 概念・アーキテクチャ依存図 (Concept Architecture)")
    output_md.append(generate_concept_diagram(schema.get("concepts", [])))
    output_md.append("")
    
    output_md.append("---")
    output_md.append("## 3. 🔄 業務フロー・処理シーケンス (Workflows)")
    output_md.append(generate_workflow_diagram(schema.get("workflows", [])))
    output_md.append("")
    
    output_md.append("---")
    output_md.append("## 4. 🖥️ UI画面およびコンポーネント設計 (UI Layout Specs)")
    output_md.append(generate_ui_structure(schema.get("ui_screens", [])))
    
    output_md.append("---")
    output_md.append("## 5. 💻 TypeScript 型定義 (Interface Code Definitions)")
    output_md.append(generate_typescript_types(schema.get("entities", [])))
    
    output_file = script_dir / "generated_output.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(output_md))
        
    print(f"SUCCESS: Generated output file -> {output_file}")

if __name__ == "__main__":
    main()
