import os

css = """
/* Interactive Sitemap CSS */
.sitemap-container {
    position: relative;
    width: 100%;
    max-width: 1000px;
    height: 800px;
    margin: 0 auto;
    overflow: hidden;
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
}

.s-connector {
    fill: none;
    stroke: var(--primary-purple, #6820E0);
    stroke-width: 2px;
}

.s-connector.lateral {
    stroke: var(--primary-purple-dark, #3b13e0);
}

.sitemap-tree-nodes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    pointer-events: none;
}

.sitemap-node {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 250px;
    pointer-events: auto;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2d6f7);
    border-radius: 6px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.body-dark .sitemap-node {
    background: var(--card-bg-dark, #1a1a2e);
    border-color: var(--border-color-dark, #3b13e0);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.sitemap-node:hover,
.sitemap-node.is-hovered {
    transform: translate(-50%, -54%);
    box-shadow: 0 12px 24px rgba(104, 32, 224, 0.2);
    border-color: var(--primary-purple, #6820E0);
    z-index: 10;
}

.sitemap-node.has-glow {
    box-shadow: 0 0 15px 5px rgba(124, 58, 237, 0.6);
    border-color: #a78bfa;
}

.sitemap-subheaders {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0 14px 14px 14px;
}

.sitemap-pill {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--pill-bg, #f5f0ff);
    color: var(--pill-text, #4c0fb0);
    text-decoration: none;
    transition: background 0.2s ease, color 0.2s ease;
}

.body-dark .sitemap-pill {
    background: var(--pill-bg-dark, #2d1b69);
    color: var(--pill-text-dark, #c4b5fd);
}

.sitemap-pill:hover {
    background: var(--primary-purple, #6820E0);
    color: white;
}

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

/* Make sure text inside cards is not affected by main document styles */
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

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-styles.css', 'a', encoding='utf-8') as f:
    f.write(css)
print("CSS appended to antigravity-styles.css")
