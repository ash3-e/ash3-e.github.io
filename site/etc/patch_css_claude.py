import re

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-styles.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

# We find where our sitemap css starts
start_idx = css_content.find("/* Interactive Sitemap CSS */")
if start_idx == -1:
    start_idx = css_content.find(".sitemap-container {")

new_css = """/* Interactive Sitemap CSS */
.sitemap-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1150 / 1008;
    max-width: 1150px;
    margin: 0 auto;
    overflow: visible;
    background: transparent;
}

.sitemap-connectors {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
    overflow: visible;
}

.sitemap-node {
    position: absolute;
    pointer-events: auto;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.3s ease, filter 0.3s ease;
    background: var(--card-bg, #ffffff);
    border: 1.5px solid var(--border-color, #e2d6f7);
    border-radius: 8px;
    box-shadow: 0 8px 16px rgba(104, 32, 224, 0.08);
    display: flex;
    flex-direction: column;
    padding: 12px;
    z-index: 2;
}

.sitemap-node.is-label {
    background: transparent;
    border: none;
    box-shadow: none;
    color: var(--primary-purple, #6820E0);
    font-weight: 900;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 13px;
    letter-spacing: 0.1em;
}

.body-dark .sitemap-node.is-label {
    color: #a78bfa;
}

.sitemap-node.is-concept {
    background: #f8f5ff;
    border-style: dashed;
    border-width: 2px;
}

.body-dark .sitemap-node.is-concept {
    background: #1c182b;
    border-color: #5d4f82;
}

/* Claude Schema Search Highlighting */
.sitemap-container.is-searching .sitemap-node:not(.is-glowing):not(.is-label) {
    opacity: 0.25;
    filter: grayscale(1);
    border-color: transparent;
    box-shadow: none;
}

.sitemap-container.is-searching .sitemap-node.is-glowing {
    transform: translateY(-4px);
    box-shadow: 0 0 0 2px rgba(104, 32, 224, 0.4), 0 12px 24px rgba(104, 32, 224, 0.25);
    border-color: var(--primary-purple, #6820E0);
    z-index: 10;
}

/* Hover effects */
.sitemap-container:not(.is-searching) .sitemap-node.doc-card:hover,
.sitemap-container:not(.is-searching) .sitemap-node.doc-card.is-hovered {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(104, 32, 224, 0.25);
    border-color: var(--primary-purple, #6820E0);
    z-index: 10;
}

.sitemap-subheaders {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    justify-content: center;
}

.sitemap-pill {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--pill-bg, #f3ebff);
    color: var(--pill-text, #5c20d6);
    text-decoration: none;
    transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid transparent;
}

.body-dark .sitemap-pill {
    background: var(--pill-bg-dark, #2d244a);
    color: var(--pill-text-dark, #d8b4fe);
}

.sitemap-pill.is-subtitle-glowing {
    background: var(--primary-purple, #6820E0);
    color: #ffffff;
    box-shadow: 0 0 8px var(--primary-purple, #6820E0);
    border-color: var(--primary-purple, #6820E0);
}

.body-dark .sitemap-pill.is-subtitle-glowing {
    background: #a78bfa;
    color: #1a1a2e;
    box-shadow: 0 0 8px #a78bfa;
    border-color: #a78bfa;
}

.sitemap-pill.sub-pill-link:hover {
    background: var(--primary-purple, #6820E0);
    color: #ffffff;
}

.body-dark .sitemap-pill.sub-pill-link:hover {
    background: var(--primary-purple-light, #a78bfa);
    color: #1a1a2e;
}

/* Centered content for concepts */
.doc-card-main.centered {
    text-align: center;
    width: 100%;
}

.doc-card-main.centered .title {
    margin: 0;
}

/* Preview Card - unchanged from Gemini */
.sitemap-preview-card {
    position: sticky;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 600px;
    background: var(--card-bg, #ffffff);
    border: 2px solid var(--primary-purple, #6820E0);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 100;
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.body-dark .sitemap-preview-card {
    background: var(--card-bg-dark, #1a1a2e);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.sitemap-preview-card.sitemap-hidden {
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, 20px);
}

.sitemap-preview-content h3 {
    margin-top: 0;
    margin-bottom: 8px;
    color: var(--primary-purple, #6820E0);
}

.body-dark .sitemap-preview-content h3 {
    color: var(--pill-text-dark, #c4b5fd);
}

.sitemap-preview-content p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
    color: var(--text-color, #333);
}

.body-dark .sitemap-preview-content p {
    color: var(--text-color-dark, #ccc);
}

.sitemap-node .title {
    margin: 0 0 4px 0;
    font-weight: 600;
    color: var(--title-text, #4c0fb0);
}

.body-dark .sitemap-node .title {
    color: var(--title-text-dark, #c4b5fd);
}

.sitemap-node .meta {
    font-size: 0.8rem;
    color: var(--annotation-text, #4338a8);
}

.body-dark .sitemap-node .meta {
    color: var(--annotation-text-dark, #a78bfa);
}
"""

if start_idx != -1:
    final_css = css_content[:start_idx] + new_css
else:
    final_css = css_content + "\n" + new_css

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-styles.css', 'w', encoding='utf-8') as f:
    f.write(final_css)

print("CSS updated with Claude search schemas and exact positioning boundaries.")
