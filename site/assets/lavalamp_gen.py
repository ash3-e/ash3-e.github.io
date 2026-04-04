import sys

with open(r'c:\Users\^w^\Downloads\backgroundtext.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Properly escape backslashes and backticks
escaped_lines = []
for line in lines:
    line = line.rstrip('\n').replace('\\', '\\\\').replace('`', '\\`')
    escaped_lines.append(f"  `{line}`")

initial_text_js = "[\n" + ",\n".join(escaped_lines) + "\n];"

js_code = f"""
(function() {{
  const initialText = {initial_text_js}

  // Configuration
  const W = initialText[0].length; // 159
  const H = initialText.length;    // 51
  
  // The chars in order of density. 
  const CHARS = ['.', ',', '-', '<', '>', '\\\\', '?', '!', '#'];

  function charToDensity(c) {{
    const idx = CHARS.indexOf(c);
    if (idx === -1) return 0;
    return (idx + 1) / CHARS.length; // shift slightly so empty isn't zero if we don't want
  }}

  function densityToChar(d) {{
    let idx = Math.floor(d * CHARS.length);
    if (idx < 0) idx = 0;
    if (idx >= CHARS.length) idx = CHARS.length - 1;
    return CHARS[idx];
  }}

  let density = new Float32Array(W * H);
  let nextDensity = new Float32Array(W * H);

  for (let y = 0; y < H; y++) {{
    for (let x = 0; x < W; x++) {{
      density[y * W + x] = charToDensity(initialText[y][x]);
    }}
  }}

  // Lava "Blobs" simulation
  const numBlobs = 20;
  const blobs = [];
  for (let i = 0; i < numBlobs; i++) {{
    blobs.push({{
      x: Math.random() * W,
      y: H + Math.random() * 20, 
      vy: - (0.05 + Math.random() * 0.1), 
      radius: 4 + Math.random() * 5
    }});
  }}

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '0'; // Should be behind header/main (z-index 1) but over body base background
  canvas.style.pointerEvents = 'none';
  document.body.insertBefore(canvas, document.body.firstChild);
  
  const ctx = canvas.getContext('2d');
  
  let cw = 0, ch = 0;
  let cellW = 0, cellH = 0;

  function resize() {{
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = cw;
    canvas.height = ch;
    
    cellW = cw / W;
    cellH = ch / H;
  }}
  window.addEventListener('resize', resize);
  resize();

  function update() {{
    for (const b of blobs) {{
      b.y += b.vy;
      b.x += (Math.random() - 0.5) * 0.1;
      
      if (b.y < -b.radius) {{
        b.y = H + b.radius;
        b.x = Math.random() * W;
      }}
    }}
    
    for (let y = 0; y < H; y++) {{
      for (let x = 0; x < W; x++) {{
        const srcY = y + 0.2; 
        const iy1 = Math.floor(srcY);
        const iy2 = iy1 + 1;
        const fy = srcY - iy1;
        
        const cy1 = Math.min(Math.max(iy1, 0), H - 1);
        const cy2 = Math.min(Math.max(iy2, 0), H - 1);
        
        let d = density[cy1 * W + x] * (1 - fy) + density[cy2 * W + x] * fy;
        
        const cx1 = Math.max(x - 1, 0);
        const cx2 = Math.min(x + 1, W - 1);
        d = d * 0.98 + (density[cy1 * W + cx1] + density[cy1 * W + cx2]) * 0.009;
        
        // Add blob contributions
        let blobDensity = 0;
        for (const b of blobs) {{
          const dx = b.x - x;
          const dy = b.y - y;
          const distSq = dx*dx + dy*dy;
          const rSq = b.radius * b.radius;
          if (distSq < rSq) {{
            const val = 1 - (distSq / rSq);
            blobDensity += val * val * 0.5; // smooth addition
          }}
        }}
        
        // Dissipate the initial text smoothly over time to let lava take over
        d = d * 0.99; 
        
        nextDensity[y * W + x] = Math.max(0, Math.min(1.0, d + blobDensity));
      }}
    }}
    
    const temp = density;
    density = nextDensity;
    nextDensity = temp;
  }}

  function render() {{
    ctx.clearRect(0, 0, cw, ch);
    
    const textGradient = ctx.createLinearGradient(0, 0, 0, ch);
    textGradient.addColorStop(0, '#ab79fd');
    textGradient.addColorStop(1, '#5300d8');
    
    ctx.font = `bold ${{Math.max(10, Math.floor(cellH))}}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = textGradient;
    
    // Filter approach for Bloom
    ctx.filter = 'blur(4px)';
    ctx.globalAlpha = 0.5;
    drawTextGrid();
    
    // Solid layer
    ctx.filter = 'none';
    ctx.globalAlpha = 1.0;
    drawTextGrid();
  }}

  function drawTextGrid() {{
    for (let y = 0; y < H; y++) {{
      let str = '';
      for (let x = 0; x < W; x++) {{
        str += densityToChar(density[y * W + x]);
      }}
      ctx.fillText(str, 0, y * cellH);
    }}
  }}

  function loop() {{
    update();
    render();
    requestAnimationFrame(loop);
  }}
  
  requestAnimationFrame(loop);

}})();
"""

with open(r'c:\Users\^w^\Downloads\site\assets\lavalamp.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("Created lavalamp.js")
