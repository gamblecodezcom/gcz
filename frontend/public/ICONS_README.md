# PWA Icons

The following icons are required for the PWA:

- `icon-192.png` - 192x192px regular icon
- `icon-512.png` - 512x512px regular icon  
- `maskable-icon-192.png` - 192x192px maskable icon (safe zone: 160x160px centered)
- `maskable-icon-512.png` - 512x512px maskable icon (safe zone: 426x426px centered)

## Maskable Icons

Maskable icons should have important content within the safe zone:
- 192px icon: safe zone is 160x160px centered (16px padding on all sides)
- 512px icon: safe zone is 426x426px centered (43px padding on all sides)

The current placeholder icons are copies of the regular icons. For production, create proper maskable versions with content centered in the safe zone.

## Generating Icons

You can use ImageMagick or similar tools to create these icons from the source SVG or PNG:

```bash
# Resize to 192x192
convert icon.svg -resize 192x192 icon-192.png

# Resize to 512x512
convert icon.svg -resize 512x512 icon-512.png

# Create maskable versions (add padding for safe zone)
convert icon.svg -resize 160x160 -gravity center -extent 192x192 maskable-icon-192.png
convert icon.svg -resize 426x426 -gravity center -extent 512x512 maskable-icon-512.png
```
