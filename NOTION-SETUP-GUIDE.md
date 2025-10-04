# 🔗 Notion 연동 완벽 가이드

## Step 1: Notion Integration 생성 (5분)

### 1-1. Integration 만들기
1. 브라우저에서 열기: https://www.notion.so/my-integrations
2. **"+ New integration"** 클릭
3. 정보 입력:
   - **Name**: `Lighthouse Dev Tracker`
   - **Associated workspace**: 본인 워크스페이스 선택
   - **Type**: Internal
4. **"Submit"** 클릭

### 1-2. API 키 복사
- **Internal Integration Token**을 복사하세요
- 형식: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- 📋 메모장에 임시 저장

---

## Step 2: Notion 페이지 준비 (3분)

### 2-1. 페이지 생성
1. Notion 앱 또는 웹에서 새 페이지 생성
2. 제목: **"Lighthouse 개발 현황"** (원하는 이름)

### 2-2. Integration 연결
1. 페이지 우측 상단 **"..."** (점 3개) 클릭
2. **"Add connections"** 클릭
3. 리스트에서 **"Lighthouse Dev Tracker"** 찾아서 선택
4. 이제 Integration이 이 페이지에 접근 가능!

### 2-3. 페이지 ID 복사
1. 페이지 우측 상단 **"Share"** 또는 **"..."** > **"Copy link"** 클릭
2. URL 예시:
   ```
   https://www.notion.so/Lighthouse-123abc456def789012345678901234ab
   또는
   https://www.notion.so/your-workspace/123abc456def789012345678901234ab?v=...
   ```
3. **페이지 ID는 URL의 마지막 32자리 영숫자 코드**:
   ```
   123abc456def789012345678901234ab
   ```
   (하이픈 없이 32자)

---

## Step 3: 설정 파일 생성 (2분)

### 3-1. 템플릿 복사
```bash
cd /home/lupan/projects/my-lighthouse/lighthouse-app
cp .notion-config.example .notion-config
```

### 3-2. 설정 파일 편집
```bash
nano .notion-config
# 또는
code .notion-config
# 또는
vi .notion-config
```

### 3-3. 값 입력
```bash
NOTION_API_KEY=secret_여기에Step1에서복사한API키붙여넣기
NOTION_PAGE_ID=여기에Step2에서복사한페이지ID붙여넣기
```

**예시**:
```bash
NOTION_API_KEY=secret_AbCd1234EfGh5678IjKl9012MnOp3456QrSt7890UvWx
NOTION_PAGE_ID=123abc456def789012345678901234ab
```

**저장**: `Ctrl + O` → `Enter` → `Ctrl + X` (nano 기준)

---

## Step 4: 테스트 (1분)

```bash
cd /home/lupan/projects/my-lighthouse
./update-notion.sh
```

**성공 메시지**:
```
✓ 보고서 생성 완료
📤 Notion 페이지 업데이트 중...
✓ Notion 업데이트 완료!
```

---

## 🎯 완료!

이제 다음 명령어로 언제든 노션 업데이트 가능:
```bash
/home/lupan/projects/my-lighthouse/update-notion.sh
```

---

## ❓ 문제 해결

### "Notion 설정 파일이 없습니다" 오류
→ `.notion-config` 파일이 올바른 위치(`lighthouse-app/` 폴더)에 있는지 확인

### "API 키가 설정되지 않았습니다" 오류
→ `.notion-config` 파일 내용 확인:
```bash
cat /home/lupan/projects/my-lighthouse/lighthouse-app/.notion-config
```

### Notion API 401 Unauthorized 오류
→ Integration Token이 올바른지 확인
→ Notion 페이지에 Integration이 연결되었는지 확인

### 페이지 ID를 찾을 수 없음
→ 페이지 URL을 다시 확인
→ 하이픈(-)이 포함되지 않은 32자리 코드 확인

---

## 📚 참고 자료

- Notion API 공식 문서: https://developers.notion.com/
- Integration 관리: https://www.notion.so/my-integrations

