# 🏮 학습의 등대가 되어줄 앱, Lighthouse 개발기

> "목표를 향해 나아가는 여정을 바다 위의 보트로 표현한다면?"

안녕하세요! 오늘은 제가 개발 중인 **Lighthouse(등대)** 학습 관리 앱의 개발 과정을 공유하려고 합니다. 이 프로젝트는 단순한 학습 시간 기록을 넘어, 사용자가 자신의 학습 여정을 **시각적으로 아름답게** 경험할 수 있도록 만드는 것을 목표로 하고 있습니다.

---

## 💡 프로젝트의 시작

### 왜 만들게 되었나요?

기존의 학습 관리 앱들은 대부분 **숫자와 그래프**로만 진도를 보여줍니다. 물론 정확하긴 하지만, 뭔가 감성이 부족하지 않나요?

저는 학습 과정을 **바다 위를 항해하는 보트**로 표현하고 싶었습니다. 먼 곳의 등대를 향해 조금씩 나아가는 모습을 보면서, 사용자가 자신의 성장을 느낄 수 있도록 말이죠.

### 기술 스택 선택

- **React + Vite**: 빠른 개발과 HMR
- **localStorage**: 서버 없이도 작동하는 완전한 오프라인 앱
- **순수 CSS 애니메이션**: 가볍고 부드러운 애니메이션
- **모듈 기반 설계**: 확장 가능한 구조

---

## 🌊 Phase 1: 오션뷰 애니메이션 - 첫 번째 도전

### 컨셉 구체화

가장 먼저 고민한 것은 **"어떻게 진도를 바다로 표현할까?"**였습니다.

```
진도 0%    →  보트가 왼쪽 끝 (출발점)
진도 50%   →  보트가 중앙 (항해 중)
진도 100%  →  보트가 등대에 도착!
```

### 구현 과정

**1. 보트 위치 계산 로직**

진도율에 따라 보트가 **대각선으로 이동**하도록 설계했습니다.

```javascript
const calculateBoatPosition = (progressPercentage) => {
  // 수평 이동: 0% → 100%
  const horizontalProgress = progressPercentage;

  // 수직 이동: 하단에서 시작 → 상단으로 (등대 쪽으로)
  const verticalProgress = progressPercentage * 0.3; // 30%만큼만 상승

  return {
    left: `${5 + (horizontalProgress * 0.7)}%`,
    top: `${70 - (verticalProgress)}%`
  };
};
```

**2. 반응형 디자인**

모바일, 태블릿, 데스크톱 모두에서 자연스럽게 보이도록 미디어 쿼리를 활용했습니다.

```css
/* 모바일 */
@media (max-width: 768px) {
  .boat-image { height: 100px; }
  .lighthouse-image { height: 120px; }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .boat-image { height: 160px; }
  .lighthouse-image { height: 200px; }
}
```

**3. 부드러운 애니메이션**

보트가 움직일 때 `transition`으로 부드럽게 이동하도록 했습니다.

```css
.boat-container {
  transition: left 2s ease-out, top 2s ease-out;
}
```

### 사용자 피드백 반영

초기 버전에서는 등대와 보트가 같은 방향을 보고 있어서 어색했습니다. 피드백을 받아 **서로 마주보도록** 이미지를 반전시켰더니 훨씬 자연스러워졌습니다!

```css
.lighthouse-flipped {
  transform: scaleX(-1); /* 좌우 반전 */
}
```

---

## 🧠 Phase 2: 성찰 시스템 - 학습의 본질

학습은 단순히 시간을 쌓는 것이 아닙니다. **성찰(Metacognition)**이 핵심입니다.

### 6단계 성찰 프로세스

제가 구현한 성찰 시스템은 다음과 같은 단계로 이루어져 있습니다:

1. **주제 입력**: 오늘 공부한 여러 주제들 입력
2. **랜덤 선택**: 시스템이 무작위로 하나 선택
3. **회상**: 교재 없이 기억나는 대로 작성
4. **검증**: 교재를 보며 틀린 부분 확인
5. **평가**: 1~5점으로 학습도 자체 평가
6. **계획**: 더 공부할 것과 내일 할 일 작성

