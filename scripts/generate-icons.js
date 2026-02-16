// Generate simple PNG placeholder icons for PWA
// Creates solid purple squares with "FA" text

function createPNG(size) {
  // Create a minimal PNG with solid purple background
  // PNG structure: signature + IHDR + IDAT + IEND

  const width = size;
  const height = size;

  // Purple color #8b5cf6 = RGB(139, 92, 246)
  const r = 139, g = 92, b = 246;

  // Raw pixel data (each row has filter byte 0 + RGB pixels)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte: None
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b);
    }
  }

  const rawBuf = Buffer.from(rawData);

  // Compress with zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawBuf);

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuf, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'ui', 'public', 'images');
fs.mkdirSync(imagesDir, { recursive: true });

fs.writeFileSync(path.join(imagesDir, 'icon-192.png'), createPNG(192));
fs.writeFileSync(path.join(imagesDir, 'icon-512.png'), createPNG(512));

console.log('Created icon-192.png and icon-512.png in ui/public/images/');
