import sharp from "sharp";

const svg = `
<svg width="800" height="1067" viewBox="0 0 800 1067" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#F4EEE3"/>
  <rect x="24" y="24" width="752" height="1019" fill="none" stroke="#DED7C8" stroke-width="2"/>
  
  <!-- Minimalist Garment Hanger Silhouette -->
  <path d="M400 420 C400 395 385 380 370 380 C355 380 345 390 345 405 C345 425 370 440 400 460 L540 540 C555 548 550 560 535 560 L265 560 C250 560 245 548 260 540 Z" fill="none" stroke="#9E472A" stroke-width="4" stroke-linejoin="round"/>
  <line x1="265" y1="560" x2="535" y2="560" stroke="#9E472A" stroke-width="4"/>

  <!-- Brand Typography -->
  <text x="400" y="640" font-family="serif" font-size="24" font-weight="500" letter-spacing="0.25em" fill="#141312" text-anchor="middle">RUST &amp; REVIVE</text>
  <text x="400" y="675" font-family="monospace" font-size="12" letter-spacing="0.3em" fill="#8C8577" text-anchor="middle">ARCHIVAL GARMENT</text>
  <text x="400" y="710" font-family="monospace" font-size="10" letter-spacing="0.2em" fill="#B5AFA4" text-anchor="middle">EDITION 2026</text>
</svg>
`;

async function generate() {
  await sharp(Buffer.from(svg))
    .webp({ quality: 90 })
    .toFile("public/placeholder-garment.webp");

  console.log("Successfully generated public/placeholder-garment.webp!");
}

generate().catch(console.error);
