const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const file = path.join(__dirname, '..', 'dist', 'work1-chat-widget.iife.js');

if (!fs.existsSync(file)) {
  console.error('IIFE bundle not found at', file);
  process.exit(1);
}

const raw = fs.statSync(file).size;
const gzipped = zlib.gzipSync(fs.readFileSync(file)).length;

console.log('\nIIFE bundle size:');
console.log(`  Raw:    ${(raw / 1024).toFixed(1)} KB`);
console.log(`  Gzip:   ${(gzipped / 1024).toFixed(1)} KB\n`);
