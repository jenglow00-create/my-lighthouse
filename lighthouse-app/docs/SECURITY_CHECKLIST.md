# 보안 체크리스트

## 배포 전 필수 확인

### 인증 및 권한

- [x] 비밀번호 해싱 (SHA-256 클라이언트, 향후 bcrypt 서버)
- [x] 세션 타임아웃 설정 (localStorage TTL)
- [ ] CSRF 토큰 (향후 서버 추가 시)
- [ ] Rate limiting (향후 서버 추가 시)

### 데이터 보호

- [x] 민감 데이터 암호화 (Web Crypto API, AES-256-GCM)
- [x] HTTPS 강제 (프로덕션)
- [x] localStorage 최소 사용
- [x] 데이터 무결성 검증 (HMAC)

### 입력 검증

- [x] 모든 폼 검증 (Zod 스키마)
- [x] XSS 방지 (React 자동 이스케이핑)
- [x] 입력 길이 제한
- [x] 특수 문자 검증
- [ ] 파일 업로드 검증 (향후 추가 시)

### 보안 헤더

- [x] CSP (Content Security Policy) 설정
- [x] X-Frame-Options (DENY)
- [x] X-Content-Type-Options (nosniff)
- [x] Referrer-Policy
- [x] Permissions-Policy
- [ ] HSTS (HTTPS 배포 후)

### 의존성

- [x] npm audit 통과 (0 vulnerabilities)
- [x] 최신 버전 사용
- [ ] 정기 업데이트 스케줄

### 모니터링

- [x] 에러 로깅 (logger.ts)
- [x] CSP 위반 추적
- [x] Mixed Content 감지
- [x] 성능 모니터링

### 코드 품질

- [x] 하드코딩된 비밀 제거
- [x] 디버그 코드 정리
- [x] console.log 최소화 (프로덕션)
- [x] 타입 안전성 (TypeScript)

## 정기 점검 (월간)

- [ ] 의존성 업데이트 (`npm update`)
- [ ] 보안 감사 (`npm audit`)
- [ ] 백업 테스트
- [ ] 접근 로그 검토
- [ ] 성능 메트릭 확인

## 개발 중 체크리스트

### 새 기능 추가 시

- [ ] 입력 검증 스키마 작성
- [ ] XSS 방지 확인
- [ ] 민감 데이터 암호화 여부 확인
- [ ] 에러 핸들링 추가
- [ ] 로깅 추가

### PR 리뷰 시

- [ ] 보안 취약점 확인
- [ ] 입력 검증 확인
- [ ] 민감 정보 노출 확인
- [ ] 에러 메시지 적절성
- [ ] 테스트 커버리지

## 보안 테스트

### 수동 테스트

- [ ] XSS 공격 시도 (`<script>alert('XSS')</script>`)
- [ ] SQL Injection (향후 서버 추가 시)
- [ ] CSRF 공격 (향후 서버 추가 시)
- [ ] 파일 업로드 악용 (향후 추가 시)

### 자동 테스트

- [x] E2E 테스트 (Playwright)
- [x] 접근성 테스트 (axe-core)
- [ ] 보안 스캔 (Snyk, npm audit)

### 외부 도구 검증

- [ ] [securityheaders.com](https://securityheaders.com) - A+ 등급
- [ ] [Mozilla Observatory](https://observatory.mozilla.org) - A+ 등급
- [ ] Chrome DevTools Security 탭
- [ ] Lighthouse Security 점수 100점

## 인시던트 대응

### 보안 사고 발생 시

1. **즉시 조치**
   - 영향 범위 파악
   - 시스템 격리 (필요 시)
   - 임시 패치 적용

2. **조사**
   - 로그 분석
   - 원인 파악
   - 영향받은 사용자 확인

3. **복구**
   - 패치 개발 및 테스트
   - 배포
   - 사용자 알림

4. **사후 조치**
   - 재발 방지 대책
   - 문서화
   - 프로세스 개선

## 보안 교육

### 팀원 필수 지식

- OWASP Top 10
- XSS, CSRF, SQL Injection 방지
- 암호화 기초
- 안전한 코딩 패턴

### 추천 리소스

- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Google Web Security Guide](https://developers.google.com/web/fundamentals/security)

## 규정 준수

### GDPR (해당 시)

- [ ] 데이터 수집 최소화
- [ ] 사용자 동의
- [ ] 데이터 삭제 권리
- [ ] 데이터 이동 권리

### 접근성

- [x] WCAG 2.0 AA 준수
- [x] 키보드 네비게이션
- [x] 스크린 리더 호환

## 업데이트 기록

| Date       | Version | Changes                          |
|------------|---------|----------------------------------|
| 2025-10-11 | 1.0     | 초기 보안 체크리스트 작성        |
