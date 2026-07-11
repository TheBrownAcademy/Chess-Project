import base64
from PIL import Image

img = Image.open('icon_tight.png')
w, h = img.size
scale = 100 / h
new_w, new_h = int(w * scale), 100
img_small = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
img_small.save('icon_tight_small.png')

with open('icon_tight_small.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_width = new_w + 24 + 280
svg_height = 100
svg = f"""<svg viewBox="0 0 {svg_width} {svg_height}" width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800&amp;display=swap');
      .logo-text {{
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-weight: 800;
        font-size: 68px;
        fill: #FFFFFF;
        letter-spacing: -2px;
      }}
    </style>
  </defs>
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="{new_w}" height="{new_h}" />
  <text x="{new_w + 18}" y="78" class="logo-text">XLChess</text>
</svg>
"""

with open('logo.svg', 'w') as f:
    f.write(svg)
print(f'logo.svg generated with width {svg_width}')
