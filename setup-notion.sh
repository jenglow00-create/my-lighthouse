#!/bin/bash

# Notion 연동 설정 도우미 스크립트
# 사용법: ./setup-notion.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/lupan/projects/my-lighthouse"
CONFIG_FILE="$PROJECT_DIR/lighthouse-app/.notion-config"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔗 Notion 연동 설정 시작${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Step 1: 패키지 설치
echo -e "${YELLOW}📦 Step 1: Notion SDK 설치 중...${NC}"
cd "$PROJECT_DIR"

if [ ! -d "node_modules/@notionhq/client" ]; then
    npm install @notionhq/client
    echo -e "${GREEN}✓ Notion SDK 설치 완료${NC}\n"
else
    echo -e "${GREEN}✓ Notion SDK 이미 설치됨${NC}\n"
fi

# Step 2: 설정 파일 확인
echo -e "${YELLOW}📝 Step 2: 설정 파일 생성${NC}"

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
    echo -e "\n${BLUE}🔑 Notion API 키와 페이지 ID를 입력해주세요.${NC}\n"

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📚 가이드:${NC}"
    echo -e "${YELLOW}1. API 키 발급: https://www.notion.so/my-integrations${NC}"
    echo -e "${YELLOW}2. 페이지 생성 후 Integration 연결${NC}"
    echo -e "${YELLOW}3. 페이지 URL에서 ID 복사${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    read -p "Notion API 키 (secret_로 시작): " API_KEY
    read -p "Notion 페이지 ID (32자리): " PAGE_ID

    # 입력 검증
    if [[ ! $API_KEY == secret_* ]]; then
        echo -e "\n${RED}❌ API 키는 'secret_'로 시작해야 합니다.${NC}"
        exit 1
    fi

    if [ ${#PAGE_ID} -ne 32 ]; then
        echo -e "\n${RED}❌ 페이지 ID는 32자리여야 합니다.${NC}"
        exit 1
    fi

    # 설정 파일 생성
    cat > "$CONFIG_FILE" << EOF
# Notion API Configuration
# 생성일: $(date '+%Y-%m-%d %H:%M:%S')

NOTION_API_KEY=$API_KEY
NOTION_PAGE_ID=$PAGE_ID
EOF

    echo -e "\n${GREEN}✓ 설정 파일 생성 완료: $CONFIG_FILE${NC}\n"
fi

# Step 3: 테스트
echo -e "${YELLOW}🧪 Step 3: 연동 테스트${NC}\n"

read -p "Notion 연동을 테스트하시겠습니까? (Y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    echo -e "\n${BLUE}테스트 실행 중...${NC}\n"
    node "$PROJECT_DIR/update-notion-api.js"

    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ Notion 연동 설정 완료!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

        echo -e "${BLUE}💡 사용법:${NC}"
        echo -e "  node update-notion-api.js"
        echo -e "  또는"
        echo -e "  ./update-notion.sh\n"
    else
        echo -e "\n${RED}❌ 테스트 실패${NC}"
        echo -e "${YELLOW}NOTION-SETUP-GUIDE.md를 참고하여 설정을 확인하세요.${NC}\n"
        exit 1
    fi
else
    echo -e "\n${BLUE}설정 완료. 나중에 직접 테스트하세요:${NC}"
    echo -e "  node update-notion-api.js\n"
fi
