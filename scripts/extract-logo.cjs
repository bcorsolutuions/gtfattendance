const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

async function extractLogo() {
  // Load pdfjs
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const pdfPath = 'C:\\Users\\MY PC\\Downloads\\GTF final logo 2_220326_090939_221026_094141 (1).pdf';
  const outputPath = path.join(__dirname, '..', 'public', 'gtf-logo.png');

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);

  const scale = 3.0;
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  // Crop to logo area (top ~60% of the page)
  const cropH = Math.floor(viewport.height * 0.62);
  const cropCanvas = createCanvas(viewport.width, cropH);
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.drawImage(canvas, 0, 0, viewport.width, cropH, 0, 0, viewport.width, cropH);

  // Save
  const buffer = cropCanvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log('Logo saved to', outputPath, `(${viewport.width}x${cropH})`);
}

extractLogo().catch(console.error);
