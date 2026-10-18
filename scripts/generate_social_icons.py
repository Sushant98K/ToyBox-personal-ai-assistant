import os
from PIL import Image, ImageDraw, ImageFont

ICONS_DIR = "public/icons/social"
os.makedirs(ICONS_DIR, exist_ok=True)

# 4x Supersampling for ultra-crisp antialiasing (draw at 1024x1024, resize to 256x256 with LANCZOS)
SIZE = 1024
OUT_SIZE = (256, 256)

def create_canvas():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

def save_icon(img, name):
    res = img.resize(OUT_SIZE, Image.Resampling.LANCZOS)
    path = os.path.join(ICONS_DIR, f"{name}.png")
    res.save(path, "PNG", optimize=True)
    print(f"Generated {path}")

# 1. GMAIL
def make_gmail():
    img = create_canvas()
    d = ImageDraw.Draw(img)
    # Scaled coordinates for 1024x1024
    # Official Gmail M layout
    # Left blue column
    d.polygon([(160, 260), (360, 420), (360, 840), (220, 840), (160, 780)], fill=(66, 133, 244, 255))
    # Right green column
    d.polygon([(864, 260), (664, 420), (664, 840), (804, 840), (864, 780)], fill=(52, 168, 83, 255))
    # Top red chevron
    d.polygon([(160, 260), (512, 530), (864, 260), (760, 180), (512, 370), (264, 180)], fill=(234, 67, 53, 255))
    # Left yellow shoulder
    d.polygon([(160, 260), (264, 180), (360, 254), (360, 420)], fill=(251, 188, 4, 255))
    # Right red shoulder
    d.polygon([(864, 260), (760, 180), (664, 254), (664, 420)], fill=(234, 67, 53, 255))
    save_icon(img, "gmail")

# 2. SLACK
def make_slack():
    img = create_canvas()
    d = ImageDraw.Draw(img)
    # Slack 4-color layout: Red, Green, Blue, Yellow
    # Top-left Green (#2EB67D)
    d.rounded_rectangle([390, 140, 490, 410], radius=50, fill=(46, 182, 125, 255))
    d.rounded_rectangle([200, 310, 470, 410], radius=50, fill=(46, 182, 125, 255))
    d.ellipse([200, 200, 300, 300], fill=(46, 182, 125, 255))

    # Top-right Blue (#36C5F0)
    d.rounded_rectangle([614, 390, 884, 490], radius=50, fill=(54, 197, 240, 255))
    d.rounded_rectangle([614, 200, 714, 470], radius=50, fill=(54, 197, 240, 255))
    d.ellipse([724, 200, 824, 300], fill=(54, 197, 240, 255))

    # Bottom-right Yellow (#ECB22E)
    d.rounded_rectangle([534, 614, 634, 884], radius=50, fill=(236, 178, 46, 255))
    d.rounded_rectangle([554, 614, 824, 714], radius=50, fill=(236, 178, 46, 255))
    d.ellipse([724, 724, 824, 824], fill=(236, 178, 46, 255))

    # Bottom-left Red (#E01E5A)
    d.rounded_rectangle([140, 534, 410, 634], radius=50, fill=(224, 30, 90, 255))
    d.rounded_rectangle([310, 554, 410, 824], radius=50, fill=(224, 30, 90, 255))
    d.ellipse([200, 724, 300, 824], fill=(224, 30, 90, 255))
    save_icon(img, "slack")

# 3. WHATSAPP
def make_whatsapp():
    img = create_canvas()
    d = ImageDraw.Draw(img)
    # Circle background
    d.ellipse([100, 100, 924, 924], fill=(37, 211, 102, 255))
    # Speech tail triangle
    d.polygon([(260, 740), (180, 860), (370, 810)], fill=(37, 211, 102, 255))
    # Phone handset shape in white
    phone_poly = [
        (350, 290), (430, 290), (460, 390), (400, 440),
        (430, 510), (510, 590), (580, 620), (630, 560),
        (730, 590), (730, 670), (650, 740), (550, 740),
        (420, 680), (340, 600), (280, 470), (280, 370)
    ]
    # Smooth handset
    d.ellipse([270, 270, 754, 754], outline=(255, 255, 255, 255), width=48)
    d.polygon([(360, 680), (270, 780), (450, 720)], fill=(255, 255, 255, 255))
    d.polygon(phone_poly, fill=(255, 255, 255, 255))
    save_icon(img, "whatsapp")

