import os
from PIL import Image, ImageDraw, ImageFont

ICONS_DIR = "/home/sushantk/Developer/personal/ai-personal-assistant/public/icons/social"
os.makedirs(ICONS_DIR, exist_ok=True)

def create_icon(name, draw_fn):
    # Render at 4x resolution (1024x1024) and downscale with Lanczos for ultra-crisp antialiasing
    scale = 4
    size = 256 * scale
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_fn(draw, size, scale)
    # Downsample
    final_img = img.resize((256, 256), Image.Resampling.LANCZOS)
    png_path = os.path.join(ICONS_DIR, f"{name}.png")
    final_img.save(png_path, "PNG")
    print(f"Generated {png_path}")

# 1. GMAIL
def draw_gmail(draw, size, s):
    # Rounded squircle background
    r = int(50 * s)
    margin = int(24 * s)
    draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=r, fill=(255, 255, 255, 255))
    # Red & Google multi-color envelope
    left, top, right, bottom = int(48 * s), int(64 * s), int(size - 48 * s), int(size - 64 * s)
    mid_x = size // 2
    
    # Left flap blue
    draw.polygon([(left, top), (left + int(40*s), top + int(30*s)), (left + int(40*s), bottom), (left, bottom)], fill=(66, 133, 244))
    # Right flap green
    draw.polygon([(right, top), (right - int(40*s), top + int(30*s)), (right - int(40*s), bottom), (right, bottom)], fill=(52, 168, 83))
    # Bottom yellow
    draw.polygon([(left, bottom), (mid_x, bottom - int(40*s)), (right, bottom)], fill=(251, 188, 4))
    # Central M Red
    draw.polygon([(left, top), (mid_x, top + int(56*s)), (right, top), (right - int(24*s), top), (mid_x, top + int(36*s)), (left + int(24*s), top)], fill=(234, 67, 53))
    # Left red stripe
    draw.polygon([(left, top), (left + int(24*s), top), (left + int(40*s), top + int(30*s)), (left, top + int(30*s))], fill=(197, 34, 31))
    # Right red stripe
    draw.polygon([(right, top), (right - int(24*s), top), (right - int(40*s), top + int(30*s)), (right, top + int(30*s))], fill=(197, 34, 31))

# 2. SLACK
def draw_slack(draw, size, s):
    r = int(50 * s)
    margin = int(24 * s)
    draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=r, fill=(255, 255, 255, 255))
    cx, cy = size // 2, size // 2
    
    # Slack hashtag elements
    # Blue (left)
    draw.rounded_rectangle([cx - int(70*s), cy - int(32*s), cx - int(42*s), cy + int(32*s)], radius=int(14*s), fill=(54, 197, 240))
    draw.rounded_rectangle([cx - int(70*s), cy - int(70*s), cx - int(42*s), cy - int(42*s)], radius=int(14*s), fill=(54, 197, 240))
    
    # Green (top)
    draw.rounded_rectangle([cx - int(32*s), cy - int(70*s), cx + int(32*s), cy - int(42*s)], radius=int(14*s), fill=(46, 182, 125))
    draw.rounded_rectangle([cx + int(42*s), cy - int(70*s), cx + int(70*s), cy - int(42*s)], radius=int(14*s), fill=(46, 182, 125))
    
    # Yellow (right)
    draw.rounded_rectangle([cx + int(42*s), cy - int(32*s), cx + int(70*s), cy + int(32*s)], radius=int(14*s), fill=(236, 178, 46))
    draw.rounded_rectangle([cx + int(42*s), cy + int(42*s), cx + int(70*s), cy + int(70*s)], radius=int(14*s), fill=(236, 178, 46))
    
    # Red (bottom)
    draw.rounded_rectangle([cx - int(32*s), cy + int(42*s), cx + int(32*s), cy + int(70*s)], radius=int(14*s), fill=(224, 30, 90))
    draw.rounded_rectangle([cx - int(70*s), cy + int(42*s), cx - int(42*s), cy + int(70*s)], radius=int(14*s), fill=(224, 30, 90))

# 3. WHATSAPP
def draw_whatsapp(draw, size, s):
    r = int(50 * s)
    margin = int(24 * s)
    draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=r, fill=(37, 211, 102))
    
    # Speech bubble + telephone icon
    cx, cy = size // 2, size // 2
    rad = int(72 * s)
    draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(255, 255, 255))
    # Inner green
    draw.ellipse([cx - int(60*s), cy - int(60*s), cx + int(60*s), cy + int(60*s)], fill=(37, 211, 102))
    # Tail
    draw.polygon([(cx - int(35*s), cy + int(45*s)), (cx - int(60*s), cy + int(75*s)), (cx - int(15*s), cy + int(56*s))], fill=(255, 255, 255))
    draw.polygon([(cx - int(30*s), cy + int(42*s)), (cx - int(52*s), cy + int(68*s)), (cx - int(14*s), cy + int(50*s))], fill=(37, 211, 102))
    
    # White phone receiver
    draw.rounded_rectangle([cx - int(24*s), cy - int(24*s), cx + int(24*s), cy + int(24*s)], radius=int(8*s), fill=(255, 255, 255))

# 4. TELEGRAM
def draw_telegram(draw, size, s):
    r = int(50 * s)
    margin = int(24 * s)
    draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=r, fill=(42, 171, 238))
    cx, cy = size // 2, size // 2
    
    # White paper plane
    p1 = (cx - int(50*s), cy)
    p2 = (cx + int(56*s), cy - int(44*s))
    p3 = (cx + int(28*s), cy + int(46*s))
    p4 = (cx - int(2*s), cy + int(18*s))
    p5 = (cx - int(14*s), cy + int(42*s))
    
    draw.polygon([p1, p2, p4], fill=(255, 255, 255))
    draw.polygon([p2, p3, p4], fill=(240, 244, 248))
    draw.polygon([p4, p3, p5], fill=(210, 222, 235))

