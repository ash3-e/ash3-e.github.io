import xml.etree.ElementTree as ET

tree = ET.parse(r'c:\Users\^w^\Downloads\site\assets\bcode-doc-nav-final.svg')
root = tree.getroot()
ns = {'s': 'http://www.w3.org/2000/svg'}

cards = {}

for g in root.findall('.//s:g', ns):
    text_nodes = g.findall('.//s:tspan', ns)
    if not text_nodes:
        continue
    
    text = text_nodes[0].text
    if not text:
        continue
    text = text.strip()
    
    rect = g.find('./s:rect', ns)
    if rect is not None:
        if text not in cards:
            cards[text] = {'x': float(rect.get('x')), 'y': float(rect.get('y')), 'w': float(rect.get('width')), 'h': float(rect.get('height'))}

for text, c in cards.items():
    print(f"{text}: x={c['x']} y={c['y']} w={c['w']} h={c['h']}")
