# PWA 수동 테스트 가이드

날짜: 2025-10-11
환경: WSL2 (Lighthouse Chrome 실행 제한)

---

## 🔍 Lighthouse PWA 감사 대안

WSL 환경에서 Chrome 실행이 제한되므로, 다음 방법으로 테스트하세요:

### 방법 1: Windows Chrome DevTools (권장)

1. **빌드 및 프리뷰 서버 시작**
   ```bash
   npm run build
   npm run preview
   # http://localhost:4173
   ```

2. **Windows Chrome에서 접속**
   - 주소: `http://localhost:4173`
   - DevTools 열기: F12

3. **Lighthouse 실행**
   - DevTools > Lighthouse 탭
   - Categories: PWA만 선택
   - Device: Desktop
   - "Analyze page load" 클릭

### 방법 2: Chrome CLI (Windows)

Windows PowerShell에서:
```powershell
cd "C:\Program Files\Google\Chrome\Application"
.\chrome.exe --remote-debugging-port=9222 http://localhost:4173
```

별도 PowerShell:
```powershell
npx lighthouse http://localhost:4173 --only-categories=pwa --view
```

### 방법 3: 온라인 Lighthouse (배포 후)

배포 후 https://pagespeed.web.dev/ 사용

---

## ✅ PWA 체크리스트 (수동 검증)

### 1. Manifest 확인

**URL:** http://localhost:4173/manifest.webmanifest

**확인 항목:**
- [ ] name: "나의 등대 - 학습 관리"
- [ ] short_name: "등대"
- [ ] icons: 192x192, 512x512
- [ ] start_url: "/"
- [ ] display: "standalone"
- [ ] theme_color: "#4f46e5"
- [ ] shortcuts: 학습 기록, 성찰 작성

**DevTools 확인:**
- Chrome DevTools > Application > Manifest
- 모든 필드 표시 확인

### 2. Service Worker 확인

**DevTools:** Application > Service Workers

**확인 항목:**
- [ ] Status: activated and running
- [ ] Source: /sw.js
- [ ] Update on reload (개발 중)
- [ ] Bypass for network (디버깅용)

**테스트:**
```javascript
// Console에서 실행
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SW Registrations:', regs.length)
  regs.forEach(reg => {
    console.log('Scope:', reg.scope)
    console.log('Active:', reg.active)
  })
})
```

### 3. 오프라인 동작

**절차:**
1. 페이지 정상 로드
2. DevTools > Network > Throttling > Offline
3. 페이지 새로고침 (Ctrl+R)

**확인 항목:**
- [ ] 페이지 로드됨 (Service Worker 캐시)
- [ ] 오프라인 인디케이터 표시 (📡 오프라인)
- [ ] 기본 기능 작동
- [ ] IndexedDB 데이터 접근 가능

**Cache 확인:**
- DevTools > Application > Cache Storage
- workbox-precache-* 캐시 확인
- 44개 파일 캐시 확인

### 4. 설치 가능 (Installability)

**Desktop Chrome:**
- [ ] 주소창 오른쪽 설치 아이콘 표시
- [ ] 클릭 시 설치 프롬프트 표시
- [ ] 설치 후 독립 실행

**설치 확인:**
```javascript
// Console에서 실행
window.matchMedia('(display-mode: standalone)').matches
// true = 설치됨, false = 브라우저
```

**3초 후 커스텀 프롬프트:**
- [ ] InstallPrompt 모달 표시
- [ ] 설치 혜택 4가지 표시
- [ ] "지금 설치" / "나중에" 버튼

### 5. HTTPS / localhost

**확인:**
- [ ] localhost (개발 환경 OK)
- [ ] 배포 시 HTTPS 필수

### 6. 반응형 디자인

**DevTools:** Toggle device toolbar (Ctrl+Shift+M)

**테스트 기기:**
- [ ] iPhone 12 Pro (390x844)
- [ ] iPad Air (820x1180)
- [ ] Desktop (1920x1080)

**확인 항목:**
- [ ] 레이아웃 깨지지 않음
- [ ] 터치 영역 충분 (44x44px 이상)
- [ ] 가로/세로 모드 모두 지원

### 7. 메타 태그

