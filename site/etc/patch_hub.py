import sys

js = """  const hub = () => {
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

    // Define coordinates directly inspired by bcode-doc-nav-final.svg
    const sitemapNodes = [
      { slug: 'intro', x: '12%', y: '85%' },
      { slug: 'syntax', x: '12%', y: '65%' },
      { slug: 'interpretation', x: '12%', y: '40%' },
      { slug: 'rest', x: '12%', y: '15%' },
      { slug: 'meta-v9', x: '55%', y: '15%' },
      { slug: 'best-practices', x: '55%', y: '40%' },
      { slug: 'telemetry-guide', x: '88%', y: '65%' } // slightly to the right of best practices
    ];

    const dsMap = Object.fromEntries(ds.map(d => [d.slug, d]));
    
    // Draw tree
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
      nodeEl.style.left = pos.x;
      nodeEl.style.top = pos.y;
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
      tree.appendChild(nodeEl);
    });
    
    // Draw SVG connections
    const svgStr = `
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
    `;
    
    // Bottom preview card
    const previewContainer = document.createElement("div");
    previewContainer.className = "sitemap-preview-card sitemap-hidden";
    previewContainer.innerHTML = `
        <div class="sitemap-preview-content">
            <h3 class="preview-title"></h3>
            <p class="preview-desc"></p>
        </div>
    `;

    container.innerHTML = svgStr;
    container.appendChild(tree);
    
    box.innerHTML = "";
    box.appendChild(container);
    box.appendChild(previewContainer);

    // Event listeners
    const nodes = box.querySelectorAll('.sitemap-node');
    const previewCard = box.querySelector('.sitemap-preview-card');
    const previewTitle = previewCard.querySelector('.preview-title');
    const previewDesc = previewCard.querySelector('.preview-desc');

    nodes.forEach(node => {
      const slug = node.dataset.slug;
      const d = dsMap[slug];
      node.addEventListener('mouseenter', () => {
         nodes.forEach(n => n.classList.remove('is-hovered'));
         node.classList.add('is-hovered');
         previewTitle.textContent = d.display_title;
         previewDesc.innerHTML = hi(portalMeta(d).summary, i.value);
         previewCard.classList.remove('sitemap-hidden');
      });
      node.addEventListener('mouseleave', () => {
         node.classList.remove('is-hovered');
         previewCard.classList.add('sitemap-hidden');
      });
      node.addEventListener('click', (e) => {
         if (e.target.closest('a')) return;
         location.href = node.dataset.href;
      });
      node.addEventListener('keydown', (e) => {
         if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            location.href = node.dataset.href;
         }
      });
    });

    const pills = box.querySelectorAll('.sitemap-pill');
    pills.forEach(pill => {
       pill.addEventListener('mouseenter', (e) => {
          e.stopPropagation();
          const p = e.target;
          const parentNode = p.closest('.sitemap-node');
          const slug = p.dataset.slug;
          const jump = p.dataset.jump;
          if (parentNode) {
            nodes.forEach(n => n.classList.remove('is-hovered'));
            parentNode.classList.add('is-hovered');
          }
          previewTitle.textContent = `Section: ${jump}`;
          previewDesc.textContent = "Jump directly to this specific section in the documentation.";
          previewCard.classList.remove('sitemap-hidden');
       });
       pill.addEventListener('mouseleave', (e) => {
          e.stopPropagation();
          const p = e.target;
          const parentNode = p.closest('.sitemap-node');
          if (parentNode) parentNode.classList.remove('is-hovered');
          previewCard.classList.add('sitemap-hidden');
       });
    });
    
    // Search Integration
    const ok = (d, q) => {
      if (!q) return true;
      return String(d.corpus_text || "").toLowerCase().includes(q);
    };

    const paint = () => {
      const raw = i.value.trim();
      const q = raw.toLowerCase();
      
      nodes.forEach(node => {
         const slug = node.dataset.slug;
         const d = dsMap[slug];
         if (!d) return;
         if (q && ok(d, q)) {
             node.classList.add('has-glow');
         } else {
             node.classList.remove('has-glow');
         }
      });
    };

    i.addEventListener("input", paint);
    paint();
  };
"""

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find("  const hub = () => {")
end_idx = content.find("  normalizeHeader();", start_idx)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + js + content[end_idx:]
    with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patch successful!")
else:
    print("Could not find start/end indices")