# 4. TELEGRAM
def make_telegram():
    img = create_canvas()
    d = ImageDraw.Draw(img)
    # Blue circle
    d.ellipse([100, 100, 924, 924], fill=(42, 171, 238, 255))
    # Crisp white airplane
    plane_poly = [
        (260, 520), (760, 300), (620, 750), (490, 640),
        (430, 720), (410, 590), (660, 390), (340, 550)
    ]
    d.polygon(plane_poly, fill=(255, 255, 255, 255))
    save_icon(img, "telegram")

# 5. OUTLOOK
def make_outlook():
    img = create_canvas()
    d = ImageDraw.Draw(img)
    # Outer envelope in Microsoft blue #0078D4
    d.rounded_rectangle([300, 200, 880, 780], radius=60, fill=(0, 120, 212, 255))
    # Flap in lighter blue #28A8EA
    d.polygon([(300, 200), (590, 480), (880, 200)], fill=(40, 168, 234, 255))
    # Front 'O' square tile
    d.rounded_rectangle([140, 280, 560, 740], radius=60, fill=(0, 90, 160, 255))
    # White 'O' letter ring
    d.ellipse([230, 390, 470, 630], fill=(255, 255, 255, 255))
    d.ellipse([290, 450, 410, 570], fill=(0, 90, 160, 255))
    save_icon(img, "outlook")

# 6. GCAL (Google Calendar)
def make_gcal():
    img = create_canvas()
    d = ImageDraw.Draw(img)
    # Calendar blue backing
    d.rounded_rectangle([180, 160, 844, 864], radius=90, fill=(26, 115, 232, 255))
    # White inner page
    d.rounded_rectangle([250, 340, 774, 800], radius=50, fill=(255, 255, 255, 255))
    # Top calendar binding pins (red & yellow)
    d.rounded_rectangle([320, 110, 400, 230], radius=30, fill=(234, 67, 53, 255))
    d.rounded_rectangle([624, 110, 704, 230], radius=30, fill=(251, 188, 4, 255))
    # Bold "31" number drawn cleanly
    # "3"
    d.rounded_rectangle([340, 430, 480, 490], radius=25, fill=(26, 115, 232, 255))
    d.rounded_rectangle([420, 430, 480, 690], radius=25, fill=(26, 115, 232, 255))
    d.rounded_rectangle([360, 530, 480, 590], radius=25, fill=(26, 115, 232, 255))
    d.rounded_rectangle([340, 630, 480, 690], radius=25, fill=(26, 115, 232, 255))
    # "1"
    d.rounded_rectangle([560, 430, 620, 690], radius=25, fill=(26, 115, 232, 255))
    d.rounded_rectangle([500, 470, 570, 530], radius=25, fill=(26, 115, 232, 255))
    d.rounded_rectangle([520, 650, 660, 700], radius=25, fill=(26, 115, 232, 255))
    save_icon(img, "gcal")

# 7. NOTION
def make_notion():
    img = create_canvas()
    d = ImageDraw.Draw(img)
    # Notion icon: clean crisp white squircle card with subtle hairline border so it pops on BOTH dark (#141414) and light (#FFFFFF)
    d.rounded_rectangle([140, 140, 884, 884], radius=150, fill=(255, 255, 255, 255), outline=(220, 222, 228, 255), width=24)
    # The classic bold black Notion 'N' with 3D flap
    # Outer sheet fold / corner
    d.polygon([(290, 260), (734, 220), (710, 310), (330, 330)], fill=(0, 0, 0, 255))
    # Left serif leg
    d.rounded_rectangle([320, 330, 410, 770], radius=18, fill=(0, 0, 0, 255))
    d.polygon([(280, 340), (440, 340), (410, 400), (320, 400)], fill=(0, 0, 0, 255))
    d.polygon([(280, 730), (450, 730), (410, 770), (300, 770)], fill=(0, 0, 0, 255))
    # Right serif leg
    d.rounded_rectangle([634, 330, 724, 770], radius=18, fill=(0, 0, 0, 255))
    d.polygon([(600, 340), (754, 340), (724, 400), (634, 400)], fill=(0, 0, 0, 255))
    d.polygon([(600, 730), (754, 730), (724, 770), (614, 770)], fill=(0, 0, 0, 255))
    # Diagonal crossbar
    d.polygon([(380, 370), (650, 680), (650, 760), (380, 450)], fill=(0, 0, 0, 255))
    save_icon(img, "notion")

if __name__ == "__main__":
    make_gmail()
    make_slack()
    make_whatsapp()
    make_telegram()
    make_outlook()
    make_gcal()
    make_notion()
    print("All 7 social icons generated successfully in public/icons/social/")
