import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const IMAGE_DIR = join(__dirname, '../src/assets/images')
const QUALITY = 85 // WebP 품질 (0-100)

async function convertToWebP(filePath) {
  const ext = extname(filePath).toLowerCase()

  // PNG, JPG, JPEG만 변환
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
    return
  }

  const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp')

  try {
    const info = await sharp(filePath)
      .webp({ quality: QUALITY })
      .toFile(webpPath)

    const originalSize = (await stat(filePath)).size
    const webpSize = info.size
    const reduction = ((1 - webpSize / originalSize) * 100).toFixed(1)

    console.log(`✅ ${basename(filePath)} → ${basename(webpPath)}`)
    console.log(`   ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(webpSize / 1024 / 1024).toFixed(2)}MB (${reduction}% 감소)`)
  } catch (error) {
    console.error(`❌ 변환 실패: ${filePath}`, error.message)
  }
}

async function processDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      await processDirectory(fullPath)
    } else if (entry.isFile()) {
      await convertToWebP(fullPath)
    }
  }
}

console.log('🖼️  이미지를 WebP로 변환합니다...\n')
console.log(`디렉토리: ${IMAGE_DIR}\n`)

await processDirectory(IMAGE_DIR)

console.log('\n✨ 변환 완료!')
