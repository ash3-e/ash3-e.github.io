import re

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Make the container match the SVG viewBox for perfect scaling
old_container = """.sitemap-container {
    position: relative;
    width: 100%;
    max-width: 1000px;
    height: 800px;
    margin: 0 auto;
    overflow: hidden;
    background: transparent;
}"""
new_container = """/* Interactive Sitemap CSS */
.sitemap-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1150 / 1008;
    max-width: 1150px;
    margin: 0 auto;
    overflow: visible;
    background: transparent;
}"""
css = css.replace(old_container, new_container)

if old_container not in css and ".sitemap-container" in css:
    # manual replace if exact old string wasn't matched
    css = re.sub(
        r'\.sitemap-container\s*\{[^}]*\}', 
        new_container.replace('/* Interactive Sitemap CSS */\n', ''), 
        css
    )

old_connectors = """.sitemap-connectors {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
}"""
new_connectors = """.sitemap-connectors {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
    overflow: visible;
}"""
css = css.replace(old_connectors, new_connectors)
if old_connectors not in css and ".sitemap-connectors" in css:
    css = re.sub(r'\.sitemap-connectors\s*\{[^}]*\}', new_connectors, css)

old_node = """.sitemap-node {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 250px;
    pointer-events: auto;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2d6f7);
    border-radius: 6px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}"""
new_node = """.sitemap-node {
    position: absolute;
    pointer-events: auto;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    background: var(--card-bg, #ffffff);
    border: 1.5px solid var(--border-color, #e2d6f7);
    border-radius: 8px;
    box-shadow: 0 8px 16px rgba(104, 32, 224, 0.08); /* slight depth */
}"""
css = css.replace(old_node, new_node)
if old_node not in css and ".sitemap-node" in css:
    css = re.sub(r'\.sitemap-node\s*\{[^}]*\}', new_node, css)

old_hover = """.sitemap-node:hover,
.sitemap-node.is-hovered {
    transform: translate(-50%, -54%);
    box-shadow: 0 12px 24px rgba(104, 32, 224, 0.2);
    border-color: var(--primary-purple, #6820E0);
    z-index: 10;
}"""
new_hover = """.sitemap-node:hover,
.sitemap-node.is-hovered {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(104, 32, 224, 0.25);
    border-color: var(--primary-purple, #6820E0);
    z-index: 10;
}"""
css = css.replace(old_hover, new_hover)
if old_hover not in css and "is-hovered" in css:
    css = re.sub(r'\.sitemap-node:hover,\s*\n\.sitemap-node\.is-hovered\s*\{[^}]*\}', new_hover, css)

# Fix some connectors properties based on what we pulled:
css += """

/* SVG Link Connectors mapping */
.s-connector {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.s-connector.dashed {
    stroke: var(--primary-purple, #6820E0);
    stroke-width: 2.2;
    stroke-dasharray: 6 5;
    opacity: 0.45;
}
.s-connector.dashed-strong {
    stroke-dasharray: 8 6;
    opacity: 0.8;
}
.s-connector.main-trunk-arrow {
    stroke: var(--primary-purple, #6820E0);
    stroke-width: 2.1;
}
"""

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-styles.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated CSS with proper node translate layout.")
