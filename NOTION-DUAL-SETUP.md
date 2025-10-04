# 🔗 Notion 2개 페이지 자동 업데이트 가이드

## 📋 개요

Lighthouse 개발 현황을 **2개의 Notion 페이지**에 자동으로 업데이트합니다:

1. **개발 현황** - 실시간 통계, 커밋 히스토리 (테이블 형식)
2. **개발일지** - 블로그 형식, 스토리텔링

---

## 🚀 빠른 시작 (3단계)

### 1단계: 자동 설정 실행

```bash
cd /home/lupan/projects/my-lighthouse
./setup-notion-dual.sh
```

### 2단계: Notion 준비

**A. Integration 생성** (1회만)
1. https://www.notion.so/my-integrations 접속
2. **"+ New integration"** 클릭
3. 이름: `Lighthouse Dev Tracker`
4. **"Submit"** → **API 키 복사**

**B. 페이지 2개 생성**
1. Notion에서 새 페이지 생성: **"Lighthouse 개발 현황"**
2. 또 다른 페이지 생성: **"Lighthouse 개발일지"**

**C. 각 페이지에 Integration 연결**
- 각 페이지에서:
  1. 우측 상단 **"..."** 클릭
  2. **"Add connections"** 클릭
  3. **"Lighthouse Dev Tracker"** 선택

**D. 페이지 ID 복사**
- 각 페이지 URL에서 32자리 ID 복사
  ```
  https://www.notion.so/Lighthouse-123abc456def789012345678901234ab
                                 ↑ 이 부분 (32자리)
  ```

### 3단계: 설정 입력

스크립트가 물어보면:
- **API 키**: `secret_xxxxxxxxxx...` 붙여넣기
- **개발 현황 페이지 ID**: 32자리 ID 붙여넣기
- **개발일지 페이지 ID**: 32자리 ID 붙여넣기

✅ 완료! 자동으로 테스트까지 실행됩니다.

---

## 📊 페이지 구성

### 페이지 1: 개발 현황 (실시간 통계)

```
🏮 Lighthouse 개발 현황
━━━━━━━━━━━━━━━━━━━━━
📅 업데이트: 2025-10-04 10:30:00

📊 프로젝트 통계
┌─────────────┬─────────┐
│ 항목        │ 값      │
├─────────────┼─────────┤
│ 총 코드     │ 4,603줄 │
│ 컴포넌트    │ 3개     │
│ 페이지      │ 7개     │
│ 미커밋 파일 │ 8개     │
└─────────────┴─────────┘

🔄 최근 커밋
• [b35da98] feat: 오션뷰 애니메이션 개선...
• [5521332] feat: 주요 기능 업데이트...
• ...

🚀 개발 서버: http://localhost:5000/
```

### 페이지 2: 개발일지 (블로그 형식)

```
🏮 Lighthouse 개발일지
━━━━━━━━━━━━━━━━━━━━━

> 최신 업데이트: 성찰 시스템 전면 개편

업데이트 일시: 2025-10-04 10:30:00

📊 현재 상태
총 4,603줄의 코드로 구성된 Lighthouse 앱은...

🎯 완료된 주요 기능
• 오션뷰 애니메이션 ✨
• 6단계 성찰 시스템 🧠
• 31개 시험 유형 지원 📚
...

💡 최근 개발 하이라이트
성찰 시스템을 전면 개편하여...

🔗 GitHub: jenglow00-create/my-lighthouse
```

---

## 🔄 사용 방법

### 수동 업데이트
```bash
cd /home/lupan/projects/my-lighthouse
node update-notion-dual.js
```

### 자동 업데이트 (Git Hook)
커밋할 때마다 자동 업데이트:

```bash
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
node /home/lupan/projects/my-lighthouse/update-notion-dual.js
EOF

chmod +x .git/hooks/post-commit
```

### npm script로 추가
`package.json`에 추가:

```json
{
  "scripts": {
    "notion": "node ../update-notion-dual.js",
    "dev:notion": "node ../update-notion-dual.js && vite"
  }
}
```

사용:
```bash
npm run notion          # Notion만 업데이트
npm run dev:notion      # Notion 업데이트 + 개발 서버 시작
```

---

## 🛠 문제 해결

### "❌ 설정이 완전하지 않습니다"
→ `.notion-config` 파일에 3개 값이 모두 있는지 확인:
```bash
cat lighthouse-app/.notion-config
```

### "❌ unauthorized"
→ API 키가 올바른지 확인
→ Integration이 페이지에 연결되었는지 확인

### "❌ object_not_found"
→ 페이지 ID가 올바른지 확인 (32자리)
→ Integration이 해당 페이지에 접근 권한이 있는지 확인

### 페이지 ID 찾는 법
1. 페이지 열기
2. **"Share"** 또는 **"..."** → **"Copy link"**
3. URL에서 32자리 영숫자 코드만 복사
   ```
   https://www.notion.so/my-page-123abc456def789012345678901234ab?v=xxx
                                   ↑ 이 부분만
   ```

---

## 📝 설정 파일 예시

`lighthouse-app/.notion-config`:
```bash
NOTION_API_KEY=secret_AbCd1234EfGh5678IjKl9012MnOp3456QrSt7890
NOTION_PAGE_ID_STATUS=123abc456def789012345678901234ab
NOTION_PAGE_ID_BLOG=456def789012345678901234ab123abc
```

---

## 🎯 팁

### 1. 정기 업데이트
cron으로 매일 자동 업데이트:
```bash
# crontab -e
0 18 * * * cd /home/lupan/projects/my-lighthouse && node update-notion-dual.js
```

### 2. 여러 워크스페이스
팀 워크스페이스와 개인 워크스페이스를 따로 관리하려면:
- 설정 파일 2개 생성: `.notion-config-team`, `.notion-config-personal`
- 스크립트 실행 시 환경변수로 선택

### 3. 백업
설정 파일 백업:
```bash
cp lighthouse-app/.notion-config lighthouse-app/.notion-config.backup
```

---

## 📚 관련 파일

- `update-notion-dual.js` - 메인 업데이트 스크립트
- `setup-notion-dual.sh` - 자동 설정 도우미
- `lighthouse-app/.notion-config` - 설정 파일 (비공개)
- `lighthouse-app/.notion-config.example` - 설정 템플릿

---

**마지막 업데이트**: 2025-10-04
**문의**: GitHub Issues
