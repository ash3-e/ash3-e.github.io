import re

with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

start_idx = js_content.find("const hub = () => {")
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
    if (!box) return;

    box.innerHTML = "";

    // Exact block layout matching Claude & Codex coordinate models
    const sitemapNodes = [
      { id:"protocol-label", kind:"label",   x:  6.3, y: 26.2, w: 10,  h: 4,    title:"PROTOCOL\\nREPRESENTATION" },
      { id:"modbus",         kind:"concept", x:  1.1, y: 15.5, w: 18.3,h: 4.76, title:"BCODe.MODBUS", center:true },
      { id:"dnp3",           kind:"concept", x:  1.1, y: 21.45,w: 18.3,h: 4.76, title:"BCODe.DNP3", center:true },
      { id:"intro",          kind:"doc",     slug:"intro", x: 34.62,y: 81.83,w: 23.46,h:14.68 },
      { id:"syntax",         kind:"doc",     slug:"syntax", x: 35.49,y: 61.8, w: 21.73,h:14.68 },
      { id:"interpretation", kind:"doc",     slug:"interpretation", x: 35.49,y: 41.76,w: 21.73,h:14.68 },
      { id:"meta-v9",        kind:"doc",     slug:"meta-v9", x: 35.49,y: 21.72,w: 21.73,h:14.68 },
      { id:"rest",           kind:"doc",     slug:"rest", x: 32.35,y:  2.87,w: 13.56,h:14.68 },
      { id:"bcnode",         kind:"concept", x: 46.78,y:  2.87,w: 13.56,h:14.68, title:"BCODe.node", subtitles:["State relay","Mode sync","Health flags"] },
      { id:"meta-library",   kind:"doc",     slug:"meta-library-semantics", x:76.05,y:21.52,w:21.74,h:14.68 },
      { id:"best-practices", kind:"doc",     slug:"best-practices", x: 71.36,y: 81.83,w: 21.74,h:14.68 },
      { id:"telemetry",      kind:"doc",     slug:"telemetry-guide", x: 72.1, y: 58.15,w: 22.5, h:13.09 },
      { id:"freestyle",      kind:"concept", x: 64.28,y: 67.56,w: 16.18,h: 5.16, title:"FREESTYLE", center:true },
    ];

    const dsMap = Object.fromEntries(ds.map(d => [d.slug, d]));

    const containerOuter = document.createElement("div");
    containerOuter.className = "sitemap-container";
    
    // Connectors Background
    const svgStr = `
<svg class="sitemap-connectors" viewBox="0 0 1150.5081 1008.1333" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="acArrUp" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 10 L 5 0 L 10 10 z" fill="var(--primary-purple, #6820e0)"/>
    </marker>
    <marker id="acArrAuto" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary-purple-dark, #3b13e0)"/>
    </marker>
  </defs>
  <line x1="325.808" y1="26.515" x2="325.808" y2="979.160" stroke="#c4b5fd" stroke-width="1.42" stroke-dasharray="7,5" opacity="0.4"/>
  <line x1="533.304" y1="824.983" x2="533.304" y2="779.591" stroke="#6820e0" stroke-width="2.18" marker-end="url(#acArrUp)"/>
  <line x1="533.304" y1="622.983" x2="533.304" y2="577.484" stroke="#6820e0" stroke-width="2.18" marker-end="url(#acArrUp)"/>
  <line x1="533.304" y1="420.983" x2="533.304" y2="375.583" stroke="#6820e0" stroke-width="2.18" marker-end="url(#acArrUp)"/>
  <line x1="449.725" y1="218.412" x2="449.725" y2="185.586" stroke="#6820e0" stroke-width="2.16" marker-end="url(#acArrUp)"/>
  <line x1="616.883" y1="218.412" x2="616.883" y2="185.586" stroke="#6820e0" stroke-width="2.16" marker-end="url(#acArrUp)"/>
  <path d="m 408.304,295.188 h -82.780 h -2.923 h -68.833 c -10.456,0 -10.489,-11.855 -10.489,-11.855 V 181.262" stroke="#3b13e0" stroke-width="2.05" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m 243.311,181.107 h -13.806" stroke="#3b13e0" stroke-width="1.75" fill="none" marker-end="url(#acArrAuto)"/>
  <line x1="242.498" y1="242.142" x2="229.505" y2="242.142" stroke="#3b13e0" stroke-width="1.75" marker-end="url(#acArrAuto)"/>
  <path d="m 658.474,292.983 h 154.839 c 12,0 12,12 12,12 l 0.246,204.054" stroke="#4338a8" stroke-width="2.2" stroke-dasharray="6,4" opacity="0.45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 990.261,292.983 H 835.422 c -6.250,0 -9.245,3.255 -10.680,6.374" stroke="#4338a8" stroke-width="2.2" stroke-dasharray="6,4" opacity="0.45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="m 658.558,497.038 h 155 c 12,0 12,12 12,12 v 163.405" stroke="#3b13e0" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#acArrAuto)"/>
  <path d="M 398.742,948.864 l -99.023,0.246" stroke="#7a34eb" stroke-width="2.2" stroke-dasharray="6,4" opacity="0.45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    containerOuter.innerHTML = svgStr;

    // Build the nodes
    sitemapNodes.forEach(pos => {
      let d = null;
      let meta = null;
      let titleLabel = pos.title || "";
      let chips = "";
      
      if (pos.slug) {
         d = dsMap[pos.slug];
         if(!d && pos.slug!=='meta-library-semantics') return;
         if (d) {
             meta = portalMeta(d);
             titleLabel = cleanMenuTitle(d.display_title);
             chips = meta.subheaders.map((s) => 
               `<a class="sub-pill sub-pill-link sitemap-pill" data-label="${esc(s)}" href="${subtopicHref(d, s, "")}">${esc(s)}</a>`
             ).join("");
         }
      } else if (pos.subtitles) {
         chips = pos.subtitles.map(s => `<span class="sub-pill sitemap-pill" data-label="${esc(s)}">${esc(s)}</span>`).join("");
      }

      const nodeEl = document.createElement("article");
      nodeEl.className = "sitemap-node " + (pos.kind === 'label' ? 'is-label' : pos.kind === 'concept' ? 'is-concept' : '');
      nodeEl.style.left = pos.x + "%";
      nodeEl.style.top = pos.y + "%";
      nodeEl.style.width = pos.w + "%";
      nodeEl.style.height = pos.h + "%";
      
      if (d) {
         nodeEl.dataset.slug = d.slug;
         nodeEl.dataset.href = readerFileForSlug(d.slug);
         nodeEl.classList.add("doc-card");
      }
      
      nodeEl.innerHTML = `
        <div class="doc-card-main ${pos.center ? 'centered' : ''}">
          <p class="title">${esc(titleLabel)}</p>
          ${d && meta && meta.preview ? `<div class="meta">${esc(meta.preview || d.display_title)}</div>` : ''}
        </div>
        ${chips ? `<div class="subheaders sitemap-subheaders">${chips}</div>` : ""}
      `;

      nodeEl.addEventListener('mouseenter', () => {
         nodeEl.classList.add('is-hovered');
         if(d && meta) updatePreviewCard(d, meta);
         else updatePreviewCardFallback(titleLabel, pos.slug ? "Missing documentation" : "Conceptual diagram node");
      });
      nodeEl.addEventListener('mouseleave', () => {
         nodeEl.classList.remove('is-hovered');
      });
      if (d) {
         nodeEl.addEventListener('click', (e) => {
            if(!e.target.closest('.sub-pill-link')) window.location.href = nodeEl.dataset.href;
         });
      }
      
      containerOuter.appendChild(nodeEl);
    });

    box.appendChild(containerOuter);

    // My search card preview
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
    
    const updatePreviewCardFallback = (tt, ds) => {
       previewCard.classList.remove("sitemap-hidden");
       document.getElementById("sp-title").textContent = tt;
       document.getElementById("sp-desc").textContent = ds;
    };

    // Claude's Highlighting Schema Search
    if (i) {
       i.addEventListener("input", (e) => {
          const term = e.target.value.toLowerCase().trim();
          
          if (!term) {
             containerOuter.classList.remove('is-searching');
             containerOuter.querySelectorAll('.sitemap-node').forEach(n => {
                n.classList.remove('is-glowing');
                n.querySelectorAll('.sitemap-pill').forEach(p => p.classList.remove('is-subtitle-glowing'));
             });
             return;
          }
          
          containerOuter.classList.add('is-searching');
          
          containerOuter.querySelectorAll('.sitemap-node').forEach(node => {
             // Does node title/meta contain term?
             let isHit = false;
             const nodeTxt = (node.textContent || "").toLowerCase();
             if (nodeTxt.includes(term)) {
                 isHit = true;
             }
             
             if (isHit) {
                 node.classList.add('is-glowing');
             } else {
                 node.classList.remove('is-glowing');
             }
             
             // Highlight specific pills independently
             node.querySelectorAll('.sitemap-pill').forEach(p => {
                 if (isHit && (p.textContent||"").toLowerCase().includes(term)) {
                     p.classList.add('is-subtitle-glowing');
                 } else {
                     p.classList.remove('is-subtitle-glowing');
                 }
             });
          });
       });
    }
  };

  """
    
final_content = js_content[:start_idx] + new_hub + js_content[end_idx:]
with open(r'c:\Users\^w^\Downloads\site\assets\antigravity-site.js', 'w', encoding='utf-8') as f:
    f.write(final_content)
print("hub() replaced successfully with Claude layout coordinates and search schema.")
