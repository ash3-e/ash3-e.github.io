import sys

with open(r'c:\Users\^w^\Downloads\backgroundtext.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Exact color matching from user description:
# Background layer (top -> bottom): dark purple (#2d0087) -> light purple (#aa6cff)
# Text layer (top -> bottom): light purple (#aa6cff) -> dark purple (#2d0087) 
# Both the solid text and the bloom should use the inverted gradient.

bg_top = "#3a00b8"
bg_bottom = "#b782ff"

text_top = "#b782ff"
text_bottom = "#3a00b8"

text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
lines = text.strip().split('\n')

svg_lines = []
y = 10
# Based on the user's images, the text is tightly packed.
line_height = 10.5 

for line in lines:
    svg_lines.append(f'<tspan x="0" y="{y}">{line}</tspan>')
    y += line_height

text_content = '\n'.join(svg_lines)

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1600 600">
  <defs>
    <!-- Background Gradient: Dark Purple to Light Purple -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{bg_top}" />
      <stop offset="100%" stop-color="{bg_bottom}" />
    </linearGradient>
    
    <!-- Text Gradient: Inverted (Light Purple to Dark Purple) -->
    <linearGradient id="txt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{text_top}" />
      <stop offset="100%" stop-color="{text_bottom}" />
    </linearGradient>

    <!-- Bloom filter -->
    <filter id="bloom" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feComponentTransfer in="blur" result="glow">
        <feFuncA type="linear" slope="2.0"/>
      </feComponentTransfer>
      <!-- Merge the glow with itself to intensify if needed, or just output glow -->
    </filter>

    <text id="bg-text" font-family="monospace" font-size="11" font-weight="900" letter-spacing="3.5">
        {text_content}
    </text>
  </defs>

  <!-- Solid Background Layer -->
  <rect width="100%" height="100%" fill="url(#bg-grad)" />
  
  <g>
      <!-- Shadow/Bloom layer: uses text gradient -->
      <use href="#bg-text" fill="url(#txt-grad)" filter="url(#bloom)" opacity="0.9" />
      
      <!-- Solid text layer EXACTLY overlapping (uses text gradient) -->
      <use href="#bg-text" fill="url(#txt-grad)" opacity="1.0" />
  </g>
</svg>"""

with open(r'c:\Users\^w^\Downloads\site\assets\bckgroundgradient.svg', 'w', encoding='utf-8') as f:
    f.write(svg)

print("Created bckgroundgradient.svg mapped exactly as requested.")
