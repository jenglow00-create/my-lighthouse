import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '나의 등대 - 학습 관리',
        short_name: '등대',
        description: '시험 준비를 위한 올인원 학습 관리 플랫폼',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['education', 'productivity'],
        shortcuts: [
          {
            name: '학습 기록',
            short_name: '학습',
            description: '새 학습 세션 기록',
            url: '/study',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: '성찰 작성',
            short_name: '성찰',
            description: '오늘의 성찰 작성',
            url: '/metacognition',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // 큰 파일도 캐시할 수 있도록 제한 증가 (기본값: 2MB -> 5MB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        // 런타임 캐싱 전략
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30일
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7일
              }
            }
          }
        ],

        // 오프라인 페이지
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],

        // 캐시할 파일 (WebP 추가)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],

        // 제외할 파일
        globIgnores: ['**/node_modules/**/*', '**/test/**/*'],

        // 추가 Service Worker 스크립트 임포트
        additionalManifestEntries: [
          { url: '/sw-notifications.js', revision: null }
        ]
      },

      // Service Worker 소스 커스터마이징
      injectManifest: {
        injectionPoint: undefined
      },

      devOptions: {
        enabled: true,
        type: 'module'
      }
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  server: {
    port: 5000,
    host: true,
    strictPort: false
  },
  preview: {
    port: 4173,
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // 청크 분할 전략
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // 상태 관리 & DB
          'state-vendor': ['zustand', 'dexie', 'dexie-react-hooks'],

          // UI 라이브러리
          'ui-vendor': ['lucide-react'],

          // Web Vitals & 성능
          'performance': ['web-vitals']
        }
      }
    },

    // 청크 크기 경고 (500KB)
    chunkSizeWarningLimit: 500,

    // 소스맵 (프로덕션에서는 비활성화)
    sourcemap: false,

    // 최소화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.log 제거
        drop_debugger: true
      }
    }
  }
})