# 5. OUTLOOK
def draw_outlook(draw, size, s):
    r = int(50 * s)
    margin = int(24 * s)
    draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=r, fill=(0, 120, 212))
    cx, cy = size // 2, size // 2
    
    # Back envelope flap
    draw.rounded_rectangle([cx - int(30*s), cy - int(48*s), cx + int(64*s), cy + int(48*s)], radius=int(12*s), fill=(40, 168, 234))
    draw.polygon([(cx - int(30*s), cy - int(48*s)), (cx + int(17*s), cy), (cx + int(64*s), cy - int(48*s))], fill=(0, 90, 160))
    
    # Front 'O' square tile
    draw.rounded_rectangle([cx - int(64*s), cy - int(38*s), cx + int(10*s), cy + int(38*s)], radius=int(14*s), fill=(0, 120, 212))
    draw.ellipse([cx - int(44*s), cy - int(20*s), cx - int(10*s), cy + int(20*s)], outline=(255, 255, 255), width=int(10*s))

# 6. GOOGLE CALENDAR
def draw_gcal(draw, size, s):
    r = int(50 * s)
    margin = int(24 * s)
    draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=r, fill=(255, 255, 255))
    cx, cy = size // 2, size // 2
    
    # Blue calendar banner top
    draw.rounded_rectangle([margin + int(10*s), margin + int(10*s), size - margin - int(10*s), cy - int(10*s)], radius=int(16*s), fill=(26, 115, 232))
    draw.rectangle([margin + int(10*s), cy - int(30*s), size - margin - int(10*s), cy - int(10*s)], fill=(26, 115, 232))
    
    # Calendar pins
    draw.rounded_rectangle([cx - int(45*s), margin, cx - int(25*s), margin + int(24*s)], radius=int(6*s), fill=(234, 67, 53))
    draw.rounded_rectangle([cx + int(25*s), margin, cx + int(45*s), margin + int(24*s)], radius=int(6*s), fill=(234, 67, 53))
    
    # Number "31" in bold center
    # Draw custom bold 3 and 1
    # 3
    bx = cx - int(36*s)
    by = cy + int(4*s)
    draw.rounded_rectangle([bx, by, bx + int(32*s), by + int(8*s)], radius=int(4*s), fill=(26, 115, 232))
    draw.rounded_rectangle([bx + int(24*s), by, bx + int(32*s), by + int(24*s)], radius=int(4*s), fill=(26, 115, 232))
    draw.rounded_rectangle([bx + int(8*s), by + int(20*s), bx + int(32*s), by + int(28*s)], radius=int(4*s), fill=(26, 115, 232))
    draw.rounded_rectangle([bx + int(24*s), by + int(24*s), bx + int(32*s), by + int(48*s)], radius=int(4*s), fill=(26, 115, 232))
    draw.rounded_rectangle([bx, by + int(42*s), bx + int(32*s), by + int(50*s)], radius=int(4*s), fill=(26, 115, 232))
    
    # 1
    ox = cx + int(16*s)
    draw.rounded_rectangle([ox + int(8*s), by, ox + int(18*s), by + int(50*s)], radius=int(4*s), fill=(26, 115, 232))
    draw.polygon([(ox, by + int(14*s)), (ox + int(10*s), by), (ox + int(10*s), by + int(10*s))], fill=(26, 115, 232))
    draw.rounded_rectangle([ox, by + int(44*s), ox + int(26*s), by + int(50*s)], radius=int(3*s), fill=(26, 115, 232))

# 7. NOTION
def draw_notion(draw, size, s):
    r = int(50 * s)
    margin = int(24 * s)
    # Notion signature dark tile with high contrast
    draw.rounded_rectangle([margin, margin, size - margin, size - margin], radius=r, fill=(0, 0, 0))
    cx, cy = size // 2, size // 2
    
    # White slanted paper base
    p1 = (cx - int(48*s), cy - int(44*s))
    p2 = (cx + int(44*s), cy - int(52*s))
    p3 = (cx + int(52*s), cy + int(48*s))
    p4 = (cx - int(40*s), cy + int(56*s))
    draw.polygon([p1, p2, p3, p4], fill=(255, 255, 255))
    
    # Stylized bold 'N' inside
    nx = cx - int(24*s)
    ny = cy - int(32*s)
    # Left bar
    draw.rounded_rectangle([nx, ny, nx + int(12*s), ny + int(64*s)], radius=int(3*s), fill=(0, 0, 0))
    # Diagonal
    draw.polygon([(nx + int(8*s), ny + int(4*s)), (nx + int(40*s), ny + int(56*s)), (nx + int(48*s), ny + int(54*s)), (nx + int(12*s), ny)], fill=(0, 0, 0))
    # Right bar
    draw.rounded_rectangle([nx + int(38*s), ny, nx + int(50*s), ny + int(64*s)], radius=int(3*s), fill=(0, 0, 0))

create_icon("gmail", draw_gmail)
create_icon("slack", draw_slack)
create_icon("whatsapp", draw_whatsapp)
create_icon("telegram", draw_telegram)
create_icon("outlook", draw_outlook)
create_icon("gcal", draw_gcal)
create_icon("notion", draw_notion)
print("All PNG icons created successfully.")