### 왜 이렇게 복잡하게?

**"아는 것과 설명할 수 있는 것은 다릅니다."**

단순히 교재를 읽는 것보다, 회상하고 검증하는 과정을 거쳐야 진정한 학습이 됩니다. 이를 코드로 강제하여, 사용자가 자연스럽게 깊이 있는 학습을 하도록 유도했습니다.

### 히스토리 기능

모든 성찰 기록을 **검색, 필터링, 정렬**할 수 있도록 만들었습니다.

```javascript
// 검색 필터
const filteredReflections = reflections.filter(r =>
  r.selectedTopic?.includes(searchTerm) ||
  r.recallContent?.includes(searchTerm) ||
  r.tomorrowPlan?.includes(searchTerm)
);

// 평점 필터
if (filterRating !== 'all') {
  filtered = filtered.filter(r => r.learningRating === rating);
}

// 정렬
filtered.sort((a, b) => {
  switch (sortBy) {
    case 'newest': return new Date(b.date) - new Date(a.date);
    case 'rating-high': return b.learningRating - a.learningRating;
    // ...
  }
});
```

---

## 📚 Phase 3: 시험 유형 시스템 - 확장성의 중요성

### 초기 문제점

처음에는 시험 유형을 단순 리스트로 관리했습니다:

```javascript
['TOEIC', 'TOEFL', '한국사', '공무원', ...]
```

하지만 사용자가 **"NCS, 전공, 논술, 컴활도 추가해주세요!"**라고 요청했을 때, 이 구조로는 확장이 어렵다는 것을 깨달았습니다.

### 해결책: 대주제-소주제 구조

**계층적 데이터 구조**로 재설계했습니다:

```javascript
const EXAM_CATEGORIES = [
  {
    id: 'language',
    name: '어학',
    icon: '🌍',
    subcategories: [
      { id: 'TOEIC', name: 'TOEIC', defaultTarget: 800 },
      { id: 'TOEFL', name: 'TOEFL', defaultTarget: 90 },
      // ...
    ]
  },
  {
    id: 'certification',
    name: '자격증',
    icon: '📜',
    subcategories: [
      { id: 'Computer 1', name: '컴퓨터활용능력 1급', defaultTarget: 70 },
      { id: 'Korean History 1', name: '한국사능력검정 1급', defaultTarget: 80 },
      // ...
    ]
  },
  // 총 6개 카테고리, 31개 시험 유형
];
```

### UI/UX 개선

**2단계 선택 방식**으로 직관성을 높였습니다:

1. **대주제**: 아이콘 버튼으로 시각적 선택
2. **소주제**: 드롭다운으로 세부 선택

```jsx
<div className="category-selector">
  {EXAM_CATEGORIES.map(category => (
    <button className={`category-btn ${selected ? 'active' : ''}`}>
      <span className="category-icon">{category.icon}</span>
      <span className="category-name">{category.name}</span>
    </button>
  ))}
</div>
```

---

## 🔧 Phase 4: 기술적 도전들

### 도전 1: WSL2 환경에서 모바일 테스트

**문제**: Windows + WSL2 환경에서 개발 중인데, 모바일 기기에서 테스트를 어떻게 할까?

**시도한 방법들**:
1. ❌ 직접 IP 접속 → VPN 때문에 실패
2. ❌ Vite dev 서버 + localtunnel → 호스트 검증 실패
3. ✅ **Python HTTP 서버 + localtunnel** → 성공!

```bash
npm run build
cd dist
python3 -m http.server 8080 &
lt --port 8080
```

정적 파일 서빙으로 vite의 제한사항을 우회했습니다.

### 도전 2: 상태 관리 복잡도

성찰 히스토리에서 **다중 확장 상태**를 관리해야 했습니다.

