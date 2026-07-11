import sys
from PIL import Image

def process_favicon():
    img_path = 'last favicon.png'
    try:
        img = Image.open(img_path)
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    # Ensure image has an alpha channel
    img = img.convert("RGBA")

    # Crop to bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Make it a perfect square
    width, height = img.size
    max_dim = max(width, height)
    
    # Create a new transparent square image
    square_img = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    
    # Calculate offset to center the cropped image
    offset_x = (max_dim - width) // 2
    offset_y = (max_dim - height) // 2
    
    # Paste the cropped image into the square
    square_img.paste(img, (offset_x, offset_y))

    sizes = [16, 32, 48, 180, 512]
    for size in sizes:
        resized = square_img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = f'favicon-{size}x{size}.png'
        resized.save(out_path, format="PNG")
        print(f"Saved {out_path}")

if __name__ == "__main__":
    process_favicon()
