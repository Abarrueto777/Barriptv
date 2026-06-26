const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Create simple Netflix-style icon with B and play
async function generateIcon(size, maskable = false) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Cyan to Purple gradient -->
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Dark background -->
      ${maskable
        ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#07060d"/>`
        : `<rect width="${size}" height="${size}" fill="#07060d"/>`
      }

      <!-- B letter (large, simple, centered) -->
      <text
        x="${size * 0.40}"
        y="${size / 2 + size * 0.04}"
        font-size="${size * 0.48}"
        font-family="Arial, sans-serif"
        font-weight="900"
        fill="url(#grad)"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        B
      </text>

      <!-- Play triangle (small, next to B, centered) -->
      <polygon
        points="${size * 0.62},${size * 0.38} ${size * 0.72},${size / 2} ${size * 0.62},${size * 0.62}"
        fill="url(#grad)"
      />
    </svg>
  `;

  const filename = maskable ? `icon-maskable-${size}.png` : `icon-${size}.png`;
  const filepath = path.join(publicDir, filename);

  try {
    await sharp(Buffer.from(svg)).png().toFile(filepath);
    console.log(`✓ Generated ${filename}`);
  } catch (err) {
    console.error(`✗ Failed to generate ${filename}:`, err.message);
  }
}

async function main() {
  console.log('Generating PWA icons...');

  try {
    await generateIcon(192, false);
    await generateIcon(512, false);
    await generateIcon(192, true);
    await generateIcon(512, true);

    console.log('✓ All icons generated successfully');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
