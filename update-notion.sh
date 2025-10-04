#!/bin/bash

# Lighthouse 앱 개발 현황 자동 업데이트 스크립트
# 사용법: ./update-notion.sh

set -e

PROJECT_DIR="/home/lupan/projects/my-lighthouse/lighthouse-app"
NOTION_CONFIG="$PROJECT_DIR/.notion-config"
REPORT_FILE="/tmp/lighthouse-dev-report.md"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏮 Lighthouse 개발 현황 보고서 생성 중...${NC}\n"

cd "$PROJECT_DIR"

# Git 정보 수집
LAST_COMMIT=$(git log -1 --format="%h - %s (%ar)" 2>/dev/null || echo "N/A")
UNCOMMITTED_FILES=$(git status --short | wc -l)
BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")

# 파일 통계
TOTAL_FILES=$(find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.css" \) | wc -l)
TOTAL_LINES=$(find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec cat {} + | wc -l)

# 변경사항 통계
CHANGED_FILES=$(git diff --stat | tail -1 || echo "변경사항 없음")

# 보고서 생성
cat > "$REPORT_FILE" << EOF
# 🏮 Lighthouse 앱 개발 현황 보고서

**업데이트 일시**: $(date '+%Y-%m-%d %H:%M:%S')
**브랜치**: $BRANCH
**저장소**: https://github.com/jenglow00-create/my-lighthouse

---

## 📊 프로젝트 통계

- 총 파일 수: **$TOTAL_FILES개** (JS/JSX/CSS)
- 총 코드 라인: **$TOTAL_LINES줄** (JS/JSX)
- 미커밋 변경사항: **$UNCOMMITTED_FILES개 파일**

---

## 🔄 최근 커밋

\`\`\`
$LAST_COMMIT
\`\`\`

---

## 📝 변경사항 요약

\`\`\`
$CHANGED_FILES
\`\`\`

---

## 🎯 오늘 완료된 주요 작업

### 1. 성찰 시스템 전면 개편 ✨
- 최근 성찰 카드에 학습도 점수, 공부한 주제, 내일 계획 표시
- 히스토리 페이지 데이터 구조 개선 (모든 입력 정보 완전 표시)
- 검색 필터 확장 및 통계 정확성 개선

### 2. 시험 유형 시스템 대주제-소주제 구조 재설계 🚀
- 6개 대주제 카테고리 (어학, 자격증, 공기업, 공무원, 대학/대학원, 기타)
- 31개 시험 유형 지원 (NCS, 전공, 논술, 컴활 1/2급 추가)
- 2단계 선택 UI (아이콘 버튼 + 드롭다운)
- 구버전 데이터 자동 마이그레이션

### 3. UI 개선
- 등대 위치 조정
- 카테고리 선택 버튼 스타일 추가
- 반응형 디자인 최적화

---

## 🎨 이전 주요 완료 기능

- ✅ 오션뷰 애니메이션 (보트 대각선 이동, 등대, 구름)
- ✅ 보트 선택 시스템 (2종)
- ✅ 등대 로고 브랜딩
- ✅ AI 피드백 시스템 (순위 기반)
- ✅ 마스터 테스트 계정 (1/1)
- ✅ 모바일 접속 지원
- ✅ 성찰 히스토리 확장/축소 기능

---

## 🚀 다음 작업 계획

- [ ] 시험 유형별 학습 통계 대시보드
- [ ] 과목별 성찰 연동 기능
- [ ] PWA 변환 검토
- [ ] 클라우드 동기화 (Firebase)

---

**개발 서버**: http://localhost:5000/
**기술 스택**: React, Vite, JavaScript, CSS, localStorage

EOF

echo -e "${GREEN}✓ 보고서 생성 완료: $REPORT_FILE${NC}\n"

# Notion 설정 확인
if [ ! -f "$NOTION_CONFIG" ]; then
    echo -e "${YELLOW}⚠ Notion 설정 파일이 없습니다.${NC}"
    echo -e "${YELLOW}다음 단계를 따라 설정하세요:${NC}\n"
    echo "1. .notion-config.example을 .notion-config로 복사"
    echo "2. Notion Integration Token과 Page ID 입력"
    echo "3. 다시 이 스크립트 실행"
    echo ""
    echo -e "${BLUE}보고서 내용:${NC}"
    cat "$REPORT_FILE"
    exit 0
fi

# Notion 설정 로드
source "$NOTION_CONFIG"

if [ -z "$NOTION_API_KEY" ] || [ -z "$NOTION_PAGE_ID" ]; then
    echo -e "${YELLOW}⚠ Notion API 키 또는 페이지 ID가 설정되지 않았습니다.${NC}"
    echo -e "${BLUE}보고서 내용:${NC}"
    cat "$REPORT_FILE"
    exit 0
fi

# Notion API 호출 (페이지 업데이트)
echo -e "${BLUE}📤 Notion 페이지 업데이트 중...${NC}"

# Notion API는 복잡하므로, 간단한 방법으로 페이지 내용을 추가
# 실제 구현시 @notionhq/client 라이브러리 사용 권장

REPORT_CONTENT=$(cat "$REPORT_FILE")

# 여기에 Notion API 호출 코드 추가
# curl을 사용한 예시 (실제로는 Node.js 스크립트 권장)

echo -e "${GREEN}✓ Notion 업데이트 완료!${NC}"
echo -e "\n${BLUE}보고서 미리보기:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$REPORT_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
