// Sinh favicon và icon PWA vào public/ từ assets/logo-source.png (chạy: npm run generate-icons).
// Logo đã có nền và bo góc riêng: icon thường giữ nền trong suốt; icon maskable và
// apple-touch cần nền đặc vì hệ điều hành tự cắt theo hình của nó.

import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const SOURCE = 'assets/logo-source.png'
const OUT = 'public'
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }
const WHITE = '#ffffff'

/** Logo cỡ `size`, đặt giữa khung `canvas`, nền `background`. */
async function icon(canvas, size, background = TRANSPARENT) {
  const logo = await sharp(SOURCE).resize(size, size).png().toBuffer()
  return sharp({ create: { width: canvas, height: canvas, channels: 4, background } })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toBuffer()
}

/** File .ico chứa sẵn các ảnh PNG (định dạng mọi trình duyệt hiện nay đều đọc được). */
function toIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const entries = []
  let offset = 6 + 16 * images.length
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

const files = {
  'logo.png': await icon(96, 96),
  'pwa-64x64.png': await icon(64, 60),
  'pwa-192x192.png': await icon(192, 180),
  'pwa-512x512.png': await icon(512, 480),
  // Vùng an toàn của maskable là hình tròn 80%: logo chiếm 64% để không bị cắt.
  'maskable-icon-512x512.png': await icon(512, 328, WHITE),
  'apple-touch-icon-180x180.png': await icon(180, 144, WHITE),
  'favicon.ico': toIco(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await icon(size, size) }))),
  ),
}

for (const [name, data] of Object.entries(files)) {
  await writeFile(`${OUT}/${name}`, data)
  console.log(`${OUT}/${name}`)
}
