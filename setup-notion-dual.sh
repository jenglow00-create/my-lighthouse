#!/bin/bash

# Notion 2개 페이지 연동 설정 도우미
# 사용법: ./setup-notion-dual.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/lupan/projects/my-lighthouse"
CONFIG_FILE="$PROJECT_DIR/lighthouse-app/.notion-config"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔗 Notion 2개 페이지 연동 설정${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Step 1: 패키지 설치
echo -e "${YELLOW}📦 Step 1: Notion SDK 설치${NC}"
cd "$PROJECT_DIR"

if [ ! -d "node_modules/@notionhq/client" ]; then
    npm install @notionhq/client
    echo -e "${GREEN}✓ Notion SDK 설치 완료${NC}\n"
else
    echo -e "${GREEN}✓ Notion SDK 이미 설치됨${NC}\n"
fi

# Step 2: 설정 파일 확인
echo -e "${YELLOW}📝 Step 2: 설정 파일 생성${NC}\n"

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠ .notion-config 파일이 이미 존재합니다.${NC}"
    read -p "덮어쓰시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}기존 설정 파일 유지${NC}\n"
    else
        rm "$CONFIG_FILE"
    fi
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📚 설정 가이드${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    echo -e "${YELLOW}1. Notion Integration 생성${NC}"
    echo -e "   https://www.notion.so/my-integrations"
    echo -e "   → '+ New integration' 클릭"
    echo -e "   → 이름: 'Lighthouse Dev Tracker'"
    echo -e "   → 'Submit' 클릭"
    echo -e "   → API 키 복사 (secret_로 시작)\n"

    echo -e "${YELLOW}2. Notion에서 2개 페이지 생성${NC}"
    echo -e "   ${GREEN}페이지 1${NC}: 'Lighthouse 개발 현황' (실시간 통계)"
    echo -e "   ${GREEN}페이지 2${NC}: 'Lighthouse 개발일지' (블로그 형식)\n"

    echo -e "${YELLOW}3. 각 페이지에 Integration 연결${NC}"
    echo -e "   각 페이지에서:"
    echo -e "   → 우측 상단 '...' 클릭"
    echo -e "   → 'Add connections' 클릭"
    echo -e "   → 'Lighthouse Dev Tracker' 선택\n"

    echo -e "${YELLOW}4. 페이지 ID 복사${NC}"
    echo -e "   각 페이지 URL에서 32자리 ID 복사"
    echo -e "   예: https://notion.so/123abc456def...\n"

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    # API 키 입력
    echo -e "${GREEN}API 키 입력:${NC}"
    read -p "Notion API 키 (secret_로 시작): " API_KEY

    # 입력 검증
    if [[ ! $API_KEY == secret_* ]]; then
        echo -e "\n${RED}❌ API 키는 'secret_'로 시작해야 합니다.${NC}"
        exit 1
    fi

    # 페이지 ID 입력
    echo -e "\n${GREEN}페이지 ID 입력:${NC}"
    read -p "개발 현황 페이지 ID (32자리): " PAGE_ID_STATUS
    read -p "개발일지 페이지 ID (32자리): " PAGE_ID_BLOG

    # 입력 검증
    if [ ${#PAGE_ID_STATUS} -ne 32 ]; then
        echo -e "\n${RED}❌ 개발 현황 페이지 ID는 32자리여야 합니다.${NC}"
        exit 1
    fi

    if [ ${#PAGE_ID_BLOG} -ne 32 ]; then
        echo -e "\n${RED}❌ 개발일지 페이지 ID는 32자리여야 합니다.${NC}"
        exit 1
    fi

    # 설정 파일 생성
    cat > "$CONFIG_FILE" << EOF
# Notion API Configuration
# 생성일: $(date '+%Y-%m-%d %H:%M:%S')

NOTION_API_KEY=$API_KEY
NOTION_PAGE_ID_STATUS=$PAGE_ID_STATUS
NOTION_PAGE_ID_BLOG=$PAGE_ID_BLOG
EOF

    echo -e "\n${GREEN}✓ 설정 파일 생성 완료: $CONFIG_FILE${NC}\n"
fi

# Step 3: 테스트
echo -e "${YELLOW}🧪 Step 3: 연동 테스트${NC}\n"

read -p "Notion 2개 페이지를 업데이트하시겠습니까? (Y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    echo -e "\n${BLUE}테스트 실행 중...${NC}\n"
    node "$PROJECT_DIR/update-notion-dual.js"

    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ Notion 2개 페이지 연동 완료!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

        echo -e "${BLUE}💡 사용법:${NC}"
        echo -e "  ${CYAN}자동 업데이트:${NC}"
        echo -e "    node update-notion-dual.js\n"

        echo -e "  ${CYAN}페이지 확인:${NC}"
        echo -e "    Notion에서 '개발 현황'과 '개발일지' 페이지를 확인하세요!\n"
    else
        echo -e "\n${RED}❌ 테스트 실패${NC}"
        echo -e "${YELLOW}다음을 확인하세요:${NC}"
        echo -e "  1. API 키가 올바른지"
        echo -e "  2. 두 페이지에 모두 Integration이 연결되었는지"
        echo -e "  3. 페이지 ID가 올바른지\n"
        exit 1
    fi
else
    echo -e "\n${BLUE}설정 완료. 나중에 직접 테스트하세요:${NC}"
    echo -e "  node update-notion-dual.js\n"
fi
