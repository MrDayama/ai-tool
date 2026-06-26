import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\0pn32\.gemini\antigravity\brain\4ec16f1b-7333-4ce5-8871-e6363370e035\.system_generated\steps\32\content.md"


with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find all JSON-LD blocks
json_lds = re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', content, re.DOTALL)
for i, js in enumerate(json_lds):
    try:
        data = json.loads(js.strip())
        print(f"--- JSON-LD {i} ---")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error parsing JSON-LD {i}: {e}")

# Find any text or paragraph content that looks like tweet text
print("\n--- Other tweet text clues ---")
# Find og:description or description
og_desc = re.findall(r'meta property="og:description" content="(.*?)"', content)
if og_desc:
    print("OG Desc:", og_desc[0])

# Find title
title = re.findall(r'<title>(.*?)</title>', content)
if title:
    print("Title:", title[0])