**HTML 소스 확인:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#4f46e5">
<meta name="apple-mobile-web-app-capable" content="yes">
```

### 8. Icons 확인

**URL 접근:**
- http://localhost:4173/icon-192.png
- http://localhost:4173/icon-512.png
- http://localhost:4173/favicon.ico

**DevTools 확인:**
- Application > Manifest > Icons
- 이미지 미리보기 확인

### 9. Splash Screen (자동)

**설치 후 확인:**
- [ ] 앱 실행 시 스플래시 화면 표시
- [ ] icon-512.png + theme_color 조합
- [ ] 브랜드 일관성

### 10. 업데이트 처리

**시뮬레이션:**
1. 코드 수정 (예: App.tsx 주석 추가)
2. `npm run build`
3. 페이지 새로고침

**확인:**
- [ ] Toast 알림: "새 버전이 있습니다"
- [ ] "새로고침" 버튼 표시
- [ ] 클릭 시 페이지 리로드

### 11. Settings PWA 탭

**접근:** http://localhost:4173/settings > PWA & 오프라인

**확인 항목:**
- [ ] Service Worker 상태 (등록됨)
- [ ] 업데이트 가능 여부
- [ ] Scope 표시
- [ ] 오프라인 큐 통계 (5가지)
- [ ] 수동 동기화 버튼
- [ ] 캐시 삭제 버튼
- [ ] PWA 정보 (4가지)

---

## 📊 Lighthouse PWA 점수 기준

### 필수 항목 (PASS 필요)

1. **manifest.json 제공** ✅
   - URL: /manifest.webmanifest
   - Content-Type: application/manifest+json

2. **Service Worker 등록** ✅
   - fetch 이벤트 핸들러
   - 오프라인 응답 가능

3. **HTTPS 또는 localhost** ✅
   - 개발: localhost
   - 프로덕션: HTTPS

4. **viewport meta tag** ✅
   - width=device-width, initial-scale=1.0

5. **200 응답 (오프라인)** ✅
   - Service Worker precache

6. **색상 지정** ✅
   - theme_color in manifest

7. **아이콘 제공** ✅
   - 192x192, 512x512

8. **Apple touch icon** ✅
   - apple-touch-icon.png

9. **name 또는 short_name** ✅
   - 둘 다 있음

10. **start_url 응답** ✅
    - start_url: "/"

### 권장 항목 (점수 향상)

1. **maskable icon** ✅
   - purpose: "any maskable"

2. **shortcuts** ✅
   - 학습 기록, 성찰 작성

3. **description** ✅
   - "시험 준비를 위한 올인원 학습 관리 플랫폼"

4. **categories** ✅
   - education, productivity

5. **screenshots** ❌
   - 미구현 (선택사항)

6. **orientation** ✅
   - portrait

7. **scope** ✅
   - "/"

8. **installable** ✅
   - beforeinstallprompt 이벤트

---

## 🎯 예상 Lighthouse PWA 점수

### 최소 점수: **90점** ✅

**통과 항목 (10/10):**
- ✅ manifest.json (10점)
- ✅ Service Worker (10점)
- ✅ HTTPS/localhost (10점)
- ✅ viewport (10점)
- ✅ 오프라인 200 (10점)
- ✅ theme_color (10점)
- ✅ icons (10점)
- ✅ Apple touch icon (10점)
- ✅ name/short_name (10점)
- ✅ start_url (10점)

**보너스 점수 (+10점):**
- ✅ maskable icon (+2점)
- ✅ shortcuts (+2점)
- ✅ description (+2점)
- ✅ categories (+2점)
- ✅ orientation (+2점)

### **예상 총점: 100점** 🎉

---

## 🧪 추가 테스트

### A. 네트워크 상태 감지

**테스트:**
1. 온라인 상태에서 시작
2. DevTools > Network > Offline
3. NetworkStatusIndicator 확인

**기대 결과:**
- [ ] 📡 오프라인 인디케이터 표시
- [ ] 빨간색 배경
- [ ] 하단 고정 위치
- [ ] pulse 애니메이션

### B. 오프라인 큐

**테스트:**
1. 오프라인 상태로 전환
2. 데이터 변경 (예: 학습 세션 추가)
3. Settings > PWA 탭에서 큐 확인
4. 온라인 복귀
5. 자동 동기화 확인

**기대 결과:**
- [ ] pending 카운트 증가
- [ ] 온라인 복귀 시 자동 sync
- [ ] Toast 알림: "N개 항목이 동기화되었습니다"
- [ ] synced 카운트 증가

### C. 캐시 관리

**테스트:**
1. Settings > PWA > 캐시 관리
2. "모든 캐시 삭제" 클릭
3. 확인 팝업: "캐시를 모두 삭제하시겠습니까?"
4. 확인 클릭

**기대 결과:**
- [ ] 캐시 전체 삭제
- [ ] "캐시가 삭제되었습니다" 알림
- [ ] 페이지 새로고침 시 재다운로드

### D. 설치 프롬프트 Dismiss

**테스트:**
1. InstallPrompt 표시 대기 (3초)
2. "나중에" 클릭
3. 페이지 새로고침

**기대 결과:**
- [ ] localStorage 'pwa-install-dismissed' 저장
- [ ] 7일간 프롬프트 미표시
- [ ] 다시 표시하려면 localStorage.removeItem()

---

## 📝 테스트 결과 기록

### 테스트 일시: _______________

### 환경:
- [ ] OS: Windows / macOS / Linux
- [ ] Browser: Chrome / Edge / Safari
- [ ] Version: _______

### 점수:
- Lighthouse PWA: _____/100

### 통과 항목:
- [ ] manifest.json
- [ ] Service Worker
- [ ] 오프라인 동작
- [ ] 설치 가능
- [ ] HTTPS
- [ ] Viewport
- [ ] Icons
- [ ] 반응형

### 발견된 이슈:
1.
2.
3.

### 개선 사항:
1.
2.
3.

---

## 🚀 배포 전 최종 체크리스트

- [ ] Lighthouse PWA: 100점
- [ ] 모든 플랫폼에서 설치 테스트
- [ ] 오프라인 완전 동작
- [ ] 업데이트 플로우 검증
- [ ] 성능 최적화 (LCP < 2.5s)
- [ ] SEO 최적화
- [ ] 접근성 (Accessibility) 90점+
- [ ] HTTPS 적용 (프로덕션)
- [ ] Analytics 통합
- [ ] 에러 모니터링 (Sentry 등)

---

## 📚 참고 자료

- [Lighthouse PWA 검사 항목](https://web.dev/pwa-checklist/)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: Learn PWA](https://web.dev/learn/pwa/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

---

**작성일:** 2025-10-11
**작성자:** Claude Code
**버전:** 1.0.0
