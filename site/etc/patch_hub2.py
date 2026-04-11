import re

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find("const sitemapNodes = [")
end_idx = content.find("const container = document.createElement", start_idx)

if start_idx != -1 and end_idx != -1:
    sitemap_nodes_str = """const sitemapNodes = [
      { slug: 'intro', x: 45.19, y: 84.9, w: 23.47, h: 148 },
      { slug: 'syntax', x: 46.06, y: 64.87, w: 21.73, h: 148 },
      { slug: 'interpretation', x: 46.06, y: 44.83, w: 21.73, h: 148 },
      { slug: 'rest', x: 38.0, y: 22.0, w: 18.25, h: 48 }, // Assuming left-sided REST concept
      { slug: 'meta-v9', x: 46.06, y: 24.79, w: 21.73, h: 148 },
      { slug: 'best-practices', x: 75.18, y: 36.69, w: 22.6, h: 148 },
      { slug: 'telemetry-guide', x: 75.18, y: 17.35, w: 22.6, h: 148 } // Replaced meta-library with telemetry
    ];

    const svgStr = `
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
         <line class="codex-separator" x1="325.80801" y1="26.514999" x2="325.80801" y2="979.16028"></line>
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
    `;

    const dsMap = Object.fromEntries(ds.map(d => [d.slug, d]));
    
"""

    # We also need to fix the node creation logic to use .style.left = pos.x + "%" and .style.top = pos.y + "%"
    # Let's do a replace on the actual content
    
    # Actually wait, the svg connection string is being created later, let's just use Python script to rewrite the whole 'draw tree' block
    pass
