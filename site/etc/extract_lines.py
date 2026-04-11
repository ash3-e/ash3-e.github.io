import xml.etree.ElementTree as ET
import sys

tree = ET.parse(r'c:\Users\^w^\Downloads\site\assets\bcode-doc-nav-final.svg')
root = tree.getroot()
ns = {'s': 'http://www.w3.org/2000/svg'}

def clean(tag):
    if tag.startswith('{http://www.w3.org/2000/svg}'):
        return tag[28:]
    return tag

def process(el):
    d = el.attrib
    
    # We want to ignore clip paths, background rects, text rects
    # We only care about strokes like stroke="#6820E0" or "#3b13e0" that are lines/paths.
    stroke = d.get('stroke', '')
    style = d.get('style', '')
    if ('#6820E0' in stroke or '#3b13e0' in stroke or '#6820e0' in stroke) or \
       ('#6820e0' in style or '#3b13e0' in style or '#c4b5fd' in style):
        # Could be a connector line!
        print(f"<{clean(el.tag)} " + " ".join([f'{k}="{v}"' for k,v in d.items()]) + " />")
        pass

for el in root.iter():
    process(el)
