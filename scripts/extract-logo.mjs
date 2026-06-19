import { fromPath } from 'pdf2pic';
import { readFileSync, existsSync } from 'fs';

const pdfPath = 'C:\\Users\\MY PC\\Downloads\\GTF final logo 2_220326_090939_221026_094141 (1).pdf';

if (!existsSync(pdfPath)) {
  console.error('PDF not found:', pdfPath);
  process.exit(1);
}

const options = {
  density: 300,
  savePath: './public',
  saveFilename: 'gtf-logo',
  format: 'png',
  width: 400,
  height: 400,
};

const convert = fromPath(pdfPath, options);
const result = await convert(1);
console.log('Saved:', result);