```javascript
// Set 자료구조 활용
const [expandedReflections, setExpandedReflections] = useState(new Set());

const toggleExpansion = (id) => {
  const newExpanded = new Set(expandedReflections);
  newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
  setExpandedReflections(newExpanded);
};

// 전체 펼치기/접기
const toggleAll = () => {
  setExpandedReflections(
    expandedReflections.size === reflections.length
      ? new Set()
      : new Set(reflections.map(r => r.id))
  );
};
```

### 도전 3: 하위 호환성 유지

시험 유형 구조를 변경하면서도 **기존 사용자 데이터**가 깨지지 않도록 마이그레이션 로직을 추가했습니다.

```javascript
const LEGACY_MAP = {
  'TOEIC': 'TOEIC',
  'Korean History': 'Korean History 1',
  'Civil Service': 'Civil 9',
  // ...
};

const migrateLegacyExamType = (oldType) => {
  return LEGACY_MAP[oldType] || oldType;
};
```

---

## 📊 현재 상태

### 통계
- **총 4,603줄** 코드
- **19개** 주요 파일
- **31개** 지원 시험 유형
- **6단계** 성찰 프로세스

### 주요 기능
✅ 바다 위 보트 애니메이션
✅ 진도 기반 위치 계산
✅ 6단계 성찰 시스템
✅ 성찰 히스토리 검색/필터
✅ 31개 시험 유형 지원
✅ 과목별 목표 관리
✅ 모바일 완전 지원
✅ 오프라인 작동

---

## 🚀 앞으로의 계획

### 단기 (1개월)
- [ ] 시험 유형별 학습 통계 대시보드
- [ ] 다크 모드 지원
- [ ] 추가 보트/배경 테마

### 중기 (3개월)
- [ ] Firebase 연동 (클라우드 동기화)
- [ ] 친구와 진도 공유 기능
- [ ] PWA 변환 (설치 가능한 앱)

### 장기 (6개월+)
- [ ] AI 기반 학습 패턴 분석
- [ ] 개인화된 학습 추천
- [ ] 커뮤니티 기능

---

## 💭 개발하며 배운 것들

### 1. 사용자 피드백의 중요성
초기에는 등대와 보트가 같은 방향을 보고 있었습니다. 사용자 피드백을 받고 바로 수정했더니 만족도가 크게 올라갔습니다. **작은 디테일이 UX를 크게 좌우합니다.**

### 2. 확장 가능한 설계
처음부터 완벽한 구조를 만들 순 없습니다. 하지만 **리팩토링을 두려워하지 말아야** 합니다. 시험 유형 시스템을 재설계하면서 이를 깨달았습니다.

### 3. 성능보다 경험
CSS 애니메이션을 JavaScript로도 구현할 수 있었지만, GPU 가속을 활용하는 **순수 CSS가 훨씬 부드럽습니다**. 때로는 간단한 방법이 최선입니다.

### 4. 모바일 퍼스트의 중요성
개발 중반에 모바일 테스트를 시작했는데, 처음부터 고려했다면 시행착오를 줄일 수 있었을 것입니다.

---

## 🎬 마치며

**Lighthouse**는 아직 진행 중인 프로젝트입니다. 하지만 이미 제가 원하던 모습에 많이 가까워졌습니다.

> "학습은 숫자가 아니라 여정입니다."

이 앱을 사용하는 모든 분들이 자신의 **학습 여정을 즐길 수 있기를** 바랍니다. 먼 바다의 등대를 향해 나아가는 보트처럼, 천천히 그리고 꾸준히.

---

**GitHub**: https://github.com/jenglow00-create/my-lighthouse
**개발 기간**: 2025년 9월 ~ 현재 진행 중
**기술 스택**: React, Vite, JavaScript, CSS

궁금한 점이나 피드백이 있으시다면 언제든 댓글 남겨주세요! 🏮

---

*이 글은 실제 개발 과정을 기록한 것으로, 코드 스니펫은 일부 단순화되었습니다.*
