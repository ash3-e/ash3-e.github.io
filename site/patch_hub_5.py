import re

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# We completely locate the `const hub = () => { ... }` block and replace it.
# Find start of `const hub = () => {`
start_idx = js_content.find("const hub = () => {")
if start_idx == -1:
    print("Could not find hub()")
else:
    # Find the end of `const hub = () => {` block. 
    # It ends right before `const asciiCharts = [];` or `const bindAsciiChartPreview = () => {`
    end_idx = js_content.find("const bindAsciiChartPreview = () => {", start_idx)
    if end_idx == -1:
        end_idx = js_content.find("  const updateAsciiThemeCharts", start_idx)
    
    new_hub = """const hub = () => {
    const ds = (Array.isArray(window.__DOCS_DATA__) ? window.__DOCS_DATA__ : [])
      .map((d) => ({
        ...d,
        display_title: normalizeMojibake(d.display_title || ""),
        preview_title: normalizeMojibake(d.preview_title || ""),
        description: normalizeMojibake(d.description || ""),
        corpus_text: normalizeMojibake(d.corpus_text || "")
      }))
      .filter((d) => !EXCLUDED_DOC_SLUGS.has(String(d.slug || "")));

    const i = $("#docSearch");
    const box = $("#docCards_Original");
    const m = $("#searchMeta");
    if (m) m.remove();
    if (!i || !box) return;

    // Use perfectly centered coordinates mathematically aligned to bcode-doc-nav-final.svg
    const sitemapNodes = [
      { slug: 'intro', x: 34.62, y: 81.83, w: 23.47 },
      { slug: 'syntax', x: 35.49, y: 61.8, w: 21.73 },
      { slug: 'interpretation', x: 35.49, y: 41.76, w: 21.73 },
      { slug: 'rest', x: 32.36, y: 2.87, w: 13.56 },
      { slug: 'meta-v9', x: 35.49, y: 21.72, w: 21.73 },
      { slug: 'best-practices', x: 71.36, y: 81.83, w: 22.6 },
      { slug: 'telemetry-guide', x: 76.04, y: 21.52, w: 22.6 } // Maps telemetry to meta-library
    ];

    const dsMap = Object.fromEntries(ds.map(d => [d.slug, d]));

    const container = document.createElement("div");
    container.className = "sitemap-container";

    const tree = document.createElement("div");
    tree.className = "sitemap-tree-nodes";

    sitemapNodes.forEach(pos => {
      const d = dsMap[pos.slug];
      if (!d) return;
      const meta = portalMeta(d);

      const nodeEl = document.createElement("article");
      nodeEl.className = "doc-card sitemap-node doc-card-click";
      nodeEl.style.left = pos.x + "%";
      nodeEl.style.top = pos.y + "%";
      if (pos.w) nodeEl.style.width = pos.w + "%";
      nodeEl.dataset.slug = d.slug;

      const titleLabel = cleanMenuTitle(d.display_title);
      const readerHref = readerFileForSlug(d.slug);
      nodeEl.dataset.href = readerHref;
      nodeEl.tabIndex = 0;
      nodeEl.role = "link";
      nodeEl.setAttribute("aria-label", `Open ${esc(titleLabel)}`);

      const chips = meta.subheaders.map((s) =>
        `<a class="sub-pill sub-pill-link sitemap-pill" data-slug="${d.slug}" data-jump="${esc(s)}" href="${subtopicHref(d, s, "")}">${esc(s)}</a>`
      ).join("");

      nodeEl.innerHTML = `
        <div class="doc-card-main">
          <p class="title">${esc(titleLabel)}</p>
          <div class="meta">${esc(meta.preview || d.display_title)}</div>
        </div>
        ${chips ? `<div class="subheaders sitemap-subheaders">${chips}</div>` : ""}
      `;

      nodeEl.addEventListener('mouseenter', () => {
         nodeEl.classList.add('is-hovered');
         updatePreviewCard(d, meta);
      });
      nodeEl.addEventListener('mouseleave', () => {
         nodeEl.classList.remove('is-hovered');
      });
      nodeEl.addEventListener('click', (e) => {
         if(!e.target.closest('.sub-pill-link')) {
            window.location.href = readerHref;
         }
      });

      tree.appendChild(nodeEl);
    });

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
         <line class="codex-separator" x1="325.80801" y1="26.514999" x2="325.80801" y2="979.16028" stroke="var(--primary-purple, #6820E0)" stroke-width="2.2" stroke-dasharray="8 6" opacity="0.9"></line>
         <path class="s-connector dashed" d="m 658.47366,292.98333 h 154.83876 c 12,0 12,12 12,12 l 0.24557,204.05443"></path>
         <path class="s-connector dashed dashed-strong" d="m 398.74244,948.86396 -99.02297,0.24557"></path>
         <path class="s-connector dashed" d="M 990.26081,292.98333 H 835.42202 c -6.24978,0 -9.24458,3.25498 -10.67964,6.37445"></path>
         <path class="s-connector lateral" d="m 658.55799,497.03776 h 155 c 12,0 12,12 12,12 v 163.40538" marker-end="url(#codexArrowDown)"></path>
         <line class="s-connector main-trunk-arrow" x1="533.30389" y1="824.98334" x2="533.30389" y2="779.59149" marker-end="url(#codexArrowUp)"></line>
         <line class="s-connector main-trunk-arrow" x1="533.30389" y1="622.98334" x2="533.30389" y2="577.48389" marker-end="url(#codexArrowUp)"></line>
         <line class="s-connector main-trunk-arrow" x1="533.30389" y1="420.98334" x2="533.30389" y2="375.58252" marker-end="url(#codexArrowUp)"></line>
         <line class="s-connector main-trunk-arrow" x1="449.72513" y1="218.4115" x2="449.72513" y2="185.58575" marker-end="url(#codexArrowUp)"></line>
         <line class="s-connector main-trunk-arrow" x1="616.88269" y1="218.4115" x2="616.88269" y2="185.58575" marker-end="url(#codexArrowUp)"></line>
         <path class="s-connector lateral" d="m 408.30391,295.18784 h -82.78016 -2.9233 -68.83348 c -10.45571,0 -10.48886,-11.85531 -10.48886,-11.85531 V 181.26184"></path>
         <path class="s-connector lateral" d="m 243.31126,181.10716 h -13.8059" marker-end="url(#codexArrowLeft)"></path>
         <line class="s-connector lateral" x1="242.4976" y1="242.14156" x2="229.50536" y2="242.14156" marker-end="url(#codexArrowLeft)"></line>
      </svg>
    `;
    container.innerHTML = svgStr;
    container.appendChild(tree);
    box.appendChild(container);

    const previewCard = document.createElement("div");
    previewCard.className = "sitemap-preview-card sitemap-hidden";
    previewCard.innerHTML = `
       <div class="sitemap-preview-content">
          <h3 id="sp-title">Hover a topic</h3>
          <p id="sp-desc">Explore the architecture documentation</p>
       </div>
    `;
    box.appendChild(previewCard);

    const updatePreviewCard = (d, meta) => {
       previewCard.classList.remove("sitemap-hidden");
       document.getElementById("sp-title").textContent = d.display_title;
       document.getElementById("sp-desc").textContent = d.description || meta.preview;
    };

    i.addEventListener("input", (e) => {
       const term = e.target.value.toLowerCase().trim();
       document.querySelectorAll('.sitemap-node').forEach(node => {
          if (!term) {
             node.classList.remove('has-glow');
             return;
          }
          const txt = node.textContent.toLowerCase();
          if (txt.includes(term)) {
             node.classList.add('has-glow');
          } else {
             node.classList.remove('has-glow');
          }
       });
    });
  };

  """
    
    final_content = js_content[:start_idx] + new_hub + js_content[end_idx:]
    with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print("hub() replaced successfully.")
