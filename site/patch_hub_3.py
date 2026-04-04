import re

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace sitemapNodes array
old_nodes = """const sitemapNodes = [
      { slug: 'intro', x: '23%', y: '85%' },
      { slug: 'syntax', x: '23%', y: '65%' },
      { slug: 'interpretation', x: '23%', y: '40%' },
      { slug: 'rest', x: '23%', y: '15%' },
      { slug: 'meta-v9', x: '55%', y: '15%' },
      { slug: 'best-practices', x: '55%', y: '40%' },
      { slug: 'telemetry-guide', x: '88%', y: '65%' } // slightly to the right of best practices
    ];"""

new_nodes = """const sitemapNodes = [
      { slug: 'intro', x: 34.62, y: 81.83, w: 23.47 },
      { slug: 'syntax', x: 35.49, y: 61.8, w: 21.73 },
      { slug: 'interpretation', x: 35.49, y: 41.76, w: 21.73 },
      { slug: 'rest', x: 32.36, y: 2.87, w: 13.56 },
      { slug: 'meta-v9', x: 35.49, y: 21.72, w: 21.73 },
      { slug: 'best-practices', x: 71.36, y: 81.83, w: 22.6 },
      { slug: 'telemetry-guide', x: 76.04, y: 21.52, w: 22.6 } // Maps to meta-library semantic's location
    ];"""
content = content.replace(old_nodes, new_nodes)

# Replace SVG paths
old_svg = """    const svgStr = `
      <svg class="sitemap-connectors" viewBox="0 0 1000 800" preserveAspectRatio="none">
         <defs>
           <marker id="sitemap-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
             <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary-purple, #6820E0)" />
           </marker>
         </defs>
         <path class="s-connector main-trunk" d="M 230,680 L 230,120 M 230,520 L 230,320" />
         <path class="s-connector main-trunk-arrow" d="M 230,620 L 230,540 M 230,460 L 230,340 M 230,260 L 230,140" marker-end="url(#sitemap-arrow)" />
         <path class="s-connector lateral" d="M 230,520 L 550,520 L 550,460" />
         <path class="s-connector lateral" d="M 550,420 L 550,140" marker-end="url(#sitemap-arrow)" />
         <polyline class="s-connector lateral" points="230,520 880,520 880,540" />
      </svg>
    `;"""

new_svg = """    const svgStr = `
      <svg class="sitemap-connectors" viewBox="0 0 1150.5081 1008.1333" preserveAspectRatio="none">
         <defs>
           <marker id="codexArrowUp" viewBox="0 0 10 8" refX="5" refY="0" markerWidth="12" markerHeight="10" markerUnits="userSpaceOnUse" orient="0">
             <polygon points="5,0 10,8 0,8" fill="var(--primary-purple, #6820E0)"></polygon>
           </marker>
           <marker id="codexArrowDown" viewBox="0 0 10 8" refX="5" refY="8" markerWidth="12" markerHeight="10" markerUnits="userSpaceOnUse" orient="0">
             <polygon points="5,8 10,0 0,0" fill="var(--primary-purple-dark, #3b13e0)"></polygon>
           </marker>
           <marker id="codexArrowLeft" viewBox="0 0 8 10" refX="0" refY="5" markerWidth="10" markerHeight="12" markerUnits="userSpaceOnUse" orient="0">
             <polygon points="0,5 8,10 8,0" fill="var(--primary-purple-dark, #3b13e0)"></polygon>
           </marker>
         </defs>
         <line class="codex-separator" x1="325.80801" y1="26.514999" x2="325.80801" y2="979.16028" stroke="var(--primary-purple, #6820E0)" stroke-width="2.2" stroke-dasharray="8 6" opacity="0.9"></line>
         <path class="s-connector dashed" d="m 658.47366,292.98333 h 154.83876 c 12,0 12,12 12,12 l 0.24557,204.05443"></path>
         <path class="s-connector dashed dashed-strong" d="m 398.74244,948.86396 -99.02297,0.24557"></path>
         <path class="s-connector dashed" d="M 990.26081,292.98333 H 835.42202 c -6.24978,0 -9.24458,3.25498 -10.67964,6.37445"></path>
         <path class="s-connector lateral" d="m 658.55799,497.03776 h 155 c 12,0 12,12 12,12 v 163.40538" marker-end="url(#codexArrowDown)"></path>
         <line class="s-connector" x1="533.30389" y1="824.98334" x2="533.30389" y2="779.59149" marker-end="url(#codexArrowUp)"></line>
         <line class="s-connector" x1="533.30389" y1="622.98334" x2="533.30389" y2="577.48389" marker-end="url(#codexArrowUp)"></line>
         <line class="s-connector" x1="533.30389" y1="420.98334" x2="533.30389" y2="375.58252" marker-end="url(#codexArrowUp)"></line>
         <line class="s-connector" x1="449.72513" y1="218.4115" x2="449.72513" y2="185.58575" marker-end="url(#codexArrowUp)"></line>
         <line class="s-connector" x1="616.88269" y1="218.4115" x2="616.88269" y2="185.58575" marker-end="url(#codexArrowUp)"></line>
         <path class="s-connector lateral" d="m 408.30391,295.18784 h -82.78016 -2.9233 -68.83348 c -10.45571,0 -10.48886,-11.85531 -10.48886,-11.85531 V 181.26184"></path>
         <path class="s-connector lateral left-arrow" d="m 243.31126,181.10716 h -13.8059" marker-end="url(#codexArrowLeft)"></path>
         <line class="s-connector lateral left-arrow" x1="242.4976" y1="242.14156" x2="229.50536" y2="242.14156" marker-end="url(#codexArrowLeft)"></line>
      </svg>
    `;"""
content = content.replace(old_svg, new_svg)

# Replace node style assignment
old_assign = """nodeEl.style.left = pos.x;
      nodeEl.style.top = pos.y;"""
new_assign = """nodeEl.style.left = pos.x + "%";
      nodeEl.style.top = pos.y + "%";
      if (pos.w) nodeEl.style.width = pos.w + "%";"""
content = content.replace(old_assign, new_assign)

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated site.js with true svg coordinates and paths.")
