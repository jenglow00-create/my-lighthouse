import { useState, useRef, useEffect, memo } from 'react'
import '../styles/OptimizedImage.css'

/**
 * 이미지 최적화 컴포넌트
 * - WebP 지원 (자동 fallback)
 * - Lazy loading
 * - Blur placeholder
 * - Responsive images (srcset)
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  onLoad,
  onError
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  // WebP 지원 여부 확인
  const supportsWebP = useRef(false)

  useEffect(() => {
    // WebP 지원 체크
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas')
      if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      }
      return false
    }

    supportsWebP.current = checkWebPSupport()
  }, [])

  // Intersection Observer로 lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target
            const dataSrc = img.getAttribute('data-src')
            if (dataSrc) {
              img.src = dataSrc
              img.removeAttribute('data-src')
            }
            observer.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px 0px', // 50px 전에 미리 로드
        threshold: 0.01
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [priority])

  const handleLoad = (e) => {
    setIsLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e) => {
    setHasError(true)
    onError?.(e)
  }

  // WebP 경로 생성 (src가 .png, .jpg인 경우 .webp로 변환)
  const getWebPSrc = (originalSrc) => {
    if (!originalSrc) return ''
    return originalSrc.replace(/\.(png|jpg|jpeg)$/i, '.webp')
  }

  // srcset 생성 (반응형 이미지)
  const generateSrcSet = (originalSrc) => {
    if (!originalSrc) return ''
    const base = originalSrc.replace(/\.(png|jpg|jpeg|webp)$/i, '')
    const ext = originalSrc.match(/\.(png|jpg|jpeg|webp)$/i)?.[0] || '.png'

    // 1x, 2x, 3x 해상도 지원
    return `${base}${ext} 1x, ${base}@2x${ext} 2x, ${base}@3x${ext} 3x`
  }

  if (hasError) {
    return (
      <div
        className={`optimized-image-error ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span>이미지를 불러올 수 없습니다</span>
      </div>
    )
  }

  return (
    <div
      className={`optimized-image-wrapper ${isLoaded ? 'loaded' : 'loading'} ${className}`}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="optimized-image-placeholder" aria-hidden="true" />
      )}

      <picture>
        {/* WebP 버전 (지원되는 경우) */}
        {supportsWebP.current && (
          <source
            type="image/webp"
            srcSet={generateSrcSet(getWebPSrc(src))}
            sizes={sizes}
          />
        )}

        {/* 원본 이미지 (fallback) */}
        <img
          ref={imgRef}
          src={priority ? src : undefined}
          data-src={priority ? undefined : src}
          srcSet={priority ? generateSrcSet(src) : undefined}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          className="optimized-image"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      </picture>
    </div>
  )
})

export default OptimizedImage
