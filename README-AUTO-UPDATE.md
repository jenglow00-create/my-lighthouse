# 🤖 자동 개발 현황 업데이트 시스템

## 📋 개요
매 작업 시작 시 자동으로 개발 현황 보고서를 생성하고 노션에 업데이트하는 시스템입니다.

## 🚀 사용법

### 1. 수동 실행
```bash
cd /home/lupan/projects/my-lighthouse
./update-notion.sh
```

### 2. Notion 연동 설정 (선택사항)

#### Step 1: Notion Integration 생성
1. https://www.notion.so/my-integrations 접속
2. "+ New integration" 클릭
3. 이름: "Lighthouse Dev Tracker"
4. "Submit" 클릭
5. **Internal Integration Token** 복사

#### Step 2: Notion 페이지 준비
1. Notion에서 개발 현황 페이지 생성
2. 우측 상단 "..." > "Add connections"
3. "Lighthouse Dev Tracker" 선택
4. 페이지 URL에서 **Page ID** 복사
   - URL 형식: `https://notion.so/YOUR_PAGE_ID?v=...`
   - `YOUR_PAGE_ID` 부분만 복사

#### Step 3: 설정 파일 생성
```bash
cd /home/lupan/projects/my-lighthouse/lighthouse-app
cp .notion-config.example .notion-config
nano .notion-config  # 또는 vi, code 등 에디터로 편집
```

`.notion-config` 파일에 값 입력:
```bash
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Step 4: 스크립트 실행
```bash
cd /home/lupan/projects/my-lighthouse
./update-notion.sh
```

---

## 🔄 작업 시작 시 자동 실행 방법

### 방법 1: 쉘 alias 설정
`~/.bashrc` 또는 `~/.zshrc`에 추가:

```bash
alias lighthouse-start='cd /home/lupan/projects/my-lighthouse && ./update-notion.sh && cd lighthouse-app && npm run dev'
```

적용:
```bash
source ~/.bashrc  # 또는 source ~/.zshrc
```

사용:
```bash
lighthouse-start
```

---

### 방법 2: npm script 추가
`lighthouse-app/package.json`에 추가:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:report": "bash ../update-notion.sh && vite"
  }
}
```

사용:
```bash
npm run dev:report
```

---

### 방법 3: Git pre-commit hook (커밋 전 자동 보고서 생성)
```bash
cd /home/lupan/projects/my-lighthouse/lighthouse-app
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
/home/lupan/projects/my-lighthouse/update-notion.sh
EOF
chmod +x .git/hooks/pre-commit
```

---

## 📊 보고서 내용

자동 생성되는 보고서에는 다음이 포함됩니다:

- 📅 업데이트 일시
- 📊 프로젝트 통계 (파일 수, 코드 라인 수)
- 🔄 최근 커밋 정보
- 📝 변경사항 요약
- 🎯 완료된 작업 목록
- 🚀 다음 작업 계획

---

## 🛠 문제 해결

### Notion API 연동이 안 될 때
1. Integration Token이 올바른지 확인
2. Page ID가 올바른지 확인
3. Notion 페이지에 Integration이 연결되었는지 확인

### 스크립트 실행 권한 오류
```bash
chmod +x /home/lupan/projects/my-lighthouse/update-notion.sh
```

---

## 📝 커스터마이징

`update-notion.sh` 파일을 직접 수정하여:
- 보고서 형식 변경
- 추가 통계 수집
- 슬랙/디스코드 연동 등

---

**마지막 업데이트**: 2025-10-04
