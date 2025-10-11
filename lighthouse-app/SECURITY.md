# Security Policy

## 지원하는 버전

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## 취약점 보고

보안 취약점을 발견하신 경우:

1. **공개적으로 이슈를 생성하지 마세요**
2. security@lighthouse.app로 이메일 보내기 (또는 GitHub Security Advisory 사용)
3. 다음 정보 포함:
   - 취약점 상세 설명
   - 재현 단계
   - 영향 범위
   - 제안하는 수정 방법 (선택)

우리는 24시간 내에 회신하며, 7일 내에 패치를 제공하겠습니다.

## 보안 Best Practices

### 사용자

- 강력한 비밀번호 사용 (8자 이상, 대소문자+숫자+특수문자)
- 정기적으로 비밀번호 변경
- 공용 컴퓨터에서 로그아웃
- 최신 버전 사용

### 개발자

- 의존성 정기 업데이트
- `npm audit` 정기 실행
- HTTPS만 사용
- 민감한 데이터 암호화
- CSP 헤더 적용

## 구현된 보안 기능

### 클라이언트 사이드 보안

- ✅ XSS 방지 (React 자동 이스케이핑)
- ✅ 입력 검증 (Zod 스키마)
- ✅ CSP (Content Security Policy)
- ✅ 보안 헤더 (X-Frame-Options, X-Content-Type-Options 등)

### 데이터 보호

- ✅ Web Crypto API 암호화 (AES-256-GCM)
- ✅ HMAC 무결성 검증
- ✅ 안전한 localStorage 래퍼
- ✅ 정기적 데이터 정리

### 네트워크 보안

- ✅ HTTPS 강제 (프로덕션)
- ✅ Mixed Content 감지
- ✅ Referrer Policy
- ✅ Permissions Policy

## 보안 감사 히스토리

| Date       | Type        | Severity | Status   | Description              |
|------------|-------------|----------|----------|--------------------------|
| 2025-10-11 | Enhancement | N/A      | Complete | 초기 보안 인프라 구축    |

## 책임 있는 공개

- 취약점 발견 후 즉시 보고
- 패치 개발 및 테스트
- 패치 릴리스 후 공개 (90일 이내)
- CVE 등록 (중요한 취약점)

## 감사의 말

보안 취약점을 책임감 있게 보고해주신 분들:

- (이름 또는 익명)

## 연락처

보안 관련 문의:
- Email: security@lighthouse.app
- GitHub Security Advisory: [링크]
