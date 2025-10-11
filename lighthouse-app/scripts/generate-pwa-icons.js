import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sourceImage = join(__dirname, '../src/assets/images/logos/등대 로고.png')
const publicDir = join(__dirname, '../public')

async function generateIcons() {
  console.log('🎨 PWA 아이콘 생성 시작...\n')

  try {
    // 원본 이미지 로드
    const image = sharp(sourceImage)
    const metadata = await image.metadata()
    console.log(`✅ 원본 이미지 로드: ${metadata.width}x${metadata.height}\n`)

    // 1. icon-192.png (192x192)
    console.log('생성 중: icon-192.png')
    await image
      .clone()
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(join(publicDir, 'icon-192.png'))
    console.log('✅ icon-192.png 생성 완료\n')

    // 2. icon-512.png (512x512)
    console.log('생성 중: icon-512.png')
    await image
      .clone()
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(join(publicDir, 'icon-512.png'))
    console.log('✅ icon-512.png 생성 완료\n')

    // 3. apple-touch-icon.png (180x180)
    console.log('생성 중: apple-touch-icon.png')
    await image
      .clone()
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(join(publicDir, 'apple-touch-icon.png'))
    console.log('✅ apple-touch-icon.png 생성 완료\n')

    // 4. favicon.ico (32x32) - PNG로 먼저 생성
    console.log('생성 중: favicon.png (32x32)')
    const faviconBuffer = await image
      .clone()
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toBuffer()

    // ICO는 PNG를 그대로 .ico 확장자로 저장 (대부분의 브라우저는 PNG를 ICO로 인식)
    writeFileSync(join(publicDir, 'favicon.ico'), faviconBuffer)
    console.log('✅ favicon.ico 생성 완료\n')

    // 5. masked-icon.svg 복사 (이미 SVG가 있다면 활용, 없으면 생략)
    console.log('생성 중: masked-icon.svg')
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4f46e5"/>
  <path d="M256 96L176 352h48l16-48h96l16 48h48L320 96h-64zm-8 144l24-72h16l24 72h-64z" fill="white"/>
</svg>`
    writeFileSync(join(publicDir, 'masked-icon.svg'), svgContent)
    console.log('✅ masked-icon.svg 생성 완료\n')

    console.log('🎉 모든 PWA 아이콘 생성 완료!')
    console.log('\n생성된 파일:')
    console.log('  - public/icon-192.png (192x192)')
    console.log('  - public/icon-512.png (512x512)')
    console.log('  - public/apple-touch-icon.png (180x180)')
    console.log('  - public/favicon.ico (32x32)')
    console.log('  - public/masked-icon.svg')
  } catch (error) {
    console.error('❌ 아이콘 생성 실패:', error)
    process.exit(1)
  }
}

generateIcons()
