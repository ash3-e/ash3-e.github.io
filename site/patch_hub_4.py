import re

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_nodes = """const sitemapNodes = [
      { slug: 'intro', x: 34.62, y: 81.83, w: 23.47 },
      { slug: 'syntax', x: 35.49, y: 61.8, w: 21.73 },
      { slug: 'interpretation', x: 35.49, y: 41.76, w: 21.73 },
      { slug: 'rest', x: 32.36, y: 2.87, w: 13.56 },
      { slug: 'meta-v9', x: 35.49, y: 21.72, w: 21.73 },
      { slug: 'best-practices', x: 71.36, y: 81.83, w: 22.6 },
      { slug: 'telemetry-guide', x: 76.04, y: 21.52, w: 22.6 } // Maps to meta-library semantic's location
    ];"""

# We map precisely to the bounding boxes in bcode-doc-nav-final.svg
new_nodes = """const sitemapNodes = [
      { slug: 'intro', x: 45.19, y: 84.90, w: 23.46 },     /* rect23: x=520, y=856, w=270 */
      { slug: 'syntax', x: 46.06, y: 64.87, w: 21.73 },    /* rect29: x=530, y=654, w=250 */
      { slug: 'interpretation', x: 46.06, y: 44.83, w: 21.73 }, /* rect35: x=530, y=452, w=250 */
      { slug: 'meta-v9', x: 46.06, y: 24.79, w: 21.73 },     /* rect41: x=530, y=250, w=250 */
      { slug: 'best-practices', x: 75.18, y: 36.69, w: 22.59 }, /* rect48: x=865, y=370, w=260 */
      { slug: 'telemetry-guide', x: 75.18, y: 17.35, w: 22.59 }, /* rect54: x=865, y=175, w=260 */
      { slug: 'rest', x: 4.34, y: 23.31, w: 18.25 }        /* rect17: x=50, y=235, w=210 (left branch) */
    ];"""

if old_nodes in content:
    content = content.replace(old_nodes, new_nodes)
else:
    # Just in case whitespace differs
    content = re.sub(
        r"const sitemapNodes = \[[^\]]+\];",
        new_nodes,
        content
    )

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated site.js with flawless percentage bounding boxes.")
