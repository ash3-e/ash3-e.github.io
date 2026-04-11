import sys
import re
import json

file_path = r"c:\Users\^w^\Downloads\site\assets\codex-site.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

def extract_js_object(content, var_name):
    # Find the start of the object definition
    pattern = rf"const {var_name} = ({{[\s\S]*?}});\n"
    match = re.search(pattern, content)
    if not match:
        print(f"Failed to find {var_name}")
        return None
    
    js_str = match.group(1)
    
    # Simple JSON fixups for JS objects that are practically JSON
    js_str = js_str.replace("gallery: true", '"gallery": true')
    js_str = js_str.replace("gallery: false", '"gallery": false')
    js_str = js_str.replace("gallery: True", '"gallery": true')
    js_str = js_str.replace("gallery: False", '"gallery": false')
    
    try:
        return json.loads(js_str)
    except Exception as eval_e:
        print(f"Failed to parse {var_name}: {eval_e}")
        return None

doc_node_previews = extract_js_object(content, "DOC_NODE_PREVIEWS")
doc_row_configs = extract_js_object(content, "DOC_ROW_CONFIGS")

if doc_node_previews is None or doc_row_configs is None:
    sys.exit(1)

def is_length_acceptable(text):
    # Standard comfortable paragraph length for 1080p preview pane
    return 200 < len(text) < 650

violation = False

# Check Node Previews
for key, data in doc_node_previews.items():
    p1, p2 = data['paragraphs'][0], data['paragraphs'][1]
    if not is_length_acceptable(p1):
        print(f"VIOLATION: Node {key} P1 length {len(p1)} is out of bounds.")
        violation = True
    if not is_length_acceptable(p2):
        print(f"VIOLATION: Node {key} P2 length {len(p2)} is out of bounds.")
        violation = True
    if len(data['bullets']) != 10:
        print(f"VIOLATION: Node {key} has {len(data['bullets'])} bullets.")
        violation = True

# Check Row Configs
for key, rows in doc_row_configs.items():
    for row in rows:
        label = row['label']
        
        # Rule: No numbered prefixes
        if re.match(r"^\d+\.", label):
            print(f"VIOLATION: Row label '{label}' contains a numbered prefix.")
            violation = True
        
        p1, p2 = row['paragraphs'][0], row['paragraphs'][1]
        
        # Exclude 'Example gallery' short description if there's an exception, but let's test normally
        if not is_length_acceptable(p1):
            print(f"VIOLATION: Row {label} P1 length {len(p1)} is out of bounds.")
            violation = True
        if not is_length_acceptable(p2):
            print(f"VIOLATION: Row {label} P2 length {len(p2)} is out of bounds.")
            violation = True
            
        if len(row['bullets']) != 10:
            print(f"VIOLATION: Row {label} has {len(row['bullets'])} bullets.")
            violation = True

if not violation:
    print("SUCCESS: All injected content conforms to length constraints, 10-bullet targets, and unnumbered label rules.")
    sys.exit(0)
else:
    sys.exit(1)
