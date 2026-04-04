import sys
import glob

with open(r'c:\Users\^w^\Downloads\backgroundtext.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

escaped_lines = []
for line in lines:
    line = line.rstrip('\n').replace('\\', '\\\\').replace('`', '\\`')
    escaped_lines.append(f"  `{line}`")

initial_text_js = "[\n" + ",\n".join(escaped_lines) + "\n];"

js_code = f"""
(function() {{
  const initialText = {initial_text_js}

  const W = initialText[0].length; // 159
  const H = initialText.length;    // 51
  
  const charList = ['.', ',', '-', '<', '>', String.fromCharCode(92), '?', '!', '#'];

  function charToDensity(c) {{
    const idx = charList.indexOf(c);
    if (idx === -1) return 0;
    return (idx + 1) / charList.length;
  }}

  let density = new Float32Array(W * H);
  let nextDensity = new Float32Array(W * H);

  for (let y = 0; y < H; y++) {{
    let rowOff = y * W;
    for (let x = 0; x < W; x++) {{
      density[rowOff + x] = charToDensity(initialText[y][x]);
    }}
  }}

  const numBlobs = 20;
  const blobs = [];
  for (let i = 0; i < numBlobs; i++) {{
    let r = 4 + Math.random() * 5;
    blobs.push({{
      x: Math.random() * W,
      y: H + Math.random() * 20, 
      vy: - (0.05 + Math.random() * 0.1), 
      radius: r,
      rSq: r * r
    }});
  }}

  // Internal rendering resolution
  // Fixed size allows crisp rendering without measuring/scaling on resize
  // CSS 100vw/100vh cleanly scales the fixed internal canvas
  const FONT_SIZE = 20;
  const CHAR_W = 12; // 20px monospace is ~12px wide
  const CHAR_H = 22; // Line height
  const canvasW = W * CHAR_W;
  const canvasH = H * CHAR_H;

  const canvas = document.createElement('canvas');
  canvas.id = 'lavalamp-canvas';
  canvas.width = canvasW;
  canvas.height = canvasH;
  Object.assign(canvas.style, {{
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '-1',
    pointerEvents: 'none'
  }});
  document.body.prepend(canvas);
  
  const bloomCanvas = document.createElement('canvas');
  bloomCanvas.width = canvasW;
  bloomCanvas.height = canvasH;
  Object.assign(bloomCanvas.style, {{
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '-2',
    pointerEvents: 'none',
    filter: 'blur(10px)', // Hardware-accelerated CSS blur! Hugely improves performance.
    opacity: '0.6'
  }});
  document.body.prepend(bloomCanvas);
  
  const ctx = canvas.getContext('2d', {{ alpha: true, desynchronized: true }});
  const bloomCtx = bloomCanvas.getContext('2d', {{ alpha: true, desynchronized: true }});
  
  const textGradient = ctx.createLinearGradient(0, 0, 0, canvasH);
  textGradient.addColorStop(0, '#ab79fd');
  textGradient.addColorStop(1, '#5300d8');

  ctx.font = `bold ${{FONT_SIZE}}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = textGradient;

  function update() {{
    for (const b of blobs) {{
      b.y += b.vy;
      b.x += (Math.random() - 0.5) * 0.1;
      
      if (b.y < -b.radius) {{
        b.y = H + b.radius;
        b.x = Math.random() * W;
      }}
    }}
    
    // Advect & diffuse grid efficiently
    for (let y = 0; y < H; y++) {{
      let rowOffset = y * W;
      let srcY = y + 0.2; 
      let iy1 = Math.floor(srcY);
      let iy2 = iy1 + 1;
      let fy = srcY - iy1;
      
      let cy1 = iy1 < 0 ? 0 : iy1 >= H ? H - 1 : iy1;
      let cy2 = iy2 < 0 ? 0 : iy2 >= H ? H - 1 : iy2;
      let row1 = cy1 * W;
      let row2 = cy2 * W;

      for (let x = 0; x < W; x++) {{
        let d = density[row1 + x] * (1 - fy) + density[row2 + x] * fy;
        
        let cx1 = x > 0 ? x - 1 : 0;
        let cx2 = x < W - 1 ? x + 1 : W - 1;
        d = d * 0.98 + (density[row1 + cx1] + density[row1 + cx2]) * 0.009;
        
        nextDensity[rowOffset + x] = d * 0.99;
      }}
    }}
    
    // Process blobs using bounding boxes (huge performance win)
    for (let i = 0; i < blobs.length; i++) {{
      let b = blobs[i];
      let minX = Math.max(0, Math.floor(b.x - b.radius));
      let maxX = Math.min(W - 1, Math.ceil(b.x + b.radius));
      let minY = Math.max(0, Math.floor(b.y - b.radius));
      let maxY = Math.min(H - 1, Math.ceil(b.y + b.radius));
      
      let rSq = b.rSq;
      for(let y = minY; y <= maxY; y++) {{
        let rowOffset = y * W;
        let dy = b.y - y;
        let dySq = dy * dy;
        for(let x = minX; x <= maxX; x++) {{
          let dx = b.x - x;
          let distSq = dx * dx + dySq;
          if (distSq < rSq) {{
            let val = 1 - (distSq / rSq);
            nextDensity[rowOffset + x] += val * val * 0.5;
          }}
        }}
      }}
    }}
    
    // Clamp
    for(let i = 0; i < W * H; i++) {{
      if (nextDensity[i] > 1) nextDensity[i] = 1.0;
    }}
    
    const temp = density;
    density = nextDensity;
    nextDensity = temp;
  }}

  function render() {{
    ctx.clearRect(0, 0, canvasW, canvasH);
    
    for (let y = 0; y < H; y++) {{
      let str = '';
      let rowOffset = y * W;
      for (let x = 0; x < W; x++) {{
        let d = density[rowOffset + x];
        let idx = Math.floor(d * 9);
        if (idx > 8) idx = 8;
        str += charList[idx];
      }}
      ctx.fillText(str, 0, y * CHAR_H);
    }}
    
    // Copy crisp canvas to bloom canvas (immensely faster than redrawing via CPU filter)
    bloomCtx.clearRect(0, 0, canvasW, canvasH);
    bloomCtx.drawImage(canvas, 0, 0);
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

print("Created highly optimized lavalamp.js")

# Distribute across all HTML files
html_files = glob.glob(r'c:\Users\^w^\Downloads\site\**\*.html', recursive=True)
count = 0

for file in html_files:
    if r'\_restore' in file or r'\backup' in file:
        continue
        
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Cleanup previous instances
    content = content.replace('<script src="../assets/lavalamp.js"></script>', '')
    content = content.replace('<script src="assets/lavalamp.js"></script>', '')
    content = content.replace('<script src="/assets/lavalamp.js"></script>', '')
    
    # Find site.js relative path and append
    if '<script src="../assets/site.js">' in content:
        content = content.replace('</body>', '<script src="../assets/lavalamp.js"></script></body>')
        count += 1
    elif '<script src="assets/site.js">' in content:
        content = content.replace('</body>', '<script src="assets/lavalamp.js"></script></body>')
        count += 1
    else:
        # Fallback manual calculation
        depth = file.replace(r'c:\Users\^w^\Downloads\site\\', '').count('\\')
        prefix = '../' * depth + 'assets/'
        content = content.replace('</body>', f'<script src="{prefix}lavalamp.js"></script></body>')
        count += 1

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Lavalamp distributed to {count} html files.")
